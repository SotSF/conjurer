import { memo } from "react";
import { PatternParam } from "@/src/types/PatternParams";
import { Text } from "@chakra-ui/react";

export const ParameterControlName = memo(function ParameterControlName({
  patternParam,
}: {
  patternParam: PatternParam;
}) {
  return (
    <Text fontSize={15} fontWeight="bold">
      {patternParam.name}
    </Text>
  );
});
