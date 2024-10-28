import { playgroundEffects } from "@/src/effects/effects";
import { playgroundPatterns } from "@/src/patterns/patterns";
import { Block, RootStore, SerializedBlock } from "@/src/types/Block";
import { Palette, SerializedPalette } from "@/src/types/Palette";
import {
  ExtraParams,
  ParamType,
  isPaletteParam,
} from "@/src/types/PatternParams";
import { deserializeVariation } from "@/src/types/Variations/variations";
import { sendControllerMessage } from "@/src/websocket/controllerWebsocket";
import { makeAutoObservable } from "mobx";

export class PlaygroundStore {
  presets: SerializedBlock[] = [];

  _autoUpdate = true;
  get autoUpdate() {
    return this._autoUpdate;
  }
  set autoUpdate(autoUpdate: boolean) {
    this._autoUpdate = autoUpdate;
    this.sendControllerUpdateMessage();
  }

  patternBlocks: Block[];
  effectBlocks: Block[];

  _selectedPatternIndex = 0;
  get selectedPatternIndex() {
    return this._selectedPatternIndex;
  }
  set selectedPatternIndex(index: number) {
    this._selectedPatternIndex = index;
    this.sendControllerUpdateMessage();
  }

  _selectedEffectIndices: number[] = [];
  get selectedEffectIndices() {
    return this._selectedEffectIndices;
  }
  set selectedEffectIndices(indices: number[]) {
    this._selectedEffectIndices = indices;
  }

  constructor(readonly store: RootStore) {
    this.patternBlocks = playgroundPatterns.map(
      (pattern) => new Block(this.store, pattern),
      []
    );
    this.effectBlocks = playgroundEffects.map(
      (effect) => new Block(this.store, effect)
    );

    makeAutoObservable(this);
  }

  initialize = () => {
    this.loadFromLocalStorage();

    this.selectedPatternIndex = this.lastPatternIndexSelected;
    this.selectedEffectIndices = this.lastEffectIndices;
  };

  get selectedPatternBlock() {
    return (
      this.patternBlocks[this.selectedPatternIndex] ?? this.patternBlocks[0]
    );
  }

  private _lastPatternIndexSelected = 0;
  get lastPatternIndexSelected() {
    return this._lastPatternIndexSelected;
  }
  set lastPatternIndexSelected(index: number) {
    this._lastPatternIndexSelected = index;
    this.saveToLocalStorage();
  }

  private _lastEffectIndices: number[] = [];
  get lastEffectIndices() {
    return this._lastEffectIndices;
  }
  set lastEffectIndices(indices: number[]) {
    this._lastEffectIndices = indices;
    this.saveToLocalStorage();
  }

  loadPreset = (index: number) => {
    const serializedBlock = this.presets[index];
    this.onUpdate(serializedBlock);
  };

  saveCurrentPreset = () => {
    const serializedBlock = this.selectedPatternBlock.serialize();
    this.presets.push(serializedBlock);
    this.saveToLocalStorage();
  };

  deletePreset = (index: number) => {
    this.presets.splice(index, 1);
    this.saveToLocalStorage();
  };

  loadFromLocalStorage = () => {
    if (typeof window === "undefined") return;
    const data = localStorage.getItem(`playgroundStore-${this.store.context}`);
    if (data) {
      const localStorageUiSettings = JSON.parse(data);
      this._lastPatternIndexSelected =
        localStorageUiSettings.lastPatternIndexSelected ?? 0;
      this._lastEffectIndices = localStorageUiSettings.lastEffectIndices ?? [];
      this.presets = localStorageUiSettings.presets ?? [];
    }
  };

  saveToLocalStorage = () => {
    if (typeof window === "undefined") return;
    localStorage.setItem(
      `playgroundStore-${this.store.context}`,
      JSON.stringify({
        lastPatternIndexSelected: this.lastPatternIndexSelected,
        lastEffectIndices: this.lastEffectIndices,
        presets: this.presets,
      })
    );
  };

  sendControllerUpdateMessage = (force = false) =>
    this.store.context === "controller" &&
    (this.autoUpdate || force) &&
    sendControllerMessage({
      type: "updateBlock",
      serializedBlock: this.selectedPatternBlock.serialize(),
    });

  // TODO: refactor, make performant
  onUpdate = (serializedBlock: SerializedBlock) => {
    const {
      pattern: transferPattern,
      parameterVariations: transferParameterVariations,
      effectBlocks: transferEffectBlocks,
    } = serializedBlock;
    this.patternBlocks.forEach(
      (patternBlock: Block<ExtraParams>, patternIndex: number) => {
        if (typeof transferPattern === "string") return;
        if (patternBlock.pattern.name !== transferPattern.name) return;
        if (!transferPattern.params) return;

        // TODO: fix duplicated code here
        const { params } = transferPattern;
        for (const [uniformName, param] of Object.entries(params)) {
          const playgroundParams = patternBlock.pattern.params as ExtraParams;
          if (playgroundParams[uniformName]) {
            if (isPaletteParam(playgroundParams[uniformName])) {
              (
                playgroundParams[uniformName].value as Palette
              ).setFromSerialized(param.value as SerializedPalette);
            } else
              playgroundParams[uniformName].value = param.value as ParamType;
          }
        }
        for (const parameter of Object.keys(transferParameterVariations)) {
          patternBlock.parameterVariations[parameter] =
            transferParameterVariations[parameter]?.map((variationData: any) =>
              deserializeVariation(this.store, variationData)
            );
        }

        // set this pattern as selected
        this.selectedPatternIndex = patternIndex;

        const effectIndices: number[] = [];
        for (const transferEffectBlock of transferEffectBlocks) {
          this.effectBlocks.forEach(
            (effectBlock: Block<ExtraParams>, effectIndex: number) => {
              if (typeof transferEffectBlock.pattern === "string") return;
              if (effectBlock.pattern.name !== transferEffectBlock.pattern.name)
                return;
              if (!transferEffectBlock.pattern.params) return;

              const { params } = transferEffectBlock.pattern;
              for (const [uniformName, param] of Object.entries(params)) {
                const playgroundParams = effectBlock.pattern
                  .params as ExtraParams;
                if (playgroundParams[uniformName]) {
                  if (isPaletteParam(playgroundParams[uniformName])) {
                    (
                      playgroundParams[uniformName].value as Palette
                    ).setFromSerialized(param.value as SerializedPalette);
                  } else
                    playgroundParams[uniformName].value =
                      param.value as ParamType;
                }
              }

              for (const parameter of Object.keys(
                transferEffectBlock.parameterVariations
              )) {
                effectBlock.parameterVariations[parameter] =
                  transferEffectBlock.parameterVariations[parameter]?.map(
                    (variationData: any) =>
                      deserializeVariation(this.store, variationData)
                  );
              }

              // set this effect as selected
              effectIndices.push(effectIndex);
            }
          );
        }
        this.selectedEffectIndices = effectIndices;
      }
    );
  };
}
