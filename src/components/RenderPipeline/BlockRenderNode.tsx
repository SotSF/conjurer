import { WebGLRenderTarget } from "three";
import { useFrame } from "@react-three/fiber";
import { memo, useRef } from "react";
import vert from "@/src/shaders/default.vert";

type BlockRenderNodeProps = {
  shaderMaterialKey?: string;
  uniforms?: any;
  fragmentShader?: string;
  priority: number;
  renderTargetIn?: WebGLRenderTarget;
  renderTargetOut: WebGLRenderTarget;
};

export const BlockRenderNode = memo(function BlockRenderNode({
  shaderMaterialKey,
  uniforms = {},
  fragmentShader = "void main() { gl_FragColor = vec4(1.0); }",
  priority,
  renderTargetIn,
  renderTargetOut,
}: BlockRenderNodeProps) {
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
        vertexShader={vert}
        fragmentShader={fragmentShader}
      />
    </mesh>
  );
});
