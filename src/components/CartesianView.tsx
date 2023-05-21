import { WebGLRenderTarget } from "three";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import vert from "@/src/shaders/default.vert";
import fromTexture from "@/src/shaders/fromTexture.frag";

type CartesianViewProps = {
  renderTarget: WebGLRenderTarget;
};

export const CartesianView = function CartesianView({
  renderTarget,
}: CartesianViewProps) {
  const outputMesh = useRef<THREE.Mesh>(null);
  const outputUniforms = useRef({ u_texture: { value: renderTarget.texture } });

  // render the cartesian view
  useFrame(({ gl, camera }) => {
    if (!outputMesh.current) return;

    gl.setRenderTarget(null);
    gl.render(outputMesh.current, camera);
  }, 1001);

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
};
