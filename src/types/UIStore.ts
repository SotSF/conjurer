import { Timer } from "@/src/types/Timer";
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
  showingUploadAudioModal = true;
  patternDrawerOpen = false;

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
  };

  loadFromLocalStorage = () => {
    if (typeof window === "undefined") return;
    const data = localStorage.getItem("uiStore");
    if (data) {
      const localStorageUiSettings = JSON.parse(data);
      this.horizontalLayout = !!localStorageUiSettings.horizontalLayout;
      this.displayingCanopy = !!localStorageUiSettings.displayingCanopy;
      this.showingPerformance = !!localStorageUiSettings.showingPerformance;
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
