import { MutableRefObject, ReactNode, useEffect, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'

import * as THREE from 'three'

import { defaultVertexShader, defaultFragmentShader } from './ShaderDefaults'
import { ShaderSrc, Uniforms } from './ShaderTypes'

type ShaderMeshProps = {
    canvasRef: MutableRefObject<HTMLCanvasElement>
    shaderSrc: ShaderSrc
    uniforms: MutableRefObject<Uniforms>
}

function ShaderMesh(props: ShaderMeshProps) {
  // This reference will give us direct access to the mesh
  const mesh = useRef(null)
  const [shader, setShader] = useState(defaultFragmentShader)

  const canvasRef = props.canvasRef.current

  const uniforms = props.uniforms

  useEffect(() => {
    uniforms.current.u_resolution.value.set(canvasRef.clientWidth, canvasRef.clientHeight)
    fetch(props.shaderSrc.src)
      .then((r) => (r.text()))
      .then((t) => {
        setShader(t)
      })
  }, [])

  const gl = useThree((state) => state.gl)

  useEffect(() => {
    const resizeListener = () => {
      uniforms.current.u_resolution.value.set(canvasRef.clientWidth, canvasRef.clientHeight)
    }
    window.addEventListener('resize', resizeListener)

    gl.domElement.addEventListener("mousemove", (e) => {
      const x = e.offsetX
      const y = canvasRef.clientHeight - e.offsetY
      uniforms.current.u_mouse.value.set(x, y)
    })

    return () => {
      window.removeEventListener('resize', resizeListener)
    }

  }, [])

  // Subscribe this component to the render-loop
  useFrame(({gl, scene, camera}, delta) => {
    uniforms.current.u_time.value += delta
    gl.render(scene, camera)
  }, 1)
   
  return (
    <mesh {...props} ref={mesh}>
      <planeBufferGeometry args={[2,3]} />
      <shaderMaterial
        vertexShader={defaultVertexShader}
        fragmentShader={shader}
        uniforms={uniforms.current}
        onUpdate={(a)=>{
          // Hack: the material doesn't seem to update when i change the shader.
          // Should only get called twice.
          a.needsUpdate=true
        }}
        />
    </mesh>
  )
}

const ShaderViewer = ({shaderSrc}: {
    shaderSrc: ShaderSrc
    children?: ReactNode
}) => {
  const canvasRef = useRef<HTMLCanvasElement>() as MutableRefObject<HTMLCanvasElement>
  const paneRef = useRef(null)

  const uniforms = useRef({
    u_time: { type: "f", value: 1.0 },
    u_resolution: { type: "v2", value: new THREE.Vector2(0, 0) },
    u_mouse: { type: "v2", value: new THREE.Vector2() },
  })

  return <div>
    <div ref={paneRef}>
      <div >
        <Canvas ref={canvasRef} style={{width:shaderSrc.width, height:shaderSrc.height}}>
          <ShaderMesh canvasRef={canvasRef} shaderSrc={shaderSrc} uniforms={uniforms}/>
        </Canvas>
      </div>
    </div>
  </div>
}

export default ShaderViewer;