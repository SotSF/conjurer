import { Timer } from "@/src/types/Timer";
import {
  ASSET_BUCKET_NAME,
  AUDIO_ASSET_PREFIX,
  getS3,
} from "@/src/utils/assets";
import { ListObjectsCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { makeAutoObservable, runInAction } from "mobx";
import type { RegionParams } from "wavesurfer.js/dist/plugins/regions";

export class AudioStore {
  audioInitialized = false;
  availableAudioFiles: string[] = [];
  selectedAudioFile: string = "";

  audioMuted = false;
  audioLooping = false;

  selectedRegion: RegionParams | null = null;

  constructor(readonly timer: Timer) {
    makeAutoObservable(this);
    this.timer.addTickListener(this.onTick);
  }

  toggleAudioMuted = () => {
    this.audioMuted = !this.audioMuted;
  };

  toggleAudioLooping = () => {
    this.audioLooping = !this.audioLooping;
  };

  fetchAvailableAudioFiles = async (forceReload = false) => {
    if (this.audioInitialized && !forceReload) return;
    this.audioInitialized = true;

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
