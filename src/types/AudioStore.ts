import { Timer } from "@/src/types/Timer";
import { makeAutoObservable } from "mobx";
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
