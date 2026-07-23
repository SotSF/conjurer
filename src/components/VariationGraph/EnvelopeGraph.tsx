import { Box, useToken } from "@chakra-ui/react";
import { useRef, useState, useEffect } from "react";
import { runInAction } from "mobx";
import { Block } from "@/src/types/Block";
import { CurveVariation } from "@/src/types/Variations/CurveVariation";
import { VARIATION_BOUND_WIDTH } from "@/src/utils/layout";
import { sampleCurveGeometry } from "@/src/utils/curveGeometry";

const HEIGHT = 50;
const PADDING = 6;
const NODE_RADIUS = 4;
// how close (px) a dragged value must get to a magnet target to snap
const SNAP_PX = 6;

type EnvelopeGraphProps = {
  uniformName: string;
  variation: CurveVariation;
  width: number;
  domain: [number, number];
  block: Block;
};

/**
 * Interactive SVG editor for a Curve region of the continuous-parameter lane.
 * Renders the cubic-Bézier value line + breakpoint nodes and supports the core
 * node gestures: click to select, drag to move (endpoints move in value only;
 * interior nodes clamp in time between their neighbors; Shift axis-locks the
 * drag, values snap to neighbor values / the range bounds unless Ctrl is held,
 * and Esc deselects), double-click the line
 * to add a node on the curve, Backspace to delete the selected node. Click a
 * segment to reveal its two Bézier handles and drag each in both axes (the
 * horizontal reach bows the curve — pen-tool style); Alt-drag a handle mirrors
 * the opposite one across the segment's midline (symmetric shapes);
 * Alt-double-click resets a segment to straight. Mutations go through the model
 * and trigger MobX reactions so the render loop and lane redraw stay in sync.
 */
