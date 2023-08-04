import { MAX_FRAMES_PER_SECOND, MAX_TIME } from "@/src/utils/time";
import { makeAutoObservable, runInAction } from "mobx";

const DEBUG = false;
let frameCount = 0;
let lastFrameTime = 0;

export class Timer {
  private _lastStartedAtDateTime = 0;
  private _tickListeners: ((time: number) => void)[] = [];

  // private _globalTime = 0;

  // get globalTime() {
  //   return this._globalTime;
  // }

  // get globalTimeRounded() {
  //   return Math.round(this._globalTime * 10) / 10;
  // }

  // set globalTime(time: number) {
  //   this._globalTime = time < 0 ? 0 : time;
  // }

  private _lastCursor = { position: 0 };

  /**
   * The last cursor position that was set by the user. This is listenable/observable, since it is an object and not a primitive.
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

  ticking = false;

  constructor() {
    makeAutoObservable(this);

    // runInAction(() => this.initialize());
  }

  // initialize = () => {
  //   if (typeof window === "undefined") return;
  //   requestAnimationFrame(this.tick);
  // };

  // addTickListener = (listener: (time: number) => void) => {
  //   this._tickListeners.push(listener);
  // };

  // start = () => {
  //   this.ticking = true;
  //   this._lastStartedAtDateTime = Date.now();
  //   requestAnimationFrame(this.tick);
  // };

  // stop = () => {
  //   this.ticking = false;
  //   this.lastCursorPosition = this.globalTime;
  // };

  // tick = (t: number) => {
  //   if (this.globalTime > MAX_TIME) this.ticking = false;
  //   if (!this.ticking) return;

  //   setTimeout(this.tick, 1000 / MAX_FRAMES_PER_SECOND);

  //   if (DEBUG) {
  //     frameCount++;
  //     const currentSecond = Math.floor(Date.now() / 1000);
  //     if (currentSecond > lastFrameTime) {
  //       console.log("FPS:", frameCount);
  //       frameCount = 0;
  //       lastFrameTime = currentSecond;
  //     }
  //   }

  //   this.globalTime =
  //     this.lastCursorPosition +
  //     (Date.now() - this._lastStartedAtDateTime) / 1000;
  //   this._tickListeners.forEach((listener) => listener(this.globalTime));
  // };

  // setTime = (time: number) => {
  //   this.globalTime = time;
  //   this.lastCursorPosition = time;
  //   this._lastStartedAtDateTime = Date.now();
  // };

  // skipBackward = () => {
  //   this.setTime(this.globalTime - 0.05);
  // };

  // skipForward = () => {
  //   this.setTime(this.globalTime + 0.05);
  // };
}
