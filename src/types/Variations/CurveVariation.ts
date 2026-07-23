import { Variation } from "@/src/types/Variations/Variation";
import type { Store } from "@/src/types/Store";
import { generateId } from "@/src/utils/id";
import { bezierValueAtX, solveBezierS } from "@/src/utils/envelopeCurve";

/**
 * A Bézier handle: an offset from its node, in (time, value) units. The OUT
 * handle of a node is the second control point of the segment to its right; the
 * IN handle is the third control point of the segment to its left. `dt` is
 * signed — OUT handles point forward (dt >= 0), IN handles backward (dt <= 0).
 */
export type CurveHandle = { dt: number; dv: number };

export type CurveNode = {
  id: string;
  /** Local time within the region, in [0, duration]. */
  time: number;
  value: number;
  /**
   * Cubic-Bézier control handles as (time, value) offsets from the node. A
   * segment A→B is the parametric cubic Bézier with control points
   * P0=(A.time,A.value), P1=A+A.handleOut, P2=B+B.handleIn, P3=(B.time,B.value).
   * Because the handle's horizontal length is free (not pinned to a third of
   * the segment, as a Hermite tangent is), the curve can linger and accelerate
   * — the pen-tool degree of freedom. Value-at-time solves X(s)=t then reads
   * Y(s); see envelopeCurve.bezierValueAtX.
   */
  handleIn: CurveHandle;
  handleOut: CurveHandle;
};

const noHandle = (): CurveHandle => ({ dt: 0, dv: 0 });

export const makeCurveNode = (
  time: number,
  value: number,
  handleIn: CurveHandle = noHandle(),
  handleOut: CurveHandle = noHandle(),
): CurveNode => ({ id: generateId(), time, value, handleIn, handleOut });

/**
 * Handle offsets that make the segment of duration `dt` and value delta `dv` a
 * straight line: control points sit a third of the way along the chord. Both
 * flat (dv=0) and linear fall out of this.
 */
const straightOut = (dt: number, dv: number): CurveHandle => ({
  dt: dt / 3,
  dv: dv / 3,
});
const straightIn = (dt: number, dv: number): CurveHandle => ({
  dt: -dt / 3,
  dv: -dv / 3,
});

type Pt = { t: number; v: number };
const lerpPt = (a: Pt, b: Pt, s: number): Pt => ({
  t: a.t + (b.t - a.t) * s,
  v: a.v + (b.v - a.v) * s,
});

/**
 * A "Curve" region of the continuous-parameter automation lane: an ordered list
 * of breakpoint nodes joined by parametric cubic-Bézier segments, replacing the
 * discrete flat/linear/easing/spline variation types. Flat and linear fall out
 * of straight handles; one segment can carry an inflection, and the free handle
 * length reproduces any cubic spline exactly. Two nodes at the same `time` form
 * a hard STEP (a vertical jump), later node wins.
 *
 * `valueAtTime` solves the segment's X(s)=t by bisection then reads Y(s) — a few
 * cheap iterations per frame, the cost of the extra handle degree of freedom.
 */
export class CurveVariation extends Variation<number> {
  displayName = "Curve";
  /** Sorted ascending by time; equal times are allowed and encode steps. */
  nodes: CurveNode[];
  /**
   * The region's explicit value range (the Min/Max control) — like the old
   * spline's domainMin/domainMax. When set it governs the editor's vertical axis
   * AND is the range the curve's output occupies: `remapRange` rescales the node
   * values into it, so changing the range changes the value at time t (the shape
   * is normalized and mapped through the range). Undefined = the axis auto-fits
   * the node values (the default, `computeDomain`) and values are taken as-is.
   */
  rangeMin?: number;
  rangeMax?: number;

  constructor(duration: number, nodes: CurveNode[]) {
    super("curve", duration);
    this.nodes = [...nodes].sort((a, b) => a.time - b.time);
  }

  get hasExplicitRange() {
    return this.rangeMin != null && this.rangeMax != null;
  }

