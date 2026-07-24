import { Button, Heading, VStack } from "@chakra-ui/react";
import { memo, useState } from "react";
import { Block } from "@/src/types/Block";
import { PatternParam } from "@/src/params/shared/patternParam";
import { BsArrowsCollapse, BsArrowsExpand } from "react-icons/bs";
import { ParameterControl } from "@/src/components/PatternPlayground/ParameterControl";
import { randomizeBlockParameters } from "@/src/utils/randomizeBlockParameters";

type ParameterControlsProps = {
  block: Block;
  // Bumped whenever parameters are randomized (including from a sibling ParameterControls,
  // e.g. randomizing a pattern also randomizes its applied effects), to remount each
  // ParameterControl below — they hold local input state that doesn't otherwise react to
  // param values changing out from under them.
  randomizeNonce?: number;
  onRandomize?: () => void;
};

export const ParameterControls = memo(function ParameterControls({
  block,
  randomizeNonce = 0,
  onRandomize,
}: ParameterControlsProps) {
  const [showControls, toggleControls] = useState(true);

  const isEffect = block.parentBlock !== null;

  const onRandomizeClick = () => {
    randomizeBlockParameters(block);
    onRandomize?.();
  };

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
        {!isEffect && (
          <Button size="xs" ml={2} onClick={onRandomizeClick}>
            Randomize
          </Button>
        )}
      </Heading>

      {showControls &&
        Object.entries<PatternParam>(block.pattern.params).map(
          ([uniformName, patternParam]) => (
            <ParameterControl
              key={`${uniformName}-${randomizeNonce}`}
              block={block}
              uniformName={uniformName}
              patternParam={patternParam}
            />
          ),
        )}
    </VStack>
  );
});
