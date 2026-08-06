import { INITIAL_PIXELS_PER_SECOND } from "@/src/utils/time";
import { makeAutoObservable } from "mobx";
import type { Store } from "@/src/types/Store";

export const MAX_PIXELS_PER_SECOND = 800;
export const MIN_PIXELS_PER_SECOND = 4;
export const ZOOM_FACTOR = 1.25;
export const TIMELINE_HEADER_WIDTH = 150;

const INITIAL_RENDER_TARGET_SIZE = 512;

// Scroll position is rounded to this many pixels before it reaches observers, so
// scrolling doesn't re-render every block continuously. See setTimelineViewport.
const VIEWPORT_QUANTUM = 400;

export type DisplayMode = "canopy" | "canopySpace" | "cartesianSpace";

const DISPLAY_MODES: DisplayMode[] = [
  "canopy",
  "canopySpace",
  "cartesianSpace",
];

const sanitizeDisplayMode = (mode: unknown): DisplayMode =>
  DISPLAY_MODES.includes(mode as DisplayMode)
    ? (mode as DisplayMode)
    : "canopy";

/** Ableton-style status-bar help for the control currently under the pointer. */
export type HoverHelp = {
  title: string;
  description?: string;
};

export class UIStore {
  showingPerformance = false;
  showingWaveformOverlay = false;
  showingOpenExperienceModal = false;
  showingAutosavesModal = false;
  showingUserPickerModal = false;
  showingSaveExperienceModal = false;
  showingUploadAudioModal = false;
  showingPaletteEditorModal = false;
  showingMarkerEditorModal = false;
  showingPlaylistAddExperienceModal = false;
  showingPortalNarrativeModal = true;
  showingLatencyModal = false;
  capturingThumbnail = false;

  // transient: Ableton-style hover help shown in the status info bar.
  // A stack so nested controls (block → param dot) restore the outer tip on leave.
  // Not persisted.
  hoverHelpStack: HoverHelp[] = [];

  get hoverHelp(): HoverHelp | null {
    return this.hoverHelpStack.at(-1) ?? null;
  }

  // transient: the id of a just-created layer whose name field should open in
  // edit mode (and focus) when its header mounts. Cleared once consumed.
  layerIdToNameOnMount: string | null = null;

  private _emceeOutputControlsMinimized = true;
  get emceeOutputControlsMinimized() {
    return this._emceeOutputControlsMinimized;
  }
  set emceeOutputControlsMinimized(minimized: boolean) {
    this._emceeOutputControlsMinimized = minimized;
    this.saveToLocalStorage();
  }

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

  patternDrawerOpen = this.store.context === "vj";

  // whether the device panel is shown for the selected block; closing it here
  // keeps the block selected, and selecting a block re-opens it
  showDevicePanel = true;

  // Ableton-style parameter detail (clip) view — zoomed lane editor for the
  // selected parameter, fit to the panel width over the full block duration
  showParameterDetailPanel = false;

  canTimelineZoom = this.store.context === "experienceEditor";
  pixelsPerSecond = INITIAL_PIXELS_PER_SECOND; // the zoom of the timeline

  // The timeline's horizontal scroll window, in CSS pixels of content, tracked so
  // blocks far off screen can skip rendering their expensive interiors. Quantized
  // to VIEWPORT_QUANTUM steps: an exact value would invalidate every block on
  // every scroll event, trading zoom jank for scroll jank.
  timelineScrollLeft = 0;
  timelineViewportWidth = 0;

  setTimelineViewport = (scrollLeft: number, viewportWidth: number) => {
    const quantized =
      Math.floor(scrollLeft / VIEWPORT_QUANTUM) * VIEWPORT_QUANTUM;
    if (quantized !== this.timelineScrollLeft)
      this.timelineScrollLeft = quantized;
    if (viewportWidth !== this.timelineViewportWidth)
      this.timelineViewportWidth = viewportWidth;
  };

  /**
   * Whether a time span is close enough to the visible window to be worth
   * rendering in full. Padded by a screenful either side so scrolling reveals
   * already-rendered content rather than building it under the cursor.
   *
   * Used for automation lanes only. Blocks themselves stay mounted regardless —
   * see the comment in TimelineLayer.
   */
  isTimeSpanNearView = (startTime: number, endTime: number) => {
    // before the first measurement, assume everything is in view
    if (this.timelineViewportWidth === 0) return true;
    const margin = this.timelineViewportWidth;
    const left = this.timelineScrollLeft - TIMELINE_HEADER_WIDTH - margin;
    const right =
      this.timelineScrollLeft -
      TIMELINE_HEADER_WIDTH +
      this.timelineViewportWidth +
      margin;
    return (
      endTime * this.pixelsPerSecond >= left &&
      startTime * this.pixelsPerSecond <= right
    );
  };

