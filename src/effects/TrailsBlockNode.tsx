import { PatternComponent } from "@/src/types/pattern/PatternBlockNode";
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useRenderTarget } from "@/src/hooks/renderTarget";

export const TrailsBlockNode: PatternComponent = ({
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

  const renderTargetA = useRenderTarget();
  const renderTargetB = useRenderTarget();

  const newUniforms = useRef({
    u_lastframetex: { value: renderTargetA.texture },
  });

  const frameIndexRef = useRef(0);

  useFrame(({ gl, camera }) => {
    if (!mesh.current) return;
    frameIndexRef.current++;

    const pingBuffer =
      frameIndexRef.current % 2 ? renderTargetA : renderTargetB;
    const pongBuffer =
      frameIndexRef.current % 2 ? renderTargetB : renderTargetA;

    newUniforms.current.u_lastframetex.value = pingBuffer.texture;

    gl.setRenderTarget(renderTargetOut);
    gl.render(mesh.current, camera);

    gl.setRenderTarget(pongBuffer);
    gl.render(mesh.current, camera);
  }, priority);

  return (
    <mesh ref={mesh}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        key={shaderMaterialKey}
        uniforms={{
          ...uniforms,
          ...newUniforms.current,
        }}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
      />
    </mesh>
  );
};
