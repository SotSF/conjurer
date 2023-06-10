import { useStore } from "@/src/types/StoreContext";
import { useCallback } from "react";
import styles from "@/styles/CloneCanvas.module.css";

export const useCloneCanvas = (clonedWaveformRef: {
  current: HTMLDivElement | null;
}) => {
  const { uiStore } = useStore();

  return useCallback(() => {
    if (!clonedWaveformRef.current || !uiStore.showingWaveformOverlay) return;

    const shadowRoot = document.querySelector("#waveform div")?.shadowRoot;
    const sourceCanvases = shadowRoot?.querySelectorAll(
      ".canvases canvas"
    ) as NodeListOf<HTMLCanvasElement>;

    if (!sourceCanvases || sourceCanvases.length === 0) return;

    const destinationCanvases = [];
    for (const sourceCanvas of sourceCanvases) {
      const destinationCanvas = document.createElement("canvas");
      destinationCanvas.width = sourceCanvas.width;
      destinationCanvas.height = sourceCanvas.height;
      destinationCanvas.classList.add(styles.waveformClone);
      destinationCanvas.style.left = sourceCanvas.style.left;
      destinationCanvas.style.width = sourceCanvas.style.width;
      const destCtx = destinationCanvas.getContext("2d")!;
      destCtx.drawImage(sourceCanvas, 0, 0);
      destinationCanvases.push(destinationCanvas);
    }

    const destinationContainer = clonedWaveformRef.current;
    destinationContainer.replaceChildren(...destinationCanvases);
  }, [clonedWaveformRef, uiStore.showingWaveformOverlay]);
};
