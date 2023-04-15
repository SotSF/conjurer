import { FRAMES_PER_SECOND, MAX_TIME } from "@/src/utils/time";
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
    setInterval(this.tick, 1000 / FRAMES_PER_SECOND);
  };

  togglePlaying = () => {
    this.playing = !this.playing;

    if (this.playing) {
      this._lastStartedAtDateTime = Date.now();
      this.lastCursorPosition = this.globalTime;
    }
  };

  tick = () => {
    if (!this.playing) return;

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