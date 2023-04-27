import { MAX_TIME } from "@/src/utils/time";
import { makeAutoObservable, runInAction } from "mobx";

export default class Timer {
  private _lastStartedAtDateTime = 0;
  private _globalTime = 0;
  private _lastCursor = { position: 0 };

  playing = false;

  get globalTime() {
    return this._globalTime;
  }

  set globalTime(time: number) {
    this._globalTime = time < 0 ? 0 : time;
  }

  /**
   * The last cursor position that was set by the user. This is listenable/observable, since it is and object and not a primitive.
   *
   * @readonly
   * @memberof Timer
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

  constructor() {
    makeAutoObservable(this);

    runInAction(() => this.initialize());
  }

  initialize = () => {
    if (typeof window === "undefined") return;
    requestAnimationFrame(this.tick);
  };

  togglePlaying = () => {
    this.playing = !this.playing;

    if (this.playing) {
      this._lastStartedAtDateTime = Date.now();
      this.lastCursorPosition = this.globalTime;
      requestAnimationFrame(this.tick);
    }
  };

  tick = (t: number) => {
    if (!this.playing) return;

    // this will tie the timer tick to the refresh rate of the browser/monitor. We may want to
    // revisit this later if we want to cap the framerate.
    requestAnimationFrame(this.tick);

    if (this.globalTime > MAX_TIME) {
      this.playing = false;
      return;
    }

    this.globalTime =
      this.lastCursorPosition +
      (Date.now() - this._lastStartedAtDateTime) / 1000;
  };

  setTime = (time: number) => {
    this.globalTime = time;
    this.lastCursorPosition = time;
    this._lastStartedAtDateTime = Date.now();
  };

  skipBackward = () => {
    this.setTime(this.globalTime - 0.2);
  };

  skipForward = () => {
    this.setTime(this.globalTime + 0.2);
  };
}
