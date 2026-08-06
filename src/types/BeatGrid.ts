/**
 * A tempo map: an ordered list of anchors, each pinning a beat number to a
 * time, with a constant tempo between consecutive anchors (warp-marker
 * semantics — tempo is piecewise constant and jumps at anchors, rather than
 * ramping continuously).
 *
 * A single anchor plus `trailingBpm` is an ordinary fixed-tempo grid, so the
 * common case is not a special case: `anchors.length === 1`.
 *
 * Everything else in the app — snapping, grid rendering, the metronome, bar
 * numbering — is built on `timeToBeat` / `beatToTime` alone, so this
 * representation can grow without touching any consumer.
 */

export type BeatGridAnchor = { time: number; beat: number };

/** Whether the grid came from audio analysis or was edited by a human. */
export type BeatGridSource = "auto" | "manual";

export type SerializedBeatGrid = {
  anchors: BeatGridAnchor[];
  trailingBpm: number;
  beatsPerBar: number;
  /** Which beat number lands on bar 1, modulo `beatsPerBar`. */
  downbeat: number;
  source: BeatGridSource;
  /** 0-1 detection confidence; 1 for a hand-edited grid. */
  confidence: number;
};

export const DEFAULT_BPM = 120;
export const MIN_BPM = 20;
export const MAX_BPM = 400;

const EPSILON = 1e-9;
// Two anchors closer than this describe a tempo so extreme it's certainly a
// mistake, and dividing by the gap would blow up.
const MIN_SEGMENT_SECONDS = 0.05;
// Guards the render loop against a pathological zoom/tempo combination asking
// for more lines than could ever be visible.
const MAX_LINES_PER_QUERY = 5000;

export type GridDivisionId =
  | "bar"
  | "1/2"
  | "1/4"
  | "1/8"
  | "1/16"
  | "1/32"
  | "1/4T"
  | "1/8T";

/** `beats` is null for "bar", whose size depends on the grid's time signature. */
export const GRID_DIVISIONS: readonly {
  id: GridDivisionId;
  label: string;
  beats: number | null;
}[] = [
  { id: "bar", label: "Bar", beats: null },
  { id: "1/2", label: "1/2", beats: 2 },
  { id: "1/4", label: "1/4", beats: 1 },
  { id: "1/8", label: "1/8", beats: 0.5 },
  { id: "1/16", label: "1/16", beats: 0.25 },
  { id: "1/32", label: "1/32", beats: 0.125 },
  { id: "1/4T", label: "1/4T", beats: 2 / 3 },
  { id: "1/8T", label: "1/8T", beats: 1 / 3 },
];

export const clampBpm = (bpm: number) =>
  Number.isFinite(bpm) ? Math.min(MAX_BPM, Math.max(MIN_BPM, bpm)) : DEFAULT_BPM;

/** A beat line, plus how strong it should read in the UI. */
export type BeatGridLine = {
  beat: number;
  time: number;
  isBeat: boolean;
  isBar: boolean;
  barNumber: number;
};

const normalizeAnchors = (anchors: BeatGridAnchor[]): BeatGridAnchor[] => {
  const result: BeatGridAnchor[] = [];
  for (const anchor of [...anchors].sort((a, b) => a.time - b.time)) {
    if (!Number.isFinite(anchor.time) || !Number.isFinite(anchor.beat)) continue;
    const previous = result[result.length - 1];
    // A segment that doesn't advance in both time and beat would make the
    // mapping non-invertible, so drop the offending anchor rather than
    // producing a grid that can't be read backwards.
    if (
      previous &&
      (anchor.time - previous.time < MIN_SEGMENT_SECONDS ||
        anchor.beat - previous.beat < EPSILON)
    )
      continue;
    result.push({ time: anchor.time, beat: anchor.beat });
  }
  return result.length ? result : [{ time: 0, beat: 0 }];
};

const positiveModulo = (value: number, modulus: number) =>
  ((value % modulus) + modulus) % modulus;

export class BeatGrid {
  readonly anchors: readonly BeatGridAnchor[];
  readonly trailingBpm: number;
  readonly beatsPerBar: number;
  readonly downbeat: number;
  readonly source: BeatGridSource;
  readonly confidence: number;

  constructor(options: Partial<SerializedBeatGrid> = {}) {
    this.anchors = normalizeAnchors(options.anchors ?? [{ time: 0, beat: 0 }]);
    this.trailingBpm = clampBpm(options.trailingBpm ?? DEFAULT_BPM);
    this.beatsPerBar = Math.max(1, Math.round(options.beatsPerBar ?? 4));
    this.downbeat = positiveModulo(options.downbeat ?? 0, this.beatsPerBar);
    this.source = options.source === "manual" ? "manual" : "auto";
    this.confidence = Math.min(1, Math.max(0, options.confidence ?? 0));
  }

