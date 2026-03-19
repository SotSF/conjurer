import { Button, Heading, VStack } from "@chakra-ui/react";
import { memo, useState } from "react";
import { Block } from "@/src/types/Block";
import { ExtraParams, PatternParam } from "@/src/types/PatternParams";
import { BsArrowsCollapse, BsArrowsExpand } from "react-icons/bs";
import { VJParameterControl } from "@/src/components/VJPage/VJParameterControl";

type VJParameterControlsProps = {
  block: Block<ExtraParams>;
};

export const VJParameterControls = memo(function VJParameterControls({
  block,
}: VJParameterControlsProps) {
  const [parameters, setParameters] = useState({});
  const [showControls, toggleControls] = useState(true);

  const isEffect = block.parentBlock !== null;

  return (
    <VStack
      spacing={0}
      width="100%"
      borderStyle="solid"
      borderWidth={1}
      borderColor="black"
    >
      <Heading size="sm">
        {isEffect ? "Effect:" : "Pattern:"} {block.pattern.name}
        <Button
          ml={1}
          variant="unstyled"
          onClick={() => toggleControls(!showControls)}
        >
          {showControls ? <BsArrowsCollapse /> : <BsArrowsExpand />}
        </Button>
      </Heading>

      {showControls &&
        Object.entries<PatternParam>(block.pattern.params).map(
          ([uniformName, patternParam]) => (
            <VJParameterControl
              key={uniformName}
              block={block}
              uniformName={uniformName}
              patternParam={patternParam}
              parameters={parameters}
              setParameters={setParameters}
            />
          ),
        )}
    </VStack>
  );
});

