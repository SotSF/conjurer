import { ExtraParams, PatternParam } from "@/src/types/PatternParams";
import { Box, Button, HStack, Text } from "@chakra-ui/react";
import { useState } from "react";
import { BsCaretDown, BsCaretUp } from "react-icons/bs";
import Block from "@/src/types/Block";
import NewVariationButtons from "@/src/components/NewVariationButtons";
import ParameterVariations from "@/src/components/ParameterVariations";
import { observer } from "mobx-react-lite";

type ParameterProps = {
  uniformName: string;
  patternParam: PatternParam;
  block: Block<ExtraParams>;
  expandMode: "expanded" | "collapsed";
};

export default observer(function ParameterView({
  uniformName,
  patternParam,
  block,
  expandMode,
}: ParameterProps) {
  const variations = block.parameterVariations[uniformName] ?? [];
  const [isExpanded, setExpanded] = useState(expandMode === "expanded");

  const headerColor = variations.length ? "orange.400" : "gray.300";
  return (
    <Box
      width="100%"
      pb={isExpanded ? 2 : 0}
      borderStyle="dashed"
      borderBottomWidth={1}
      borderColor="gray.500"
    >
      <Button
        variant="ghost"
        width="100%"
        height={7}
        p={0}
        onClick={() => setExpanded(!isExpanded)}
      >
        <HStack width="100%" justify="center">
          <Text
            lineHeight={1}
            userSelect="none"
            fontSize={14}
            color={headerColor}
          >
            {patternParam.name}
          </Text>
          {isExpanded ? (
            <BsCaretUp key={headerColor} size={10} color={headerColor} />
          ) : (
            <BsCaretDown key={headerColor} size={10} color={headerColor} />
          )}
        </HStack>
      </Button>

      {isExpanded &&
        (variations.length === 0 ? (
          <HStack width="100%" justify="center">
            <Text py={2} fontSize={10}>
              Click to add a variation:
            </Text>
            <NewVariationButtons uniformName={uniformName} block={block} />
          </HStack>
        ) : (
          <ParameterVariations uniformName={uniformName} block={block} />
        ))}
    </Box>
  );
});
