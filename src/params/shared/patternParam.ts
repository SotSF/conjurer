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
  // opacity of the block's final output, applied by the render pipeline after
  // the entire effect chain has run. With no variations authored, the pipeline
  // derives an equal-power crossfade from block overlaps instead.
  readonly u_opacity: {
    name: "Opacity";
    value: number;
    min?: number;
    max?: number;
    step?: number;
  };
};

export type ParamMap = Record<string, PatternParam>;

export type PatternParams = StandardParams & ParamMap;

type SerializedParamType = ParamType | SerializedPalette;

export type SerializedParams = Record<string, { value: SerializedParamType }>;
