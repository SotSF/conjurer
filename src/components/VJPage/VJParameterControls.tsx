import { Box, Text, VStack } from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import { useEffect, useRef, useState } from "react";
import { Block } from "@/src/types/Block";
import { ExtraParams, PatternParam } from "@/src/types/PatternParams";
import { VJParameterControl } from "@/src/components/VJPage/VJParameterControl";
import { observer } from "mobx-react-lite";

const patternNameFlash = keyframes`
  0% {
    color: #93c5fd;
    text-shadow: 0 0 10px rgba(147, 197, 253, 0.95);
  }
  35% {
    color: #ffffff;
    text-shadow: 0 0 12px rgba(255, 255, 255, 0.55);
  }
  100% {
    color: #f7fafc;
    text-shadow: none;
  }
`;

type VJParameterControlsProps = {
  block: Block<ExtraParams>;
};

export const VJParameterControls = observer(function VJParameterControls({
  block,
}: VJParameterControlsProps) {
  const [parameters, setParameters] = useState({});

  const isEffect = block.parentBlock !== null;
  const patternName = block.pattern.name;

  const [patternFlashKey, setPatternFlashKey] = useState(0);
  const prevPatternNameRef = useRef<string | null>(null);

  useEffect(() => {
    if (isEffect) return;
    const prev = prevPatternNameRef.current;
    if (prev !== null && prev !== patternName) {
      setPatternFlashKey((k) => k + 1);
    }
    prevPatternNameRef.current = patternName;
  }, [isEffect, patternName]);

  return (
    <Box
      ml={2}
      width="100%"
      minW={0}
      maxW="100%"
      borderWidth="1px"
      borderColor="gray.600"
      borderRadius="md"
      p={0}
      overflow="hidden"
    >
      <Box px={3} pt={3} pb={2}>
        <Text fontSize="sm" fontWeight="bold" color="gray.100">
          {isEffect ? (
            <>Effect: {patternName}</>
          ) : (
            <>
              Pattern:{" "}
              <Text
                as="span"
                key={patternFlashKey}
                display="inline"
                sx={{
                  animation:
                    patternFlashKey > 0
                      ? `${patternNameFlash} 0.55s ease-out forwards`
                      : undefined,
                }}
              >
                {patternName}
              </Text>
            </>
          )}
        </Text>
      </Box>

      <VStack spacing={0} align="stretch" width="100%" minW={0}>
        {Object.entries<PatternParam>(block.pattern.params)
          .sort(([, a], [, b]) => {
            if (a.jumpy && !b.jumpy) return 1;
            if (!a.jumpy && b.jumpy) return -1;
            return 0;
          })
          .map(([uniformName, patternParam]) => (
            <VJParameterControl
              key={uniformName}
              block={block}
              uniformName={uniformName}
              patternParam={patternParam}
              parameters={parameters}
              setParameters={setParameters}
            />
          ))}
      </VStack>
    </Box>
  );
});
