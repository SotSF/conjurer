import { playgroundEffects } from "@/src/effects/effects";
import { playgroundPatterns } from "@/src/patterns/patterns";
import { Block, RootStore } from "@/src/types/Block";
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
}