  /**
   * Remap the region's values from one value range to another (the Min/Max
   * control). Node values and handle heights rescale proportionally, so the
   * curve's normalized shape is preserved but its OUTPUT now spans [toMin, toMax]
   * — the old spline min/max behavior, so the value at time t follows the range.
   * Pins the explicit range. `from` is the range the values currently occupy
   * (the effective range: the prior explicit range, else the param/node range).
   */
  remapRange = (
    fromMin: number,
    fromMax: number,
    toMin: number,
    toMax: number,
  ) => {
    const scale = (toMax - toMin) / (fromMax - fromMin || 1);
    for (const n of this.nodes) {
      n.value = toMin + (n.value - fromMin) * scale;
      n.handleIn = { dt: n.handleIn.dt, dv: n.handleIn.dv * scale };
      n.handleOut = { dt: n.handleOut.dt, dv: n.handleOut.dv * scale };
    }
    this.rangeMin = toMin;
    this.rangeMax = toMax;
  };

  /** Clear the explicit range; the axis reverts to auto-fitting node values. */
  clearRange = () => {
    this.rangeMin = undefined;
    this.rangeMax = undefined;
  };

  /** A flat region: two nodes at the same value joined by a straight segment. */
  static flat = (duration: number, value: number) =>
    new CurveVariation(duration, [
      makeCurveNode(0, value, noHandle(), straightOut(duration, 0)),
      makeCurveNode(duration, value, straightIn(duration, 0), noHandle()),
    ]);

  /** A straight ramp from `from` to `to`. */
  static line = (duration: number, from: number, to: number) => {
    const dv = to - from;
    return new CurveVariation(duration, [
      makeCurveNode(0, from, noHandle(), straightOut(duration, dv)),
      makeCurveNode(duration, to, straightIn(duration, dv), noHandle()),
    ]);
  };

  get firstValue() {
    return this.nodes.length ? this.nodes[0].value : 0;
  }

  get lastValue() {
    return this.nodes.length ? this.nodes[this.nodes.length - 1].value : 0;
  }

  /** Control points of the segment between nodes `i` and `i+1`, in (t,v). */
  private segmentControlPoints(i: number): [Pt, Pt, Pt, Pt] {
    const a = this.nodes[i];
    const b = this.nodes[i + 1];
    return [
      { t: a.time, v: a.value },
      { t: a.time + a.handleOut.dt, v: a.value + a.handleOut.dv },
      { t: b.time + b.handleIn.dt, v: b.value + b.handleIn.dv },
      { t: b.time, v: b.value },
    ];
  }

  valueAtTime = (time: number) => {
    const { nodes } = this;
    if (nodes.length === 0) return 0;
    if (nodes.length === 1 || time <= nodes[0].time) return nodes[0].value;
    const last = nodes[nodes.length - 1];
    if (time >= last.time) return last.value;

    // Positive-width segment [a, b) containing `time`. Zero-width (equal-time)
    // segments are steps and skipped by the half-open condition, so a jump
    // resolves to the later node's value once time reaches it.
    for (let i = 0; i < nodes.length - 1; i++) {
      const a = nodes[i];
      const b = nodes[i + 1];
      if (a.time <= time && time < b.time) {
        const [p0, p1, p2, p3] = this.segmentControlPoints(i);
        return bezierValueAtX(
          p0.t,
          p0.v,
          p1.t,
          p1.v,
          p2.t,
          p2.v,
          p3.t,
          p3.v,
          time,
        );
      }
    }
    return last.value;
  };

  computeDomain = () => {
    if (this.nodes.length === 0) return [0, 0] as [number, number];
    let min = this.nodes[0].value;
    let max = this.nodes[0].value;
    for (const node of this.nodes) {
      if (node.value < min) min = node.value;
      if (node.value > max) max = node.value;
    }
    return [min, max] as [number, number];
  };

  computeSampledData = (duration: number) => {
    const totalSamples = Math.max(
      2,
      Math.ceil((duration || this.duration) * 8),
    );
    const data = [];
    for (let i = 0; i < totalSamples; i++) {
      data.push({
        value: this.valueAtTime(this.duration * (i / (totalSamples - 1))),
      });
    }
    return data;
  };

