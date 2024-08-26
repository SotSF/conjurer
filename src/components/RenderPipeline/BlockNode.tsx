import { WebGLRenderTarget } from "three";
import { useFrame } from "@react-three/fiber";
import { memo, useRef } from "react";

type BlockNodeProps = {
  shaderMaterialKey?: string;
  uniforms?: any;
  vertexShader: string;
  fragmentShader: string;
  priority: number;
  renderTargetIn?: WebGLRenderTarget;
  renderTargetOut: WebGLRenderTarget;
};

export const BlockNode = memo(function BlockNode({
  shaderMaterialKey,
  uniforms = {},
  vertexShader,
  fragmentShader,
  priority,
  renderTargetIn,
  renderTargetOut,
}: BlockNodeProps) {
  const mesh = useRef<THREE.Mesh>(null);

  if (renderTargetIn) {
    uniforms.u_texture = { value: renderTargetIn.texture };
  }

  useFrame(({ gl, camera }) => {
    if (!mesh.current) return;

    gl.setRenderTarget(renderTargetOut);
    gl.render(mesh.current, camera);
  }, priority);

  return (
    <mesh ref={mesh}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        key={shaderMaterialKey}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
      />
    </mesh>
  );
});
