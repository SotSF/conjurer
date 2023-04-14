import { BufferAttribute, BufferGeometry, ShaderMaterial } from "three";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { observer } from "mobx-react-lite";
import { useStore } from "@/src/types/StoreContext";
import vert from "@/src/patterns/shaders/canopy.vert";
import black from "@/src/patterns/shaders/black.frag";
import { LED_COUNTS, STRIP_LENGTH } from "@/src/utils/size";
import catenary from "@/src/utils/catenary";

type CanopyViewProps = {};

export default observer(function Canopy({}: CanopyViewProps) {
  const { currentBlock } = useStore();
  const shaderMaterial = useRef<ShaderMaterial>(null);

  const bufferGeometry = useMemo(() => {
    // TODO: fix this horrible hack
    const catenaryCoordinates = catenary(
      { x: 1, y: 0 },
      { x: 8, y: 0 },
      STRIP_LENGTH,
      LED_COUNTS.y,
    );
    const ledPositions = [];
    for (let x = 0; x < LED_COUNTS.x; x++) {
      for (let y = 0; y < LED_COUNTS.y; y++) {
        ledPositions.push(
          x / (LED_COUNTS.x - 1),
          y / (LED_COUNTS.y - 1),
          -catenaryCoordinates[y][1],
        );
      }
    }
    const positionsFloatArray = new Float32Array(ledPositions);

    const geometry = new BufferGeometry();
    geometry.setAttribute(
      "position",
      new BufferAttribute(positionsFloatArray, 3),
    );
    return geometry;
  }, []);

  const { timer } = useStore();
  useFrame(() => {
    // mobx linting will complain about these lines if observableRequiresReaction is enabled, but
    // it's fine. We don't want this function to react to changes in these variables - it runs every
    // frame already.
    const { globalTime } = timer;

    if (currentBlock)
      currentBlock.update(globalTime - currentBlock.startTime, globalTime);
  });

  return (
    <points>
      <primitive attach="geometry" object={bufferGeometry} />
      <shaderMaterial
        key={currentBlock?.id}
        ref={shaderMaterial}
        uniforms={currentBlock?.pattern.params}
        fragmentShader={currentBlock ? currentBlock.pattern.src : black}
        vertexShader={vert}
      />
    </points>
  );
});
