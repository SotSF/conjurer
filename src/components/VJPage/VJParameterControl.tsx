import { Box } from "@chakra-ui/react";
import { memo } from "react";
import { Block } from "@/src/types/Block";
import { PatternParam } from "@/src/params/shared/patternParam";
import { BASE_UNIFORMS } from "@/src/types/Pattern";
import { ParamDefinitions } from "@/src/params/shared/ParamDefinitions";

type VJParameterControlProps = {
  block: Block;
  uniformName: string;
  patternParam: PatternParam;
};

export const VJParameterControl = memo(function VJParameterControl({
  block,
  uniformName,
  patternParam,
}: VJParameterControlProps) {
  if (BASE_UNIFORMS.includes(uniformName)) return null;

  const props = { block, uniformName };
  let control: React.ReactNode = null;
  for (const paramDefinition of ParamDefinitions) {
    const rendered = paramDefinition.renderVJControl(patternParam, props);
    if (rendered) {
      control = rendered;
      break;
    }
  }

  return (
    <Box
      key={uniformName}
      p={1}
      width="100%"
      minW={0}
      maxW="100%"
      _odd={{ bgColor: "whiteAlpha.200" }}
      _even={{ bgColor: "whiteAlpha.50" }}
    >
      {control}
    </Box>
  );
});
