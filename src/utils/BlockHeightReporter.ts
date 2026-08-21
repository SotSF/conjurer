import { makeAutoObservable, runInAction } from "mobx";

/**
 * Observable record of blocks' rendered heights within one timeline track,
 * batching a frame's worth of reports into a single observable write.
 *
 * Every block's layout reads the track's whole height map, so writing one
 * entry re-renders every mounted block in the track. One write per report is
 * therefore quadratic in the number of blocks changing size at once, which is
 * exactly what happens when a zoom or a lane toggle resizes many blocks in the
 * same frame. Measured on a scroll that resized 84 blocks: 12,262
 * TimelineBlockStack renders before batching, 934 after.
 */
export class BlockHeightReporter {
  heights = new Map<string, number>();

  // Buffered reports, applied together once per frame. Deliberately not
  // observable — this is bookkeeping for the flush, not state anything renders.
  _pending = new Map<string, number>();
  _flushHandle: number | null = null;

  constructor() {
    makeAutoObservable(this, {
      _pending: false,
      _flushHandle: false,
    });
  }

  /**
   * Record one block's rendered height.
   *
   * Reports that wouldn't change anything are ignored. Without this the flush
   * is self-sustaining: applying a batch re-renders the track's blocks, which
   * fires their ResizeObservers, which re-report the identical heights and
   * schedule another flush — burning a full track re-render every frame
   * forever. (Measured: idle frame time doubled, 8.4ms -> 16.7ms.)
   */
  report = (blockId: string, heightPx: number) => {
    if (this.heights.get(blockId) === heightPx && !this._pending.has(blockId))
      return;

    this._pending.set(blockId, heightPx);
    if (this._flushHandle !== null) return;
    if (typeof window === "undefined") {
      this.flush();
      return;
    }
    this._flushHandle = window.requestAnimationFrame(() => this.flush());
  };

  private flush = () => {
    this._flushHandle = null;
    if (this._pending.size === 0) return;
    const pending = this._pending;
    this._pending = new Map();
    runInAction(() => {
      for (const [blockId, heightPx] of pending)
        this.heights.set(blockId, heightPx);
    });
  };
}
