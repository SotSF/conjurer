import { Canvas, extend, useFrame, useThree } from "@react-three/fiber";
import { MutableRefObject, ReactNode, RefObject, useEffect, useMemo, useRef, useState } from "react";
import { BufferGeometry, Float32BufferAttribute, Mesh, OrthographicCamera, ShaderMaterial, Texture, Vector2, WebGLRenderTarget } from "three";
import { defaultFragmentShader, defaultVertexShader } from "./ShaderDefaults";
import { ShaderSrc } from "./ShaderTypes";

export type ShaderSrcProps = {
    shaderSrc: ShaderSrc
    canvasRef: RefObject<HTMLCanvasElement>
}

const origin = new Vector2(0, 0)

const MultiShader = ({shaderSrc, canvasRef}: ShaderSrcProps) => {
    const {gl, camera} = useThree();

    const [fragShader, setFragShader] = useState(defaultFragmentShader);
    const [shaderA, setShaderA] = useState(defaultFragmentShader);
    const [shaderB, setShaderB] = useState(defaultFragmentShader);
    const [mixShader, setMixShader] = useState(defaultFragmentShader);

    useEffect(() => {
        uniforms.current.u_resolution.value.set(canvasRef.current!.clientWidth, canvasRef.current!.clientHeight);
        mixShaderUniforms.current.u_resolution.value.set(canvasRef.current!.clientWidth, canvasRef.current!.clientHeight);
        fetch(shaderSrc.src)
            .then( r => r.text())
            .then( t => setFragShader(t))
        fetch("/shaders/redleft.frag")
            .then( r => r.text())
            .then( t => setShaderA(t))
        fetch("/shaders/greenbottom.frag")
            .then( r => r.text())
            .then( t => setShaderB(t))
        fetch("/shaders/mix.frag")
            .then( r => r.text())
            .then( t => setMixShader(t))
    }, [shaderSrc.src]);

    const meshRefA = useRef();
    const meshRefB = useRef();
    const mixMeshRef = useRef();
    const texA = useMemo(() => new WebGLRenderTarget(600, 600), []);
    const texB = useMemo(() => new WebGLRenderTarget(600, 600), []);

    // Subscribe this component to the render-loop
    useFrame(({ gl, scene, camera }, delta) => {
        uniforms.current.u_time.value += delta;
        mixShaderUniforms.current.u_time.value += delta;
        const screen = gl.getRenderTarget()

        const ma = meshRefA.current as unknown as Mesh
        gl.setRenderTarget(texA)
        gl.render(ma, camera);

        const mb = meshRefB.current as unknown as Mesh
        gl.setRenderTarget(texB)
        gl.render(mb, camera);

        const mixM = mixMeshRef.current as unknown as Mesh
        gl.setRenderTarget(screen);
        gl.render(mixM, camera);
    }, 1);

    const uniforms = useRef({
        u_time: { value: 1.0 },
        u_resolution: { value: new Vector2(0, 0) },
        u_mouse: { type: "v2", value: new Vector2() },
        u_tex: { value: texA.texture }
    })
    const mixShaderUniforms = useRef({
        u_resolution: { value: new Vector2(0, 0) },
        u_time: { value: 1.0 },
        u_texA: { value: texA.texture },
        u_texB: { value: texB.texture }
    })

    return <>
        <mesh ref={meshRefA}>
            <planeGeometry args={[2, 2]} />
            <shaderMaterial
            vertexShader={defaultVertexShader}
            fragmentShader={shaderA}
            uniforms={uniforms.current}
            onUpdate={(a) => {
                // Hack: the material doesn't seem to update when i change the shader.
                // Should only get called twice.
                a.needsUpdate = true;
            }} />
        </mesh>
        <mesh ref={meshRefB}>
            <planeGeometry args={[2, 2]} />
            <shaderMaterial
            vertexShader={defaultVertexShader}
            fragmentShader={shaderB}
            uniforms={uniforms.current}
            onUpdate={(a) => {
                // Hack: the material doesn't seem to update when i change the shader.
                // Should only get called twice.
                a.needsUpdate = true;
            }} />
        </mesh>
        <mesh ref={mixMeshRef}>
            <planeGeometry args={[2,2]} />
            <shaderMaterial
                vertexShader={defaultVertexShader}
                fragmentShader={mixShader}
                uniforms={mixShaderUniforms.current}
                onUpdate={(a) => {
                    // Hack: the material doesn't seem to update when i change the shader.
                    // Should only get called twice.
                    a.needsUpdate = true;
                }} />
            </mesh>
      </>
}

export default MultiShader;