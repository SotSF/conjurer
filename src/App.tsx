import { Canvas } from '@react-three/fiber';
import { MutableRefObject, useRef } from 'react';
import './App.css';
import MultiShader from './components/ShaderViewer/MultiShader';
import ShaderViewer from './components/ShaderViewer/ShaderViewer';

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  return (
    <div className="App">
      <div style={{width: "512px", height: "512px"}}>
        <Canvas ref={canvasRef}>
          <MultiShader
            canvasRef={canvasRef}
            shaderSrc={{
              name: 'lol',
              src: '/shaders/greenbottom.frag',
              width: '600px',
              height: '600px',
              parameters: [] }}
            />
          </Canvas>
        {/* <ShaderViewer shaderSrc={{ name: 'lol', src: '/shaders/default.frag',
          width: '600px', height: '600px', parameters: [] }} /> */}
        {/* <ShaderViewer shaderSrc={{ name: 'lol', src: '/shaders/default.frag',
          width: '300px', height: '300px', parameters: [] }} /> */}
      </div>
    </div>
  );
}

export default App;
