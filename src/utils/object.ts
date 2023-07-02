import { Vector4 } from "three";

export const deepClone = (orig: Object) => JSON.parse(JSON.stringify(orig));
export const isVector4 = (obj: any): obj is Vector4 =>
  obj.x !== undefined &&
  obj.y !== undefined &&
  obj.z !== undefined &&
  obj.w !== undefined;
