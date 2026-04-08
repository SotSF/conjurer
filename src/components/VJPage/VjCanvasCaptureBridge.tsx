import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
import type { MutableRefObject } from "react";
import type { WebGLRenderTarget } from "three";

import { captureRenderTargetToDataUrl } from "@/src/utils/captureRenderTargetToDataUrl";

type Props = {
  renderTarget: WebGLRenderTarget | null;
  captureFnRef: MutableRefObject<(() => string | null) | null>;
};

/** Registers a function that snapshots the current pipeline render target as a PNG data URL. */
export function VjCanvasCaptureBridge({
  renderTarget,
  captureFnRef,
}: Props) {
  const gl = useThree((s) => s.gl);

  useEffect(() => {
    captureFnRef.current = () => captureRenderTargetToDataUrl(gl, renderTarget);
    return () => {
      captureFnRef.current = null;
    };
  }, [gl, renderTarget, captureFnRef]);

  return null;
}
