import merge from "@/src/shaders/merge.frag";
import { WebGLRenderTarget } from "three";
import { useFrame } from "@react-three/fiber";
import { memo, useRef } from "react";
import { makeVertexShader } from "@/src/shaders/vertexShader";

type MergeNodeProps = {
  priority: number;
  renderTargetIn1: WebGLRenderTarget;
  renderTargetIn2: WebGLRenderTarget;
  renderTargetOut: WebGLRenderTarget;
  // per-frame opacity of each input, defaulting to fully opaque. Evaluated in
  // the render loop rather than passed as a value since opacity varies with
  // playback time.
  getOpacityIn1?: () => number;
  getOpacityIn2?: () => number;
};

export const MergeNode = memo(function MergeNode({
  priority,
  renderTargetIn1,
  renderTargetIn2,
  renderTargetOut,
  getOpacityIn1,
  getOpacityIn2,
}: MergeNodeProps) {
  const mesh = useRef<THREE.Mesh>(null);

  // three.js only reads this object at material construction, so it must keep
  // a stable identity; the values are refreshed each frame below, since the
  // pipeline swaps this node's render targets as the number of active
  // blocks/layers changes and opacities vary with playback time
  const uniforms = useRef({
    u_texture1: { value: renderTargetIn1.texture },
    u_texture2: { value: renderTargetIn2.texture },
    u_opacity1: { value: 1 },
    u_opacity2: { value: 1 },
  });

  useFrame(({ gl, camera }) => {
    if (!mesh.current) return;

    uniforms.current.u_texture1.value = renderTargetIn1.texture;
    uniforms.current.u_texture2.value = renderTargetIn2.texture;
    uniforms.current.u_opacity1.value = getOpacityIn1?.() ?? 1;
    uniforms.current.u_opacity2.value = getOpacityIn2?.() ?? 1;

    gl.setRenderTarget(renderTargetOut);
    gl.render(mesh.current, camera);
  }, priority);

  return (
    <mesh ref={mesh}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        uniforms={uniforms.current}
        vertexShader={makeVertexShader(["v_normalized_uv"])}
        fragmentShader={merge}
      />
    </mesh>
  );
});
