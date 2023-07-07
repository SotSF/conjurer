import { Timer } from "@/src/types/Timer";
import { INITIAL_PIXELS_PER_SECOND } from "@/src/utils/time";
import { makeAutoObservable } from "mobx";

const MAX_PIXELS_PER_SECOND = 90;
const MIN_PIXELS_PER_SECOND = 4;

export type DisplayMode = "canopy" | "canopySpace" | "cartesianSpace";

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

  // TODO: refactor these in display in ui differently
  keepingPlayHeadCentered = false;
  keepingPlayHeadVisible = false;

  private _displayMode: DisplayMode = "canopy";

  get displayMode() {
    return this._displayMode;
  }

  set displayMode(mode: DisplayMode) {
    this._displayMode = mode;
    this.saveToLocalStorage();
  }

  patternDrawerOpen = false;

  private _lastPatternIndexSelected = 0;

  get lastPatternIndexSelected() {
    return this._lastPatternIndexSelected;
  }

  set lastPatternIndexSelected(index: number) {
    this._lastPatternIndexSelected = index;
    this.saveToLocalStorage();
  }

  private _lastEffectIndexSelected = -1;

  get lastEffectIndexSelected() {
    return this._lastEffectIndexSelected;
  }

  set lastEffectIndexSelected(index: number) {
    this._lastEffectIndexSelected = index;
    this.saveToLocalStorage();
  }

  private _lastEffectIndices : number[] = [];
  get lastEffectIndices() {
    return this._lastEffectIndices;
  }
  set lastEffectIndices(indices: number[]) {
    this._lastEffectIndices = indices;
    this.saveToLocalStorage();
  }

  pixelsPerSecond = INITIAL_PIXELS_PER_SECOND; // the zoom of the timeline

  constructor(readonly timer: Timer) {
    makeAutoObservable(this);
  }

  initialize = () => {
    this.loadFromLocalStorage();
  };

  timeToXPixels = (time: number) => `${time * this.pixelsPerSecond}px`;
  timeToX = (time: number) => time * this.pixelsPerSecond;
  xToTime = (x: number) => x / this.pixelsPerSecond;

  zoomOut = () => {
    this.pixelsPerSecond -= 2;
    if (this.pixelsPerSecond < MIN_PIXELS_PER_SECOND) {
      this.pixelsPerSecond = MIN_PIXELS_PER_SECOND;
    }

    // resetting the time will restart the playhead animation
    this.timer.setTime(this.timer.globalTime);
  };

  zoomIn = () => {
    this.pixelsPerSecond += 2;
    if (this.pixelsPerSecond > MAX_PIXELS_PER_SECOND) {
      this.pixelsPerSecond = MAX_PIXELS_PER_SECOND;
    }

    // resetting the time will restart the playhead animation
    this.timer.setTime(this.timer.globalTime);
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
      this.displayMode = localStorageUiSettings.displayMode ?? "canopy";
      this.showingPerformance = !!localStorageUiSettings.showingPerformance;
      this.lastPatternIndexSelected =
        localStorageUiSettings.lastPatternIndexSelected ?? 0;
      this.lastEffectIndexSelected =
        localStorageUiSettings.lastEffectIndexSelected ?? 0;
    }
  };

  saveToLocalStorage = () => {
    if (typeof window === "undefined") return;
    localStorage.setItem(
      "uiStore",
      JSON.stringify({
        horizontalLayout: this.horizontalLayout,
        displayMode: this.displayMode,
        showingPerformance: this.showingPerformance,
        lastPatternIndexSelected: this.lastPatternIndexSelected,
        lastEffectIndexSelected: this.lastEffectIndexSelected,
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
