import { Canvas, useFrame } from "@react-three/fiber";
import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useRef, useState } from "react";
import type { WebGLRenderTarget } from "three";

import { Block } from "@/src/types/Block";
import { useStore } from "@/src/types/StoreContext";
import { RenderingGate } from "@/src/components/RenderingGate";
import { CameraControls } from "@/src/components/CameraControls";
import { Canopy } from "@/src/components/Canvas/CanopyView";
import { CanopySpaceView } from "@/src/components/Canvas/CanopySpaceView";
import { CartesianSpaceView } from "@/src/components/Canvas/CartesianSpaceView";
import { SingleBlockRenderPipeline } from "@/src/components/RenderPipeline/SingleBlockRenderPipeline";
import { VJCrossfadeRenderPipeline } from "@/src/components/VJPage/VJCrossfadeRenderPipeline";
import { BrightnessAdjust } from "@/src/effects/BrightnessAdjust";
import { runInAction } from "mobx";

export type VJDisplayMode =
  | "canopy"
  | "canopySpace"
  | "cartesianSpace"
  | "none";

type PushRequest = {
  id: number;
  toBlock: Block;
} | null;

type Props = {
  block: Block;
  displayMode: VJDisplayMode;
  transmitDataEnabled?: boolean;
  frameloop?: "always" | "demand";

  pushRequest: PushRequest;
  onCrossfadeComplete?: () => void;

  crossfadeDurationSeconds: number;
  /** Increment to finish the current crossfade immediately (same outcome as completing the fade). */
  cancelCrossfadeSignal: number;
};

function attachBrightnessAdjust(base: Block, intensity: number): Block {
  // MobX strict mode requires observable writes to be wrapped in actions.
  let result: Block;
  runInAction(() => {
    const cloned = base.clone();
    const brightness = new Block(base.store, BrightnessAdjust());
    (brightness.pattern.params as any).u_intensity.value = intensity;
    brightness.parentBlock = cloned;
    cloned.effectBlocks = [...cloned.effectBlocks, brightness];
    result = cloned;
  });
  // `result` is assigned inside runInAction above.
  return result!;
}

const CrossfadeDriver = function CrossfadeDriver({
  active,
  startTimeRef,
  progressRef,
  currentBlockWithBrightness,
  nextBlockWithBrightness,
  crossfadeDurationSeconds,
  onDone,
}: {
  active: boolean;
  startTimeRef: React.MutableRefObject<number | null>;
  progressRef: React.MutableRefObject<number>;
  currentBlockWithBrightness: Block | null;
  nextBlockWithBrightness: Block | null;
  crossfadeDurationSeconds: number;
  onDone: () => void;
}) {
  useFrame(({ clock }) => {
    if (!active) return;
    if (startTimeRef.current === null) startTimeRef.current = clock.elapsedTime;
    const t = clock.elapsedTime - startTimeRef.current;
    const duration = Math.max(0.01, crossfadeDurationSeconds);
    const p = Math.min(1, Math.max(0, t / duration));
    progressRef.current = p;

    const outIntensity = 1 - p;
    const inIntensity = p;

    if (!currentBlockWithBrightness || !nextBlockWithBrightness) return;

    const currentBrightnessBlock =
      currentBlockWithBrightness.effectBlocks[
        currentBlockWithBrightness.effectBlocks.length - 1
      ];
    const nextBrightnessBlock =
      nextBlockWithBrightness.effectBlocks[
        nextBlockWithBrightness.effectBlocks.length - 1
      ];

    const currentIntensityParam = (
      currentBrightnessBlock?.pattern?.params as any
    )?.u_intensity;
    const nextIntensityParam = (nextBrightnessBlock?.pattern?.params as any)
      ?.u_intensity;

    runInAction(() => {
      if (currentIntensityParam) currentIntensityParam.value = outIntensity;
      if (nextIntensityParam) nextIntensityParam.value = inIntensity;
    });

    if (p >= 1) onDone();
  }, -10);
  return null;
};

