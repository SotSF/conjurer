import { MutableRefObject, useEffect, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { defaultVertexShader, defaultFragmentShader } from './ShaderDefaults';
import { ShaderSrc, Uniforms } from './ShaderTypes';

export type ShaderMeshProps = {
    canvasRef: MutableRefObject<HTMLCanvasElement>
    shaderSrc: ShaderSrc
    uniforms: MutableRefObject<Uniforms>
    playing: boolean
}

/** `ShaderMesh` is a component that renders a shader. It fetches a frag shader
 * from `shaderSrc.src` and while `playing` is true, renders the shader in a
 * loop.
 * 
 * Automatically updates resolution, mouse, and time uniforms.*/
export function ShaderMesh(props: ShaderMeshProps) {
  const mesh = useRef(null);
  const [shader, setShader] = useState(defaultFragmentShader);

  const canvasRef = props.canvasRef.current;
  const uniforms = props.uniforms;
  const gl = useThree((state) => state.gl);

  // On mount, set up the resolution uniform and fetch the shader.
  useEffect(() => {
    uniforms.current.u_resolution.value.set(canvasRef.clientWidth, canvasRef.clientHeight);
    fetch(props.shaderSrc.src)
      .then((r) => (r.text()))
      .then((t) => {
        setShader(t);
      })
      // TODO: do something more useful on error
      .catch((e) => console.log("Got an error", e));
  });

  // On mount, set up listener for resize, in case our canvas needs to change.
  useEffect(() => {
    const resizeListener = () => {
      uniforms.current.u_resolution.value.set(canvasRef.clientWidth, canvasRef.clientHeight);
    };
    window.addEventListener('resize', resizeListener);
    return () => window.removeEventListener('resize', resizeListener);
  });

  // On mount, set up mouse listener for updating uniforms
  useEffect(() => {
    const mousemoveListener = (e: MouseEvent) => {
      const x = e.offsetX;
      const y = canvasRef.clientHeight - e.offsetY;
      uniforms.current.u_mouse.value.set(x, y);
    }
    gl.domElement.addEventListener("mousemove", mousemoveListener);
    return () => window.removeEventListener("mousemove", mousemoveListener)
  });

  // Subscribe this component to the render-loop
  useFrame(({ gl, scene, camera }, delta) => {
    if (props.playing) {
      uniforms.current.u_time.value += delta;
      gl.render(scene, camera);
    }
  });

  return (
    <mesh {...props} ref={mesh}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        vertexShader={defaultVertexShader}
        fragmentShader={shader}
        uniforms={uniforms.current}
        onUpdate={(a) => {
          // Hack: the material doesn't seem to update when i change the shader.
          // Should only get called twice.
          a.needsUpdate = true;
        }} />
    </mesh>
  );
}
