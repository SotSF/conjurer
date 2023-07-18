import { Vector3, Vector4 } from "three";

export const vector4ToRgbaString = (v: Vector4) => {
  const r = Math.floor(v.x * 255);
  const g = Math.floor(v.y * 255);
  const b = Math.floor(v.z * 255);
  const a = v.w;
  return `rgba(${r}, ${g}, ${b}, ${a})`;
};

export const vector3ToRgbaString = (v: Vector3) => {
  const r = Math.floor(v.x * 255);
  const g = Math.floor(v.y * 255);
  const b = Math.floor(v.z * 255);
  return `rgba(${r}, ${g}, ${b}, 1)`;
};

export const vector4ToHex = (v: Vector4) => {
  const r = Math.floor(v.x * 255)
    .toString(16)
    .padStart(2, "0");
  const g = Math.floor(v.y * 255)
    .toString(16)
    .padStart(2, "0");
  const b = Math.floor(v.z * 255)
    .toString(16)
    .padStart(2, "0");
  return `#${r}${g}${b}`;
};

export const hexToVector3 = (hex: string) => {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return new Vector3(r, g, b);
};

export const hexToRgb = (hex: string) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
};
