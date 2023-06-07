import { WebGLRenderTarget } from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import vert from "@/src/shaders/default.vert";
import fromTexture from "@/src/shaders/fromTexture.frag";
import { useRenderTarget } from "@/src/hooks/renderTarget";
import { LED_COUNTS } from "@/src/utils/size";
import { observer } from "mobx-react-lite";
import { useStore } from "@/src/types/StoreContext";

type CartesianViewProps = {
  renderTarget: WebGLRenderTarget;
};

export const CartesianView = observer(function CartesianView({
  renderTarget,
}: CartesianViewProps) {
  const store = useStore();
  const outputMesh = useRef<THREE.Mesh>(null);
  const outputUniforms = useRef({ u_texture: { value: renderTarget.texture } });

  useEffect(() => {
    if (!outputUniforms.current) return;
    outputUniforms.current.u_texture.value = renderTarget.texture;
  }, [renderTarget.texture]);

  // render the cartesian view
  useFrame(({ gl, camera }) => {
    if (!outputMesh.current) return;

    gl.setRenderTarget(null);
    gl.render(outputMesh.current, camera);
  }, 1000);

  const finalRenderTarget = useRenderTarget({
    width: LED_COUNTS.x,
    height: LED_COUNTS.y,
  });

  const buffer = useMemo(
    () => new Uint8Array(LED_COUNTS.x * LED_COUNTS.y * 4),
    []
  );

  useFrame(({ gl, camera }) => {
    if (!outputMesh.current || !store.sendingData) return;

    gl.setRenderTarget(finalRenderTarget);
    gl.render(outputMesh.current, camera);

    gl.readRenderTargetPixels(
      finalRenderTarget,
      0,
      0,
      LED_COUNTS.x,
      LED_COUNTS.y,
      buffer
    );

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

  return (
    <mesh ref={outputMesh}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        uniforms={outputUniforms.current}
        fragmentShader={fromTexture}
        vertexShader={vert}
      />
    </mesh>
  );
});
