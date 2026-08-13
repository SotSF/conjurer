/**
 * Focused tests for snap-to-beginning / snap-to-end of the audio track.
 * Runs on Node's built-in test runner (node:test + node:assert) via ts-node —
 * no new dependencies. Exercises the pure seek/clamp semantics against a
 * minimal WaveSurfer mock.
 */
import assert from "node:assert/strict";
import { test } from "node:test";

class FakeWaveSurfer {
  private _current = 0;
  constructor(private _duration: number) {}
  getDuration() {
    return this._duration;
  }
  getCurrentTime() {
    return this._current;
  }
  seekTo(progress: number) {
    assert.ok(
      progress >= 0 && progress <= 1 && Number.isFinite(progress),
      `seekTo received out-of-range/NaN progress: ${progress}`,
    );
    this._current = progress * this._duration;
  }
}

class SnapHarness {
  globalTime = 0;
  lastCursorPosition = 0;
  wavesurfer: FakeWaveSurfer | null = null;

  setTimeWithCursor = (time: number) => {
    const validTime = Math.max(0, time);
    this.lastCursorPosition = validTime;
    this.globalTime = validTime;
    if (!this.wavesurfer) return;
    const duration = this.wavesurfer.getDuration();
    if (this.wavesurfer.getCurrentTime() === validTime || duration === 0)
      return;
    this.wavesurfer.seekTo(validTime / duration);
  };

  goToBeginning = () => {
    this.setTimeWithCursor(0);
  };

  goToEnd = () => {
    const duration = this.wavesurfer?.getDuration() ?? 0;
    this.setTimeWithCursor(duration);
  };
}

test("goToBeginning snaps cursor and globalTime to 0", () => {
  const h = new SnapHarness();
  h.wavesurfer = new FakeWaveSurfer(120);
  h.setTimeWithCursor(90);
  h.goToBeginning();
  assert.equal(h.globalTime, 0);
  assert.equal(h.lastCursorPosition, 0);
});

test("goToEnd snaps to song duration, not MAX_TIME (30*60)", () => {
  const h = new SnapHarness();
  h.wavesurfer = new FakeWaveSurfer(120);
  h.goToEnd();
  assert.equal(h.globalTime, 120);
  assert.notEqual(h.globalTime, 30 * 60);
});

test("goToEnd with duration 0 is a safe no-op (no divide-by-zero / NaN seek)", () => {
  const h = new SnapHarness();
  h.wavesurfer = new FakeWaveSurfer(0);
  h.goToEnd();
  assert.equal(h.globalTime, 0);
});

test("goToBeginning / goToEnd are no-op safe when wavesurfer is null", () => {
  const h = new SnapHarness();
  h.wavesurfer = null;
  assert.doesNotThrow(() => h.goToBeginning());
  assert.doesNotThrow(() => h.goToEnd());
  assert.equal(h.globalTime, 0);
});

test("setTimeWithCursor clamps negative input to 0", () => {
  const h = new SnapHarness();
  h.wavesurfer = new FakeWaveSurfer(120);
  h.setTimeWithCursor(-42);
  assert.equal(h.globalTime, 0);
  assert.equal(h.lastCursorPosition, 0);
});

test("snap methods never drive seekTo out of the [0,1] progress range", () => {
  const h = new SnapHarness();
  h.wavesurfer = new FakeWaveSurfer(200);
  h.goToEnd();
  h.goToBeginning();
  h.setTimeWithCursor(50);
  h.goToEnd();
  assert.equal(h.globalTime, 200);
});
