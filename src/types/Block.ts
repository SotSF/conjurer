import { makeAutoObservable } from "mobx";
import { BASE_UNIFORMS, Pattern, SerializedPattern } from "@/src/types/Pattern";
import { ParamType } from "@/src/params/shared/patternParam";
import { Variation } from "@/src/types/Variations/Variation";
import {
  DEFAULT_VARIATION_DURATION,
  MINIMUM_VARIATION_DURATION,
} from "@/src/utils/time";
import { deserializeVariation } from "@/src/types/Variations/variations";
import type { Layer } from "@/src/types/Layer";
import { FlatVariation } from "@/src/types/Variations/FlatVariation";
import { defaultPatternEffectMap } from "@/src/utils/patternsEffects";
import { isVector4 } from "@/src/utils/object";
import { LinearVariation4 } from "@/src/types/Variations/LinearVariation4";
import { isPalette } from "@/src/params/palette/Palette";
import { PaletteVariation } from "@/src/params/palette/variation/PaletteVariation";
import { generateId } from "@/src/utils/id";
import type { Store } from "@/src/types/Store";

export type SerializedBlock = {
  id: string;
  // for backwards compatibility, pattern may be just the name of the pattern (string)
  pattern: string | SerializedPattern;
  parameterVariations: { [key: string]: any[] | undefined };
  startTime: number;
  duration: number;
  effectBlocks: SerializedBlock[];
};

export class Block {
  id: string = generateId();
  pattern: Pattern;
  parameterVariations: { [uniformName: string]: Variation[] | undefined } = {};

  parentBlock: Block | null = null; // if this is an effect block, this is the pattern block that it is applied to
  effectBlocks: Block[] = [];

  startTime: number = 0; // global time that block starts playing at in seconds
  duration: number = 5; // duration that block plays for in seconds

  headerRepetitions: number = 1; // number of times to repeat the headers in this block

  // UI state: whether the timeline shows this block's parameters/effects or
  // just its header
  showDetails = false;

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

  constructor(
    readonly store: Store,
    pattern: Pattern,
    parentBlock: Block | null = null,
  ) {
    this.pattern = pattern;
    this.parentBlock = parentBlock;

    makeAutoObservable(this, {
      store: false,
      pattern: false,
      updateParameters: false,
      updateParameter: false,
    });
  }

  regenerateId = () => {
    this.id = generateId();
    this.effectBlocks.forEach((effectBlock) => effectBlock.regenerateId());
  };

  toggleShowDetails = () => {
    this.showDetails = !this.showDetails;
  };

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

  updateParameters = (time: number, loopLast = false) => {
    this.pattern.params.u_time.value = time;

    for (const parameter of Object.keys(this.parameterVariations)) {
      this.updateParameter(parameter, time, loopLast);
    }

    for (const effect of this.effectBlocks) {
      effect.updateParameters(time, loopLast);
    }
  };

