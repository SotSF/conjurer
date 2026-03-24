import { memo } from "react";
import { PatternParam } from "@/src/types/PatternParams";
import { Text } from "@chakra-ui/react";

export const VJParameterControlName = memo(function VJParameterControlName({
  patternParam,
}: {
  patternParam: PatternParam;
}) {
  return (
    <Text
      lineHeight={1.25}
      fontSize="sm"
      fontWeight="bold"
      w="100%"
      wordBreak="break-word"
      whiteSpace="normal"
    >
      {patternParam.name}
    </Text>
  );
});

