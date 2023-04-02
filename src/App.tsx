import React from 'react';
import logo from './logo.svg';
import './App.css';
import ShaderViewer from './components/Shader';
import { defaultFragmentShader } from './components/ShaderDefaults';

function App() {
  return (
    <div className="App">
      <div>
        <ShaderViewer shaderSrc={{
            name: 'lol',
            src: '/shaders/default.frag',
            width: '100px',
            height: '100px',
            parameters: []
          }} />
      </div>
    </div>
  );
}

export default App;
