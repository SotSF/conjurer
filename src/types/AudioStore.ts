import { Timer } from "@/src/types/Timer";
import {
  ASSET_BUCKET_NAME,
  ASSET_BUCKET_REGION,
  AUDIO_ASSET_PREFIX,
  LOCAL_ASSET_DIRECTORY,
  getS3,
} from "@/src/utils/assets";
import { ListObjectsCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { makeAutoObservable, runInAction } from "mobx";
import type WaveSurfer from "wavesurfer.js";
import type TimelinePlugin from "wavesurfer.js/dist/plugins/timeline";
import type RegionsPlugin from "wavesurfer.js/dist/plugins/regions";
import type { RegionParams } from "wavesurfer.js/dist/plugins/regions";

// Define a new RootStore interface here so that we avoid circular dependencies
interface RootStore {
  usingLocalAssets: boolean;
}

export class AudioStore {
  audioInitialized = false;
  availableAudioFiles: string[] = [];
  selectedAudioFile: string = "";

  audioMuted = false;
  audioLooping = false;

  audioBuffer: AudioBuffer | null = null; // currently unused

  selectedRegion: RegionParams | null = null;

  wavesurfer: WaveSurfer | null = null;
  timeline: TimelinePlugin | null = null;
  regions: RegionsPlugin | null = null;

  constructor(readonly rootStore: RootStore, readonly timer: Timer) {
    makeAutoObservable(this, {
      getSelectedAudioFileUrl: false,
      audioBuffer: false,
      wavesurfer: false,
      timeline: false,
      regions: false,
    });
    this.timer.addTickListener(this.onTick);
  }

  toggleAudioMuted = () => {
    this.audioMuted = !this.audioMuted;
  };

  toggleAudioLooping = () => {
    this.audioLooping = !this.audioLooping;
  };

  loopAudio = (start: number, end: number) => {
    this.audioLooping = true;
    this.selectedRegion = {
      id: "block",
      start,
      end,
    };
    // TODO: make this region appear in the UI
  };

  getSelectedAudioFileUrl = () =>
    this.rootStore.usingLocalAssets
      ? `${location.href}/${LOCAL_ASSET_DIRECTORY}${AUDIO_ASSET_PREFIX}${this.selectedAudioFile}`
      : `https://${ASSET_BUCKET_NAME}.s3.${ASSET_BUCKET_REGION}.amazonaws.com/${AUDIO_ASSET_PREFIX}${this.selectedAudioFile}`;

  fetchAvailableAudioFiles = async (forceReload = false) => {
    if (this.audioInitialized && !forceReload) return;
    this.audioInitialized = true;

    if (this.rootStore.usingLocalAssets) {
      const response = await fetch("/api/audio");
      const { audioFilenames } = await response.json();
      runInAction(() => {
        this.availableAudioFiles = audioFilenames;
      });
      return;
    }

    const listObjectsCommand = new ListObjectsCommand({
      Bucket: ASSET_BUCKET_NAME,
      Prefix: AUDIO_ASSET_PREFIX,
    });
    const data = await getS3().send(listObjectsCommand);

    runInAction(() => {
      this.availableAudioFiles = [];
      data.Contents?.forEach((object) => {
        const audioFile = object.Key?.split("/")[1];
        if (audioFile) this.availableAudioFiles.push(audioFile);
      });
    });
  };

  uploadAudioFile = async (file: File) => {
    const putObjectCommand = new PutObjectCommand({
      Bucket: ASSET_BUCKET_NAME,
      Key: `${AUDIO_ASSET_PREFIX}${file.name}`,
      Body: file,
    });
    return getS3().send(putObjectCommand);
  };

  onTick = (time: number) => {
    if (!this.audioLooping || !this.selectedRegion || !this.selectedRegion.end)
      return;

    if (time > this.selectedRegion.end)
      this.timer.setTime(this.selectedRegion.start);
  };

  serialize = () => ({
    selectedAudioFile: this.selectedAudioFile,
    audioMuted: this.audioMuted,
  });

  deserialize = (data: any) => {
    this.selectedAudioFile = data.selectedAudioFile;
    this.audioMuted = !!data.audioMuted;
  };
}
