import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { WebGLRenderTarget } from "three";
import type { ParamMap } from "@/src/params/shared/patternParam";
import type { Pattern } from "@/src/types/Pattern";

export type PatternComponent = React.FC<{
  pattern: Pattern<ParamMap>;
  priority: number;
  renderTargetIn?: WebGLRenderTarget;
  renderTargetOut: WebGLRenderTarget;
  shaderMaterialKey?: string;
}>;

export const PatternBlockNode: PatternComponent = ({
  pattern,
  priority,
  renderTargetIn,
  renderTargetOut,
  shaderMaterialKey,
}) => {
  const mesh = useRef<THREE.Mesh>(null);

  const uniforms = pattern.params;
  const vertexShader = pattern.vertexShader;
  const fragmentShader = pattern.fragmentShader;

  if (renderTargetIn) {
    uniforms.u_texture.value = renderTargetIn.texture;
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
};
