import { Heading, Text, VStack } from "@chakra-ui/react";
import { useState } from "react";
import { Block } from "@/src/types/Block";
import { ExtraParams, PatternParam } from "@/src/types/PatternParams";
import { VJParameterControl } from "@/src/components/VJPage/VJParameterControl";
import {
  VJPatternRadioGroup,
  type VJPatternRadioGroupProps,
} from "@/src/components/VJPage/VJPatternRadioGroup";
import { observer } from "mobx-react-lite";

type VJParameterControlsProps = {
  block: Block<ExtraParams>;
  /** When editing the root pattern block, pattern picker is shown under the "Pattern" heading. */
  patternSelection?: Pick<
    VJPatternRadioGroupProps,
    "selectedPatternName" | "selectedPatternIndex" | "onSelectPattern"
  >;
};

export const VJParameterControls = observer(function VJParameterControls({
  block,
  patternSelection,
}: VJParameterControlsProps) {
  const [parameters, setParameters] = useState({});

  const isEffect = block.parentBlock !== null;
  const showPatternPicker = !isEffect && patternSelection != null;

  return (
    <VStack
      spacing={2}
      align="stretch"
      width="100%"
      minW={0}
      maxW="100%"
      px={2}
    >
      {showPatternPicker ? (
        <>
          <Text fontSize="md" fontWeight="bold">
            Pattern
          </Text>
          <VJPatternRadioGroup
            selectedPatternName={patternSelection.selectedPatternName}
            selectedPatternIndex={patternSelection.selectedPatternIndex}
            onSelectPattern={patternSelection.onSelectPattern}
          />
        </>
      ) : (
        <Heading size="sm">
          Effect: {block.pattern.name}
        </Heading>
      )}

      <VStack spacing={0} align="stretch" width="100%" pl={3}>
        {Object.entries<PatternParam>(block.pattern.params).map(
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
    </VStack>
  );
});
