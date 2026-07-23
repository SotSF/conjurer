import {
  Box,
  HStack,
  IconButton,
  Input,
  Portal,
  Text,
  VStack,
  useToken,
} from "@chakra-ui/react";
import { TbTrash } from "react-icons/tb";
import { useRef, useState, useEffect } from "react";
import { runInAction } from "mobx";
import { Block } from "@/src/types/Block";
import { CurveVariation, CurveNode } from "@/src/types/Variations/CurveVariation";
import { VARIATION_BOUND_WIDTH } from "@/src/utils/layout";
import { sampleCurveGeometry } from "@/src/utils/curveGeometry";

// Trim a number to a short, human-editable string (no trailing-zero noise).
const fmtNum = (n: number) =>
  Number.isFinite(n) ? parseFloat(n.toFixed(4)).toString() : "0";

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
 * to add a node on the curve, Backspace to delete the selected node.
 * Double-click a node (or select it and press "e" / Enter) to open an inline
 * editor to type an exact value (and, for interior nodes, an exact time). Click a
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
  // node whose inline numeric editor is open (opened by double-clicking a node)
  const [editingId, setEditingId] = useState<string | null>(null);
  // (t, v) of the editing node when the editor opened / last navigated, so Esc
  // can abort the whole session (live edits have already moved the node).
  const editStart = useRef<{ id: string; time: number; value: number } | null>(
    null,
  );

  // Open the numeric editor on a node: select it and snapshot its (t, v) so Esc
  // can restore it. Used by node double-click and Shift+←/→ navigation.
  const openEditor = (id: string) => {
    const n = variation.nodes.find((nn) => nn.id === id);
    if (!n) return;
    setSelectedId(id);
    setSelectedSegment(null);
    setEditingId(id);
    editStart.current = { id, time: n.time, value: n.value };
  };
  // value a node is currently snapping to (for the guide line), or null
  const [snapValue, setSnapValue] = useState<number | null>(null);
  // true while a node is being dragged — the numeric editor hides so it doesn't
  // sit under the cursor / thrash as values stream in.
  const [dragging, setDragging] = useState(false);

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
    // a plain click/drag closes any open editor; a double-click re-opens it
    setEditingId(null);
    draggingId.current = id;
    setDragging(true);
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
      setDragging(false);
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
    setEditingId(null);
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
      setEditingId(null);
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
      // while the numeric editor is open, Esc is its abort (handled in the
      // panel), not a deselect
      if (editingId != null) return;
      setSelectedId(null);
      setSelectedSegment(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedId, selectedSegment, editingId]);

  // With a node selected but its editor closed, "e" or Enter opens the editor.
  useEffect(() => {
    if (selectedId == null || editingId != null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "e" && e.key !== "Enter") return;
      const el = e.target as HTMLElement | null;
      if (
        el &&
        (el.tagName === "INPUT" ||
          el.tagName === "TEXTAREA" ||
          el.isContentEditable)
      )
        return;
      e.preventDefault();
      openEditor(selectedId);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, editingId]);

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

  const selectedIdx = selectedId
    ? nodes.findIndex((n) => n.id === selectedId)
    : -1;
  const selectedNode = selectedIdx >= 0 ? nodes[selectedIdx] : null;

  return (
    <Box position="relative" py={1} bgColor="gray.600" _hover={{ bgColor: "gray.500" }}>
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
              onDoubleClick={(e) => {
                e.stopPropagation();
                openEditor(node.id);
              }}
            />
          );
        })}
        {selectedSegment != null && renderSegmentHandles(selectedSegment)}
      </svg>
      {selectedNode && editingId === selectedNode.id && !dragging && (
        <Portal>
        <NodeNumericEditor
          key={selectedNode.id}
          node={selectedNode}
          isFirst={selectedIdx === 0}
          isLast={selectedIdx === nodes.length - 1}
          duration={duration}
          prevTime={nodes[selectedIdx - 1]?.time ?? 0}
          nextTime={nodes[selectedIdx + 1]?.time ?? duration}
          x={xOfTime(selectedNode.time)}
          y={yOfValue(selectedNode.value)}
          originX={svgRef.current?.getBoundingClientRect().left ?? 0}
          originY={svgRef.current?.getBoundingClientRect().top ?? 0}
          innerWidth={innerWidth}
          onCommit={(t, v) =>
            commit(() => variation.setNode(selectedNode.id, t, v))
          }
          onDelete={() => {
            commit(() => variation.removeNode(selectedNode.id));
            setSelectedId(null);
            setSelectedSegment(null);
            setEditingId(null);
          }}
          onNavigate={(dir) => {
            const target = nodes[selectedIdx + dir];
            if (target) openEditor(target.id);
          }}
          onAbort={() => {
            const s = editStart.current;
            if (s) commit(() => variation.setNode(s.id, s.time, s.value));
            setEditingId(null);
          }}
        />
        </Portal>
      )}
    </Box>
  );
};

