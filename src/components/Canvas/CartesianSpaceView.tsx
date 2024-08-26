import { WebGLRenderTarget, Mesh } from "three";
import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import fromTexture from "@/src/shaders/fromTexture.frag";
import { observer } from "mobx-react-lite";
import { useStore } from "@/src/types/StoreContext";
import { makeVertexShader } from "@/src/shaders/vertexShader";

type Props = {
  renderTarget: WebGLRenderTarget;
  visible?: boolean;
};

export const CartesianSpaceView = observer(function CartesianSpaceView({
  renderTarget,
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

  // render the cartesian space view
  useFrame(({ gl, camera }) => {
    if (!outputMesh.current || !visible) return;

    gl.setRenderTarget(null);
    gl.render(outputMesh.current, camera);
  }, 1000);

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
