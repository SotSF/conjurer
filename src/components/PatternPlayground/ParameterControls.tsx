import { Heading, VStack } from "@chakra-ui/react";
import { memo, useState } from "react";
import { Block } from "@/src/types/Block";
import { ExtraParams, PatternParam } from "@/src/types/PatternParams";
import { BASE_UNIFORMS } from "@/src/types/Pattern";
import { BsArrowsCollapse, BsArrowsExpand } from "react-icons/bs";
import { ScalarParameterControl } from "@/src/components/PatternPlayground/ScalarParameterControl";

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
          {showControls ? (
            <BsArrowsCollapse></BsArrowsCollapse>
          ) : (
            <BsArrowsExpand></BsArrowsExpand>
          )}
        </button>
      </Heading>
      {showControls &&
        Object.entries<PatternParam>(block.pattern.params).map(
          ([uniformName, patternParam]) => {
            if (BASE_UNIFORMS.includes(uniformName)) return null;
            if (typeof patternParam.value === "number")
              return (
                <ScalarParameterControl
                  key={uniformName}
                  block={block}
                  uniformName={uniformName}
                  // TODO: implement better type discrimination somehow
                  patternParam={patternParam as PatternParam<number>}
                  parameters={parameters}
                  setParameters={setParameters}
                />
              );
            return null;
          }
        )}
    </VStack>
  );
});