  /** A fixed-tempo grid whose beat 0 falls at `offset` seconds. */
  static constant(
    bpm: number,
    offset = 0,
    options: Partial<SerializedBeatGrid> = {},
  ) {
    return new BeatGrid({
      ...options,
      anchors: [{ time: offset, beat: 0 }],
      trailingBpm: bpm,
    });
  }

  static deserialize(data: Partial<SerializedBeatGrid> | null | undefined) {
    return new BeatGrid(data ?? {});
  }

  serialize = (): SerializedBeatGrid => ({
    anchors: this.anchors.map((anchor) => ({ ...anchor })),
    trailingBpm: this.trailingBpm,
    beatsPerBar: this.beatsPerBar,
    downbeat: this.downbeat,
    source: this.source,
    confidence: this.confidence,
  });

  /** True when the whole song runs at one tempo (the overwhelmingly common case). */
  get isConstant() {
    return this.anchors.length === 1;
  }

  /** Time of beat 0 — the "offset" of a fixed-tempo grid. */
  get offset() {
    return this.beatToTime(0);
  }

  /**
   * Seconds per beat of the segment that STARTS at anchor `index`. The segment
   * after the last anchor is unbounded and runs at `trailingBpm`; time before
   * the first anchor extrapolates backwards using the first segment.
   */
  private segmentSecondsPerBeat = (index: number) => {
    const next = this.anchors[index + 1];
    if (!next) return 60 / this.trailingBpm;
    const current = this.anchors[index];
    return (next.time - current.time) / (next.beat - current.beat);
  };

  /** Index of the last anchor at or before `time`, clamped to 0. */
  private segmentIndexAtTime = (time: number) => {
    let low = 0;
    let high = this.anchors.length - 1;
    while (low < high) {
      const middle = Math.ceil((low + high) / 2);
      if (this.anchors[middle].time <= time) low = middle;
      else high = middle - 1;
    }
    return low;
  };

  /** Index of the last anchor at or before `beat`, clamped to 0. */
  private segmentIndexAtBeat = (beat: number) => {
    let low = 0;
    let high = this.anchors.length - 1;
    while (low < high) {
      const middle = Math.ceil((low + high) / 2);
      if (this.anchors[middle].beat <= beat) low = middle;
      else high = middle - 1;
    }
    return low;
  };

  timeToBeat = (time: number) => {
    const index = this.segmentIndexAtTime(time);
    const anchor = this.anchors[index];
    return anchor.beat + (time - anchor.time) / this.segmentSecondsPerBeat(index);
  };

  beatToTime = (beat: number) => {
    const index = this.segmentIndexAtBeat(beat);
    const anchor = this.anchors[index];
    return anchor.time + (beat - anchor.beat) * this.segmentSecondsPerBeat(index);
  };

  bpmAt = (time: number) =>
    60 / this.segmentSecondsPerBeat(this.segmentIndexAtTime(time));

  /** Size of a grid division in beats. "bar" tracks the time signature. */
  divisionBeats = (division: GridDivisionId) => {
    const found = GRID_DIVISIONS.find((entry) => entry.id === division);
    if (!found) return 1;
    return found.beats ?? this.beatsPerBar;
  };

  /**
   * Round a beat to the nearest multiple of `divisionBeats`, measured from the
   * downbeat so that bar-level snapping lands on bar lines rather than beat 0.
   */
  quantizeBeat = (beat: number, divisionBeats: number) =>
    Math.round((beat - this.downbeat) / divisionBeats) * divisionBeats +
    this.downbeat;

  /** Nearest grid time to `time`. Does not consider whether snap is enabled. */
  quantizeTime = (time: number, divisionBeats: number) =>
    this.beatToTime(this.quantizeBeat(this.timeToBeat(time), divisionBeats));

  isBarStart = (beat: number) => {
    const offsetInBar = positiveModulo(beat - this.downbeat, this.beatsPerBar);
    return (
      offsetInBar < 1e-6 || Math.abs(offsetInBar - this.beatsPerBar) < 1e-6
    );
  };

  /** 1-based bar number containing `beat`. */
  barNumber = (beat: number) =>
    Math.floor((beat - this.downbeat) / this.beatsPerBar) + 1;

  /**
   * Every grid line in [startTime, endTime], at `divisionBeats` resolution.
   * Callers pass only the visible window, so this stays small.
   */
  linesInRange = (
    startTime: number,
    endTime: number,
    divisionBeats: number,
  ): BeatGridLine[] => {
    if (!(divisionBeats > 0) || endTime <= startTime) return [];

    const startBeat = this.timeToBeat(startTime);
    const endBeat = this.timeToBeat(endTime);
    const firstStep = Math.ceil(
      (startBeat - this.downbeat) / divisionBeats - EPSILON,
    );
    const lastStep = Math.floor(
      (endBeat - this.downbeat) / divisionBeats + EPSILON,
    );
    if (lastStep < firstStep) return [];

    const lines: BeatGridLine[] = [];
    const steps = Math.min(lastStep - firstStep, MAX_LINES_PER_QUERY);
    for (let step = 0; step <= steps; step++) {
      const beat = this.downbeat + (firstStep + step) * divisionBeats;
      lines.push({
        beat,
        time: this.beatToTime(beat),
        isBeat: Math.abs(beat - Math.round(beat)) < 1e-6,
        isBar: this.isBarStart(beat),
        barNumber: this.barNumber(beat),
      });
    }
    return lines;
  };