  /**
   * Insert a breakpoint at `time` lying on the current curve. Uses a De
   * Casteljau split so the curve shape is preserved exactly: the containing
   * segment's endpoint handles are rewritten and the new node gets both handles.
   */
  addNodeAtTime = (time: number) => {
    const t = time < 0 ? 0 : time > this.duration ? this.duration : time;
    const { nodes } = this;
    for (let i = 0; i < nodes.length - 1; i++) {
      const a = nodes[i];
      const b = nodes[i + 1];
      if (a.time <= t && t < b.time && b.time - a.time > 0) {
        const [p0, p1, p2, p3] = this.segmentControlPoints(i);
        const s = solveBezierS(p0.t, p1.t, p2.t, p3.t, t);
        const q0 = lerpPt(p0, p1, s);
        const q1 = lerpPt(p1, p2, s);
        const q2 = lerpPt(p2, p3, s);
        const r0 = lerpPt(q0, q1, s);
        const r1 = lerpPt(q1, q2, s);
        const mid = lerpPt(r0, r1, s);
        // Rewrite the two endpoints' inner handles to the split's outer legs...
        a.handleOut = { dt: q0.t - a.time, dv: q0.v - a.value };
        b.handleIn = { dt: q2.t - b.time, dv: q2.v - b.value };
        // ...and give the new node its two inner-leg handles.
        const node = makeCurveNode(
          mid.t,
          mid.v,
          { dt: r0.t - mid.t, dv: r0.v - mid.v },
          { dt: r1.t - mid.t, dv: r1.v - mid.v },
        );
        this.nodes = [...nodes, node].sort((x, y) => x.time - y.time);
        return node;
      }
    }
    // Fallback (e.g. click past the last positive segment): flat handles.
    const node = makeCurveNode(t, this.valueAtTime(t));
    this.nodes = [...nodes, node].sort((x, y) => x.time - y.time);
    return node;
  };

  /** Remove a node by id, keeping at least the two endpoints. */
  removeNode = (id: string) => {
    if (this.nodes.length <= 2) return;
    this.nodes = this.nodes.filter((n) => n.id !== id);
  };

  /**
   * Whether segment [i, i+1] is a straight line — i.e. its two Bézier control
   * points lie on the chord between the endpoints. A step (zero-width) is not a
   * straight segment. Used to keep a linear segment linear when a node moves.
   */
  isSegmentStraight = (i: number): boolean => {
    const a = this.nodes[i];
    const b = this.nodes[i + 1];
    if (!a || !b) return false;
    const dt = b.time - a.time;
    if (dt <= 0) return false;
    const chordV = (t: number) =>
      a.value + ((b.value - a.value) * (t - a.time)) / dt;
    const p1v = a.value + a.handleOut.dv;
    const p2v = b.value + b.handleIn.dv;
    const eps = 1e-5 * (Math.abs(a.value) + Math.abs(b.value) + 1);
    return (
      Math.abs(p1v - chordV(a.time + a.handleOut.dt)) < eps &&
      Math.abs(p2v - chordV(b.time + b.handleIn.dt)) < eps
    );
  };

  /**
   * Set a node's time & value, re-sorting to keep nodes time-ordered. Segments
   * that were STRAIGHT stay straight: their handles are re-derived from the new
   * chord after the move (so a flat line dragged by an endpoint becomes a
   * straight ramp, not a flat-ended S-curve). Curved segments keep their shape.
   */
  setNode = (id: string, time: number, value: number) => {
    const idx = this.nodes.findIndex((n) => n.id === id);
    if (idx < 0) return;
    const leftWasStraight = idx > 0 && this.isSegmentStraight(idx - 1);
    const rightWasStraight =
      idx < this.nodes.length - 1 && this.isSegmentStraight(idx);
    const node = this.nodes[idx];
    node.time = time;
    node.value = value;
    this.nodes = [...this.nodes].sort((a, b) => a.time - b.time);
    const j = this.nodes.findIndex((n) => n.id === id);
    if (leftWasStraight && j > 0) this.setSegmentStraight(j - 1);
    if (rightWasStraight && j < this.nodes.length - 1) this.setSegmentStraight(j);
  };