  updateParameter = (parameter: string, time: number, loopLast = false) => {
    const variations = this.parameterVariations[parameter];
    if (!variations) return;

    if (!(parameter in this.pattern.params)) {
      console.error(`Parameter ${String(parameter)} not found in pattern`);
      return;
    }

    let variationTime = 0;
    for (const variation of variations) {
      if (time < variationTime + variation.duration) {
        // this is the variation that is active at this time
        this.pattern.params[parameter].value = variation.valueAtTime(
          time - variationTime,
          this.startTime + time,
        );
        return;
      }

      variationTime += variation.duration;
    }

    if (variations.length === 0) return;

    const lastVariation = variations[variations.length - 1];

    // handle the case where we are looping the last variation
    if (loopLast) {
      const loopedTime = time % lastVariation.duration;
      this.pattern.params[parameter].value = lastVariation.valueAtTime(
        loopedTime,
        this.startTime + loopedTime,
      );
      return;
    }

    // if the current time is beyond the end of the last variation, use the last variation's last value
    this.pattern.params[parameter].value = lastVariation.valueAtTime(
      lastVariation.duration,
      this.startTime + variationTime,
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
    const totalVariationTime = variations.reduce(
      (total, variation) => total + variation.duration,
      0,
    );
    return lastVariation.valueAtTime(
      lastVariation.duration,
      this.startTime + totalVariationTime,
    );
  };

  addFlatVariationUpToTime = (uniformName: string, time: number) => {
    const parameter = this.pattern.params[uniformName];
    if (typeof parameter.value !== "number") return;

    const variations = this.parameterVariations[uniformName];
    if (!variations) {
      this.parameterVariations[uniformName] = [
        new FlatVariation(time, parameter.value),
      ];
    } else {
      const totalVariationDuration = variations.reduce(
        (total, variation) => total + variation.duration,
        0,
      );

      if (time < totalVariationDuration || time > this.duration) return;

      variations.push(
        new FlatVariation(time - totalVariationDuration, parameter.value),
      );
      this.triggerVariationReactions(uniformName);
    }
  };

  addVariation = (uniformName: string, variation: Variation) => {
    const variations = this.parameterVariations[uniformName];
    if (!variations) {
      this.parameterVariations[uniformName] = [variation];
    } else {
      variations.push(variation);
      this.triggerVariationReactions(uniformName);
    }
  };

  removeVariation = (uniformName: string, variation: Variation): number => {
    const variations = this.parameterVariations[uniformName];
    if (!variations) return -1;

    const index = variations.indexOf(variation);
    if (index > -1) {
      variations.splice(index, 1);
      this.triggerVariationReactions(uniformName);
      return index;
    }
    return -1;
  };

  findVariationAtIndex = (uniformName: string, index: number) => {
    const variations = this.parameterVariations[uniformName];
    if (!variations) return null;

    return variations[index];
  };

  duplicateVariation = (
    uniformName: string,
    variation: Variation,
    insertAtEnd = false,
  ) => {
    const variations = this.parameterVariations[uniformName];
    if (!variations) return;

    if (insertAtEnd) {
      variations.push(variation.clone());
      return;
    }

    const index = variations.indexOf(variation);
    if (index > -1) variations.splice(index, 0, variation.clone());
  };

  // Note: not very performant due to looping through variations
  getVariationGlobalEndTime = (uniformName: string, variation: Variation) => {
    const variations = this.parameterVariations[uniformName];
    if (!variations) return this.startTime;

    const index = variations.indexOf(variation);
    if (index < 0) return this.startTime;

    return variations
      .slice(0, index + 1)
      .reduce((total, variation) => total + variation.duration, 0);
  };

  applyVariationDurationDelta = (
    uniformName: string,
    variation: Variation,
    delta: number,
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
    variation: Variation,
  ) => {
    const variations = this.parameterVariations[uniformName];
    if (!variations) return;

    const index = variations.indexOf(variation);
    if (index < 0) return;

    const totalVariationDuration = variations.reduce(
      (total, variation) => total + variation.duration,
      0,
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
    this.parameterVariations[uniformName] = [...variations];
  };

  recomputeHeaderRepetitions = (width: number) => {
    // average screen width is 1280px, so repeat header and additional time for each multiple of this
    this.headerRepetitions = Math.floor(width / 1280) + 1;

    this.effectBlocks.forEach((effect) =>
      effect.recomputeHeaderRepetitions(width),
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

  isActive = () => {
    const { globalTime } = this.store.audioStore;
    return this.startTime <= globalTime && globalTime < this.endTime;
  };

  get hasManualOpacity() {
    return !!this.parameterVariations["u_opacity"]?.length;
  }

  // The opacity of this block's final output, applied by the render pipeline
  // after the entire effect chain. Manually-authored opacity variations take
  // precedence; otherwise an equal-power crossfade is derived from overlaps.
  currentMergeOpacity = (globalTime: number): number => {
    if (this.hasManualOpacity) {
      // kept current every frame by updateParameters
      const opacity = this.pattern.params.u_opacity.value;
      return typeof opacity === "number" ? opacity : 1;
    }
    const opacity = this.layer?.autoBlockOpacityAt(this, globalTime) ?? 1;
    // reflect the derived value so UI readouts of the param stay truthful
    this.pattern.params.u_opacity.value = opacity;
    return opacity;
  };

  // copies the auto-derived crossfade into real variations so the user can
  // edit from there; rendering is unchanged until they do
  materializeAutoOpacity = () => {
    const derived = this.layer?.autoOpacityVariations(this);
    this.parameterVariations["u_opacity"] = derived ?? [
      new FlatVariation(
        Math.min(this.duration, DEFAULT_VARIATION_DURATION),
        1,
      ),
    ];
  };

  resetOpacityToAuto = () => {
    delete this.parameterVariations["u_opacity"];
  };

  /**
   * Adds a clone of the effect to the block
   *
   * @param {Pattern} effect
   * @memberof Block
   */
  addCloneOfEffect = (effect: Pattern) => {
    const newBlock = new Block(this.store, effect.clone());
    newBlock.parentBlock = this;
    newBlock.layer = this.layer;
    this.effectBlocks.push(newBlock);
  };

  clone = () => {
    const newBlock = new Block(this.store, this.pattern.clone());
    newBlock.startTime = this.startTime;
    newBlock.duration = this.duration;
    newBlock.layer = this.layer;

    newBlock.parameterVariations = { ...this.parameterVariations };
    Object.entries(newBlock.parameterVariations).forEach(([key, value]) => {
      newBlock.parameterVariations[key] =
        value?.map((variation) => variation.clone()) ?? [];
    });

    newBlock.parentBlock = this.parentBlock;
    newBlock.effectBlocks = this.effectBlocks.map((effectBlock) =>
      effectBlock.clone(),
    );
    return newBlock;
  };

  serializeParameterVariations = () => {
    const serialized: { [uniformName: string]: any[] | undefined } = {};
    for (const parameter of Object.keys(this.parameterVariations)) {
      serialized[parameter] = this.parameterVariations[parameter]?.map(
        (variation) => variation.serialize(),
      );
    }

    // check for any parameters without variations and insert a flat variation
    const parameterNames = Object.keys(
      defaultPatternEffectMap[this.pattern.name]?.params ?? {},
    );
    const variationDuration = Math.min(
      this.duration,
      DEFAULT_VARIATION_DURATION,
    );
    for (const parameter of parameterNames) {
      // skip this parameter if it is a base uniform or if it already has variations
      if (
        BASE_UNIFORMS.includes(parameter) ||
        this.parameterVariations[parameter]?.length
      )
        continue;

      const parameterValue = this.pattern.params[parameter].value;
      if (typeof parameterValue === "number") {
        serialized[parameter] = [
          new FlatVariation(variationDuration, parameterValue).serialize(),
        ];
      } else if (isVector4(parameterValue)) {
        serialized[parameter] = [
          new LinearVariation4(
            variationDuration,
            parameterValue,
            parameterValue,
          ).serialize(),
        ];
      } else if (isPalette(parameterValue)) {
        serialized[parameter] = [
          new PaletteVariation(variationDuration, parameterValue).serialize(),
        ];
      }
    }
    return serialized;
  };

  serialize = (options: { includeParams?: boolean } = {}): SerializedBlock => ({
    id: this.id,
    pattern: this.pattern.serialize(options?.includeParams),
    startTime: this.startTime,
    duration: this.duration,
    parameterVariations: this.serializeParameterVariations(),
    effectBlocks: this.effectBlocks.map((effectBlock) =>
      effectBlock.serialize(options),
    ),
  });

  static deserialize = (store: Store, data: any, parentBlock?: Block) => {
    const patternName =
      typeof data.pattern === "string" ? data.pattern : data.pattern.name;

    const block = new Block(
      store,
      defaultPatternEffectMap[patternName].clone(),
    );

    if (data.id) block.id = data.id;
    block.setTiming({
      startTime: data.startTime,
      duration: data.duration,
    });
    block.parentBlock = parentBlock ?? null;

    for (const parameter of Object.keys(data.parameterVariations)) {
      block.parameterVariations[parameter] = data.parameterVariations[
        parameter
      ]?.map((variationData: any) =>
        deserializeVariation(store, variationData),
      );
    }

    block.effectBlocks = data.effectBlocks.map((effectBlockData: any) =>
      Block.deserialize(store, effectBlockData, block),
    );

    return block;
  };
}
