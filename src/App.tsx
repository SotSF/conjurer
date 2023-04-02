import './App.css';
import ShaderViewer from './components/Shader';

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