  /**
   * Set one side of a node's Bézier handle to an absolute (dt, dv) offset (the
   * two-handle drag). `dt` is clamped to keep the handle inside its segment and
   * pointing the right way, so X(s) stays monotonic (single-valued).
   */
  setNodeHandle = (id: string, side: "in" | "out", dt: number, dv: number) => {
    const idx = this.nodes.findIndex((n) => n.id === id);
    if (idx < 0) return;
    const node = this.nodes[idx];
    if (side === "out") {
      const next = this.nodes[idx + 1];
      const gap = next ? next.time - node.time : 0;
      node.handleOut = { dt: gap > 0 ? Math.min(Math.max(dt, 0), gap) : 0, dv };
    } else {
      const prev = this.nodes[idx - 1];
      const gap = prev ? node.time - prev.time : 0;
      node.handleIn = { dt: gap > 0 ? Math.max(Math.min(dt, 0), -gap) : 0, dv };
    }
  };

  /** Reset the segment between node `index` and the next node to a straight line. */
  setSegmentStraight = (index: number) => {
    const a = this.nodes[index];
    const b = this.nodes[index + 1];
    if (!a || !b) return;
    const dt = b.time - a.time;
    if (dt <= 0) return;
    a.handleOut = straightOut(dt, b.value - a.value);
    b.handleIn = straightIn(dt, b.value - a.value);
  };

  /**
   * Split into two Curves at local time `t`, preserving the shape exactly via a
   * De Casteljau split. Returns [left (spanning 0..t), right (spanning 0..dur-t)].
   * The split point becomes the last node of `left` and the first node of
   * `right`, each carrying the correct one-sided handle. Range carries to both.
   */
  splitAtTime = (t: number): [CurveVariation, CurveVariation] => {
    const dur = this.duration;
    const time = t < 0 ? 0 : t > dur ? dur : t;
    const work = this.clone();
    if (!work.nodes.some((n) => Math.abs(n.time - time) < 1e-9))
      work.addNodeAtTime(time);
    const dup = (n: CurveNode, dt: number) =>
      makeCurveNode(n.time + dt, n.value, { ...n.handleIn }, { ...n.handleOut });
    const leftNodes = work.nodes
      .filter((n) => n.time <= time + 1e-9)
      .map((n) => dup(n, 0));
    const rightNodes = work.nodes
      .filter((n) => n.time >= time - 1e-9)
      .map((n) => dup(n, -time));
    const left = new CurveVariation(
      time,
      leftNodes.length ? leftNodes : [makeCurveNode(0, this.firstValue)],
    );
    const right = new CurveVariation(
      dur - time,
      rightNodes.length ? rightNodes : [makeCurveNode(0, this.lastValue)],
    );
    left.rangeMin = right.rangeMin = this.rangeMin;
    left.rangeMax = right.rangeMax = this.rangeMax;
    return [left, right];
  };

  /**
   * Resize the region's END to `newDur`. Shrinking is a faithful De Casteljau
   * right-cut; growing just extends the duration (the trailing hold covers the
   * new tail via `valueAtTime`).
   */
  resizeEnd = (newDur: number) => {
    if (newDur < 1e-6) return;
    if (newDur < this.duration - 1e-9) {
      const [left] = this.splitAtTime(newDur);
      this.nodes = left.nodes;
    }
    this.duration = newDur;
  };

  /**
   * Move the region's START by `delta` (in local time). `delta > 0` moves the
   * start later (shrink from the left, trimming the leading portion — a faithful
   * De Casteljau left-cut); `delta < 0` moves it earlier (grow, adding a leading
   * hold at the first value). Content stays put in the surrounding global time.
   */
  shiftStart = (delta: number) => {
    const newDur = this.duration - delta;
    if (newDur < 1e-6) return;
    if (delta > 1e-9) {
      const [, right] = this.splitAtTime(delta);
      this.nodes = right.nodes;
      this.duration = right.duration;
    } else if (delta < -1e-9) {
      const shift = -delta;
      this.nodes = [
        makeCurveNode(0, this.firstValue),
        ...this.nodes.map((n) =>
          makeCurveNode(n.time + shift, n.value, { ...n.handleIn }, { ...n.handleOut }),
        ),
      ];
      this.duration = newDur;
    }
  };

