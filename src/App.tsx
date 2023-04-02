import './App.css';
import ShaderViewer from './components/ShaderViewer/ShaderViewer';

function App() {
  return (
    <div className="App">
      <div>
        <ShaderViewer shaderSrc={{ name: 'lol', src: '/shaders/default.frag',
          width: '600px', height: '600px', parameters: [] }} />
        <ShaderViewer shaderSrc={{ name: 'lol', src: '/shaders/default.frag',
          width: '300px', height: '300px', parameters: [] }} />
      </div>
    </div>
  );
}

export default App;
