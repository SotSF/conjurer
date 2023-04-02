import { MutableRefObject, useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { defaultFragmentShader } from './ShaderDefaults';
import { ShaderSrc, Uniforms } from './ShaderTypes';
import { BufferAttribute, BufferGeometry, DoubleSide, DynamicDrawUsage, Float32BufferAttribute, TextureLoader } from 'three';

import { OrbitControls, Stats } from "@react-three/drei";


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
  const {gl, camera} = useThree();

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
      // (boxRef.current as Mesh).rotation.x += 0.005;
      // (boxRef.current as Mesh).rotation.y += 0.01;
      gl.render(scene, camera);
    }
  });

  return (
    <>
      <Stars i={350} j={350} />
      <OrbitControls />
      <Stats />
    </>
  )
}

function BufferPoints({ count = 1000 }) {
  const points = useMemo(() => {
    const p = new Array(count).fill(0).map((v) => (0.5 - Math.random()) * 7.5);
    return new BufferAttribute(new Float32Array(p), 3);
  }, [count]);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach={"attributes-position"} {...points} />
      </bufferGeometry>
      <pointsMaterial
        size={0.1}
        // threshold={0.1}
        alphaTest={0.1}
        opacity={1.0}
        color={0xff00ff}
        sizeAttenuation={true}
      />
    </points>
  );
}


const Stars = ({ i, j }: {i: number, j: number}) => {
  const geometry = new BufferGeometry();
  const vertices = [];

  const sprite = new TextureLoader().load("/star.png");

  for (let count = 0; count < 10000; count++) {
    const x = 2000 * Math.random() - 1000;
    const y = 2000 * Math.random() - 1000;
    const z = 2000 * Math.random() - 1000;

    vertices.push(x, y, z);
  }

  geometry.setAttribute(
    "position",
    new Float32BufferAttribute(vertices, 3)
  );

  return (
    <points args={[geometry]}>
      <pointsMaterial
        size={35}
        sizeAttenuation={true}
        // map={sprite}
        color={0xff00ff}
        opacity={1.0}
        alphaTest={0.5}
        transparent={false}
      />
    </points>
  );
};
