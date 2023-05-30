import { deepClone } from "@/src/utils/object";
import { ExtraParams, StandardParams } from "./PatternParams";

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
}
