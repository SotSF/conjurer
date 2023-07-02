import { Vector3 } from "three";

// This cosine-based palette creates a continuous spectrum of color given 4 vec3 params
// https://iquilezles.org/articles/palettes/
export class Palette {
  a: Vector3;
  b: Vector3;
  c: Vector3;
  d: Vector3;

  constructor(a: Vector3, b: Vector3, c: Vector3, d: Vector3) {
    this.a = a;
    this.b = b;
    this.c = c;
    this.d = d;
  }
}
