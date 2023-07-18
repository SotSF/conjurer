import { Heading, VStack } from "@chakra-ui/react";
import { memo, useState } from "react";
import { Block } from "@/src/types/Block";
import {
  ExtraParams,
  PatternParam,
  isNumberParam,
  isPaletteParam,
  isVector4Param,
} from "@/src/types/PatternParams";
import { BASE_UNIFORMS } from "@/src/types/Pattern";
import { BsArrowsCollapse, BsArrowsExpand } from "react-icons/bs";
import { ScalarParameterControl } from "@/src/components/PatternPlayground/ScalarParameterControl";
import { ColorParameterControl } from "@/src/components/PatternPlayground/ColorParameterControl";
import { Vector4 } from "three";
import { Palette, isPalette } from "@/src/types/Palette";
import { PaletteParameterControl } from "@/src/components/PatternPlayground/PaletteParameterControl";

type ParameterControlsProps = {
  block: Block<ExtraParams>;
};

export const ParameterControls = memo(function ParameterControls({
  block,
}: ParameterControlsProps) {
  const [parameters, setParameters] = useState({});
  const [showControls, toggleControls] = useState(true);

  return (
    <VStack spacing={0} width="100%">
      <Heading size="sm" mt={4}>
        {block.pattern.name}
        <button onClick={() => toggleControls(!showControls)}>
          {showControls ? <BsArrowsCollapse /> : <BsArrowsExpand />}
        </button>
      </Heading>
      {showControls &&
        Object.entries<PatternParam>(block.pattern.params).map(
          ([uniformName, patternParam]) => {
            if (BASE_UNIFORMS.includes(uniformName)) return null;
            const props = {
              key: uniformName,
              block,
              uniformName,
              parameters,
              setParameters,
            };
            if (isNumberParam(patternParam))
              return (
                <ScalarParameterControl
                  {...props}
                  patternParam={patternParam}
                />
              );
            if (isVector4Param(patternParam))
              return (
                <ColorParameterControl {...props} patternParam={patternParam} />
              );
            if (isPaletteParam(patternParam))
              return (
                <PaletteParameterControl
                  {...props}
                  patternParam={patternParam}
                />
              );
            return null;
          }
        )}
    </VStack>
  );
});
