import { Palette, SerializedPalette } from "@/src/params/palette/Palette";
import { Texture, Vector4 } from "three";

export type ParamType = number | Vector4 | Palette | Texture | null;

export type PatternParam<T = ParamType> = {
  readonly name: string;
  value: T;

  min?: number;
  max?: number;
  step?: number;
  jumpy?: boolean;
};

export const isTextureParam = (
  param: PatternParam,
): param is PatternParam<Texture> => param.value instanceof Texture;

export type StandardParams = {
  readonly u_time: {
    name: "Time";
    value: number;
  };
  readonly u_texture: {
    name: "Input Texture";
    value: Texture | null;
  };
};

export type ParamMap = Record<string, PatternParam>;

export type PatternParams = StandardParams & ParamMap;

type SerializedParamType = ParamType | SerializedPalette;

export type SerializedParams = Record<string, { value: SerializedParamType }>;
