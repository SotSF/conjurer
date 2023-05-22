import vert from "@/src/shaders/default.vert";
import merge from "@/src/shaders/merge.frag";
import { WebGLRenderTarget } from "three";
import { useFrame } from "@react-three/fiber";
import { memo, useMemo, useRef } from "react";

type MergeNodeProps = {
  priority: number;
  renderTargetIn1: WebGLRenderTarget;
  renderTargetIn2: WebGLRenderTarget;
  renderTargetOut: WebGLRenderTarget;
};

export const MergeNode = memo(function MergeNode({
  priority,
  renderTargetIn1,
  renderTargetIn2,
  renderTargetOut,
}: MergeNodeProps) {
  const mesh = useRef<THREE.Mesh>(null);
  const uniforms = useMemo(
    () => ({
      u_alpha1: { value: 0.5 },
      u_alpha2: { value: 0.5 },
      u_texture1: { value: renderTargetIn1.texture },
      u_texture2: { value: renderTargetIn2.texture },
    }),
    [renderTargetIn1, renderTargetIn2]
  );

  useFrame(({ gl, camera }) => {
    if (!mesh.current) return;

    gl.setRenderTarget(renderTargetOut);
    gl.render(mesh.current, camera);
  }, priority);

  return (
    <mesh ref={mesh}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={vert}
        fragmentShader={merge}
      />
    </mesh>
  );
});