  constructor(readonly store: Store) {
    // _persistTimeout is bookkeeping for the debounced save, not UI state —
    // making it observable would invalidate observers on every zoom.
    makeAutoObservable(this, { _persistTimeout: false });
  }

  initialize = (viewerMode = false) => {
    if (viewerMode) this.setViewerModeDefaults();
    else this.loadFromLocalStorage();
  };

  timeToXPixels = (time: number) => `${time * this.pixelsPerSecond}px`;
  timeToX = (time: number) => time * this.pixelsPerSecond;
  xToTime = (x: number) => x / this.pixelsPerSecond;

  // Horizontally scrolls the timeline so the given time sits just inside the
  // left of the view (past the fixed layer-header column). Used by the device
  // panel's "locate" button to jump back to the selected block.
  scrollToTime = (time: number) => {
    const timeline = document.getElementById("timeline");
    if (!timeline) return;
    const margin = 24;
    timeline.scrollTo({
      left: Math.max(0, time * this.pixelsPerSecond - margin),
      behavior: "smooth",
    });
  };

  /**
   * Zoom and scroll so the given block fills the timeline content viewport
   * (with a little padding) and is centered. Clamped to min/max zoom — long
   * blocks may still overflow at minimum zoom.
   */
  fitBlockInView = (block: { startTime: number; duration: number }) => {
    if (!this.canTimelineZoom) return;
    const timeline = document.getElementById("timeline");
    if (!timeline) return;

    const visibleWidth = Math.max(
      1,
      timeline.clientWidth - TIMELINE_HEADER_WIDTH,
    );
    const padding = Math.min(64, visibleWidth * 0.08);
    const usableWidth = Math.max(1, visibleWidth - padding * 2);
    const duration = Math.max(block.duration, 0.01);
    const newPps = Math.min(
      MAX_PIXELS_PER_SECOND,
      Math.max(MIN_PIXELS_PER_SECOND, usableWidth / duration),
    );

    this.pixelsPerSecond = newPps;
    this.saveToLocalStorageSoon();

    const centerTime = block.startTime + block.duration / 2;
    const newScrollLeft = Math.max(0, centerTime * newPps - visibleWidth / 2);
    timeline.scrollLeft = newScrollLeft;
    // Re-apply after layout so scrollLeft isn't clamped to the pre-zoom width.
    requestAnimationFrame(() => {
      timeline.scrollLeft = newScrollLeft;
    });
  };

  /**
   * Set an absolute zoom level (pixels per second).
   * @param anchorClientX optional mouse X to keep that time fixed in the viewport;
   *   when omitted (or outside the timeline, e.g. toolbar zoom buttons), anchors
   *   to the center of the visible timeline content
   */
  setZoom = (pixelsPerSecond: number, anchorClientX?: number) => {
    if (!this.canTimelineZoom) return;

    const oldPps = this.pixelsPerSecond;
    const newPps = Math.min(
      MAX_PIXELS_PER_SECOND,
      Math.max(MIN_PIXELS_PER_SECOND, pixelsPerSecond),
    );
    if (newPps === oldPps) return;

    const timeline = document.getElementById("timeline");
    if (timeline) {
      const rect = timeline.getBoundingClientRect();
      // Only mouse-anchor when the pointer is actually over the timeline.
      // Toolbar buttons / keyboard shortcuts leave the mouse outside, so fall
      // back to the center of the scrollable content (past the sticky header).
      const mouseInTimeline =
        anchorClientX !== undefined &&
        anchorClientX >= rect.left &&
        anchorClientX <= rect.right;
      const offsetX = mouseInTimeline
        ? anchorClientX - rect.left
        : TIMELINE_HEADER_WIDTH + (rect.width - TIMELINE_HEADER_WIDTH) / 2;
      const contentX = timeline.scrollLeft + offsetX;
      const anchorTime = Math.max(
        0,
        (contentX - TIMELINE_HEADER_WIDTH) / oldPps,
      );

      this.pixelsPerSecond = newPps;
      const newScrollLeft =
        TIMELINE_HEADER_WIDTH + anchorTime * newPps - offsetX;
      timeline.scrollLeft = newScrollLeft;
      // Re-apply after MobX→React lays out the new content width. Setting
      // scrollLeft before scrollWidth grows gets clamped to the old max, which
      // makes toolbar/keyboard zoom appear to jump left instead of staying
      // centered.
      requestAnimationFrame(() => {
        timeline.scrollLeft = newScrollLeft;
      });
    } else {
      this.pixelsPerSecond = newPps;
    }

    this.saveToLocalStorageSoon();
  };

