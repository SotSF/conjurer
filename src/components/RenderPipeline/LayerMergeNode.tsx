import vert from "@/src/shaders/default.vert";
import merge from "@/src/shaders/merge.frag";
import { WebGLRenderTarget } from "three";
import { useFrame } from "@react-three/fiber";
import { memo, useMemo, useRef } from "react";
import { BlockRenderNode } from "@/src/components/RenderPipeline/BlockRenderNode";
import { useStore } from "@/src/types/StoreContext";
import { Layer } from "@/src/types/Layer";
import { Block } from "@/src/types/Block";

type LayerMergeNodeProps = {
  priority: number;
  renderTargetIn1: WebGLRenderTarget;
  renderTargetIn2: WebGLRenderTarget;
  renderTargetOut: WebGLRenderTarget;
};

export const LayerMergeNode = memo(function LayerMergeNode({
  priority,
  renderTargetIn1,
  renderTargetIn2,
  renderTargetOut,
}: LayerMergeNodeProps) {
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
