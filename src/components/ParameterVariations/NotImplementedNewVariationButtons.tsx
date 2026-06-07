import { Text } from "@chakra-ui/react";
import { memo } from "react";
import { Block } from "@/src/types/Block";
import { ParamType, PatternParam } from "@/src/params/shared/patternParam";

type NotImplementedNewVariationButtonsProps = {
  block: Block;
  uniformName: string;
  patternParam: PatternParam<ParamType>;
};

export const NotImplementedNewVariationButtons = memo(
  function NotImplementedNewVariationButtons(_props: NotImplementedNewVariationButtonsProps) {
    return (
      <Text fontSize="xs" color="whiteAlpha.500">
        not implemented
      </Text>
    );
  },
);
