import { deepClone, isVector4 } from "@/src/utils/object";
import {
  ParamMap,
  SerializedParams,
  StandardParams,
} from "@/src/params/shared/patternParam";
import { isPaletteParam } from "@/src/params/palette/isPaletteParam";
import { isPalette } from "@/src/params/palette/Palette";
import { makeVertexShader, Varying } from "@/src/shaders/vertexShader";

export type SerializedPattern = {
  name: string;
  params?: SerializedParams;
};

export const BASE_UNIFORMS = ["u_time", "u_texture"];

export class Pattern<T extends ParamMap = ParamMap> {
  name: string;
  fragmentShader: string;
  vertexShader: string;
  params: StandardParams & T;

  constructor(
    name: string,
    src: string,
    parameters: T = {} as T,
    vertexShaderVaryings: Varying[] = ["v_uv"],
  ) {
    this.name = name;
    this.fragmentShader = src;
    this.vertexShader = makeVertexShader(vertexShaderVaryings);

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

    // after the deep clone, we only have plain objects, so we need to additionally clone the
    // palette and vector4 objects
    for (const uniformName of Object.keys(clonedParams)) {
      if (BASE_UNIFORMS.includes(uniformName)) continue;
      const oldParameterValue = this.params[uniformName].value;
      if (isPalette(oldParameterValue) || isVector4(oldParameterValue)) {
        clonedParams[uniformName].value = oldParameterValue.clone();
      }
    }

    const pattern = new Pattern<T>(
      this.name,
      this.fragmentShader,
      clonedParams,
    );
    pattern.vertexShader = this.vertexShader;
    return pattern;
  };

  // Note: not using includeParams anymore but probably will in the future
  serialize = (includeParams = false): SerializedPattern => {
    if (!includeParams) return { name: this.name };

    const transferParams: SerializedParams = {};
    for (const [key, param] of Object.entries(this.params)) {
      if (BASE_UNIFORMS.includes(key)) continue;
      if (isPaletteParam(param))
        transferParams[key] = { value: param.value.serialize() };
      else transferParams[key] = { value: param.value };
    }
    return {
      name: this.name,
      params: transferParams,
    };
  };
}