  // ============================== editing ==================================
  // A BeatGrid is immutable: edits return a new grid. That keeps MobX change
  // detection trivial (identity changes) and makes undo/redo a matter of
  // holding onto old values.

  private with = (changes: Partial<SerializedBeatGrid>) =>
    new BeatGrid({ ...this.serialize(), ...changes });

  /** Mark as hand-edited, which stops analysis from overwriting it. */
  asManual = () => (this.source === "manual" ? this : this.withSource("manual"));

  withSource = (source: BeatGridSource) =>
    this.with({ source, confidence: source === "manual" ? 1 : this.confidence });

  /**
   * Set the tempo of the final (unbounded) segment. On a fixed-tempo grid this
   * is simply "the" tempo, and beat 0 stays put.
   */
  withTrailingBpm = (bpm: number) =>
    this.with({ trailingBpm: clampBpm(bpm), source: "manual", confidence: 1 });

  /**
   * Scale every segment's tempo at once, keeping anchor times fixed. Halving
   * and doubling is the single most common correction, because an octave error
   * is the one mistake tempo detection still makes on sparse material.
   */
  withTempoScaled = (factor: number) =>
    this.with({
      anchors: this.anchors.map((anchor) => ({
        time: anchor.time,
        beat: anchor.beat * factor,
      })),
      trailingBpm: clampBpm(this.trailingBpm * factor),
      downbeat: positiveModulo(this.downbeat * factor, this.beatsPerBar),
      source: "manual",
      confidence: 1,
    });

  /** Slide the whole grid in time, changing phase without changing tempo. */
  withTimeShift = (deltaSeconds: number) =>
    this.with({
      anchors: this.anchors.map((anchor) => ({
        ...anchor,
        time: anchor.time + deltaSeconds,
      })),
      source: "manual",
      confidence: 1,
    });

  /** Move beat 0 to `time` (used by tap-tempo and manual alignment). */
  withOffset = (time: number) => this.withTimeShift(time - this.offset);

  withBeatsPerBar = (beatsPerBar: number) =>
    this.with({ beatsPerBar, source: "manual", confidence: 1 });

  /** Make the beat nearest `time` a bar start, leaving beat phase alone. */
  withDownbeatAtTime = (time: number) =>
    this.with({
      downbeat: positiveModulo(
        Math.round(this.timeToBeat(time)),
        this.beatsPerBar,
      ),
      source: "manual",
      confidence: 1,
    });

  /**
   * Pin the beat nearest `time` where it currently sits. Splitting a segment
   * this way changes nothing on its own — it just creates a handle that later
   * edits can pivot around.
   */
  withAnchorAtTime = (time: number) => {
    const beat = Math.round(this.timeToBeat(time));
    const anchorTime = this.beatToTime(beat);
    if (
      this.anchors.some(
        (anchor) => Math.abs(anchor.time - anchorTime) < MIN_SEGMENT_SECONDS,
      )
    )
      return this;
    return this.with({
      anchors: [...this.anchors, { time: anchorTime, beat }],
      source: "manual",
      confidence: 1,
    });
  };

  /**
   * Drag an anchor to a new time, keeping its beat number. Only the segments
   * on either side of it retime; the rest of the song stays where it is.
   */
  withAnchorMoved = (index: number, time: number) => {
    const anchor = this.anchors[index];
    if (!anchor) return this;
    const anchors = this.anchors.map((existing, i) =>
      i === index ? { time, beat: existing.beat } : { ...existing },
    );
    // normalizeAnchors would silently drop an anchor dragged past a neighbor,
    // which reads as the handle vanishing mid-drag; refuse the move instead.
    const previous = this.anchors[index - 1];
    const next = this.anchors[index + 1];
    if (previous && time - previous.time < MIN_SEGMENT_SECONDS) return this;
    if (next && next.time - time < MIN_SEGMENT_SECONDS) return this;
    return this.with({ anchors, source: "manual", confidence: 1 });
  };

  /** Remove an anchor. The last remaining anchor cannot be removed. */
  withoutAnchor = (index: number) => {
    if (this.anchors.length <= 1) return this;
    return this.with({
      anchors: this.anchors.filter((_, i) => i !== index),
      source: "manual",
      confidence: 1,
    });
  };

  /** Index of the anchor within `tolerance` seconds of `time`, or -1. */
  anchorIndexNear = (time: number, tolerance: number) => {
    let best = -1;
    let bestDistance = tolerance;
    this.anchors.forEach((anchor, index) => {
      const distance = Math.abs(anchor.time - time);
      if (distance <= bestDistance) {
        bestDistance = distance;
        best = index;
      }
    });
    return best;
  };
}
