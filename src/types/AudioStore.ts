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
import { filterData } from "@/src/types/audioPeaks";
import { AudioRegion } from "@/src/types/AudioRegion";

export const loopRegionColor = "rgba(237, 137, 54, 0.4)";

export const PEAK_DATA_SAMPLE_RATE = 30;

// Define a new RootStore interface here so that we avoid circular dependencies
interface RootStore {
  usingLocalAssets: boolean;
}

export class AudioStore {
  audioInitialized = false;
  availableAudioFiles: string[] = [];
  selectedAudioFile: string = "";
  audioMuted = false;

  wavesurfer: WaveSurfer | null = null;
  timelinePlugin: TimelinePlugin | null = null;
  regionsPlugin: RegionsPlugin | null = null;

  initialRegions: AudioRegion[] = [];

  peaks: number[] = [];

  markingAudio = false;

  loopingAudio = false;
  loopRegion: RegionParams | null = null;

  constructor(readonly rootStore: RootStore, readonly timer: Timer) {
    makeAutoObservable(this, {
      getSelectedAudioFileUrl: false,
      wavesurfer: false,
      timelinePlugin: false,
      regionsPlugin: false,
      peaks: false,
      getPeakAtTime: false,
    });
    this.timer.addTickListener(this.onTick);
  }

  computePeaks = (audioBuffer: AudioBuffer) => {
    const totalDesiredSamples = Math.floor(
      PEAK_DATA_SAMPLE_RATE * audioBuffer.duration
    );
    const channelData = filterData(audioBuffer, totalDesiredSamples, true);
    const numberOfChannels = channelData.length;

    this.peaks = [];
    for (let j = 0; j < channelData[0].length; j++) {
      let frameTotal = 0;
      for (let i = 0; i < numberOfChannels; i++) {
        frameTotal += channelData[i][j];
      }
      this.peaks.push(frameTotal / numberOfChannels);
    }
  };

  getPeakAtTime = (time: number) => {
    if (!this.peaks.length) return 0;
    const index = Math.floor(time * PEAK_DATA_SAMPLE_RATE);
    return this.peaks[index];
  };

  toggleAudioMuted = () => {
    this.audioMuted = !this.audioMuted;
  };

  toggleMarkingAudio = () => {
    this.markingAudio = !this.markingAudio;

    this.regionsPlugin
      ?.getRegions()
      .forEach(
        (region) =>
          region.content && region.setOptions({ drag: this.markingAudio })
      );
  };

  toggleLoopingAudio = () => {
    this.loopingAudio = !this.loopingAudio;
  };

  loopAudio = (start: number, end: number) => {
    this.loopingAudio = true;
    this.loopRegion = {
      id: "block",
      start,
      end,
      color: loopRegionColor,
    };
    this.regionsPlugin?.addRegion(this.loopRegion);
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
    if (!this.loopingAudio || !this.loopRegion || !this.loopRegion.end) return;

    if (time > this.loopRegion.end) this.timer.setTime(this.loopRegion.start);
  };

  serialize = () => ({
    selectedAudioFile: this.selectedAudioFile,
    audioMuted: this.audioMuted,
    audioRegions: this.regionsPlugin
      ?.getRegions()
      .map((region) => new AudioRegion(region).serialize()),
  });

  deserialize = (data: any) => {
    this.selectedAudioFile = data.selectedAudioFile;
    this.audioMuted = !!data.audioMuted;
    this.initialRegions = data.audioRegions?.map(
      (region: any) => new AudioRegion(region)
    );
  };
}
