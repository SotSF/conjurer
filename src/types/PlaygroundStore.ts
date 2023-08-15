import { playgroundEffects } from "@/src/effects/effects";
import { playgroundPatterns } from "@/src/patterns/patterns";
import { Block, RootStore } from "@/src/types/Block";
import { ExtraParams } from "@/src/types/PatternParams";
import { TransferBlock } from "@/src/types/TransferBlock";
import { makeAutoObservable } from "mobx";

export class PlaygroundStore {
  patternBlocks: Block[];
  effectBlocks: Block[];

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
  };

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

  loadFromLocalStorage = () => {
    if (typeof window === "undefined") return;
    const data = localStorage.getItem("playgroundStore");
    if (data) {
      const localStorageUiSettings = JSON.parse(data);
      this.lastPatternIndexSelected =
        localStorageUiSettings.lastPatternIndexSelected ?? 0;
      this.lastEffectIndices = localStorageUiSettings.lastEffectIndices ?? [];
    }
  };

  saveToLocalStorage = () => {
    if (typeof window === "undefined") return;
    localStorage.setItem(
      "playgroundStore",
      JSON.stringify({
        lastPatternIndexSelected: this.lastPatternIndexSelected,
        lastEffectIndices: this.lastEffectIndices,
      })
    );
  };

  // TODO: refactor, make performant
  onUpdate = (transferBlock: TransferBlock) => {
    const { pattern: transferPattern, effectBlocks: transferEffectBlocks } =
      transferBlock;
    for (const patternBlock of this.patternBlocks) {
      if (patternBlock.pattern.name === transferPattern.name) {
        const { params } = transferPattern;
        for (const [uniformName, param] of Object.entries(params)) {
          const playgroundParams = patternBlock.pattern.params as ExtraParams;
          if (playgroundParams[uniformName])
            playgroundParams[uniformName].value = param.value;
        }

        for (const transferEffectBlock of transferEffectBlocks) {
          for (const effectBlock of this.effectBlocks) {
            if (effectBlock.pattern.name === transferEffectBlock.pattern.name) {
              const { params } = transferEffectBlock.pattern;
              for (const [uniformName, param] of Object.entries(params)) {
                const playgroundParams = effectBlock.pattern
                  .params as ExtraParams;
                if (playgroundParams[uniformName])
                  playgroundParams[uniformName].value = param.value;
              }
              break;
            }
          }
        }

        break;
      }
    }
  };
}
