import merge from "@/src/shaders/merge.frag";
import { WebGLRenderTarget } from "three";
import { useFrame } from "@react-three/fiber";
import { memo, useMemo, useRef } from "react";
import { PatternParam } from "@/src/types/PatternParams";
import { makeVertexShader } from "@/src/shaders/vertexShader";

type MergeNodeProps = {
  priority: number;
  renderTargetIn1: WebGLRenderTarget;
  opacity1: PatternParam<number>;
  renderTargetIn2: WebGLRenderTarget;
  opacity2: PatternParam<number>;
  renderTargetOut: WebGLRenderTarget;
};

export const MergeNode = memo(function MergeNode({
  priority,
  renderTargetIn1,
  opacity1,
  renderTargetIn2,
  opacity2,
  renderTargetOut,
}: MergeNodeProps) {
  const mesh = useRef<THREE.Mesh>(null);
  const uniforms = useMemo(
    () => ({
      u_alpha1: opacity1,
      u_alpha2: opacity2,
      u_texture1: { value: renderTargetIn1.texture },
      u_texture2: { value: renderTargetIn2.texture },
    }),
    [renderTargetIn1, opacity1, renderTargetIn2, opacity2]
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
        vertexShader={makeVertexShader(["v_normalized_uv"])}
        fragmentShader={merge}
      />
    </mesh>
  );
});
