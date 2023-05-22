import { Block } from "@/src/types/Block";
import { Pattern } from "@/src/types/Pattern";
import { Timer } from "@/src/types/Timer";
import { UIStore } from "@/src/types/UIStore";
import { patterns } from "@/src/patterns/patterns";
import { makeAutoObservable, configure } from "mobx";
import { AudioStore } from "@/src/types/AudioStore";
import { Variation } from "@/src/types/Variations/Variation";
import { ExperienceStore } from "@/src/types/ExperienceStore";
import { Layer } from "@/src/types/Layer";

// Enforce MobX strict mode, which can make many noisy console warnings, but can help use learn MobX better.
// Feel free to comment out the following if you want to silence the console messages.
configure({
  enforceActions: "always",
  computedRequiresReaction: true,
  reactionRequiresObservable: true,
  observableRequiresReaction: false, // This will trigger false positives sometimes, so turning off
});

export class Store {
  initialized = false;

  timer = new Timer();
  uiStore = new UIStore();
  audioStore = new AudioStore(this.timer);
  experienceStore = new ExperienceStore(this);

  selectedLayer: Layer | null = null;
  layers: Layer[] = [];

  selectedBlocks: Set<Block> = new Set();

  selectedVariationBlock: Block | null = null;
  selectedVariationUniformName: string = "";
  selectedVariation: Variation | null = null;

  patterns: Pattern[] = patterns;
  selectedPattern: Pattern = patterns[0];
  draggingPattern: boolean = false;

  _user = "";

  get user(): string {
    return this._user;
  }

  set user(value: string) {
    this._user = value;
    localStorage.setItem("user", value);
  }

  _experienceName = "untitled";

  get experienceName(): string {
    return this._experienceName;
  }

  set experienceName(value: string) {
    this._experienceName = value;
    localStorage.setItem("experienceName", value);
  }

  experienceLastSavedAt = 0;

  constructor() {
    makeAutoObservable(this);
  }

  initialize = () => {
    this.experienceStore.loadInitialExperience();

    // check for a username in local storage
    const username = localStorage.getItem("user");
    if (username) this._user = username;

    // set up an autosave interval
    setInterval(() => {
      if (!this.timer.playing)
        this.experienceStore.saveToLocalStorage("autosave");
    }, 60 * 1000);

    this.initialized = true;
  };

  selectBlock = (block: Block) => {
    this.selectedBlocks = new Set([block]);
  };

  addBlockToSelection = (block: Block) => {
    this.selectedBlocks.add(block);
  };

  deselectBlock = (block: Block) => {
    this.selectedBlocks.delete(block);
  };

  selectAllBlocks = () => {
    const allBlocks = this.layers.flatMap((l) => l.patternBlocks);
    this.selectedBlocks = new Set(allBlocks);
  };

  deselectAllBlocks = () => {
    if (this.selectedBlocks.size === 0) return;
    this.selectedBlocks = new Set();
  };

  // TODO: better generalize for multiple layers
  deleteSelected = () => {
    if (this.selectedBlocks.size > 0) {
      Array.from(this.selectedBlocks).forEach((block) => {
        this.layers.forEach((l) => l.removeBlock(block));
      });
      this.selectedBlocks = new Set();
      return;
    }

    if (this.selectedVariation) {
      this.selectedVariationBlock?.removeVariation(
        this.selectedVariationUniformName,
        this.selectedVariation
      );
    }
  };

  copyBlocksToClipboard = (clipboardData: DataTransfer) => {
    clipboardData.setData(
      "text/plain",
      JSON.stringify(Array.from(this.selectedBlocks).map((b) => b.serialize()))
    );
  };

  // TODO: better generalize for multiple layers
  pasteBlocksFromClipboard = (clipboardData: DataTransfer) => {
    const blocksData = JSON.parse(clipboardData.getData("text/plain"));
    if (!blocksData || !blocksData.length) return;

    const layerToPasteInto = this.selectedLayer || this.layers[0];
    if (!layerToPasteInto) return;

    const blocksToPaste = blocksData.map((b: any) => Block.deserialize(b));
    this.selectedBlocks = new Set();
    for (const blockToPaste of blocksToPaste) {
      const nextGap = layerToPasteInto.nextFiniteGap(
        this.timer.globalTime,
        blockToPaste.duration
      );
      blockToPaste.setTiming(nextGap);
      layerToPasteInto.addBlock(blockToPaste);
      this.addBlockToSelection(blockToPaste);
    }
  };

  // TODO: better generalize for multiple layers
  duplicateSelected = () => {
    if (this.selectedBlocks.size > 0) {
      const layerToPasteInto = this.selectedLayer || this.layers[0];
      if (!layerToPasteInto) return;

      const selectedBlocks = Array.from(this.selectedBlocks);
      this.selectedBlocks = new Set();
      for (const selectedBlock of selectedBlocks) {
        const newBlock = selectedBlock.clone();
        const nextGap = layerToPasteInto.nextFiniteGap(
          selectedBlock.endTime,
          selectedBlock.duration
        );
        newBlock.setTiming(nextGap);
        layerToPasteInto.addBlock(newBlock);
        this.addBlockToSelection(newBlock);
      }
      return;
    }

    if (this.selectedVariation) {
      this.selectedVariationBlock?.duplicateVariation(
        this.selectedVariationUniformName,
        this.selectedVariation
      );
    }
  };

  selectVariation = (
    block: Block,
    uniformName: string,
    variation: Variation
  ) => {
    if (this.selectedVariation?.id === variation.id) {
      this.selectedVariation = null;
      this.selectedVariationUniformName = "";
      this.selectedVariationBlock = null;
      return;
    }

    this.selectedVariation = variation;
    this.selectedVariationUniformName = uniformName;
    this.selectedVariationBlock = block;
  };

  serialize = () => ({
    audioStore: this.audioStore.serialize(),
    uiStore: this.uiStore.serialize(),
    layers: this.layers.map((l) => l.serialize()),
    user: this.user,
    savedAt: Date.now(),
  });

  deserialize = (data: any) => {
    this.audioStore.deserialize(data.audioStore);
    this.uiStore.deserialize(data.uiStore);
    this.layers = data.layers.map((l: any) => Layer.deserialize(l, this.timer));
  };
}
