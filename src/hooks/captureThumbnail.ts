import { Mesh } from "three";
import { useFrame } from "@react-three/fiber";
import { useRenderTarget } from "@/src/hooks/renderTarget";
import { useStore } from "@/src/types/StoreContext";
import { runInAction } from "mobx";
import { useToast } from "@chakra-ui/react";
import { useSaveExperience } from "@/src/hooks/experience";

export const useCaptureThumbnail = (mesh: { current: Mesh | null }) => {
  const store = useStore();
  const { uiStore } = store;

  const toast = useToast();
  const { saveExperience } = useSaveExperience();

  const thumbnailRenderTarget = useRenderTarget(64, 64);
  const buffer = new Uint8Array(64 * 64 * 4);
  useFrame(({ gl, camera }) => {
    if (!mesh.current || !uiStore.capturingThumbnail) return;

    gl.setRenderTarget(thumbnailRenderTarget);
    gl.render(mesh.current, camera);

    gl.readRenderTargetPixels(thumbnailRenderTarget, 0, 0, 64, 64, buffer);

    // Generate image via data url
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const context = canvas.getContext("2d")!;
    // Copy the pixels to a 2D canvas
    const imageData = context.createImageData(64, 64);
    imageData.data.set(buffer);
    context.putImageData(imageData, 0, 0);
    const dataURL = canvas.toDataURL();

    runInAction(() => {
      uiStore.capturingThumbnail = false;
      store.experienceThumbnailURL = dataURL;
    });

    toast({
      title: "Thumbnail updated",
      status: "info",
      duration: 2000,
    });
    saveExperience({ id: store.experienceId, name: store.experienceName });
  }, 10000);
};
