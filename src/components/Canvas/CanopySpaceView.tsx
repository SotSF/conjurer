import { WebGLRenderTarget, Mesh } from "three";
import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import vert from "@/src/shaders/default.vert";
import fromTextureToCanopySpace from "@/src/shaders/fromTextureToCanopySpace.frag";
import { observer } from "mobx-react-lite";
import { useStore } from "@/src/types/StoreContext";
import { useDataTransmission } from "@/src/hooks/dataTransmission";

type Props = {
  renderTarget: WebGLRenderTarget;
  transmitData: boolean;
  visible?: boolean;
};

export const CanopySpaceView = observer(function CanopySpaceView({
  renderTarget,
  transmitData,
  visible,
}: Props) {
  const store = useStore();
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

  // render the canopy space view
  useFrame(({ gl, camera }) => {
    if (!outputMesh.current || !visible) return;

    gl.setRenderTarget(null);
    gl.render(outputMesh.current, camera);
  }, 1000);

  useDataTransmission(outputMesh.current, transmitData);

  return (
    <mesh ref={outputMesh}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        uniforms={outputUniforms.current}
        fragmentShader={fromTextureToCanopySpace}
        vertexShader={vert}
      />
    </mesh>
  );
});
