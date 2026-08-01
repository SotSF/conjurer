import type { CurveNode } from "@/src/types/Variations/CurveVariation";
import { evalCubic } from "@/src/utils/envelopeCurve";

export type CurvePoint = { time: number; value: number };

/**
 * Build a pixel-independent polyline for a Curve region: a leading hold up to
 * the first node, per-segment parametric cubic-Bézier sampling between nodes,
 * exact vertical risers at steps (coincident-time nodes), and a trailing hold to
 * `duration`. Each segment is sampled by its Bézier parameter s (not by time),
 * so a lingering handle bends the polyline faithfully. The renderer maps each
 * point's time/value to screen coordinates.
 */
export const sampleCurveGeometry = (
  nodes: CurveNode[],
  duration: number,
  samplesPerSegment = 16,
): CurvePoint[] => {
  if (nodes.length === 0) return [];

  const points: CurvePoint[] = [];
  const first = nodes[0];

  // Leading hold: value before the first node is held flat (matches valueAtTime).
  points.push({ time: 0, value: first.value });
  if (first.time > 0) points.push({ time: first.time, value: first.value });

  for (let i = 0; i < nodes.length - 1; i++) {
    const a = nodes[i];
    const b = nodes[i + 1];
    const dt = b.time - a.time;
    if (dt <= 0) {
      // Step: an instantaneous vertical jump to the outgoing node's value.
      points.push({ time: a.time, value: b.value });
    } else {
      // Bézier control coords for this segment.
      const p0t = a.time;
      const p0v = a.value;
      const p1t = a.time + a.handleOut.dt;
      const p1v = a.value + a.handleOut.dv;
      const p2t = b.time + b.handleIn.dt;
      const p2v = b.value + b.handleIn.dv;
      const p3t = b.time;
      const p3v = b.value;
      for (let step = 1; step <= samplesPerSegment; step++) {
        const s = step / samplesPerSegment;
        points.push({
          time: evalCubic(p0t, p1t, p2t, p3t, s),
          value: evalCubic(p0v, p1v, p2v, p3v, s),
        });
      }
    }
  }

  // Trailing hold: value after the last node is held flat to the region end.
  const last = nodes[nodes.length - 1];
  if (last.time < duration) points.push({ time: duration, value: last.value });

  return points;
};
