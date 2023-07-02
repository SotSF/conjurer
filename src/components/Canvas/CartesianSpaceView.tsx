import { WebGLRenderTarget, Mesh } from "three";
import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import vert from "@/src/shaders/default.vert";
import fromTexture from "@/src/shaders/fromTexture.frag";
import { observer } from "mobx-react-lite";
import { useStore } from "@/src/types/StoreContext";
import cartesianSpace from "@/src/shaders/cartesianSpace.frag";

type Props = {
  renderTarget: WebGLRenderTarget;
};

export const CartesianSpaceView = observer(function CartesianSpaceView({
  renderTarget,
}: Props) {
  const store = useStore();
  const { uiStore } = store;
  const outputMesh = useRef<Mesh>(null);
  const outputUniforms = useRef({
    u_texture: { value: renderTarget.texture },
    u_cartesianness: { value: 1 },
  });

  useEffect(() => {
    if (!outputUniforms.current) return;
    outputUniforms.current.u_texture.value = renderTarget.texture;
  }, [renderTarget.texture]);

  // TODO: implement global intensity

  // render the cartesian space view
  useFrame(({ gl, camera }) => {
    if (!outputMesh.current || uiStore.displayMode !== "cartesianSpace") return;

    gl.setRenderTarget(null);
    gl.render(outputMesh.current, camera);
  }, 1000);

  return (
    <mesh ref={outputMesh}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        uniforms={outputUniforms.current}
        fragmentShader={cartesianSpace}
        vertexShader={vert}
      />
    </mesh>
  );
});
