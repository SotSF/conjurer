import { MutableRefObject, ReactNode, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'

import * as THREE from 'three'

import { ShaderSrc, Uniforms } from './ShaderTypes'
import { ShaderMesh } from './ShaderMesh'

/** `ShaderViewer` makes a canvas and starts rendering the shader passed to it. */
const ShaderViewer = ({shaderSrc}: {
    shaderSrc: ShaderSrc
    children?: ReactNode
}) => {
  const canvasRef = useRef<HTMLCanvasElement>() as MutableRefObject<HTMLCanvasElement>

  const [playing, setPlaying] = useState(true)
  const togglePlaying = () => setPlaying((s) => !s);

  const uniforms = useRef({
    u_time: { type: "f", value: 1.0 },
    u_resolution: { type: "v2", value: new THREE.Vector2(0, 0) },
    u_mouse: { type: "v2", value: new THREE.Vector2() },
  })

  return <div>
    <div style={{width:shaderSrc.width, height:shaderSrc.height}} onClick={togglePlaying}>
        <Canvas ref={canvasRef} >
          <ShaderMesh canvasRef={canvasRef} shaderSrc={shaderSrc} uniforms={uniforms} playing={playing}/>
        </Canvas>
    </div>
  </div>
}

export default ShaderViewer;