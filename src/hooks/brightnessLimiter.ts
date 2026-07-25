import { Mesh } from "three";
import { useFrame } from "@react-three/fiber";
import { MutableRefObject, useRef } from "react";
import { useRenderTarget } from "@/src/hooks/renderTarget";
import { LED_COUNTS } from "@/src/utils/size";
import { useStore } from "@/src/types/StoreContext";
import { runInAction } from "mobx";
import {
  averageCanopyLuminance,
  updateBrightnessLimiterGain,
} from "@/src/utils/brightnessLimiter";

type LimiterUniforms = {
  u_limiterGain: { value: number };
};

/**
 * Measures average canopy-space luminance at LED resolution (dry: intensity on,
 * limiter off), updates the gain-reduction envelope, and writes u_limiterGain.
 *
 * `enabled` selects which CanopySpaceView owns analysis (same ownership as
 * data transmission), so playground vs experience editor do not fight.
 */
export const useBrightnessLimiter = (
  mesh: Mesh | null,
  uniforms: MutableRefObject<LimiterUniforms>,
  enabled: boolean,
) => {
  const store = useStore();
  const analysisTarget = useRenderTarget(LED_COUNTS.x, LED_COUNTS.y);
  const pixels = useRef(new Uint8Array(LED_COUNTS.x * LED_COUNTS.y * 4));
  const gainRef = useRef(store.brightnessLimiterGain);
  const lastTimeRef = useRef<number | null>(null);

  useFrame(({ gl, camera, clock }) => {
    // Only the active canopy-space output owns analysis / envelope updates.
    if (!mesh || !enabled) {
      lastTimeRef.current = null;
      return;
    }

    if (!store.brightnessLimiterEnabled) {
      gainRef.current = 1;
      uniforms.current.u_limiterGain.value = 1;
      if (store.brightnessLimiterGain !== 1) {
        runInAction(() => {
          store.brightnessLimiterGain = 1;
        });
      }
      lastTimeRef.current = clock.elapsedTime;
      return;
    }

    const elapsed = clock.elapsedTime;
    const dt =
      lastTimeRef.current === null
        ? 0
        : Math.min(elapsed - lastTimeRef.current, 0.1);
    lastTimeRef.current = elapsed;

    // Dry analysis pass: intensity applied in shader, limiter bypassed.
    uniforms.current.u_limiterGain.value = 1;
    gl.setRenderTarget(analysisTarget);
    gl.render(mesh, camera);
    gl.readRenderTargetPixels(
      analysisTarget,
      0,
      0,
      LED_COUNTS.x,
      LED_COUNTS.y,
      pixels.current,
    );

    const averageLuma = averageCanopyLuminance(pixels.current);
    const nextGain = updateBrightnessLimiterGain(
      gainRef.current,
      averageLuma,
      store.brightnessLimiterThreshold,
      store.brightnessLimiterReleaseSec,
      dt,
    );
    gainRef.current = nextGain;
    uniforms.current.u_limiterGain.value = nextGain;

    if (store.brightnessLimiterGain !== nextGain) {
      runInAction(() => {
        store.brightnessLimiterGain = nextGain;
      });
    }
  }, 900);
};
