import { Palette } from "@/src/types/Palette";
import { Texture, Vector4 } from "three";

export type ParamType = number | Vector4 | Palette | Texture | null;

export type PatternParam<T = ParamType> = {
  readonly name: string;
  value: T;

  min?: number;
  max?: number;
  step?: number;
};

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
