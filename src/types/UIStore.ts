import { INITIAL_PIXELS_PER_SECOND } from "@/src/utils/time";
import { makeAutoObservable } from "mobx";
import type { Store } from "@/src/types/Store";

export const MAX_PIXELS_PER_SECOND = 160;
export const MIN_PIXELS_PER_SECOND = 4;

const INITIAL_RENDER_TARGET_SIZE = 512;

export type DisplayMode = "canopy" | "canopySpace" | "cartesianSpace" | "none";

export class UIStore {
  horizontalLayout = true;
  showingPerformance = false;
  showingWaveformOverlay = false;
  showingBeatGridOverlay = false;
  snappingToBeatGrid = false;
  showingOpenExperienceModal = false;
  showingUserPickerModal = false;
  showingSaveExperienceModal = false;
  showingUploadAudioModal = false;
  showingPaletteEditorModal = false;
  showingMarkerEditorModal = false;
  showingPlaylistAddExperienceModal = false;
  showingViewerInstructionsModal = false;
  showingSaveBeatMapModal = false;
  showingLoadBeatMapModal = false;
  showingLatencyModal = false;

  pendingAction: "open" | "save" | "" = "";

  private _renderTargetSize = INITIAL_RENDER_TARGET_SIZE;
  get renderTargetSize() {
    return this._renderTargetSize;
  }
  set renderTargetSize(size: number) {
    this._renderTargetSize = size;
    this.saveToLocalStorage();
  }

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

  private _playgroundDisplayMode: DisplayMode = "canopy";
  get playgroundDisplayMode() {
    return this._playgroundDisplayMode;
  }
  set playgroundDisplayMode(mode: DisplayMode) {
    this._playgroundDisplayMode = mode;
    this.saveToLocalStorage();
  }

  patternDrawerOpen = this.store.context === "playground";

  canTimelineZoom = this.store.context === "experienceEditor";
  pixelsPerSecond = INITIAL_PIXELS_PER_SECOND; // the zoom of the timeline

  constructor(readonly store: Store) {
    makeAutoObservable(this);
  }

  initialize = (viewerMode = false) => {
    if (viewerMode) this.setViewerModeDefaults();
    else this.loadFromLocalStorage();
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
    this.store.audioStore.setTimeWithCursor(this.store.audioStore.globalTime);
  };

  zoomIn = (amount?: number) => {
    this.pixelsPerSecond += amount || 4;
    if (this.pixelsPerSecond > MAX_PIXELS_PER_SECOND) {
      this.pixelsPerSecond = MAX_PIXELS_PER_SECOND;
    }

    // resetting the time will restart the playhead animation
    this.store.audioStore.setTimeWithCursor(this.store.audioStore.globalTime);
  };

  toggleLayout = () => {
    this.horizontalLayout = !this.horizontalLayout;
    this.saveToLocalStorage();
  };

  togglePerformance = () => {
    this.showingPerformance = !this.showingPerformance;
    this.saveToLocalStorage();
  };

  toggleWaveformOverlay = () => {
    this.showingWaveformOverlay = !this.showingWaveformOverlay;
  };

  toggleBeatGridOverlay = () => {
    this.showingBeatGridOverlay = !this.showingBeatGridOverlay;
  };

  toggleSnappingToBeatGrid = () => {
    this.snappingToBeatGrid = !this.snappingToBeatGrid;
  };

  // TODO: can be removed when authentication is implemented
  attemptShowOpenExperienceModal = () => {
    if (!this.store.userStore.isAuthenticated) {
      this.showingUserPickerModal = true;
      this.pendingAction = "open";
      return;
    }

    this.showingOpenExperienceModal = true;
  };

  attemptShowSaveExperienceModal = () => {
    if (!this.store.userStore.isAuthenticated) {
      this.showingUserPickerModal = true;
      this.pendingAction = "save";
      return;
    }

    this.showingSaveExperienceModal = true;
  };

  showPendingModal = () => {
    switch (this.pendingAction) {
      case "open":
        this.showingOpenExperienceModal = true;
        break;
      case "save":
        this.showingSaveExperienceModal = true;
        break;
    }
    this.pendingAction = "";
  };

  nextRenderTextureSize = () => {
    this.renderTargetSize *= 2;
    if (this.renderTargetSize > 1024) this.renderTargetSize = 256;
    this.saveToLocalStorage();
  };

  setViewerModeDefaults = () => {
    this.horizontalLayout = true;
    this.showingPerformance = false;
    this.displayMode = "canopy";
    this.playgroundDisplayMode = "none";
    this.renderTargetSize = INITIAL_RENDER_TARGET_SIZE;
  };

  loadFromLocalStorage = () => {
    if (typeof window === "undefined") return;
    const data = localStorage.getItem("uiStore");
    if (data) {
      const localStorageUiSettings = JSON.parse(data);
      this.horizontalLayout = !!localStorageUiSettings.horizontalLayout;
      this.showingPerformance = !!localStorageUiSettings.showingPerformance;
      this.displayMode = localStorageUiSettings.displayMode || "canopy";
      this.playgroundDisplayMode =
        localStorageUiSettings.playgroundDisplayMode || "canopy";
      this.renderTargetSize =
        localStorageUiSettings.renderTargetSize || INITIAL_RENDER_TARGET_SIZE;
      if (this.store.context === "experienceEditor")
        this.pixelsPerSecond =
          localStorageUiSettings.pixelsPerSecond || INITIAL_PIXELS_PER_SECOND;
    }
  };

  saveToLocalStorage = () => {
    if (typeof window === "undefined") return;
    localStorage.setItem(
      "uiStore",
      JSON.stringify({
        horizontalLayout: this.horizontalLayout,
        showingPerformance: this.showingPerformance,
        displayMode: this.displayMode,
        playgroundDisplayMode: this.playgroundDisplayMode,
        renderTargetSize: this.renderTargetSize,
        pixelsPerSecond: this.pixelsPerSecond,
      }),
    );
  };
}
