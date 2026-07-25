import { Vector3 } from "three";
import { Palette } from "./Palette";

// Curated cosine palettes (Inigo Quilez's classic coefficients plus a few
// extras). Each `make` returns a fresh Palette so callers can mutate freely.
const make =
  (
    a: [number, number, number],
    b: [number, number, number],
    c: [number, number, number],
    d: [number, number, number],
  ) =>
  () =>
    new Palette(
      new Vector3(...a),
      new Vector3(...b),
      new Vector3(...c),
      new Vector3(...d),
    );

const gradient =
  (from: [number, number, number], to: [number, number, number]) =>
  () =>
    Palette.fromLinearGradient(new Vector3(...from), new Vector3(...to));

export const PALETTE_PRESETS: { name: string; make: () => Palette }[] = [
  { name: "Rainbow", make: make([0.5, 0.5, 0.5], [0.5, 0.5, 0.5], [1, 1, 1], [0, 0.33, 0.67]) },
  // deep rose -> gold, warm sunset
  { name: "Sunset", make: gradient([0.62, 0.11, 0.29], [1.0, 0.74, 0.32]) },
  { name: "Warm", make: make([0.5, 0.5, 0.5], [0.5, 0.5, 0.5], [1, 0.7, 0.4], [0, 0.15, 0.2]) },
  { name: "Candy", make: make([0.5, 0.5, 0.5], [0.5, 0.5, 0.5], [1, 1, 1], [0, 0.1, 0.2]) },
  { name: "Aqua", make: make([0.5, 0.5, 0.5], [0.5, 0.5, 0.5], [1, 1, 1], [0.3, 0.2, 0.2]) },
  // deep navy -> light aqua
  { name: "Ocean", make: gradient([0.02, 0.11, 0.32], [0.35, 0.85, 0.86]) },
  { name: "Neon", make: make([0.8, 0.5, 0.4], [0.2, 0.4, 0.2], [2, 1, 1], [0, 0.25, 0.25]) },
  { name: "Mono", make: make([0.5, 0.5, 0.5], [0.5, 0.5, 0.5], [1, 1, 1], [0.5, 0.5, 0.5]) },
  { name: "Default", make: () => Palette.default() },
];
