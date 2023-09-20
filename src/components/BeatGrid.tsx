import { observer } from "mobx-react-lite";
import { useStore } from "@/src/types/StoreContext";
import { useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { Mesh } from "three";
import vert from "@/src/shaders/default.vert";
import beatGrid from "@/src/shaders/beatGrid.frag";

type BeatGridProps = {
  songTempo: number;
  songTempoOffset: number;
};

export const BeatGrid = observer(function BeatGrid({
  songTempo,
  songTempoOffset,
}: BeatGridProps) {
  const store = useStore();
  const { uiStore } = store;

  const secondsPerBeat = 60 / songTempo;
  const pixelsPerBeat = secondsPerBeat * uiStore.pixelsPerSecond;
  const zoomFactor = pixelsPerBeat / 10;

  const outputMesh = useRef<Mesh>(null);
  const outputUniforms = useRef({
    u_resolution: { value: [512, 512] },
    u_song_tempo: { value: 120 },
    u_song_tempo_offset: { value: 0 },
  });

  return (
    <>
      <Canvas frameloop="always">
        <mesh ref={outputMesh}>
          <planeGeometry args={[2, 2]} />
          <shaderMaterial
            uniforms={outputUniforms.current}
            fragmentShader={beatGrid}
            vertexShader={vert}
          />
        </mesh>
      </Canvas>
    </>
  );
});
