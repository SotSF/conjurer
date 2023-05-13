import { AudioRegion } from "@/src/types/AudioRegion";
import { makeAutoObservable } from "mobx";

export class AudioStore {
  audioInitialized = false;
  availableAudioFiles: string[] = [];
  selectedAudioFile: string = "cloudkicker-explorebecurious.mp3";

  audioMuted = false;
  audioLooping = false;

  selectedRegion: AudioRegion | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  toggleAudioMuted = () => {
    this.audioMuted = !this.audioMuted;
  };

  toggleAudioLooping = () => {
    this.audioLooping = !this.audioLooping;
  };

  onTick = (time: number) => {
    console.log("testing");
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
