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
}
