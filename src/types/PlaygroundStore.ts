import { playgroundEffects } from "@/src/effects/effects";
import { playgroundPatterns } from "@/src/patterns/patterns";
import { Block } from "@/src/types/Block";
import { ExtraParams } from "@/src/types/PatternParams";
import type { Store } from "@/src/types/Store";
import { sendConjurerStateUpdate } from "@/src/websocket/conjurerApiWebsocket";
import { makeAutoObservable, runInAction } from "mobx";
import { FlatVariation } from "./Variations/FlatVariation";
import { DEFAULT_BLOCK_DURATION } from "../utils/time";
import { generateId } from "@/src/utils/id";

export class PlaygroundStore {
  id = generateId();

  patternBlocks: Block[];
  effectBlocks: Block[];

  _selectedPatternIndex = 0;
  get selectedPatternIndex() {
    return this._selectedPatternIndex;
  }
  set selectedPatternIndex(index: number) {
    this._selectedPatternIndex = index;

    if (process.env.NEXT_PUBLIC_NODE_ENV !== "production")
      sendConjurerStateUpdate(this.store);
  }

  _selectedEffectIndices: number[] = [];
  get selectedEffectIndices() {
    return this._selectedEffectIndices;
  }
  set selectedEffectIndices(indices: number[]) {
    this._selectedEffectIndices = indices;
  }

  constructor(readonly store: Store) {
    this.patternBlocks = playgroundPatterns.map(
      (pattern) => new Block(this.store, pattern),
      [],
    );
    this.effectBlocks = playgroundEffects.map(
      (effect) => new Block(this.store, effect),
    );

    makeAutoObservable(this);
  }

  initialize = () => {
    this.loadFromLocalStorage();

    this.selectedPatternIndex = this.lastPatternIndexSelected;
    this.selectedEffectIndices = this.lastEffectIndices;

    // listen for local storage changes to sending data
    window.addEventListener("storage", (event) => {
      if (
        event.key === `${this.store.context}-sendingData` &&
        event.newValue !== null
      ) {
        runInAction(() => {
          // don't send data if another tab is already
          this.store.sendingData = false;
        });
      }
      if (
        event.key === `playgroundStore-${this.store.context}` &&
        event.newValue !== null
      ) {
        this.loadFromLocalStorage();
      }
    });
  };

  get selectedPatternBlock(): Block<ExtraParams> {
    return (
      this.patternBlocks[this.selectedPatternIndex] ?? this.patternBlocks[0]
    );
  }

  nextPattern = () => {
    this.selectedPatternIndex =
      (this.selectedPatternIndex + 1) % this.patternBlocks.length;
  };

  previousPattern = () => {
    this.selectedPatternIndex =
      (this.selectedPatternIndex - 1 + this.patternBlocks.length) %
      this.patternBlocks.length;
  };

  addEffects = (effectNames: string[]) => {
    effectNames.forEach((effectName) => {
      const newIndex = this.effectBlocks.findIndex(
        (effectBlock) => effectBlock.pattern.name === effectName,
      );
      if (!this.selectedEffectIndices.includes(newIndex))
        this.selectedEffectIndices = [...this.selectedEffectIndices, newIndex];
    });
  };

  removeEffects = (effectNames: string[]) => {
    this.selectedEffectIndices = this.selectedEffectIndices.filter(
      (selectedEffectIndex) =>
        !effectNames.includes(
          this.effectBlocks[selectedEffectIndex].pattern.name,
        ),
    );
  };

  setParameterValues = (newParams: { name: string; value: number }[]) => {
    const params = this.selectedPatternBlock.pattern.params as ExtraParams;
    for (const { name, value } of newParams) {
      const variations = this.selectedPatternBlock.parameterVariations;
      if (params[name]) params[name].value = value;
      if (!variations[name] || variations[name].length == 0) {
        variations[name] = [new FlatVariation(DEFAULT_BLOCK_DURATION, value)];
        return;
      }
      if (variations[name][0] instanceof FlatVariation) {
        variations[name][0].value = value;
      }
      // TODO: handle non-numeric params
      // TODO: handle effect params
    }
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
    const data = localStorage.getItem(`playgroundStore-${this.store.context}`);
    if (data) {
      const localStorageUiSettings = JSON.parse(data);
      this._lastPatternIndexSelected =
        localStorageUiSettings.lastPatternIndexSelected ?? 0;
      this._lastEffectIndices = localStorageUiSettings.lastEffectIndices ?? [];
    }
  };

  saveToLocalStorage = () => {
    if (typeof window === "undefined") return;
    localStorage.setItem(
      `playgroundStore-${this.store.context}`,
      JSON.stringify({
        lastPatternIndexSelected: this.lastPatternIndexSelected,
        lastEffectIndices: this.lastEffectIndices,
      }),
    );
  };
}
