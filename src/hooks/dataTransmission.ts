import { Mesh } from "three";
import { useFrame } from "@react-three/fiber";
import { useMemo } from "react";
import { useRenderTarget } from "@/src/hooks/renderTarget";
import { LED_COUNTS } from "@/src/utils/size";
import { useStore } from "@/src/types/StoreContext";
import { transmitData } from "@/src/utils/unityWebsocket";

export const useDataTransmission = (mesh: Mesh | null, enabled: boolean) => {
  const { sendingData } = useStore();

  const finalRenderTarget = useRenderTarget(LED_COUNTS.x, LED_COUNTS.y);

  const arrayBuffer = useMemo(
    () => new Uint8Array(LED_COUNTS.x * LED_COUNTS.y * 4),
    []
  );

  useFrame(({ gl, camera }) => {
    if (!mesh || !sendingData || !enabled) return;

    gl.setRenderTarget(finalRenderTarget);
    gl.render(mesh, camera);

    gl.readRenderTargetPixels(
      finalRenderTarget,
      0,
      0,
      LED_COUNTS.x,
      LED_COUNTS.y,
      arrayBuffer
    );

    transmitData(arrayBuffer);

    // // View image via data url
    // // Create a 2D canvas to store the result
    // const canvas = document.createElement("canvas");
    // canvas.width = LED_COUNTS.x;
    // canvas.height = LED_COUNTS.y;
    // const context = canvas.getContext("2d")!;
    // // Copy the pixels to a 2D canvas
    // const imageData = context.createImageData(LED_COUNTS.x, LED_COUNTS.y);
    // imageData.data.set(buffer);
    // context.putImageData(imageData, 0, 0);
    // console.log(canvas.toDataURL());
  }, 10000);
};
