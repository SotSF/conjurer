import { Button, Heading, Tooltip, VStack } from "@chakra-ui/react";
import { memo, useState } from "react";
import { Block } from "@/src/types/Block";
import { PatternParam } from "@/src/params/shared/patternParam";
import { BsArrowsCollapse, BsArrowsExpand } from "react-icons/bs";
import { ParameterControl } from "@/src/components/PatternPlayground/ParameterControl";
import { randomizeBlockParameters } from "@/src/utils/randomizeBlockParameters";
import { resetBlockParamsToDefaults } from "@/src/utils/resetBlockParamsToDefaults";

type ParameterControlsProps = {
  block: Block;
  // Bumped whenever every block's parameters are randomized or reset at once (see the
  // buttons in PatternPlayground), to remount each ParameterControl below — they hold
  // local input state that doesn't otherwise react to param values changing out from
  // under them. Changing this block alone bumps a local nonce instead, leaving sibling
  // blocks' controls untouched.
  randomizeNonce?: number;
};

export const ParameterControls = memo(function ParameterControls({
  block,
  randomizeNonce = 0,
}: ParameterControlsProps) {
  const [showControls, toggleControls] = useState(true);
  const [blockRandomizeNonce, setBlockRandomizeNonce] = useState(0);

  const isEffect = block.parentBlock !== null;
  const kind = isEffect ? "effect" : "pattern";

  const bumpControls = () => setBlockRandomizeNonce((n) => n + 1);

  const onRandomizeClick = () => {
    randomizeBlockParameters(block, { includeEffectBlocks: false });
    bumpControls();
  };

  const onResetDefaultsClick = () => {
    resetBlockParamsToDefaults(block);
    bumpControls();
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
        <Tooltip
          label={`Randomize only this ${kind}'s parameters`}
          openDelay={500}
        >
          <Button size="xs" ml={2} onClick={onRandomizeClick}>
            Randomize
          </Button>
        </Tooltip>
        <Tooltip
          label={`Reset only this ${kind}'s parameters to defaults`}
          openDelay={500}
        >
          <Button size="xs" ml={2} onClick={onResetDefaultsClick}>
            Defaults
          </Button>
        </Tooltip>
      </Heading>

      {showControls &&
        Object.entries<PatternParam>(block.pattern.params).map(
          ([uniformName, patternParam]) => (
            <ParameterControl
              key={`${uniformName}-${randomizeNonce}-${blockRandomizeNonce}`}
              block={block}
              uniformName={uniformName}
              patternParam={patternParam}
            />
          ),
        )}
    </VStack>
  );
});