  /**
   * Merge two adjacent Curves (`right` immediately follows `left`) into one
   * region. STRUCTURAL, never value reconciliation: the seam nodes are kept
   * as-is. Matching value → one node (handleIn from left, handleOut from right;
   * a corner if the tangents differ). Differing value → two coincident-time
   * nodes = a preserved STEP. Fully round-trips with a later re-split.
   */
  static mergeAdjacent = (
    left: CurveVariation,
    right: CurveVariation,
  ): CurveVariation => {
    const L = left.duration;
    const dup = (n: CurveNode, dt: number) =>
      makeCurveNode(n.time + dt, n.value, { ...n.handleIn }, { ...n.handleOut });
    const leftNodes = left.nodes.map((n) => dup(n, 0));
    const rightNodes = right.nodes.map((n) => dup(n, L));
    const lLast = leftNodes[leftNodes.length - 1];
    const rFirst = rightNodes[0];
    let merged: CurveNode[];
    if (lLast && rFirst && Math.abs(lLast.value - rFirst.value) < 1e-9) {
      // same value → collapse to one seam node (smooth, or a corner if tangents
      // differ); nothing is lost.
      const seam = makeCurveNode(
        L,
        lLast.value,
        { ...lLast.handleIn },
        { ...rFirst.handleOut },
      );
      merged = [...leftNodes.slice(0, -1), seam, ...rightNodes.slice(1)];
    } else {
      // value mismatch → keep both coincident nodes = a preserved step.
      merged = [...leftNodes, ...rightNodes];
    }
    const cv = new CurveVariation(L + right.duration, merged);
    cv.rangeMin = left.rangeMin ?? right.rangeMin;
    cv.rangeMax = left.rangeMax ?? right.rangeMax;
    return cv;
  };

  clone = () => {
    const cv = new CurveVariation(
      this.duration,
      this.nodes.map((node) => ({
        ...node,
        id: generateId(),
        handleIn: { ...node.handleIn },
        handleOut: { ...node.handleOut },
      })),
    );
    cv.rangeMin = this.rangeMin;
    cv.rangeMax = this.rangeMax;
    return cv;
  };

  serialize = () => ({
    type: this.type,
    duration: this.duration,
    rangeMin: this.rangeMin,
    rangeMax: this.rangeMax,
    nodes: this.nodes.map((node) => ({
      time: node.time,
      value: node.value,
      handleIn: { dt: node.handleIn.dt, dv: node.handleIn.dv },
      handleOut: { dt: node.handleOut.dt, dv: node.handleOut.dv },
    })),
  });

  static deserialize = (store: Store, data: any) => {
    const applyRange = (cv: CurveVariation) => {
      if (typeof data.rangeMin === "number") cv.rangeMin = data.rangeMin;
      if (typeof data.rangeMax === "number") cv.rangeMax = data.rangeMax;
      return cv;
    };
    const rawNodes: any[] = data.nodes ?? [];
    const nodes = rawNodes.map((node: any) =>
      makeCurveNode(
        node.time,
        node.value,
        node.handleIn ? { dt: node.handleIn.dt, dv: node.handleIn.dv } : noHandle(),
        node.handleOut ? { dt: node.handleOut.dt, dv: node.handleOut.dv } : noHandle(),
      ),
    );
    // Back-compat: an older Curve stored Hermite tangent slopes. Convert them to
    // equivalent (dt/3) Bézier handles using the neighbor gaps.
    const hasLegacyTangents = rawNodes.some(
      (n) => n.handleIn == null && (n.tangentIn != null || n.tangentOut != null),
    );
    if (hasLegacyTangents) {
      const sorted = [...nodes].sort((a, b) => a.time - b.time);
      sorted.forEach((n, i) => {
        const raw = rawNodes.find(
          (r) => r.time === n.time && r.value === n.value,
        );
        const prev = sorted[i - 1];
        const next = sorted[i + 1];
        if (prev) {
          const g = n.time - prev.time;
          n.handleIn = { dt: -g / 3, dv: (-(raw?.tangentIn ?? 0) * g) / 3 };
        }
        if (next) {
          const g = next.time - n.time;
          n.handleOut = { dt: g / 3, dv: ((raw?.tangentOut ?? 0) * g) / 3 };
        }
      });
      return applyRange(new CurveVariation(data.duration, sorted));
    }
    return applyRange(new CurveVariation(data.duration, nodes));
  };
}

// Re-export so callers can build straight-segment handles when constructing
// nodes outside the factories (e.g. the migration fitter).
export const straightSegmentHandles = (dt: number, dv: number) => ({
  out: straightOut(dt, dv),
  in: straightIn(dt, dv),
});
