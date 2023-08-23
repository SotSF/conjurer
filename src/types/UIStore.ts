import { AudioStore } from "@/src/types/AudioStore";
import { INITIAL_PIXELS_PER_SECOND } from "@/src/utils/time";
import { makeAutoObservable } from "mobx";
import { RegionParams } from "wavesurfer.js/dist/plugins/regions";

const MAX_PIXELS_PER_SECOND = 160;
const MIN_PIXELS_PER_SECOND = 4;

export type DisplayMode = "canopy" | "canopySpace" | "cartesianSpace" | "none";

/**
 * MobX store for UI state.
 *
 * @export
 * @class UIStore
 */
export class UIStore {
  horizontalLayout = true;
  showingPerformance = false;
  showingWaveformOverlay = false;
  showingOpenExperienceModal = false;
  showingSaveExperienceModal = false;
  showingUploadAudioModal = false;
  showingPaletteEditorModal = false;
  showingMarkerEditorModal = false;
  showingPlaylistAddExperienceModal = false;

  markerToEdit: Partial<RegionParams> = {};

  // TODO: refactor these in display in ui differently
  keepingPlayHeadCentered = false;
  keepingPlayHeadVisible = false;

  private _displayMode: DisplayMode = "canopy";
  get displayMode() {
    return this._displayMode;
  }
  set displayMode(mode: DisplayMode) {
    this._displayMode = mode;
  }

  patternDrawerOpen = false;

  playlistDrawerOpen = false;

  pixelsPerSecond = INITIAL_PIXELS_PER_SECOND; // the zoom of the timeline

  constructor(readonly audioStore: AudioStore) {
    makeAutoObservable(this);
  }

  initialize = () => {
    this.loadFromLocalStorage();
  };

  timeToXPixels = (time: number) => `${time * this.pixelsPerSecond}px`;
  timeToX = (time: number) => time * this.pixelsPerSecond;
  xToTime = (x: number) => x / this.pixelsPerSecond;

  zoomOut = (amount?: number) => {
    this.pixelsPerSecond -= amount || 4;
    if (this.pixelsPerSecond < MIN_PIXELS_PER_SECOND) {
      this.pixelsPerSecond = MIN_PIXELS_PER_SECOND;
    }

    // resetting the time will restart the playhead animation
    this.audioStore.setTimeWithCursor(this.audioStore.globalTime);
  };

  zoomIn = (amount?: number) => {
    this.pixelsPerSecond += amount || 4;
    if (this.pixelsPerSecond > MAX_PIXELS_PER_SECOND) {
      this.pixelsPerSecond = MAX_PIXELS_PER_SECOND;
    }

    // resetting the time will restart the playhead animation
    this.audioStore.setTimeWithCursor(this.audioStore.globalTime);
  };

  toggleLayout = () => {
    this.horizontalLayout = !this.horizontalLayout;
    this.saveToLocalStorage();
  };

  toggleDisplayMode = () => {
    this.displayMode = this.displayMode === "canopy" ? "canopySpace" : "canopy";
    this.saveToLocalStorage();
  };

  togglePerformance = () => {
    this.showingPerformance = !this.showingPerformance;
    this.saveToLocalStorage();
  };

  toggleWaveformOverlay = () => {
    this.showingWaveformOverlay = !this.showingWaveformOverlay;
  };

  loadFromLocalStorage = () => {
    if (typeof window === "undefined") return;
    const data = localStorage.getItem("uiStore");
    if (data) {
      const localStorageUiSettings = JSON.parse(data);
      this.horizontalLayout = !!localStorageUiSettings.horizontalLayout;
      this.showingPerformance = !!localStorageUiSettings.showingPerformance;
    }
  };

  saveToLocalStorage = () => {
    if (typeof window === "undefined") return;
    localStorage.setItem(
      "uiStore",
      JSON.stringify({
        horizontalLayout: this.horizontalLayout,
        showingPerformance: this.showingPerformance,
      })
    );
  };

  serialize = () => ({
    pixelsPerSecond: this.pixelsPerSecond,
  });

  deserialize = (data: any) => {
    this.pixelsPerSecond = data?.pixelsPerSecond ?? this.pixelsPerSecond;
  };
}
