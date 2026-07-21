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

export const PALETTE_PRESETS: { name: string; make: () => Palette }[] = [
  { name: "Rainbow", make: make([0.5, 0.5, 0.5], [0.5, 0.5, 0.5], [1, 1, 1], [0, 0.33, 0.67]) },
  { name: "Sunset", make: make([0.5, 0.5, 0.5], [0.5, 0.5, 0.5], [1, 1, 0.5], [0.8, 0.9, 0.3]) },
  { name: "Warm", make: make([0.5, 0.5, 0.5], [0.5, 0.5, 0.5], [1, 0.7, 0.4], [0, 0.15, 0.2]) },
  { name: "Candy", make: make([0.5, 0.5, 0.5], [0.5, 0.5, 0.5], [1, 1, 1], [0, 0.1, 0.2]) },
  { name: "Aqua", make: make([0.5, 0.5, 0.5], [0.5, 0.5, 0.5], [1, 1, 1], [0.3, 0.2, 0.2]) },
  { name: "Ocean", make: make([0.5, 0.5, 0.5], [0.5, 0.5, 0.5], [2, 1, 0], [0.5, 0.2, 0.25]) },
  { name: "Neon", make: make([0.8, 0.5, 0.4], [0.2, 0.4, 0.2], [2, 1, 1], [0, 0.25, 0.25]) },
  { name: "Mono", make: make([0.5, 0.5, 0.5], [0.5, 0.5, 0.5], [1, 1, 1], [0.5, 0.5, 0.5]) },
  { name: "Default", make: () => Palette.default() },
];
