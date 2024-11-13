import { Mesh } from "three";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { useRenderTarget } from "@/src/hooks/renderTarget";
import { LED_COUNTS } from "@/src/utils/size";
import { useStore } from "@/src/types/StoreContext";
import {
  UNITY_APP_WEBSOCKET_HOST,
  UNITY_APP_WEBSOCKET_PORT,
} from "@/src/websocket/websocketHost";
import { action, runInAction } from "mobx";
import { useToast } from "@chakra-ui/react";

export const useDataTransmission = (mesh: Mesh | null, enabled: boolean) => {
  const store = useStore();
  const { sendingData } = store;

  const toast = useToast();

  const canTransmitData =
    process.env.NEXT_PUBLIC_NODE_ENV !== "production" && sendingData;

  const websocket = useMemo(() => {
    if (!canTransmitData) return;

    const ws = new WebSocket(
      `ws://${UNITY_APP_WEBSOCKET_HOST}:${UNITY_APP_WEBSOCKET_PORT}`
    );
    ws.binaryType = "arraybuffer";

    ws.onopen = action(() => {
      toast({
        title: `Connected to Unity websocket server at ${UNITY_APP_WEBSOCKET_HOST}:${UNITY_APP_WEBSOCKET_PORT}`,

        status: "success",
        duration: 3_000,
        isClosable: true,
      });
    });
    ws.onerror = action((e) => {
      toast({
        title: `Failed to connect to Unity websocket server at ${UNITY_APP_WEBSOCKET_HOST}:${UNITY_APP_WEBSOCKET_PORT}`,
        status: "error",
        duration: 10_000,
        isClosable: true,
      });
      console.error("Websocket error", e);
      store.sendingData = false;
    });
    return ws;
  }, [store, canTransmitData, toast]);

  const lastWarned = useRef(0);
  const transmitData = (data: Uint8Array) => {
    if (!canTransmitData) return;

    if (!websocket) {
      runInAction(() => (store.sendingData = false));
      return;
    }

    if (websocket.readyState !== websocket.OPEN) {
      if (websocket.readyState === websocket.CONNECTING) return;

      if (Date.now() - lastWarned.current > 5000) {
        console.warn("Websocket not open, not sending data");
        lastWarned.current = Date.now();
      }
      return;
    }

    websocket.send(data.buffer);
  };

  const finalRenderTarget = useRenderTarget(LED_COUNTS.x, LED_COUNTS.y);
  const arrayBuffer = useRef(new Uint8Array(LED_COUNTS.x * LED_COUNTS.y * 4));

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
      arrayBuffer.current
    );

    transmitData(arrayBuffer.current);

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
