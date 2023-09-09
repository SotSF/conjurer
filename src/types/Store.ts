import { Block } from "@/src/types/Block";
import {
  MAX_PIXELS_PER_SECOND,
  MIN_PIXELS_PER_SECOND,
  UIStore,
} from "@/src/types/UIStore";
import { makeAutoObservable, configure } from "mobx";
import { AudioStore } from "@/src/types/AudioStore";
import { Variation } from "@/src/types/Variations/Variation";
import { ExperienceStore } from "@/src/types/ExperienceStore";
import { Layer } from "@/src/types/Layer";
import { setupUnityAppWebsocket } from "@/src/utils/unityWebsocket";
import { deserializeVariation } from "@/src/types/Variations/variations";
import { PlaylistStore } from "@/src/types/PlaylistStore";
import { PlaygroundStore } from "@/src/types/PlaygroundStore";
import { setupControllerWebsocket } from "@/src/utils/controllerWebsocket";

// Enforce MobX strict mode, which can make many noisy console warnings, but can help use learn MobX better.
// Feel free to comment out the following if you want to silence the console messages.
configure({
  enforceActions: "always",
  computedRequiresReaction: true,
  reactionRequiresObservable: true,
  observableRequiresReaction: false, // This will trigger false positives sometimes, so turning off
});

export type BlockSelection = { type: "block"; block: Block };

export type VariationSelection = {
  type: "variation";
  block: Block;
  uniformName: string;
  variation: Variation;
};

export type BlockOrVariation = BlockSelection | VariationSelection;

export class Store {
  initializedClientSide = false;

