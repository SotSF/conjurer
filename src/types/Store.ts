import { Block } from "@/src/types/Block";
import { MIN_PIXELS_PER_SECOND, UIStore } from "@/src/types/UIStore";
import { makeAutoObservable, configure } from "mobx";
import { AudioStore } from "@/src/types/AudioStore";
import { Variation } from "@/src/types/Variations/Variation";
import { ExperienceStore } from "@/src/types/ExperienceStore";
import { Layer } from "@/src/types/Layer";
import { setupUnityAppWebsocket } from "@/src/websocket/unityWebsocket";
import { deserializeVariation } from "@/src/types/Variations/variations";
import { PlaylistStore } from "@/src/types/PlaylistStore";
import { BeatMapStore } from "@/src/types/BeatMapStore";
import { PlaygroundStore } from "@/src/types/PlaygroundStore";
import { setupControllerWebsocket } from "@/src/websocket/controllerWebsocket";
import { setupVoiceCommandWebsocket } from "@/src/websocket/voiceCommandWebsocket";
import {
  EXPERIENCE_VERSION,
  ExperienceStatus,
  Experience,
} from "@/src/types/Experience";
import { NO_SONG } from "@/src/types/Song";
import { Context } from "@/src/types/context";

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
  beatMapStore = new BeatMapStore(this);
  uiStore = new UIStore(this, this.audioStore);
  experienceStore = new ExperienceStore(this);
  playlistStore = new PlaylistStore(
    this,
    this.audioStore,
    this.experienceStore
  );
  playgroundStore = new PlaygroundStore(this);

  layers: Layer[] = [];

  sendingData = false;
  embeddedViewer = false;

  _globalIntensity = 1;
  get globalIntensity(): number {
    return this._globalIntensity;
  }
  set globalIntensity(value: number) {
    this._globalIntensity = value;
    localStorage.setItem("globalIntensity", String(value));
  }

  private _usingLocalData = process.env.NEXT_PUBLIC_NODE_ENV !== "production";
  get usingLocalData(): boolean {
    return this._usingLocalData;
  }
  set usingLocalData(value: boolean) {
    this._usingLocalData = value;
    localStorage.setItem("usingLocalData", String(value));
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

  get singleBlockSelection(): Block | null {
    const blockSelections = Array.from(this.selectedBlocksOrVariations).filter(
      (blockOrVariation) => blockOrVariation.type === "block"
    ) as BlockSelection[];

    return blockSelections.length === 1 ? blockSelections[0].block : null;
  }

  get singleVariationSelection(): VariationSelection | null {
    const variationSelections = Array.from(
      this.selectedBlocksOrVariations
    ).filter(
      (blockOrVariation) => blockOrVariation.type === "variation"
    ) as VariationSelection[];

    return variationSelections.length === 1 ? variationSelections[0] : null;
  }

  private _username = "";
  get username(): string {
    return this._username;
  }
  set username(value: string) {
    this._username = value;
    if (this.context === "experienceEditor")
      localStorage.setItem("username", value);
  }

  private _experienceName = "";
  get experienceName(): string {
    return this._experienceName;
  }
  set experienceName(value: string) {
    this._experienceName = value;
    if (this.context === "experienceEditor") {
      localStorage.setItem("experienceName", value);
      window.history.pushState({}, "", `/experience/${value}`);
    }
  }

  hasSaved = false;
  experienceLastSavedAt = 0;
  experienceVersion = EXPERIENCE_VERSION;
  experienceStatus: ExperienceStatus = "inprogress";
  experienceId: number | undefined = undefined;

  get playing() {
    return this.audioStore.audioState !== "paused";
  }

  constructor(readonly context: Context) {
    makeAutoObservable(this);

    this.initializeServerSide();
  }

  initializeServerSide = () => {
    // TODO: can move all of these into the field initialization code in their respective stores
    if (this.context === "playground") {
      this.uiStore.patternDrawerOpen = true;
    } else if (this.context === "controller") {
      this.uiStore.displayMode = "none";
    } else if (this.context === "viewer") {
      this.uiStore.showingViewerInstructionsModal = true;
      this.uiStore.pixelsPerSecond = MIN_PIXELS_PER_SECOND;
    }
  };

  initializeClientSide = (initialExperienceName?: string) => {
    if (this.initializedClientSide) return;
    this.initializedClientSide = true;

    if (process.env.NEXT_PUBLIC_ENABLE_VOICE === "true")
      setupVoiceCommandWebsocket(this);

    if (this.context === "controller") {
      this.playgroundStore.initialize();
      setupControllerWebsocket(this.context);
      return;
    }

    if (this.context === "playground") {
      this.playgroundStore.initialize();
      this.uiStore.initialize();
      setupControllerWebsocket(this.context, this.playgroundStore.onUpdate);
      return;
    }

    if (this.context === "viewer") {
      this.embeddedViewer =
        new URLSearchParams(window.location.search).get("embedded") === "true";
      this.experienceStore.loadFromParams() ||
        this.experienceStore.load(this.playlistStore.experienceNames[0]);
      this.uiStore.initialize(this.embeddedViewer);
      if (this.embeddedViewer) this.play();
      return;
    }

    // check for a username in local storage
    const username = localStorage.getItem("user");
    if (username) this._username = username;

    // check for a global intensity in local storage
    const globalIntensity = localStorage.getItem("globalIntensity");
    if (globalIntensity) this._globalIntensity = Number(globalIntensity);

    // check for a usingLocalData in local storage (not honored in production)
    const usingLocalData = localStorage.getItem("usingLocalData");
    if (usingLocalData && process.env.NEXT_PUBLIC_NODE_ENV !== "production")
      this._usingLocalData = usingLocalData === "true";

    // load experience from path parameter if provided (e.g. /experience/my-experience)
    if (initialExperienceName) this.experienceStore.load(initialExperienceName);
    else if (this.context === "playlistEditor")
      this.playlistStore.loadFirstExperience();
    else this.experienceStore.loadEmptyExperience();

    this.uiStore.initialize();
  };

  toggleSendingData = () => {
    this.sendingData = !this.sendingData;
    if (this.sendingData) setupUnityAppWebsocket();
  };

  toggleUsingLocalData = () => {
    this.usingLocalData = !this.usingLocalData;
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

    let blockRemoved = false;
    for (const blockOrVariation of Array.from(
      this.selectedBlocksOrVariations
    )) {
      if (blockOrVariation.type === "block") {
        // TODO: better generalize for multiple layers
        this.layers.forEach((l) => l.removeBlock(blockOrVariation.block));
        blockRemoved = true;
      } else if (blockOrVariation.type === "variation")
        this.deleteVariation(
          blockOrVariation.block,
          blockOrVariation.uniformName,
          blockOrVariation.variation
        );
    }

    if (blockRemoved) {
      // when deleting a variation, we select the next variation, so we don't want to deselect everything
      this.selectedBlocksOrVariations = new Set();
    }
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
    const removeIndex = block.removeVariation(uniformName, variation);
    const nextVariation = block.findVariationAtIndex(uniformName, removeIndex);

    if (nextVariation) this.selectVariation(block, uniformName, nextVariation);
    else this.deselectVariation(block, uniformName, variation);
  };

  copyLinkToExperience = () => {
    const url = new URL(`${window.location.origin}/viewer`);
    url.searchParams.set("experience", this.experienceName);
    navigator.clipboard.writeText(url.toString());
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
    // check if we are pasting blocks
    if (firstBlockOrVariation.pattern) {
      const layerToPasteInto = this.selectedLayer;
      if (!layerToPasteInto) return;

      const blocksToPaste = blocksOrVariationsData.map((b: any) =>
        Block.deserialize(this, b)
      );
      blocksToPaste.forEach((block) => block.regenerateId());
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

  serialize = (): Experience => ({
    id: this.experienceId,
    name: this.experienceName,
    song: this.audioStore.selectedSong,
    status: this.experienceStatus,
    version: this.experienceVersion,
    data: { layers: this.layers.map((l) => l.serialize()) },
  });

  deserialize = (experience: Experience) => {
    this.experienceId = experience.id;
    this.experienceName = experience.name;
    this.audioStore.selectedSong = experience.song || NO_SONG;
    this.experienceStatus = experience.status;
    this.experienceVersion = experience.version;
    this.layers = experience.data.layers.map((l: any) =>
      Layer.deserialize(this, l)
    );

    // Select first layer
    this.selectedLayer = this.layers[0];
  };
}
