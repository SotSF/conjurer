import { Palette, SerializedPalette, isPalette } from "@/src/types/Palette";
import { isVector4 } from "@/src/utils/object";
import { Texture, Vector4 } from "three";

export type ParamType = number | Vector4 | Palette | Texture | null;

export type PatternParam<T = ParamType> = {
  readonly name: string;
  value: T;

  min?: number;
  max?: number;
  step?: number;
};

export const isBooleanParam = (
  param: PatternParam
): param is PatternParam<number> =>
  typeof param.value === "number" &&
  param.min === 0 &&
  param.max === 1 &&
  param.step === 1;

export const isNumberParam = (
  param: PatternParam
): param is PatternParam<number> => typeof param.value === "number";

export const isVector4Param = (
  param: PatternParam
): param is PatternParam<Vector4> => isVector4(param.value);

export const isPaletteParam = (
  param: PatternParam
): param is PatternParam<Palette> => isPalette(param.value);

export const isTextureParam = (
  param: PatternParam
): param is PatternParam<Texture> => param.value instanceof Texture;

export type StandardParams = {
  readonly u_time: {
    name: "Time";
    value: number;
  };
  // for effects
  readonly u_texture: {
    name: "Input Texture";
    value: Texture | null;
  };
};

export type ExtraParams = Record<string, PatternParam>;

export type PatternParams = StandardParams & ExtraParams;

// this type could be improved a bit
type SerializedParamType = ParamType | SerializedPalette;

export type SerializedParams = Record<string, { value: SerializedParamType }>;
