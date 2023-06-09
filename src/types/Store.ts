import { Block } from "@/src/types/Block";
import { Timer } from "@/src/types/Timer";
import { UIStore } from "@/src/types/UIStore";
import { makeAutoObservable, configure } from "mobx";
import { AudioStore } from "@/src/types/AudioStore";
import { Variation } from "@/src/types/Variations/Variation";
import { ExperienceStore } from "@/src/types/ExperienceStore";
import { Layer } from "@/src/types/Layer";
import { setupWebsocket } from "@/src/utils/websocket";

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
  uiStore = new UIStore(this.timer);
  audioStore = new AudioStore(this, this.timer);
  experienceStore = new ExperienceStore(this);

  layers: Layer[] = [];

  sendingData = false;

  _globalIntensity = 1;

  get globalIntensity(): number {
    return this._globalIntensity;
  }

  set globalIntensity(value: number) {
    this._globalIntensity = value;
    localStorage.setItem("globalIntensity", String(value));
  }

  private _usingLocalAssets = false;

  get usingLocalAssets(): boolean {
    return this._usingLocalAssets;
  }

  set usingLocalAssets(value: boolean) {
    this._usingLocalAssets = value;
    localStorage.setItem("usingLocalAssets", String(value));
  }

  private _selectedLayer: Layer = this.layers[0]; // a layer is always selected

  get selectedLayer() {
    return this._selectedLayer;
  }

  set selectedLayer(value: Layer) {
    if (this._selectedLayer === value) return;
    this._selectedLayer = value;
    this.deselectVariation();
  }

  selectedBlocks: Set<Block> = new Set();

  selectedVariationBlock: Block | null = null;
  selectedVariationUniformName: string = "";
  selectedVariation: Variation | null = null;

  private _user = "";

  get user(): string {
    return this._user;
  }

  set user(value: string) {
    this._user = value;
    localStorage.setItem("user", value);
  }

  private _experienceName = "untitled";

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
    // check for a username in local storage
    const username = localStorage.getItem("user");
    if (username) this._user = username;

    // check for a global intensity in local storage
    const globalIntensity = localStorage.getItem("globalIntensity");
    if (globalIntensity) this._globalIntensity = Number(globalIntensity);

    // check for a usingLocalAssets in local storage
    const usingLocalAssets = localStorage.getItem("usingLocalAssets");
    if (usingLocalAssets) this._usingLocalAssets = usingLocalAssets === "true";

    // check for an experience name in local storage
    const experienceName = localStorage.getItem("experienceName");
    if (experienceName) {
      this._experienceName = experienceName;
      this.experienceStore.load(`${this.user}-${experienceName}`);
    } else this.experienceStore.loadInitialExperience();

    // set up an autosave interval
    setInterval(() => {
      if (!this.timer.playing)
        this.experienceStore.saveToLocalStorage("autosave");
    }, 60 * 1000);

    this.uiStore.initialize();

    this.initialized = true;
  };

  initializePlayground = () => {
    if (this.initialized) return;
    this.initialized = true;

    this.uiStore.initialize();
  };

  toggleSendingData = () => {
    this.sendingData = !this.sendingData;
    if (this.sendingData) setupWebsocket();
  };

  toggleUsingLocalAssets = () => {
    this.usingLocalAssets = !this.usingLocalAssets;
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

    if (this.selectedVariation && this.selectedVariationBlock)
      this.deleteVariation(
        this.selectedVariationBlock,
        this.selectedVariationUniformName,
        this.selectedVariation
      );
  };

  addVariation = (block: Block, uniformName: string, variation: Variation) => {
    block.addVariation(uniformName, variation);
    if (block.layer) this._selectedLayer = block.layer;
    this.selectedVariationBlock = block;
    this.selectedVariationUniformName = uniformName;
    this.selectedVariation = variation;
  };

  duplicateVariation = (
    block: Block,
    uniformName: string,
    variation: Variation
  ) => {
    block.duplicateVariation(uniformName, variation);
    if (block.layer) this._selectedLayer = block.layer;
    this.selectedVariationBlock = block;
    this.selectedVariationUniformName = uniformName;
    this.selectedVariation = variation;
  };

  deleteVariation = (
    block: Block,
    uniformName: string,
    variation: Variation
  ) => {
    block.removeVariation(uniformName, variation);
    if (this.selectedVariation === variation) {
      this.selectedVariationBlock = null;
      this.selectedVariationUniformName = "";
      this.selectedVariation = null;
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

    const layerToPasteInto = this.selectedLayer;
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
      const layerToPasteInto = this.selectedLayer;
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

    if (this.selectedVariation && this.selectedVariationBlock) {
      this.duplicateVariation(
        this.selectedVariationBlock,
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
    this.selectedVariation = variation;
    this.selectedVariationUniformName = uniformName;
    this.selectedVariationBlock = block;
    if (block.layer) this._selectedLayer = block.layer;
  };

  deselectVariation = () => {
    this.selectedVariation = null;
    this.selectedVariationUniformName = "";
    this.selectedVariationBlock = null;
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
    this.selectedLayer = this.layers[0];
  };
}
