import { Badge, HStack, Text } from "@chakra-ui/react";
import { memo } from "react";
import { PatternParam } from "@/src/types/PatternParams";

export const VJParameterControlName = memo(function VJParameterControlName({
  patternParam,
}: {
  patternParam: PatternParam;
}) {
  return (
    <HStack
      alignItems="center"
      flexWrap="wrap"
      spacing={1}
      w="100%"
      minW={0}
    >
      <Text
        lineHeight={1.25}
        fontSize="sm"
        fontWeight="bold"
        wordBreak="break-word"
        whiteSpace="normal"
      >
        {patternParam.name}
      </Text>
      {patternParam.jumpy && (
        <Badge
          fontSize="xs"
          px={1.5}
          py={0}
          lineHeight="short"
          textTransform="none"
          fontWeight="medium"
          colorScheme="orange"
          variant="subtle"
        >
          jumpy
        </Badge>
      )}
    </HStack>
  );
});

