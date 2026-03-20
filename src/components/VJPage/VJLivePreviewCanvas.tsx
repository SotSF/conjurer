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
  currentWithBrightness,
  nextWithBrightness,
  crossfadeDurationSeconds,
  onDone,
}: {
  active: boolean;
  startTimeRef: React.MutableRefObject<number | null>;
  progressRef: React.MutableRefObject<number>;
  currentWithBrightness: Block | null;
  nextWithBrightness: Block | null;
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

    if (!currentWithBrightness || !nextWithBrightness) return;

    const currentBrightnessBlock =
      currentWithBrightness.effectBlocks[
        currentWithBrightness.effectBlocks.length - 1
      ];
    const nextBrightnessBlock =
      nextWithBrightness.effectBlocks[
        nextWithBrightness.effectBlocks.length - 1
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

export const VJLivePreviewCanvas = observer(function VJLivePreviewCanvas({
  block,
  displayMode,
  transmitDataEnabled = false,
  frameloop = "demand",
  pushRequest,
  onCrossfadeComplete,
  crossfadeDurationSeconds,
}: Props) {
  const store = useStore();
  const [renderTarget, setRenderTarget] = useState<WebGLRenderTarget | null>(
    null,
  );
  const transmitData = store.context === "vj" && transmitDataEnabled;

  const [currentBase, setCurrentBase] = useState(() => block.clone());
  const [nextBase, setNextBase] = useState<Block | null>(null);

  // If the live session is edited directly (not via push), reflect it immediately
  // when we're not mid-crossfade.
  useEffect(() => {
    if (nextBase) return;
    runInAction(() => {
      setCurrentBase(block.clone());
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [block.id, block.pattern.name, nextBase]);

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
      setNextBase(pushRequest.toBlock.clone());
    });
  }, [pushRequest]);

  const crossfading = !!nextBase;

  const currentWithBrightness = useMemo(() => {
    if (!crossfading) return currentBase;
    return attachBrightnessAdjust(currentBase, 1);
  }, [crossfading, currentBase]);

  const nextWithBrightness = useMemo(() => {
    if (!nextBase) return null;
    return attachBrightnessAdjust(nextBase, 0);
  }, [nextBase]);

  const finishCrossfade = () => {
    if (!nextBase) return;
    setCurrentBase(nextBase);
    setNextBase(null);
    startTimeRef.current = null;
    progressRef.current = 0;
    onCrossfadeComplete?.();
  };

  return (
    <Canvas frameloop={frameloop}>
      {frameloop === "demand" && (
        <RenderingGate shouldRender={!store.playing} />
      )}
      <CameraControls />

      {crossfading && (
        <CrossfadeDriver
          active
          startTimeRef={startTimeRef}
          progressRef={progressRef}
          currentWithBrightness={currentWithBrightness}
          nextWithBrightness={nextWithBrightness}
          crossfadeDurationSeconds={crossfadeDurationSeconds}
          onDone={finishCrossfade}
        />
      )}

      {!crossfading && (
        <SingleBlockRenderPipeline
          autorun
          block={currentBase}
          setRenderTarget={setRenderTarget}
        />
      )}

      {crossfading && nextWithBrightness && (
        <VJCrossfadeRenderPipeline
          currentBlock={currentWithBrightness}
          nextBlock={nextWithBrightness}
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
            transmitData={transmitData}
            visible={displayMode === "canopySpace"}
          />
        </>
      )}
    </Canvas>
  );
});