export const EnvelopeGraph = function EnvelopeGraph({
  uniformName,
  variation,
  width,
  domain,
  block,
}: EnvelopeGraphProps) {
  const [orange, nodeFill, selectedFill] = useToken("colors", [
    "orange.400",
    "gray.800",
    "yellow.300",
  ]);
  const svgRef = useRef<SVGSVGElement>(null);
  const draggingId = useRef<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedSegment, setSelectedSegment] = useState<number | null>(null);
  // value a node is currently snapping to (for the guide line), or null
  const [snapValue, setSnapValue] = useState<number | null>(null);

  const innerWidth = Math.max(1, width - VARIATION_BOUND_WIDTH);
  const { nodes, duration } = variation;
  const [domainMin, domainMax] = domain;
  const valueSpan = domainMax - domainMin || 1;

  const xOfTime = (t: number) => (duration > 0 ? (t / duration) * innerWidth : 0);
  const yOfValue = (v: number) =>
    PADDING + (1 - (v - domainMin) / valueSpan) * (HEIGHT - 2 * PADDING);
  const timeOfX = (px: number) =>
    duration > 0
      ? Math.max(0, Math.min(duration, (px / innerWidth) * duration))
      : 0;
  const valueOfY = (py: number) =>
    Math.max(
      domainMin,
      Math.min(
        domainMax,
        domainMin + (1 - (py - PADDING) / (HEIGHT - 2 * PADDING)) * valueSpan,
      ),
    );

  const localPoint = (clientX: number, clientY: number) => {
    const rect = svgRef.current!.getBoundingClientRect();
    return { px: clientX - rect.left, py: clientY - rect.top };
  };

  const commit = (fn: () => void) =>
    runInAction(() => {
      fn();
      block.triggerVariationReactions(uniformName);
    });

  const onNodePointerDown = (e: React.PointerEvent, id: string) => {
    e.stopPropagation();
    setSelectedId(id);
    setSelectedSegment(null);
    draggingId.current = id;
    // Force the 4-directional move cursor everywhere for the whole drag — a
    // global !important rule, so it beats the node's own pointer cursor while
    // the pointer is still over the dot.
    const cursorStyle = document.createElement("style");
    cursorStyle.textContent = "*{cursor:move !important;}";
    document.head.appendChild(cursorStyle);
    // remember where the drag started, for Shift axis-lock
    const startNode = variation.nodes.find((n) => n.id === id);
    const startTime = startNode?.time ?? 0;
    const startValue = startNode?.value ?? 0;
    const startClientX = e.clientX;
    const startClientY = e.clientY;
    const move = (ev: PointerEvent) => {
      if (draggingId.current !== id || !svgRef.current) return;
      const { px, py } = localPoint(ev.clientX, ev.clientY);
      const ns = variation.nodes;
      const idx = ns.findIndex((n) => n.id === id);
      if (idx < 0) return;
      const isFirst = idx === 0;
      const isLast = idx === ns.length - 1;
      let t = isFirst
        ? 0
        : isLast
          ? variation.duration
          : Math.max(ns[idx - 1].time, Math.min(ns[idx + 1].time, timeOfX(px)));
      let v = valueOfY(py);
      let valueLocked = false;

      // Shift = lock the drag to its dominant axis: horizontal keeps the value,
      // vertical keeps the time.
      if (ev.shiftKey) {
        const horizontal =
          Math.abs(ev.clientX - startClientX) >=
          Math.abs(ev.clientY - startClientY);
        if (horizontal) {
          v = startValue;
          valueLocked = true;
        } else if (!isFirst && !isLast) {
          t = startTime;
        }
      }

      // Value-snap magnet: pull the value onto a neighbor's value or the axis
      // bounds when within SNAP_PX. Ctrl frees it; a locked value never snaps.
      let snap: number | null = null;
      if (!ev.ctrlKey && !valueLocked) {
        const candidates: number[] = [domainMin, domainMax];
        if (ns[idx - 1]) candidates.push(ns[idx - 1].value);
        if (ns[idx + 1]) candidates.push(ns[idx + 1].value);
        const yv = yOfValue(v);
        let bestDist = SNAP_PX;
        for (const c of candidates) {
          const d = Math.abs(yOfValue(c) - yv);
          if (d < bestDist) {
            bestDist = d;
            snap = c;
          }
        }
        if (snap != null) v = snap;
      }

      setSnapValue(snap);
      commit(() => variation.setNode(id, t, v));
    };
    const up = () => {
      draggingId.current = null;
      setSnapValue(null);
      cursorStyle.remove();
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  const segmentIndexAtX = (px: number) => {
    const t = timeOfX(px);
    const ns = variation.nodes;
    for (let i = 0; i < ns.length - 1; i++)
      if (ns[i + 1].time > ns[i].time && ns[i].time <= t && t < ns[i + 1].time)
        return i;
    return ns.length >= 2 ? ns.length - 2 : -1;
  };

  // Drag one endpoint's Bézier control handle freely in both axes. The
  // horizontal offset (handle reach) shapes how the curve lingers vs.
  // accelerates; the vertical offset sets its steepness. Holding Alt mirrors the
  // opposite handle through the segment's midpoint (its offset negated), so the
  // two pivot symmetrically — a symmetric ease-in-out between the endpoints.
  const beginHandleDrag = (segIndex: number, side: "out" | "in") => {
    const cursorStyle = document.createElement("style");
    cursorStyle.textContent = "*{cursor:move !important;}";
    document.head.appendChild(cursorStyle);
    const move = (ev: PointerEvent) => {
      if (!svgRef.current) return;
      const { px, py } = localPoint(ev.clientX, ev.clientY);
      const ns = variation.nodes;
      const a = ns[segIndex];
      const b = ns[segIndex + 1];
      if (!a || !b || b.time - a.time <= 0) return;
      // Offset of the dragged control point from its own node.
      const dt = side === "out" ? timeOfX(px) - a.time : timeOfX(px) - b.time;
      const dv = side === "out" ? valueOfY(py) - a.value : valueOfY(py) - b.value;
      commit(() => {
        if (side === "out") {
          variation.setNodeHandle(a.id, "out", dt, dv);
          if (ev.altKey) variation.setNodeHandle(b.id, "in", -dt, -dv);
        } else {
          variation.setNodeHandle(b.id, "in", dt, dv);
          if (ev.altKey) variation.setNodeHandle(a.id, "out", -dt, -dv);
        }
      });
    };
    const up = () => {
      cursorStyle.remove();
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  // Pointer-down on the lane selects the segment under the cursor and reveals its
  // two handles. With Alt held it ALSO starts a symmetric (mirrored) bend on the
  // nearer handle immediately, so you can Alt-drag a bend in one motion without
  // first clicking to select.
  const onSvgPointerDown = (e: React.PointerEvent) => {
    if (!svgRef.current) return;
    const { px } = localPoint(e.clientX, e.clientY);
    const seg = segmentIndexAtX(px);
    setSelectedSegment(seg >= 0 ? seg : null);
    setSelectedId(null);
    if (seg >= 0 && e.altKey) {
      const ns = variation.nodes;
      const a = ns[seg];
      const b = ns[seg + 1];
      if (a && b && b.time - a.time > 0) {
        e.preventDefault();
        const midX = xOfTime((a.time + b.time) / 2);
        beginHandleDrag(seg, px < midX ? "out" : "in");
      }
    }
  };

  // Press directly on a rendered handle → drag just that side (Alt mirrors).
  const onHandlePointerDown = (
    e: React.PointerEvent,
    segIndex: number,
    side: "out" | "in",
  ) => {
    e.stopPropagation();
    beginHandleDrag(segIndex, side);
  };

  const onDoubleClick = (e: React.MouseEvent) => {
    if (!svgRef.current) return;
    const { px, py } = localPoint(e.clientX, e.clientY);
    if (e.altKey) {
      // Alt double-click a segment → reset it to a straight line.
      const seg = segmentIndexAtX(px);
      if (seg >= 0) commit(() => variation.setSegmentStraight(seg));
      return;
    }
    // ignore double-clicks landing on an existing node (that's not "add")
    const onNode = variation.nodes.some(
      (n) =>
        Math.abs(xOfTime(n.time) - px) <= NODE_RADIUS + 3 &&
        Math.abs(yOfValue(n.value) - py) <= NODE_RADIUS + 3,
    );
    if (onNode) return;
    let addedId = "";
    commit(() => {
      addedId = variation.addNodeAtTime(timeOfX(px)).id;
    });
    setSelectedId(addedId);
    setSelectedSegment(null);
  };

  useEffect(() => {
    if (!selectedId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Backspace" && e.key !== "Delete") return;
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable))
        return;
      e.preventDefault();
      commit(() => variation.removeNode(selectedId));
      setSelectedId(null);
      setSelectedSegment(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, variation, block, uniformName]);

  // Esc deselects the current node/segment (hides handles, drops selection).
  useEffect(() => {
    if (selectedId == null && selectedSegment == null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setSelectedId(null);
      setSelectedSegment(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedId, selectedSegment]);

  const renderSegmentHandles = (seg: number) => {
    const a = nodes[seg];
    const b = nodes[seg + 1];
    if (!a || !b) return null;
    if (b.time - a.time <= 0) return null; // step boundary — no curve handles
    const cp1x = xOfTime(a.time + a.handleOut.dt);
    const cp1y = yOfValue(a.value + a.handleOut.dv);
    const cp2x = xOfTime(b.time + b.handleIn.dt);
    const cp2y = yOfValue(b.value + b.handleIn.dv);
    return (
      <g>
        <line x1={xOfTime(a.time)} y1={yOfValue(a.value)} x2={cp1x} y2={cp1y} stroke="#63b3ed" strokeWidth={1} />
        <line x1={xOfTime(b.time)} y1={yOfValue(b.value)} x2={cp2x} y2={cp2y} stroke="#63b3ed" strokeWidth={1} />
        <circle cx={cp1x} cy={cp1y} r={3.5} fill={nodeFill} stroke="#63b3ed" strokeWidth={2} style={{ cursor: "move" }} onPointerDown={(e) => onHandlePointerDown(e, seg, "out")} />
        <circle cx={cp2x} cy={cp2y} r={3.5} fill={nodeFill} stroke="#63b3ed" strokeWidth={2} style={{ cursor: "move" }} onPointerDown={(e) => onHandlePointerDown(e, seg, "in")} />
      </g>
    );
  };

  const linePath = sampleCurveGeometry(nodes, duration)
    .map(
      (p, i) =>
        `${i === 0 ? "M" : "L"} ${xOfTime(p.time).toFixed(2)} ${yOfValue(
          p.value,
        ).toFixed(2)}`,
    )
    .join(" ");

  return (
    <Box py={1} bgColor="gray.600" _hover={{ bgColor: "gray.500" }}>
      <svg
        ref={svgRef}
        width={innerWidth}
        height={HEIGHT}
        style={{ display: "block", touchAction: "none" }}
        onPointerDown={onSvgPointerDown}
        onDoubleClick={onDoubleClick}
      >
        <path d={linePath} fill="none" stroke={orange} strokeWidth={2} />
        {snapValue != null && (
          <line
            x1={0}
            y1={yOfValue(snapValue)}
            x2={innerWidth}
            y2={yOfValue(snapValue)}
            stroke="#8fcbf5"
            strokeWidth={1}
            strokeDasharray="3 3"
            opacity={0.7}
            pointerEvents="none"
          />
        )}
        {nodes.map((node) => {
          const selected = node.id === selectedId;
          return (
            <circle
              key={node.id}
              cx={xOfTime(node.time)}
              cy={yOfValue(node.value)}
              r={selected ? NODE_RADIUS + 1.5 : NODE_RADIUS}
              fill={selected ? selectedFill : nodeFill}
              stroke={selected ? "#ffffff" : orange}
              strokeWidth={2}
              style={{ cursor: "pointer" }}
              onPointerDown={(e) => onNodePointerDown(e, node.id)}
            />
          );
        })}
        {selectedSegment != null && renderSegmentHandles(selectedSegment)}
      </svg>
    </Box>
  );
};
