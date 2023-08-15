import { deepClone } from "@/src/utils/object";
import {
  ExtraParams,
  ParamType,
  StandardParams,
  isPaletteParam,
  isVector4Param,
} from "./PatternParams";
import { TransferPattern, TransformParams } from "@/src/types/TransferBlock";

export const BASE_UNIFORMS = ["u_time", "u_texture"];

export class Pattern<T extends ExtraParams = ExtraParams> {
  name: string;
  src: string;
  params: StandardParams & T;

  constructor(name: string, src: string, parameters: T = {} as T) {
    this.name = name;
    this.src = src;

    this.params = {
      u_time: {
        name: "Time",
        value: 0,
      },
      u_texture: {
        name: "Input Texture",
        value: null,
      },
      ...parameters,
    };
  }

  clone = () => {
    const clonedParams = deepClone(this.params);
    const pattern = new Pattern<T>(this.name, this.src, clonedParams);
    return pattern;
  };

  serializeTransferPattern = (): TransferPattern => {
    const transferParams: TransformParams = {};
    for (const [key, param] of Object.entries(this.params)) {
      if (BASE_UNIFORMS.includes(key)) continue;
      if (isPaletteParam(param)) {
        transferParams[key] = { value: param.value.serialize() };
      } else transferParams[key] = { value: param.value };
    }

    return {
      name: this.name,
      params: transferParams,
    };
  };
}
