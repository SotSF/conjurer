import { INITIAL_PIXELS_PER_SECOND } from "@/src/utils/time";
import { makeAutoObservable } from "mobx";

const MAX_PIXELS_PER_SECOND = 90;
const MIN_PIXELS_PER_SECOND = 4;

/**
 * MobX store for UI state.
 *
 * @export
 * @class UIStore
 */
export class UIStore {
  horizontalLayout = true;
  displayingCanopy = true;
  showingPerformance = false;
  showingWaveformOverlay = false;
  showingOpenExperienceModal = false;
  showingSaveExperienceModal = false;
  patternDrawerOpen = true;

  pixelsPerSecond = INITIAL_PIXELS_PER_SECOND; // the zoom of the timeline

  constructor() {
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
  };

  zoomIn = () => {
    this.pixelsPerSecond += 2;
    if (this.pixelsPerSecond > MAX_PIXELS_PER_SECOND) {
      this.pixelsPerSecond = MAX_PIXELS_PER_SECOND;
    }
  };

  toggleLayout = () => {
    this.horizontalLayout = !this.horizontalLayout;
    this.saveToLocalStorage();
  };

  toggleCanopyDisplay = () => {
    this.displayingCanopy = !this.displayingCanopy;
    this.saveToLocalStorage();
  };

  togglePerformance = () => {
    this.showingPerformance = !this.showingPerformance;
    this.saveToLocalStorage();
  };

  toggleWaveformOverlay = () => {
    this.showingWaveformOverlay = !this.showingWaveformOverlay;
    this.saveToLocalStorage();
  };

  loadFromLocalStorage = () => {
    if (typeof window === "undefined") return;
    const data = localStorage.getItem("uiStore");
    if (data) {
      const localStorageUiSettings = JSON.parse(data);
      this.horizontalLayout = !!localStorageUiSettings.horizontalLayout;
      this.displayingCanopy = !!localStorageUiSettings.displayingCanopy;
      this.showingPerformance = !!localStorageUiSettings.showingPerformance;
      this.showingWaveformOverlay =
        !!localStorageUiSettings.showingWaveformOverlay;
    }
  };

  saveToLocalStorage = () => {
    if (typeof window === "undefined") return;
    localStorage.setItem(
      "uiStore",
      JSON.stringify({
        horizontalLayout: this.horizontalLayout,
        displayingCanopy: this.displayingCanopy,
        showingPerformance: this.showingPerformance,
        showingWaveformOverlay: this.showingWaveformOverlay,
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
