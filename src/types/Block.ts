import { makeAutoObservable } from "mobx";
import { BASE_UNIFORMS, Pattern } from "@/src/types/Pattern";
import { ExtraParams, ParamType } from "@/src/types/PatternParams";
import { Variation } from "@/src/types/Variations/Variation";
import {
  DEFAULT_VARIATION_DURATION,
  MINIMUM_VARIATION_DURATION,
} from "@/src/utils/time";
import { defaultPatternMap } from "@/src/patterns/patterns";
import { deserializeVariation } from "@/src/types/Variations/variations";
import { defaultEffectMap } from "@/src/effects/effects";
import { Layer } from "@/src/types/Layer";
import { Opacity } from "@/src/patterns/Opacity";
import { FlatVariation } from "@/src/types/Variations/FlatVariation";

type SerializedBlock = {
  pattern: string;
  parameterVariations: { [key: string]: any[] | undefined };
  startTime: number;
  duration: number;
  effectBlocks: SerializedBlock[];
};

export class Block<T extends ExtraParams = {}> {
  id: string = Math.random().toString(16).slice(2); // unique id
  pattern: Pattern<T>;
  parameterVariations: { [K in keyof T]?: Variation[] } = {};

  parentBlock: Block | null = null; // if this is an effect block, this is the pattern block that it is applied to
  effectBlocks: Block[] = [];

  startTime: number = 0; // global time that block starts playing at in seconds
  duration: number = 5; // duration that block plays for in seconds

  headerRepetitions: number = 1; // number of times to repeat the headers in this block

  private _layer: Layer | null = null; // the layer that this block is in

  get layer() {
    return this._layer;
  }

  set layer(layer: Layer | null) {
    this._layer = layer;
    this.effectBlocks.forEach((effectBlock) => (effectBlock.layer = layer));
  }

  get endTime() {
    return this.startTime + this.duration;
  }

  constructor(pattern: Pattern<T>, parentBlock: Block | null = null) {
    this.pattern = pattern;
    this.parentBlock = parentBlock;

    makeAutoObservable(this, {
      pattern: false,
      updateParameters: false,
      updateParameter: false,
    });
  }

  setTiming = ({
    startTime,
    duration,
  }: {
    startTime: number;
    duration: number;
  }) => {
    this.startTime = startTime;
    this.duration = duration;
  };

  updateParameters = (time: number) => {
    this.pattern.params.u_time.value = time;

    for (const parameter of Object.keys(this.parameterVariations)) {
      this.updateParameter(parameter, time);
    }

    for (const effect of this.effectBlocks) {
      effect.updateParameters(time);
    }
  };

  updateParameter = (parameter: keyof T, time: number) => {
    const variations = this.parameterVariations[parameter];
    if (!variations) return;

    let variationTime = 0;
    for (const variation of variations) {
      if (
        // if infinite duration variation, OR
        variation.duration < 0 ||
        // this is the variation that is active at this time
        time < variationTime + variation.duration
      ) {
        this.pattern.params[parameter].value = variation.valueAtTime(
          time - variationTime
        );
        return;
      }

      variationTime += variation.duration;
    }

    if (variations.length === 0) return;

    // if the current time is beyond the end of the last variation, use the last variation's last value
    const lastVariation = variations[variations.length - 1];
    this.pattern.params[parameter].value = lastVariation.valueAtTime(
      lastVariation.duration
    );
  };

  getLastParameterValue = (uniformName: string): ParamType => {
    // makes sure that uniform exists
    if (!this.pattern.params[uniformName]) return null;

    // if there are no variations, returned the currently set value
    const variations = this.parameterVariations[uniformName];
    if (!variations || variations.length === 0)
      return this.pattern.params[uniformName].value;

    const lastVariation = variations[variations.length - 1];
    return lastVariation.valueAtTime(lastVariation.duration);
  };

  addFlatVariationUpToTime = (uniformName: string, time: number) => {
    const parameter = this.pattern.params[uniformName];
    if (typeof parameter.value !== "number") return;

    const variations = this.parameterVariations[uniformName];
    if (!variations) {
      this.parameterVariations[uniformName as keyof T] = [
        new FlatVariation(time, parameter.value),
      ];
    } else {
      const totalVariationDuration = variations.reduce(
        (total, variation) => total + variation.duration,
        0
      );

      if (time < totalVariationDuration || time > this.duration) return;

      variations.push(
        new FlatVariation(time - totalVariationDuration, parameter.value)
      );
      this.triggerVariationReactions(uniformName);
    }
  };

  addVariation = (uniformName: string, variation: Variation) => {
    const variations = this.parameterVariations[uniformName];
    if (!variations) {
      this.parameterVariations[uniformName as keyof T] = [variation];
    } else {
      variations.push(variation);
      this.triggerVariationReactions(uniformName);
    }
  };

  removeVariation = (uniformName: string, variation: Variation) => {
    const variations = this.parameterVariations[uniformName];
    if (!variations) return;

    const index = variations.indexOf(variation);
    if (index > -1) {
      variations.splice(index, 1);
      this.triggerVariationReactions(uniformName);
    }
  };

  duplicateVariation = (uniformName: string, variation: Variation) => {
    const variations = this.parameterVariations[uniformName];
    if (!variations) return;

    const index = variations.indexOf(variation);
    if (index > -1) variations.splice(index, 0, variation.clone());
  };

  applyVariationDurationDelta = (
    uniformName: string,
    variation: Variation,
    delta: number
  ) => {
    const variations = this.parameterVariations[uniformName];
    if (!variations) return;

    const index = variations.indexOf(variation);
    if (index < 0) return;

    if (variation.duration + delta < MINIMUM_VARIATION_DURATION) return;

    variation.duration += delta;
    this.triggerVariationReactions(uniformName);
  };

