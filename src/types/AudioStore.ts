import {
  ASSET_BUCKET_NAME,
  ASSET_BUCKET_REGION,
  AUDIO_ASSET_PREFIX,
  LOCAL_ASSET_DIRECTORY,
} from "@/src/utils/assets";
import { makeAutoObservable } from "mobx";
import type WaveSurfer from "wavesurfer.js";
import type TimelinePlugin from "wavesurfer.js/dist/plugins/timeline";
import type MinimapPlugin from "wavesurfer.js/dist/plugins/minimap";
import { filterData } from "@/src/types/audioPeaks";
import { NO_SONG, Song } from "@/src/types/Song";

export const PEAK_DATA_SAMPLE_RATE = 60;

// Define a new RootStore interface here so that we avoid circular dependencies
interface RootStore {
  usingLocalData: boolean;
}

export class AudioStore {
  audioInitialized = false;
  selectedSong: Song = NO_SONG;
  audioMuted = false;

  wavesurfer: WaveSurfer | null = null;
  timelinePlugin: TimelinePlugin | null = null;
  minimapPlugin: MinimapPlugin | null = null;

  peaks: number[] = [];

  audioState: "paused" | "starting" | "playing" = "paused";

  audioContext: AudioContext | null = null;

  constructor(readonly rootStore: RootStore) {
    makeAutoObservable(this, {
      timelinePlugin: false,
      minimapPlugin: false,
      peaks: false,
      getPeakAtTime: false,
    });
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

  getSelectedSongUrl = () =>
    this.rootStore.usingLocalData
      ? `${location.origin}/${LOCAL_ASSET_DIRECTORY}${AUDIO_ASSET_PREFIX}${this.selectedSong.filename}`
      : `https://${ASSET_BUCKET_NAME}.s3.${ASSET_BUCKET_REGION}.amazonaws.com/${AUDIO_ASSET_PREFIX}${this.selectedSong.filename}`;

  // Timer relevant code - perhaps extract this to a separate file

  private _globalTime = 0;
  get globalTime() {
    return this._globalTime;
  }
  set globalTime(time: number) {
    this._globalTime = time;
  }
  get globalTimeRounded() {
    return Math.round(this.globalTime * 10) / 10;
  }

  audioLatency = 0.15; // seconds

  setTimeWithCursor = (time: number) => {
    if (!this.wavesurfer) return;

    const validTime = Math.max(0, time);
    this.lastCursorPosition = validTime;
    this.globalTime = validTime;

    const duration = this.wavesurfer.getDuration();
    if (this.wavesurfer.getCurrentTime() === validTime || duration === 0)
      return;
    this.wavesurfer.seekTo(validTime / duration);
  };

  skipForward = () => this.setTimeWithCursor(this.globalTime + 0.01);
  skipBackward = () => this.setTimeWithCursor(this.globalTime - 0.01);

  skip = (delta: number) => this.setTimeWithCursor(this.globalTime + delta);

  // called by wavesurfer, which defaults to 60fps
  onTick = (time: number) => {
    this.globalTime = time;
  };

  private _lastCursor = { position: 0 };

  /**
   * The last cursor position that was set by the user. This is listenable/observable, since it is
   * an object and not a primitive.
   */
  get lastCursor() {
    return this._lastCursor;
  }

  get lastCursorPosition() {
    return this._lastCursor.position;
  }

  set lastCursorPosition(time: number) {
    // instantiate a new object here to trigger Mobx reactions
    this._lastCursor = { position: time < 0 ? 0 : time };
  }
}
