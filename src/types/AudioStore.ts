import {
  ASSET_BUCKET_NAME,
  ASSET_BUCKET_REGION,
  AUDIO_ASSET_PREFIX,
  LOCAL_ASSET_DIRECTORY,
} from "@/src/utils/assets";
import { makeAutoObservable } from "mobx";
import type WaveSurfer from "wavesurfer.js";
import type TimelinePlugin from "wavesurfer.js/dist/plugins/timeline";
import type RegionsPlugin from "wavesurfer.js/dist/plugins/regions";
import type MinimapPlugin from "wavesurfer.js/dist/plugins/minimap";
import type { RegionParams } from "wavesurfer.js/dist/plugins/regions";
import { filterData } from "@/src/types/audioPeaks";
import { AudioRegion } from "@/src/types/AudioRegion";

export const loopRegionColor = "rgba(237, 137, 54, 0.4)";

export const PEAK_DATA_SAMPLE_RATE = 60;

// Define a new RootStore interface here so that we avoid circular dependencies
interface RootStore {
  usingLocalData: boolean;
}

export class AudioStore {
  audioInitialized = false;
  selectedAudioFile: string = "";
  audioMuted = false;

  wavesurfer: WaveSurfer | null = null;
  timelinePlugin: TimelinePlugin | null = null;
  regionsPlugin: RegionsPlugin | null = null;
  minimapPlugin: MinimapPlugin | null = null;

  initialRegions: AudioRegion[] = [];

  peaks: number[] = [];

  markingAudio = false;

  loopingAudio = false;
  loopRegion: RegionParams | null = null;

  audioState: "paused" | "starting" | "playing" = "paused";

  audioContext: AudioContext | null = null;

  constructor(readonly rootStore: RootStore) {
    makeAutoObservable(this, {
      timelinePlugin: false,
      regionsPlugin: false,
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

  toggleMarkingAudio = () => {
    this.markingAudio = !this.markingAudio;

    this.regionsPlugin
      ?.getRegions()
      .forEach(
        (region) =>
          region.content &&
          region.setOptions({ start: region.start, drag: this.markingAudio })
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
    this.rootStore.usingLocalData
      ? `${location.href}/${LOCAL_ASSET_DIRECTORY}${AUDIO_ASSET_PREFIX}${this.selectedAudioFile}`
      : `https://${ASSET_BUCKET_NAME}.s3.${ASSET_BUCKET_REGION}.amazonaws.com/${AUDIO_ASSET_PREFIX}${this.selectedAudioFile}`;

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
    this.lastCursorPosition = time;
    this.globalTime = time;

    const duration = this.wavesurfer.getDuration();
    if (this.wavesurfer.getCurrentTime() === time || duration === 0) return;
    this.wavesurfer.seekTo(time / duration);
  };

  skipForward = () => this.setTimeWithCursor(this.globalTime + 0.01);
  skipBackward = () => this.setTimeWithCursor(this.globalTime - 0.01);

  // called by wavesurfer, which defaults to 60fps
  onTick = (time: number) => {
    this.globalTime = time;

    if (!this.loopingAudio || !this.loopRegion || !this.loopRegion.end) return;
    if (time > this.loopRegion.end)
      this.setTimeWithCursor(this.loopRegion.start);
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

  // Serialization

  serialize = () => ({
    selectedAudioFile: this.selectedAudioFile,
    audioRegions: this.regionsPlugin
      ?.getRegions()
      .map((region) => new AudioRegion(region).serialize()),
  });

  deserialize = (data: any) => {
    this.selectedAudioFile = data.selectedAudioFile;
    this.initialRegions =
      data.audioRegions?.map((region: any) => new AudioRegion(region)) ?? [];
  };
}
