import { Block } from "@/src/types/Block";
import { ParameterView } from "@/src/components/TimelineBlockStack/ParameterView";
import { VStack } from "@chakra-ui/react";
import { memo } from "react";

const uniformNamesToExclude = ["u_time", "u_texture"];
// opacity applies to a pattern block's final output, so it is not editable on
// effect blocks
const effectUniformNamesToExclude = [...uniformNamesToExclude, "u_opacity"];

type ParametersListProps = {
  block: Block;
  expandMode: "expanded" | "collapsed";
};

export const ParametersList = memo(function ParametersList({
  block,
  expandMode,
}: ParametersListProps) {
  const excludedUniformNames = block.parentBlock
    ? effectUniformNamesToExclude
    : uniformNamesToExclude;
  return (
    <VStack spacing={0} width="100%">
      {Object.entries(block.pattern.params).map(
        ([uniformName, patternParam]) =>
          excludedUniformNames.includes(uniformName) ? null : (
            <ParameterView
              // if the expandMode changes, we want to re-render all the ParameterViews
              key={uniformName + expandMode}
              expandMode={expandMode}
              uniformName={uniformName}
              patternParam={patternParam}
              block={block}
            />
          ),
      )}
    </VStack>
  );
});