  applyMaxVariationDurationDelta = (
    uniformName: string,
    variation: Variation
  ) => {
    const variations = this.parameterVariations[uniformName];
    if (!variations) return;

    const index = variations.indexOf(variation);
    if (index < 0) return;

    const totalVariationDuration = variations.reduce(
      (total, variation) => total + variation.duration,
      0
    );

    // use the parent block's duration if this is an effect block
    const duration = this.parentBlock?.duration ?? this.duration;
    if (totalVariationDuration < duration) {
      const maxVariationDurationDelta = duration - totalVariationDuration;
      variation.duration += Math.min(maxVariationDurationDelta, 120);
      this.triggerVariationReactions(uniformName);
    }
  };

  triggerVariationReactions = (uniformName: string) => {
    const variations = this.parameterVariations[uniformName];
    if (!variations) return;

    // create a new array so that mobx can detect the change
    this.parameterVariations[uniformName as keyof T] = [...variations];
  };

  recomputeHeaderRepetitions = (width: number) => {
    // average screen width is 1280px, so repeat header and additional time for each multiple of this
    this.headerRepetitions = Math.floor(width / 1280) + 1;

    this.effectBlocks.forEach((effect) =>
      effect.recomputeHeaderRepetitions(width)
    );
  };

  reorderEffectBlock = (block: Block, delta: number) => {
    const index = this.effectBlocks.indexOf(block);
    if (index < 0) return;

    const newIndex = index + delta;
    if (newIndex < 0 || newIndex >= this.effectBlocks.length) return;

    this.effectBlocks.splice(index, 1);
    this.effectBlocks.splice(newIndex, 0, block);
  };

  removeEffectBlock = (block: Block) => {
    const index = this.effectBlocks.indexOf(block);
    if (index > -1) {
      this.effectBlocks.splice(index, 1);
    }
  };

  /**
   * Adds a clone of the effect to the block
   *
   * @param {Pattern} effect
   * @memberof Block
   */
  addCloneOfEffect = (effect: Pattern) => {
    const newBlock = new Block(effect.clone());
    newBlock.parentBlock = this;
    newBlock.layer = this.layer;
    this.effectBlocks.push(newBlock);
  };

  clone = () => {
    const newBlock = new Block(this.pattern.clone());
    newBlock.startTime = this.startTime;
    newBlock.duration = this.duration;
    newBlock.layer = this.layer;

    newBlock.parameterVariations = { ...this.parameterVariations };
    Object.entries(newBlock.parameterVariations).forEach(([key, value]) => {
      newBlock.parameterVariations[key as keyof T] =
        value?.map((variation) => variation.clone()) ?? [];
    });

    newBlock.parentBlock = this.parentBlock;
    newBlock.effectBlocks = this.effectBlocks.map((effectBlock) =>
      effectBlock.clone()
    );
    return newBlock;
  };

  serializeParameterVariations = () => {
    const serialized: { [K in keyof T]?: any[] } = {};
    for (const parameter of Object.keys(this.parameterVariations)) {
      serialized[parameter as keyof T] = this.parameterVariations[
        parameter as keyof T
      ]?.map((variation) => variation.serialize());
    }

    // check for any parameters without variations but that have changed from their default value.
    // insert a flat variation in this case so that we persist the difference from the default.
    const parameterNames = Object.keys(
      defaultPatternMap[this.pattern.name]?.params ??
        defaultEffectMap[this.pattern.name]?.params ??
        {}
    );
    for (const parameter of parameterNames) {
      if (BASE_UNIFORMS.includes(parameter)) continue;

      const defaultParameterValue =
        defaultPatternMap[this.pattern.name]?.params[parameter].value ??
        defaultEffectMap[this.pattern.name]?.params[parameter].value;
      const parameterValue = this.pattern.params[parameter].value;
      if (
        // if this parameter has no variations,
        (this.parameterVariations[parameter]?.length ?? 0) === 0 &&
        // and it's a number
        typeof parameterValue === "number" &&
        // and it's not the default value
        parameterValue !== defaultParameterValue
      ) {
        // then add a flat variation to persist the difference from the default
        serialized[parameter as keyof T] = [
          new FlatVariation(
            DEFAULT_VARIATION_DURATION,
            parameterValue
          ).serialize(),
        ];
      }
    }
    return serialized;
  };

  serialize = (): SerializedBlock => ({
    pattern: this.pattern.name,
    startTime: this.startTime,
    duration: this.duration,
    parameterVariations: this.serializeParameterVariations(),
    effectBlocks: this.effectBlocks.map((effectBlock) =>
      effectBlock.serialize()
    ),
  });

  static deserialize = (data: any, effect?: boolean, parentBlock?: Block) => {
    const block =
      data.pattern === "Opacity"
        ? // TODO: make opacity less of a special case
          new Block<ExtraParams>(Opacity())
        : new Block<ExtraParams>(
            effect
              ? defaultEffectMap[data.pattern].clone()
              : defaultPatternMap[data.pattern].clone()
          );

    block.setTiming({
      startTime: data.startTime,
      duration: data.duration,
    });
    block.parentBlock = parentBlock ?? null;

    for (const parameter of Object.keys(data.parameterVariations)) {
      block.parameterVariations[parameter] = data.parameterVariations[
        parameter
      ]?.map((variationData: any) => deserializeVariation(variationData));
    }

    block.effectBlocks = data.effectBlocks.map((effectBlockData: any) =>
      Block.deserialize(effectBlockData, true, block)
    );

    return block;
  };
}
