import {
  BufferAttribute,
  BufferGeometry,
  Scene,
  WebGLRenderTarget,
  ShaderChunk,
} from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import canopyVert from "@/src/shaders/canopy.vert";
import fromTextureWithIntensity from "@/src/shaders/fromTextureWithIntensity.frag";
import conjurerCommon from "@/src/shaders/conjurer_common.frag";
import canopyGeometry from "@/src/data/canopyGeometry.json";
import {
  BloomEffect,
  EffectComposer,
  EffectPass,
  RenderPass,
} from "postprocessing";

type CanopyViewProps = {
  renderTarget: WebGLRenderTarget;
};

export const Canopy = function Canopy({ renderTarget }: CanopyViewProps) {
  const { gl, camera } = useThree();
  const scene = useRef<Scene>(null);

  const canopyUniforms = useRef({
    u_view_vector: { value: camera.position },
    u_texture: { value: renderTarget.texture },
  });

  const bufferGeometry = useMemo(() => {
    const geometry = new BufferGeometry();
    geometry.setAttribute(
      "position",
      new BufferAttribute(new Float32Array(canopyGeometry.position), 3)
    );
    geometry.setAttribute(
      "uv",
      new BufferAttribute(new Float32Array(canopyGeometry.uv), 2)
    );
    geometry.setAttribute(
      "normal",
      new BufferAttribute(new Float32Array(canopyGeometry.normal), 3)
    );
    return geometry;
  }, []);

  // build an EffectComposer with imperative style three js because of shortcomings of
  // Drei <EffectComposer> (lack of render priority, ability to specify scene/singular mesh to render)
  const effectComposer = useMemo(() => {
    const effectComposer = new EffectComposer(gl);
    effectComposer.setSize(
      gl.domElement.clientWidth,
      gl.domElement.clientHeight
    );

    // This enables `#include <conjurer_common>`
    ShaderChunk.conjurer_common = conjurerCommon;

    return effectComposer;
  }, [gl]);

  useEffect(() => {
    if (!scene.current) return;

    effectComposer.addPass(new RenderPass(scene.current, camera));
    effectComposer.addPass(
      new EffectPass(
        camera,
        new BloomEffect({
          luminanceThreshold: 0.001,
          intensity: 0.2,
        })
      )
    );
  }, [effectComposer, camera]);

  // render the effect composer, including the canopy render pass and bloom effect
  useFrame(() => effectComposer.render(), 1000);

  return (
    <scene ref={scene}>
      <points>
        <primitive attach="geometry" object={bufferGeometry} />
        <shaderMaterial
          uniforms={canopyUniforms.current}
          fragmentShader={fromTextureWithIntensity}
          vertexShader={canopyVert}
        />
      </points>
    </scene>
  );
};
