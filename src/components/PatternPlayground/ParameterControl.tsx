import { Box } from "@chakra-ui/react";
import { memo } from "react";
import { Block } from "@/src/types/Block";
import { PatternParam } from "@/src/types/PatternParams";
import { BASE_UNIFORMS } from "@/src/types/Pattern";
import { ParamDefinitions } from "@/src/paramDefinitions/ParamDefinitions";

type ParameterControlProps = {
  block: Block;
  uniformName: string;
  patternParam: PatternParam;
};

export const ParameterControl = memo(function ParameterControl({
  block,
  uniformName,
  patternParam,
}: ParameterControlProps) {
  if (BASE_UNIFORMS.includes(uniformName)) return null;

  const props = {
    block,
    uniformName,
  };

  for (let paramDefinition of ParamDefinitions) {
    const control = paramDefinition.renderControl(patternParam, props);
    if (control) {
      return (
        <Box
          key={uniformName}
          p={1}
          width="100%"
          _odd={{ bgColor: "whiteAlpha.200" }}
          _even={{ bgColor: "whiteAlpha.50" }}
        >
          {control}
        </Box>
      );
    }
  }

  return (
    <Box
      p={1}
      width="100%"
      _odd={{ bgColor: "whiteAlpha.200" }}
      _even={{ bgColor: "whiteAlpha.50" }}
    />
  );
});
