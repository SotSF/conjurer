import { createContext, useContext, useMemo, ReactNode } from "react";
import { useStore } from "@/src/types/StoreContext";

/** Maps lane-local time ↔ horizontal pixels for a parameter lane. */
export type LaneTimeScale = {
  timeToX: (time: number) => number;
  xToTime: (x: number) => number;
};

const LaneTimeScaleContext = createContext<LaneTimeScale | null>(null);

/**
 * Provides a local time↔pixel scale for a lane rendered outside the timeline
 * (e.g. the parameter detail panel), where width is fixed to the container
 * rather than driven by the global timeline zoom.
 */
export function LaneTimeScaleProvider({
  width,
  duration,
  children,
}: {
  width: number;
  duration: number;
  children: ReactNode;
}) {
  const value = useMemo<LaneTimeScale>(() => {
    const safeWidth = Math.max(0, width);
    const safeDuration = Math.max(1e-6, duration);
    return {
      timeToX: (time: number) => (time / safeDuration) * safeWidth,
      xToTime: (x: number) => (x / safeWidth) * safeDuration,
    };
  }, [width, duration]);

  return (
    <LaneTimeScaleContext.Provider value={value}>
      {children}
    </LaneTimeScaleContext.Provider>
  );
}

/** Local scale when inside a provider; otherwise the timeline's global zoom. */
export function useLaneTimeScale(): LaneTimeScale {
  const ctx = useContext(LaneTimeScaleContext);
  const { uiStore } = useStore();
  if (ctx) return ctx;
  return {
    timeToX: uiStore.timeToX,
    xToTime: uiStore.xToTime,
  };
}