// Compact numeric editor for the selected node (opened by double-click): stacked
// value (v) and, for interior nodes, local-time (t) fields, plus a delete button
// for interior nodes. Floats beside the node (right, or left near the right
// edge). The panel is focused on open, so keys work at the "modal open" scope:
// with no field focused, Up/Down adjust the value and Left/Right the time (same
// clamps), and Shift+Left/Right hop the panel to the prior/next node; inside a
// field, Up/Down nudge that field (Shift = fine) and Enter commits. Esc aborts
// the whole session, restoring the node to its open-time (t, v). Typing/arrows
// apply live; fields stay in sync with the node except while focused. Endpoints
// anchor the region bounds, so their time is fixed and they can't be deleted.
function NodeNumericEditor({
  node,
  isFirst,
  isLast,
  duration,
  prevTime,
  nextTime,
  x,
  y,
  originX,
  originY,
  innerWidth,
  onCommit,
  onDelete,
  onNavigate,
  onAbort,
}: {
  node: CurveNode;
  isFirst: boolean;
  isLast: boolean;
  duration: number;
  prevTime: number;
  nextTime: number;
  x: number;
  y: number;
  originX: number;
  originY: number;
  innerWidth: number;
  onCommit: (t: number, v: number) => void;
  onDelete: () => void;
  onNavigate: (dir: number) => void;
  onAbort: () => void;
}) {
  const [vStr, setVStr] = useState(fmtNum(node.value));
  const [tStr, setTStr] = useState(fmtNum(node.time));
  const vFocused = useRef(false);
  const tFocused = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const timeFixed = isFirst || isLast;

  // Focus the panel when it opens (and on navigation, since it remounts per
  // node) so the arrow keys drive it without a field needing focus.
  useEffect(() => {
    containerRef.current?.focus({ preventScroll: true });
  }, []);

  // Keep fields synced to the live node except while that field is focused.
  useEffect(() => {
    if (!vFocused.current) setVStr(fmtNum(node.value));
  }, [node.value]);
  useEffect(() => {
    if (!tFocused.current) setTStr(fmtNum(node.time));
  }, [node.time]);

  // A node's time is bounded by its neighbors and the region ends: it can't pass
  // the prior node (nor go below 0) or the next node (nor past the region end).
  const tMin = Math.max(0, prevTime);
  const tMax = Math.min(nextTime, duration);
  const clampT = (t: number) => Math.max(tMin, Math.min(tMax, t));

  const VALUE_STEP = 0.1;
  const TIME_STEP = 0.1;

  // Live-apply as a field changes (typing / field arrow-nudge) so the node moves
  // in real time — no Enter needed. Value is unclamped (out-of-range values just
  // expand the axis); time clamps into [tMin, tMax].
  const applyV = (raw: string) => {
    const v = parseFloat(raw);
    if (Number.isFinite(v)) onCommit(node.time, v);
  };
  const applyT = (raw: string) => {
    if (timeFixed) return;
    const t = parseFloat(raw);
    if (Number.isFinite(t)) onCommit(clampT(t), node.value);
  };
  // Edits are already applied live, so blur just normalizes the display.
  const commitV = () => setVStr(fmtNum(node.value));
  const commitT = () => setTStr(fmtNum(node.time));
  const onFieldFocus = (focusedRef: React.MutableRefObject<boolean>) => {
    focusedRef.current = true;
  };
  const onFieldBlur = (
    focusedRef: React.MutableRefObject<boolean>,
    commitFn: () => void,
  ) => {
    focusedRef.current = false;
    commitFn();
  };

  // Per-field key handling (only while that field is focused): Enter commits and
  // blurs; Up/Down nudge that field (Shift = fine); Escape is left to bubble to
  // the panel handler (abort). Other keys are stopped so they don't double-fire
  // at the panel scope or trigger node deletion (Backspace) at the window scope.
  const fieldKeyHandler =
    (
      setStr: (s: string) => void,
      apply: (raw: string) => void,
      commitFn: () => void,
      step: number,
      clamp?: (n: number) => number,
    ) =>
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key !== "Escape") e.stopPropagation();
      if (e.key === "Enter") {
        commitFn();
        e.currentTarget.blur();
      } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
        e.preventDefault();
        // read the live DOM value so holding the arrow accumulates correctly
        const base = Number.isFinite(parseFloat(e.currentTarget.value))
          ? parseFloat(e.currentTarget.value)
          : 0;
        let next = base + (e.key === "ArrowUp" ? 1 : -1) * step * (e.shiftKey ? 0.1 : 1);
        if (clamp) next = clamp(next);
        const s = fmtNum(next);
        setStr(s);
        apply(s);
      }
    };

  // Panel-scope key handling (active whenever the panel or one of its fields has
  // focus, i.e. the whole "modal open" timeframe). Esc aborts the edit session;
  // with no field focused, Up/Down adjust the value and Left/Right adjust the
  // time (same clamp), while Shift+Left/Right hop the panel to the prior/next
  // node. Reads the live node object so holding a key accumulates.
  const onPanelKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation(); // don't also trip the window Esc-deselect handler
      onAbort();
      return;
    }
    const inField = (e.target as HTMLElement).tagName === "INPUT";
    if (inField) return; // the focused field handles its own keys
    const isArrow =
      e.key === "ArrowUp" ||
      e.key === "ArrowDown" ||
      e.key === "ArrowLeft" ||
      e.key === "ArrowRight";
    if (!isArrow) return;
    // keep the arrow keys local — don't also scrub the global playhead / scroll
    e.preventDefault();
    e.stopPropagation();
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      const dv = (e.key === "ArrowUp" ? 1 : -1) * VALUE_STEP * (e.shiftKey ? 0.1 : 1);
      onCommit(node.time, node.value + dv);
    } else {
      if (e.shiftKey) {
        onNavigate(e.key === "ArrowRight" ? 1 : -1);
        return;
      }
      if (timeFixed) return;
      const dir = e.key === "ArrowRight" ? 1 : -1;
      onCommit(clampT(node.time + dir * TIME_STEP), node.value);
    }
  };

  // Position the panel beside the node (it's a tall, narrow stack). Prefer the
  // right of the dot, flipping to the left near the right edge; vertically
  // centered on the dot. Rendered in a Portal with fixed positioning (viewport
  // coordinates) so it escapes lane clipping/stacking and paints above the
  // neighboring lanes. (originX/Y = the svg's viewport top-left; x/y = the
  // node's position within the svg.)
  const PANEL_W = 66;
  const PANEL_H = timeFixed ? 26 : 66;
  const GAP = 5;
  const R = NODE_RADIUS + 1.5;
  const placeRight = x + R + GAP + PANEL_W <= innerWidth;
  const left = placeRight
    ? originX + x + R + GAP
    : originX + x - R - GAP - PANEL_W;
  const top = originY + y - PANEL_H / 2;
  const inputProps = {
    size: "xs" as const,
    height: "16px",
    width: "48px",
    px: 1,
    fontSize: "10px",
    bg: "gray.900",
    border: "none",
    borderRadius: "sm",
    _focusVisible: { boxShadow: "0 0 0 1px var(--chakra-colors-blue-300)" },
  };

  const fieldLabel = (t: string) => (
    <Text fontSize="9px" color="gray.400" width="8px" textAlign="right">
      {t}
    </Text>
  );

  return (
    <VStack
      ref={containerRef}
      tabIndex={-1}
      position="fixed"
      left={`${left}px`}
      top={`${top}px`}
      spacing={1}
      align="stretch"
      px={1}
      py="2px"
      bg="gray.800"
      borderRadius="sm"
      boxShadow="md"
      zIndex={1500}
      outline="none"
      onKeyDown={onPanelKeyDown}
      onPointerDown={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
    >
      <HStack spacing={1}>
        {fieldLabel("v")}
        <Input
          {...inputProps}
          value={vStr}
          aria-label="node value"
          onChange={(e) => {
            setVStr(e.target.value);
            applyV(e.target.value);
          }}
          onFocus={() => onFieldFocus(vFocused)}
          onBlur={() => onFieldBlur(vFocused, commitV)}
          onKeyDown={fieldKeyHandler(setVStr, applyV, commitV, VALUE_STEP)}
        />
      </HStack>
      {!timeFixed && (
        <>
          <HStack spacing={1}>
            {fieldLabel("t")}
            <Input
              {...inputProps}
              value={tStr}
              aria-label="node time"
              onChange={(e) => {
                setTStr(e.target.value);
                applyT(e.target.value);
              }}
              onFocus={() => onFieldFocus(tFocused)}
              onBlur={() => onFieldBlur(tFocused, commitT)}
              onKeyDown={fieldKeyHandler(
                setTStr,
                applyT,
                commitT,
                TIME_STEP,
                clampT,
              )}
            />
          </HStack>
          <IconButton
            aria-label="delete node"
            icon={<TbTrash size={12} />}
            size="xs"
            height="16px"
            minW="16px"
            variant="ghost"
            color="gray.400"
            alignSelf="center"
            _hover={{ color: "red.300", bg: "whiteAlpha.200" }}
            onClick={onDelete}
          />
        </>
      )}
    </VStack>
  );
}
