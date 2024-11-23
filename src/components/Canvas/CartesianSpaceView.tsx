import { WebGLRenderTarget, Mesh } from "three";
import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import fromTexture from "@/src/shaders/fromTexture.frag";
import { observer } from "mobx-react-lite";
import { useStore } from "@/src/types/StoreContext";
import { makeVertexShader } from "@/src/shaders/vertexShader";
import { useRenderTarget } from "@/src/hooks/renderTarget";
import { runInAction } from "mobx";

type Props = {
  renderTarget: WebGLRenderTarget;
  visible?: boolean;
};

export const CartesianSpaceView = observer(function CartesianSpaceView({
  renderTarget,
  visible,
}: Props) {
  const store = useStore();
  const { uiStore } = store;
  const outputMesh = useRef<Mesh>(null);
  const outputUniforms = useRef({
    u_texture: { value: renderTarget.texture },
    u_intensity: { value: 1 },
  });

  useEffect(() => {
    if (!outputUniforms.current) return;
    outputUniforms.current.u_texture.value = renderTarget.texture;
  }, [renderTarget.texture]);

  useEffect(() => {
    if (!outputUniforms.current) return;
    outputUniforms.current.u_intensity.value = store.globalIntensity;
  }, [store.globalIntensity]);

  // render the cartesian space view
  useFrame(({ gl, camera }) => {
    if (!outputMesh.current || !visible) return;

    gl.setRenderTarget(null);
    gl.render(outputMesh.current, camera);
  }, 1000);

  // capture the thumbnail
  const thumbnailRenderTarget = useRenderTarget(64, 64);
  const buffer = new Uint8Array(64 * 64 * 4);
  useFrame(({ gl, camera }) => {
    if (!outputMesh.current || !uiStore.capturingThumbnail) return;

    gl.setRenderTarget(thumbnailRenderTarget);
    gl.render(outputMesh.current, camera);

    gl.readRenderTargetPixels(thumbnailRenderTarget, 0, 0, 64, 64, buffer);

    // TODO: toast message reporting successful and reminding to save
    // Generate image via data url
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const context = canvas.getContext("2d")!;
    // Copy the pixels to a 2D canvas
    const imageData = context.createImageData(64, 64);
    console.log(buffer);
    imageData.data.set(buffer);
    context.putImageData(imageData, 0, 0);
    const dataURL = canvas.toDataURL();

    runInAction(() => {
      uiStore.capturingThumbnail = false;
      store.experienceThumbnailURL = dataURL;
    });
  }, 10000);

  return (
    <mesh ref={outputMesh}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        uniforms={outputUniforms.current}
        fragmentShader={fromTexture}
        vertexShader={makeVertexShader()}
      />
    </mesh>
  );
});
