import { Block } from "@/src/types/Block";
import { ExtraParams } from "@/src/types/PatternParams";
import { ParameterView } from "@/src/components/TimelineBlockStack/ParameterView";
import { VStack } from "@chakra-ui/react";
import { memo } from "react";

const uniformNamesToExclude = ["u_time", "u_texture"];

type ParametersListProps = {
  block: Block<ExtraParams>;
  expandMode: "expanded" | "collapsed";
};

export const ParametersList = memo(function ParametersList({
  block,
  expandMode,
}: ParametersListProps) {
  return (
    <VStack spacing={0} width="100%">
      {Object.entries(block.pattern.params).map(
        ([uniformName, patternParam]) =>
          uniformNamesToExclude.includes(uniformName) ? null : (
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