  /**
   * Multiplicatively zoom the timeline.
   * @param factor >1 zooms in, <1 zooms out
   * @param anchorClientX optional mouse X to keep that time fixed in the viewport;
   *   when omitted (or outside the timeline), anchors to the content center
   */
  zoomBy = (factor: number, anchorClientX?: number) => {
    if (factor === 1) return;
    this.setZoom(this.pixelsPerSecond * factor, anchorClientX);
  };

  zoomIn = (anchorClientX?: number) =>
    this.zoomBy(ZOOM_FACTOR, anchorClientX);

  zoomOut = (anchorClientX?: number) =>
    this.zoomBy(1 / ZOOM_FACTOR, anchorClientX);

  setHoverHelp = (help: HoverHelp) => {
    this.hoverHelpStack = [...this.hoverHelpStack, help];
  };

  clearHoverHelp = () => {
    if (this.hoverHelpStack.length === 0) return;
    this.hoverHelpStack = this.hoverHelpStack.slice(0, -1);
  };

  clearAllHoverHelp = () => {
    this.hoverHelpStack = [];
  };

  togglePerformance = () => {
    this.showingPerformance = !this.showingPerformance;
    this.saveToLocalStorage();
  };

  toggleWaveformOverlay = () => {
    this.showingWaveformOverlay = !this.showingWaveformOverlay;
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
    this.showingPerformance = false;
    this.displayMode = "canopy";
    this.renderTargetSize = INITIAL_RENDER_TARGET_SIZE;
  };

  loadFromLocalStorage = () => {
    if (typeof window === "undefined") return;
    const data = localStorage.getItem("uiStore");
    if (data) {
      const localStorageUiSettings = JSON.parse(data);
      this.showingPerformance = !!localStorageUiSettings.showingPerformance;
      this.displayMode = sanitizeDisplayMode(
        localStorageUiSettings.displayMode,
      );
      this.playgroundDisplayMode = sanitizeDisplayMode(
        localStorageUiSettings.playgroundDisplayMode,
      );
      this.renderTargetSize =
        localStorageUiSettings.renderTargetSize || INITIAL_RENDER_TARGET_SIZE;
      this._emceeOutputControlsMinimized =
        !!localStorageUiSettings.emceeOutputControlsMinimized;
      if (this.store.context === "experienceEditor")
        this.pixelsPerSecond =
          localStorageUiSettings.pixelsPerSecond || INITIAL_PIXELS_PER_SECOND;
    }
  };

  // Zoom persistence is coalesced: a zoom gesture changes pixelsPerSecond many
  // times in a row, and each save is a synchronous JSON.stringify + localStorage
  // write on the main thread. Only the final zoom level matters, so defer it.
  _persistTimeout: ReturnType<typeof setTimeout> | null = null;
  saveToLocalStorageSoon = () => {
    if (typeof window === "undefined") return;
    if (this._persistTimeout !== null) clearTimeout(this._persistTimeout);
    this._persistTimeout = setTimeout(() => {
      this._persistTimeout = null;
      this.saveToLocalStorage();
    }, 300);
  };

  saveToLocalStorage = () => {
    if (typeof window === "undefined") return;
    if (this._persistTimeout !== null) {
      clearTimeout(this._persistTimeout);
      this._persistTimeout = null;
    }
    localStorage.setItem(
      "uiStore",
      JSON.stringify({
        showingPerformance: this.showingPerformance,
        displayMode: this.displayMode,
        playgroundDisplayMode: this.playgroundDisplayMode,
        renderTargetSize: this.renderTargetSize,
        pixelsPerSecond: this.pixelsPerSecond,
        emceeOutputControlsMinimized: this._emceeOutputControlsMinimized,
      }),
    );
  };
}
