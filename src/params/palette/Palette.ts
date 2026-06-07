import { Vector3 } from "three";
import { clamp } from "three/src/math/MathUtils";

export type SerializedPalette = {
  a: [number, number, number];
  b: [number, number, number];
  c: [number, number, number];
  d: [number, number, number];
};

// This cosine-based palette creates a continuous spectrum of color given 4 vec3 params
// https://iquilezles.org/articles/palettes/
export class Palette {
  a: Vector3;
  b: Vector3;
  c: Vector3;
  d: Vector3;
  colorOut = new Vector3();

  constructor(a: Vector3, b: Vector3, c: Vector3, d: Vector3) {
    this.a = new Vector3(a.x, a.y, a.z);
    this.b = new Vector3(b.x, b.y, b.z);
    this.c = new Vector3(c.x, c.y, c.z);
    this.d = new Vector3(d.x, d.y, d.z);
  }

  colorAt = (t: number): Vector3 => {
    const r = clamp(
      this.a.x + this.b.x * Math.cos(2 * Math.PI * (this.c.x * t + this.d.x)),
      0,
      1,
    );
    const g = clamp(
      this.a.y + this.b.y * Math.cos(2 * Math.PI * (this.c.y * t + this.d.y)),
      0,
      1,
    );
    const b = clamp(
      this.a.z + this.b.z * Math.cos(2 * Math.PI * (this.c.z * t + this.d.z)),
      0,
      1,
    );
    this.colorOut.set(r, g, b);
    return this.colorOut;
  };

  randomize = () => {
    this.a.set(Math.random(), Math.random(), Math.random());
    this.b.set(Math.random(), Math.random(), Math.random());
    this.c.set(Math.random(), Math.random(), Math.random());
    this.d.set(Math.random(), Math.random(), Math.random());
  };

  clone = () =>
    new Palette(this.a.clone(), this.b.clone(), this.c.clone(), this.d.clone());

  serialize = (): SerializedPalette => ({
    a: this.a.toArray(),
    b: this.b.toArray(),
    c: this.c.toArray(),
    d: this.d.toArray(),
  });

  static deserialize = (serialized: SerializedPalette) =>
    new Palette(
      new Vector3(serialized.a[0], serialized.a[1], serialized.a[2]),
      new Vector3(serialized.b[0], serialized.b[1], serialized.b[2]),
      new Vector3(serialized.c[0], serialized.c[1], serialized.c[2]),
      new Vector3(serialized.d[0], serialized.d[1], serialized.d[2]),
    );

  setFromSerialized = (serialized: SerializedPalette) => {
    this.a.set(serialized.a[0], serialized.a[1], serialized.a[2]);
    this.b.set(serialized.b[0], serialized.b[1], serialized.b[2]);
    this.c.set(serialized.c[0], serialized.c[1], serialized.c[2]);
    this.d.set(serialized.d[0], serialized.d[1], serialized.d[2]);
  };

  toConstructorString = () =>
    `new Palette(new Vector3(${this.a.x}, ${this.a.y}, ${this.a.z}), new Vector3(${this.b.x}, ${this.b.y}, ${this.b.z}), new Vector3(${this.c.x}, ${this.c.y}, ${this.c.z}), new Vector3(${this.d.x}, ${this.d.y}, ${this.d.z}))`;

  static default = () =>
    new Palette(
      new Vector3(0.387, 0.8, 0.435),
      new Vector3(0.8, 0.392, 0.071),
      new Vector3(1.497, 1.219, 1.176),
      new Vector3(3.613, 5.485, 0.773),
    );
}

export const isPalette = (obj: any): obj is Palette =>
  obj.a !== undefined &&
  obj.b !== undefined &&
  obj.c !== undefined &&
  obj.d !== undefined;
