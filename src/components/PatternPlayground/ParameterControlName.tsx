import { memo } from "react";
import { PatternParam } from "@/src/types/PatternParams";
import { Text } from "@chakra-ui/react";

export const ParameterControlName = memo(function ParameterControlName({
  patternParam,
}: {
  patternParam: PatternParam;
}) {
  return (
    <Text lineHeight={1} fontSize="sm" fontWeight="bold">
      {patternParam.name}
    </Text>
  );
});
