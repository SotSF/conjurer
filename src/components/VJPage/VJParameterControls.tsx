import { Box, Text, VStack } from "@chakra-ui/react";
import { useState } from "react";
import { Block } from "@/src/types/Block";
import { ExtraParams, PatternParam } from "@/src/types/PatternParams";
import { VJParameterControl } from "@/src/components/VJPage/VJParameterControl";
import { VJ_EDIT_PANE_CONTENT_ML } from "@/src/components/VJPage/vjEditPaneLayout";
import { observer } from "mobx-react-lite";

type VJParameterControlsProps = {
  block: Block<ExtraParams>;
};

export const VJParameterControls = observer(function VJParameterControls({
  block,
}: VJParameterControlsProps) {
  const [parameters, setParameters] = useState({});

  const isEffect = block.parentBlock !== null;

  return (
    <Box
      ml={VJ_EDIT_PANE_CONTENT_ML}
      width="100%"
      minW={0}
      maxW="100%"
      borderWidth="1px"
      borderColor="gray.600"
      borderRadius="md"
      p={0}
      overflow="hidden"
    >
      <Box px={3} pt={3} pb={2}>
        <Text fontSize="sm" fontWeight="bold" color="gray.100">
          {isEffect ? "Effect" : "Pattern"}: {block.pattern.name}
        </Text>
      </Box>

      <VStack spacing={0} align="stretch" width="100%" minW={0}>
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
    </Box>
  );
});
