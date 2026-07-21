import { WebGLRenderTarget } from "three";
import { useFrame } from "@react-three/fiber";
import { memo, useRef } from "react";
import { ParamMap } from "@/src/types/PatternParams";
import { Pattern } from "@/src/types/Pattern";

export const PatternRender = (pattern: Pattern<ParamMap>) =>
  function PatternBlockNode({
    priority,
    renderTargetOut,
    shaderMaterialKey,
  }: {
    priority: number;
    renderTargetOut: WebGLRenderTarget;
    shaderMaterialKey?: string;
  }) {
    const mesh = useRef<THREE.Mesh>(null);

    const uniforms = pattern.params;
    const vertexShader = pattern.vertexShader;
    const fragmentShader = pattern.fragmentShader;

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
  };