export const VJLiveCanvas = observer(function VJLiveCanvas({
  block,
  displayMode,
  transmitDataEnabled = false,
  frameloop = "demand",
  pushRequest,
  onCrossfadeComplete,
  crossfadeDurationSeconds,
  cancelCrossfadeSignal,
}: Props) {
  const store = useStore();
  const [renderTarget, setRenderTarget] = useState<WebGLRenderTarget | null>(
    null,
  );

  const lastProcessedCancelSignalRef = useRef(0);
  const nextBlockRef = useRef<Block | null>(null);

  // Snapshots only used during crossfade. When idle, we render `block` directly so
  // live edits (params, variations) stay in sync — a clone would go stale because
  // its source is the same MobX object and only id/pattern.name were previously
  // used to refresh.
  const [currentBlock, setCurrentBlock] = useState<Block | null>(null);
  const [nextBlock, setNextBlock] = useState<Block | null>(null);
  nextBlockRef.current = nextBlock;

  const startTimeRef = useRef<number | null>(null);
  const progressRef = useRef(0);

  // Start crossfade when a new request arrives.
  const lastPushIdRef = useRef<number | null>(null);
  useEffect(() => {
    if (!pushRequest) return;
    if (lastPushIdRef.current === pushRequest.id) return;
    lastPushIdRef.current = pushRequest.id;

    startTimeRef.current = null;
    progressRef.current = 0;
    runInAction(() => {
      // Freeze live + preview at push time so the fade is between two stable snapshots.
      setCurrentBlock(block.clone());
      setNextBlock(pushRequest.toBlock.clone());
    });
  }, [pushRequest, block]);

  const crossfading = !!nextBlock;

  const currentBlockWithBrightness = useMemo(() => {
    if (!crossfading || !currentBlock) return null;
    return attachBrightnessAdjust(currentBlock, 1);
  }, [crossfading, currentBlock]);

  const nextBlockWithBrightness = useMemo(() => {
    if (!nextBlock) return null;
    return attachBrightnessAdjust(nextBlock, 0);
  }, [nextBlock]);

  const finishCrossfade = () => {
    if (!nextBlockRef.current) return;
    setNextBlock(null);
    setCurrentBlock(null);
    startTimeRef.current = null;
    progressRef.current = 0;
    onCrossfadeComplete?.();
  };

  const finishCrossfadeRef = useRef(finishCrossfade);
  finishCrossfadeRef.current = finishCrossfade;

  useEffect(() => {
    if (cancelCrossfadeSignal <= lastProcessedCancelSignalRef.current) return;
    lastProcessedCancelSignalRef.current = cancelCrossfadeSignal;
    finishCrossfadeRef.current();
  }, [cancelCrossfadeSignal]);

  return (
    <Canvas frameloop={frameloop}>
      {frameloop === "demand" && (
        <RenderingGate shouldRender={!store.playing} />
      )}
      <CameraControls />

      {crossfading && currentBlockWithBrightness && (
        <CrossfadeDriver
          active
          startTimeRef={startTimeRef}
          progressRef={progressRef}
          currentBlockWithBrightness={currentBlockWithBrightness}
          nextBlockWithBrightness={nextBlockWithBrightness}
          crossfadeDurationSeconds={crossfadeDurationSeconds}
          onDone={finishCrossfade}
        />
      )}

      {!crossfading && (
        <SingleBlockRenderPipeline
          autorun
          block={block}
          setRenderTarget={setRenderTarget}
        />
      )}

      {crossfading && currentBlockWithBrightness && nextBlockWithBrightness && (
        <VJCrossfadeRenderPipeline
          currentBlock={currentBlockWithBrightness}
          nextBlock={nextBlockWithBrightness}
          setRenderTarget={setRenderTarget}
        />
      )}

      {renderTarget && (
        <>
          {displayMode === "canopy" && <Canopy renderTarget={renderTarget} />}
          {displayMode === "cartesianSpace" && (
            <CartesianSpaceView
              renderTarget={renderTarget}
              visible={displayMode === "cartesianSpace"}
            />
          )}
          <CanopySpaceView
            renderTarget={renderTarget}
            transmitData={transmitDataEnabled}
            visible={displayMode === "canopySpace"}
          />
        </>
      )}
    </Canvas>
  );
});