  audioStore = new AudioStore(this);
  uiStore = new UIStore(this.audioStore);
  experienceStore = new ExperienceStore(this);
  playlistStore = new PlaylistStore(
    this,
    this.audioStore,
    this.experienceStore
  );
  playgroundStore = new PlaygroundStore(this);

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
  }

  selectedBlocksOrVariations: Set<BlockOrVariation> = new Set();

  get singleVariationSelection(): VariationSelection | null {
    const variationSelections = Array.from(
      this.selectedBlocksOrVariations
    ).filter(
      (blockOrVariation) => blockOrVariation.type === "variation"
    ) as VariationSelection[];

    return variationSelections.length === 1 ? variationSelections[0] : null;
  }

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

  get experienceFilename(): string {
    return `${this.user}-${this.experienceName}`;
  }

  experienceLastSavedAt = 0;

  get playing() {
    return this.audioStore.audioState !== "paused";
  }

  constructor(
    readonly context: "playground" | "controller" | "viewer" | "default"
  ) {
    makeAutoObservable(this);

    this.initializeServerSide();
  }

  initializeServerSide = () => {
    if (this.context === "playground") {
      this.uiStore.patternDrawerOpen = true;
    } else if (this.context === "controller") {
      this.uiStore.displayMode = "none";
    } else if (this.context === "viewer") {
      this.playlistStore.autoplay = true;
      this.uiStore.showingViewerInstructionsModal = true;
      this.uiStore.pixelsPerSecond = MIN_PIXELS_PER_SECOND;
    }
  };

  initializeClientSide = () => {
    if (this.initializedClientSide) return;
    this.initializedClientSide = true;

    if (this.context === "controller") {
      this.playgroundStore.initialize();
      setupControllerWebsocket(this.context);
      return;
    }

    if (this.context === "playground") {
      this.playgroundStore.initialize();
      setupControllerWebsocket(this.context, this.playgroundStore.onUpdate);
      return;
    }

    if (this.context === "viewer") {
      this.playlistStore.loadExperience(
        this.playlistStore.experienceFilenames[0]
      );
      this.uiStore.initialize();
      return;
    }

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
      if (!this.playing) this.experienceStore.saveToLocalStorage("autosave");
    }, 60 * 1000);

    this.uiStore.initialize();
  };

  toggleSendingData = () => {
    this.sendingData = !this.sendingData;
    if (this.sendingData) setupUnityAppWebsocket();
  };

  toggleUsingLocalAssets = () => {
    this.usingLocalAssets = !this.usingLocalAssets;
  };

  newExperience = () => {
    this.experienceStore.saveToLocalStorage("autosave");
    this.experienceName = "untitled";
    this.experienceLastSavedAt = 0;
    this.experienceStore.loadEmptyExperience();
  };

  selectBlock = (block: Block) => {
    this.selectedBlocksOrVariations = new Set([{ type: "block", block }]);
  };

  addBlockToSelection = (block: Block) => {
    this.selectedBlocksOrVariations.add({ type: "block", block });
  };

  selectVariation = (
    block: Block,
    uniformName: string,
    variation: Variation
  ) => {
    this.selectedBlocksOrVariations = new Set([
      {
        type: "variation",
        block,
        uniformName,
        variation,
      },
    ]);
    if (block.layer) this._selectedLayer = block.layer;
  };

  addVariationToSelection = (
    block: Block,
    uniformName: string,
    variation: Variation
  ) => {
    this.selectedBlocksOrVariations.add({
      type: "variation",
      block,
      uniformName,
      variation,
    });
  };

  deselectBlock = (block: Block) => {
    this.selectedBlocksOrVariations.forEach((selectedBlockOrVariation) => {
      if (
        selectedBlockOrVariation.type === "block" &&
        selectedBlockOrVariation.block === block
      ) {
        this.selectedBlocksOrVariations.delete(selectedBlockOrVariation);
      }
    });
  };

  deselectVariation = (
    block: Block,
    uniformName: string,
    variation: Variation
  ) => {
    this.selectedBlocksOrVariations.forEach((selectedBlockOrVariation) => {
      if (
        selectedBlockOrVariation.type === "variation" &&
        selectedBlockOrVariation.block === block &&
        selectedBlockOrVariation.uniformName === uniformName &&
        selectedBlockOrVariation.variation === variation
      )
        this.selectedBlocksOrVariations.delete(selectedBlockOrVariation);
    });
  };

  selectAllBlocks = () => {
    const allBlocks = this.layers
      .flatMap((l) => l.patternBlocks)
      .map((block) => ({
        type: "block" as const,
        block,
      }));
    this.selectedBlocksOrVariations = new Set(allBlocks);
  };

  deselectAll = () => {
    if (this.selectedBlocksOrVariations.size === 0) return;
    this.selectedBlocksOrVariations = new Set();
  };

  deleteSelected = () => {
    if (this.selectedBlocksOrVariations.size === 0) return;

    for (const blockOrVariation of Array.from(
      this.selectedBlocksOrVariations
    )) {
      if (blockOrVariation.type === "block")
        // TODO: better generalize for multiple layers
        this.layers.forEach((l) => l.removeBlock(blockOrVariation.block));
      else if (blockOrVariation.type === "variation")
        this.deleteVariation(
          blockOrVariation.block,
          blockOrVariation.uniformName,
          blockOrVariation.variation
        );
    }

    this.selectedBlocksOrVariations = new Set();
  };

  addVariation = (block: Block, uniformName: string, variation: Variation) => {
    block.addVariation(uniformName, variation);
    if (block.layer) this._selectedLayer = block.layer;
    this.selectVariation(block, uniformName, variation);
  };

  duplicateVariation = (
    block: Block,
    uniformName: string,
    variation: Variation,
    insertAtEnd = false
  ) => {
    block.duplicateVariation(uniformName, variation, insertAtEnd);
    if (block.layer) this._selectedLayer = block.layer;
    this.selectVariation(block, uniformName, variation);
  };

  deleteVariation = (
    block: Block,
    uniformName: string,
    variation: Variation
  ) => {
    block.removeVariation(uniformName, variation);
    this.deselectVariation(block, uniformName, variation);
  };

  copyToClipboard = (clipboardData: DataTransfer) => {
    if (this.selectedBlocksOrVariations.size === 0) return;

    clipboardData.setData(
      "text/plain",
      JSON.stringify(
        Array.from(this.selectedBlocksOrVariations).map((blockOrVariation) =>
          blockOrVariation.type === "block"
            ? blockOrVariation.block.serialize()
            : blockOrVariation.variation.serialize()
        )
      )
    );
  };

  // TODO: better generalize for multiple layers
  pasteFromClipboard = (clipboardData: DataTransfer) => {
    const blocksOrVariationsData = JSON.parse(
      clipboardData.getData("text/plain")
    ) as any[];
    if (!blocksOrVariationsData || !blocksOrVariationsData.length) return;

    const firstBlockOrVariation = blocksOrVariationsData[0];
    if (firstBlockOrVariation.pattern) {
      // these are blocks

      const layerToPasteInto = this.selectedLayer;
      if (!layerToPasteInto) return;

      const blocksToPaste = blocksOrVariationsData.map((b: any) =>
        Block.deserialize(this, b)
      );
      this.selectedBlocksOrVariations = new Set();
      for (const blockToPaste of blocksToPaste) {
        const nextGap = layerToPasteInto.nextFiniteGap(
          this.audioStore.globalTime,
          blockToPaste.duration
        );
        blockToPaste.setTiming(nextGap);
        layerToPasteInto.addBlock(blockToPaste);
        this.addBlockToSelection(blockToPaste);
      }
      return;
    }

    // otherwise, these are variations

    // at least one variation must already be selected to know where to paste
    const selectedVariations = Array.from(
      this.selectedBlocksOrVariations
    ).filter(
      (blockOrVariation) => blockOrVariation.type === "variation"
    ) as VariationSelection[];
    if (!selectedVariations.length) return;

    const blockToPasteTo = selectedVariations[0].block;
    const uniformNameToPasteTo = selectedVariations[0].uniformName;

    const variationsToPaste = blocksOrVariationsData.map((v) =>
      deserializeVariation(this, v)
    );

    this.selectedBlocksOrVariations = new Set();
    for (const variationToPaste of variationsToPaste) {
      this.addVariation(blockToPasteTo, uniformNameToPasteTo, variationToPaste);
    }
  };

  // TODO: better generalize for multiple layers
  duplicateSelected = () => {
    if (this.selectedBlocksOrVariations.size === 0) return;

    const selectedBlocks = Array.from(this.selectedBlocksOrVariations)
      .filter((blockOrVariation) => blockOrVariation.type === "block")
      .map((blockOrVariation) => blockOrVariation.block);
    if (selectedBlocks.length > 0) {
      const layerToPasteInto = this.selectedLayer;
      if (!layerToPasteInto) return;

      this.selectedBlocksOrVariations = new Set();
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

    const selectedVariations = Array.from(
      this.selectedBlocksOrVariations
    ).filter(
      (blockOrVariation) => blockOrVariation.type === "variation"
      // TODO: do better type discrimination
    ) as VariationSelection[];
    if (selectedVariations.length > 0) {
      for (const selectedVariation of selectedVariations) {
        this.duplicateVariation(
          selectedVariation.block,
          selectedVariation.uniformName,
          selectedVariation.variation,
          selectedVariations.length > 1
        );
      }
    }
  };

  play = () => {
    if (this.playing) return;
    this.togglePlaying();
  };

  pause = () => {
    if (!this.playing) return;
    this.togglePlaying();
  };

  // How playing works:
  // - When the user clicks play, we set audioState to "starting"
  // - When the wavesurfer audio actually starts playing, we set audioState to "playing"
  // - When the audioState changes to "playing", the timer starts ticking
  togglePlaying = () => {
    if (this.audioStore.audioContext?.state === "suspended") {
      // resume audio context if it's suspended - will happen in chrome based on autoplay
      // settings/user interaction: https://developer.chrome.com/blog/autoplay/
      this.audioStore.audioContext.resume();
    }

    if (
      this.audioStore.audioState === "playing" ||
      this.audioStore.audioState === "starting"
    ) {
      this.audioStore.audioState = "paused";
    } else {
      this.audioStore.audioState = "starting";
    }
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
    this.uiStore.deserialize(this, data.uiStore);
    this.layers = data.layers.map((l: any) => Layer.deserialize(this, l));
    this.selectedLayer = this.layers[0];
  };
}
