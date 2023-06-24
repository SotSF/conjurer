import { WebGLRenderTarget, Mesh } from "three";
import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import vert from "@/src/shaders/default.vert";
import fromTexture from "@/src/shaders/fromTexture.frag";
import { observer } from "mobx-react-lite";
import { useStore } from "@/src/types/StoreContext";
import { useDataTransmission } from "@/src/hooks/dataTransmission";

type Props = {
  renderTarget: WebGLRenderTarget;
};

export const CartesianView = observer(function CartesianView({
  renderTarget,
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

  // render the cartesian view
  useFrame(({ gl, camera }) => {
    if (!outputMesh.current || uiStore.displayingCanopy) return;

    gl.setRenderTarget(null);
    gl.render(outputMesh.current, camera);
  }, 1000);

  useDataTransmission(outputMesh.current);

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
