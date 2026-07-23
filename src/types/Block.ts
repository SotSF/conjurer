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
import { EasingVariation } from "@/src/types/Variations/EasingVariation";
import { defaultPatternEffectMap } from "@/src/utils/patternsEffects";
import { isVector4 } from "@/src/utils/object";
import { LinearVariation4 } from "@/src/types/Variations/LinearVariation4";
import { isPalette, Palette } from "@/src/params/palette/Palette";
import { PaletteVariation } from "@/src/params/palette/variation/PaletteVariation";
import { CurveVariation } from "@/src/types/Variations/CurveVariation";
import { generateId } from "@/src/utils/id";
import {
  loadBlockLanes,
  saveBlockLanes,
} from "@/src/utils/laneStatePersistence";
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
  // just its header. Expanded by default; the header caret can collapse it.
  showDetails = true;

  // UI state: uniform names whose automation lane is toggled open directly
  // beneath this block in the timeline (see the dot-row / automation lanes).
  // Not serialized.
  lanedParams: Set<string> = new Set();

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

  // arms a param's automation lane; a palette gets a default region spanning
  // the whole block so its lane isn't empty (palettes are discrete regions, not
  // a continuous curve)
  private armParamLane = (uniformName: string) => {
    if (
      isPalette(this.pattern.params[uniformName]?.value) &&
      !this.parameterVariations[uniformName]?.length
    )
      this.parameterVariations[uniformName] = [
        new PaletteVariation(this.duration, Palette.default()),
      ];
    this.lanedParams.add(uniformName);
  };

  // toggles whether the given param's automation lane is shown beneath this
  // block in the timeline
  toggleParamLane = (uniformName: string) => {
    if (this.lanedParams.has(uniformName)) this.lanedParams.delete(uniformName);
    else this.armParamLane(uniformName);
    this.persistLanes();
  };

  // persists this block's open lanes locally so a refresh restores them
  private persistLanes = () => {
    saveBlockLanes(this.store.experienceName, this.id, [...this.lanedParams]);
  };

  // uniform names on this block that can be given an automation lane: excludes
  // machinery uniforms and opacity on effects (applied per pattern). Palettes
  // are included — their lane shows discrete color regions over time.
  get lanableParamNames(): string[] {
    const excluded = new Set(["u_time", "u_texture"]);
    if (this.parentBlock) excluded.add("u_opacity");
    return Object.keys(this.pattern.params).filter(
      (name) => !excluded.has(name),
    );
  }

  setParamLanes = (uniformNames: string[], on: boolean) => {
    for (const uniformName of uniformNames) {
      if (on) this.armParamLane(uniformName);
      else this.lanedParams.delete(uniformName);
    }
    this.persistLanes();
  };

  // resets a single region (variation) back to the param's default value,
  // keeping its duration/placement in the lane
  resetVariationToDefault = (uniformName: string, variation: Variation) => {
    const variations = this.parameterVariations[uniformName];
    if (!variations) return;
    const index = variations.indexOf(variation);
    if (index < 0) return;

    const defaultValue =
      defaultPatternEffectMap[this.pattern.name]?.params[uniformName]?.value;
    const duration = variation.duration;
    let replacement: Variation | undefined;
    if (typeof defaultValue === "number")
      // region model: a numeric reset is a flat full-span Curve (editable as a
      // Curve region), not the legacy FlatVariation.
      replacement = CurveVariation.flat(duration, defaultValue);
    else if (isVector4(defaultValue))
      replacement = new LinearVariation4(duration, defaultValue, defaultValue);
    else if (isPalette(defaultValue))
      replacement = new PaletteVariation(duration, defaultValue);
    if (!replacement) return;

    variations[index] = replacement;
    this.triggerVariationReactions(uniformName);
  };

  // ===== Region-model layout operations (full-block lane) =====
  // The lane is always exactly block-width and always full: these keep the
  // region durations summing to the lane span, so time is conserved on every op.

  // The [a,b] local slice of a region, rebased to its own frame. Curves cut
  // faithfully (De Casteljau); generators just take the sub-duration.
  private sliceRegion = (v: Variation, a: number, b: number): Variation => {
    const c = v.clone();
    if (c instanceof CurveVariation) {
      c.resizeEnd(b);
      c.shiftStart(a);
    } else {
      c.duration = Math.max(MINIMUM_VARIATION_DURATION, b - a);
    }
    return c;
  };

  // Fold runs of adjacent Curve regions into single Curves (structural merge —
  // preserves steps/corners at the seam). Used after remove/insert.
  private mergeAdjacentCurves = (regions: Variation[]): Variation[] => {
    const out: Variation[] = [];
    for (const r of regions) {
      const prev = out[out.length - 1];
      if (prev instanceof CurveVariation && r instanceof CurveVariation)
        out[out.length - 1] = CurveVariation.mergeAdjacent(prev, r);
      else out.push(r);
    }
    return out;
  };

  // Move the boundary between region `index` and `index+1` by `deltaTime`
  // (positive = later). One region grows exactly as the other shrinks, so the
  // lane total never changes. Clamped so both stay above the minimum width.
  moveBoundary = (uniformName: string, index: number, deltaTime: number) => {
    const vs = this.parameterVariations[uniformName];
    if (!vs || index < 0 || index + 1 >= vs.length) return;
    const left = vs[index];
    const right = vs[index + 1];
    const maxGrow = right.duration - MINIMUM_VARIATION_DURATION; // right can give
    const maxShrink = left.duration - MINIMUM_VARIATION_DURATION; // left can give
    const delta = Math.max(-maxShrink, Math.min(maxGrow, deltaTime));
    if (Math.abs(delta) < 1e-9) return;
    if (left instanceof CurveVariation) left.resizeEnd(left.duration + delta);
    else left.duration += delta;
    if (right instanceof CurveVariation) right.shiftStart(delta);
    else right.duration -= delta;
    this.triggerVariationReactions(uniformName);
  };

  // Insert a new region spanning lane-local [startT, endT], carving that span
  // out of whatever region(s) it overlaps (they shrink; a fully-overlapped
  // interior region is removed; a Curve split in the middle yields two copies).
  // `makeRegion(duration)` builds the region to drop in. Adjacent Curves that
  // become neighbors are auto-merged.
  insertRegion = (
    uniformName: string,
    startT: number,
    endT: number,
    makeRegion: (duration: number) => Variation,
  ) => {
    const vs = this.parameterVariations[uniformName];
    if (!vs || vs.length === 0) return;
    const total = vs.reduce((sum, v) => sum + v.duration, 0);
    const s = Math.max(0, Math.min(total - MINIMUM_VARIATION_DURATION, startT));
    const e = Math.max(s + MINIMUM_VARIATION_DURATION, Math.min(total, endT));

    const out: Variation[] = [];
    let acc = 0;
    let inserted = false;
    const insert = () => {
      if (!inserted) {
        out.push(makeRegion(e - s));
        inserted = true;
      }
    };
    for (const v of vs) {
      const vStart = acc;
      const vEnd = acc + v.duration;
      acc = vEnd;
      if (vEnd <= s + 1e-9) {
        out.push(v);
        continue;
      }
      if (vStart >= e - 1e-9) {
        insert();
        out.push(v);
        continue;
      }
      // v overlaps [s, e]
      if (s > vStart + 1e-9) out.push(this.sliceRegion(v, 0, s - vStart));
      insert();
      if (vEnd > e + 1e-9)
        out.push(this.sliceRegion(v, e - vStart, v.duration));
    }
    insert(); // span lands at the very end

    this.parameterVariations[uniformName] = this.mergeAdjacentCurves(out);
    this.triggerVariationReactions(uniformName);
  };

  // Remove a region and conserve the lane: the left neighbor extends right to
  // cover the vacated span (or the right neighbor extends left if the removed
  // region was leftmost); adjacent Curves then auto-merge. The sole region can't
  // be removed — it degrades to a reset to the param default.
  removeRegionWithBackfill = (uniformName: string, variation: Variation) => {
    const vs = this.parameterVariations[uniformName];
    if (!vs) return;
    const idx = vs.indexOf(variation);
    if (idx < 0) return;
    if (vs.length === 1) {
      this.resetVariationToDefault(uniformName, variation);
      return;
    }
    const removedDur = variation.duration;
    const out = vs.slice();
    out.splice(idx, 1);
    if (idx - 1 >= 0) {
      const left = out[idx - 1];
      if (left instanceof CurveVariation)
        left.resizeEnd(left.duration + removedDur);
      else left.duration += removedDur;
    } else {
      const right = out[0];
      if (right instanceof CurveVariation) right.shiftStart(-removedDur);
      else right.duration += removedDur;
    }
    this.parameterVariations[uniformName] = this.mergeAdjacentCurves(out);
    this.triggerVariationReactions(uniformName);
  };

  // Swap a region for another in place, preserving its span (its duration is
  // forced onto the replacement). Used by type-conversion (Curve↔LFO↔Audio).
  replaceRegionInPlace = (
    uniformName: string,
    variation: Variation,
    replacement: Variation,
  ) => {
    const vs = this.parameterVariations[uniformName];
    if (!vs) return;
    const idx = vs.indexOf(variation);
    if (idx < 0) return;
    replacement.duration = variation.duration;
    vs[idx] = replacement;
    this.triggerVariationReactions(uniformName);
  };

  // arms every lanable param across this block and its effect chain, or clears
  // them all if they are already all armed
  toggleAllLanes = () => {
    const blocks = [this, ...this.effectBlocks];
    const allArmed = blocks.every((block) =>
      block.lanableParamNames.every((name) => block.lanedParams.has(name)),
    );
    blocks.forEach((block) =>
      block.setParamLanes(block.lanableParamNames, !allArmed),
    );
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
      new FlatVariation(Math.min(this.duration, DEFAULT_VARIATION_DURATION), 1),
    ];
  };

  resetOpacityToAuto = () => {
    delete this.parameterVariations["u_opacity"];
  };

  // Drags an opacity fade knee via the edge-line handle. Materializes the auto
  // crossfade first (so there is something to edit), then lengthens/shortens
  // the leading fade-in ("in") or trailing fade-out ("out") by deltaTime,
  // trading the time with the adjacent segment so the total stays put.
  adjustOpacityFade = (side: "in" | "out", deltaTime: number) => {
    if (!this.hasManualOpacity) this.materializeAutoOpacity();
    const variations = this.parameterVariations["u_opacity"];
    if (!variations || variations.length === 0) return;

    if (side === "in") {
      const fadeIn = variations[0];
      // only a leading rising easing (0 -> 1) is a fade-in
      if (!(fadeIn instanceof EasingVariation) || fadeIn.from >= fadeIn.to)
        return;
      const next = variations[1];
      const newFadeIn = fadeIn.duration + deltaTime;
      if (newFadeIn < MINIMUM_VARIATION_DURATION) return;
      if (next) {
        const newNext = next.duration - deltaTime;
        if (newNext < MINIMUM_VARIATION_DURATION) return;
        next.duration = newNext;
      }
      fadeIn.duration = newFadeIn;
    } else {
      const fadeOut = variations[variations.length - 1];
      // only a trailing falling easing (1 -> 0) is a fade-out
      if (!(fadeOut instanceof EasingVariation) || fadeOut.from <= fadeOut.to)
        return;
      const prev = variations[variations.length - 2];
      // dragging the knee left (deltaTime < 0) lengthens the fade-out
      const newFadeOut = fadeOut.duration - deltaTime;
      if (newFadeOut < MINIMUM_VARIATION_DURATION) return;
      if (prev) {
        const newPrev = prev.duration + deltaTime;
        if (newPrev < MINIMUM_VARIATION_DURATION) return;
        prev.duration = newPrev;
      }
      fadeOut.duration = newFadeOut;
    }
    this.triggerVariationReactions("u_opacity");
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

    // restore locally-persisted open lanes for this experience (UI state, not
    // part of the serialized experience data)
    for (const uniformName of loadBlockLanes(store.experienceName, block.id))
      if (uniformName in block.pattern.params)
        block.lanedParams.add(uniformName);

    return block;
  };
}
