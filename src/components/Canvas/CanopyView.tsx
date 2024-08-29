import {
  BufferAttribute,
  BufferGeometry,
  Scene,
  WebGLRenderTarget,
} from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import canopyVert from "@/src/shaders/canopy.vert";
import fromTextureCircularMask from "@/src/shaders/fromTextureCircularMask.frag";
import {
  BloomEffect,
  EffectComposer,
  EffectPass,
  RenderPass,
} from "postprocessing";
import { CanopyGeometry } from "@/src/types/CanopyGeometry";

type CanopyProps = { renderTarget: WebGLRenderTarget };

export const Canopy = function Canopy({ renderTarget }: CanopyProps) {
  const [canopyGeometry, setCanopyGeometry] = useState<CanopyGeometry>();
  useEffect(() => {
    // Lazy load the canopy geometry
    import("@/src/data/canopyGeometry.json").then((data) =>
      setCanopyGeometry(data)
    );
  }, []);
  if (!canopyGeometry) return null;
  return (
    <CanopyView renderTarget={renderTarget} canopyGeometry={canopyGeometry} />
  );
};

type CanopyViewProps = {
  renderTarget: WebGLRenderTarget;
  canopyGeometry: CanopyGeometry;
};

const CanopyView = function CanopyView({
  renderTarget,
  canopyGeometry,
}: CanopyViewProps) {
  const { gl, camera } = useThree();
  const scene = useRef<Scene>(null);

  const canopyUniforms = useRef({
    u_view_vector: { value: camera.position },
    u_texture: { value: renderTarget.texture },
  });

  useEffect(() => {
    if (!canopyUniforms.current) return;
    canopyUniforms.current.u_texture.value = renderTarget.texture;
  }, [renderTarget.texture]);

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
  }, [canopyGeometry]);

  // build an EffectComposer with imperative style three js because of shortcomings of
  // Drei <EffectComposer> (lack of render priority, ability to specify scene/singular mesh to render)
  const effectComposer = useMemo(() => {
    const effectComposer = new EffectComposer(gl);
    effectComposer.setSize(
      gl.domElement.clientWidth,
      gl.domElement.clientHeight
    );

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
          intensity: 0.7,
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
          fragmentShader={fromTextureCircularMask}
          vertexShader={canopyVert}
        />
      </points>
    </scene>
  );
};
