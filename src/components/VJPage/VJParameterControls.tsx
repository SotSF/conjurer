import { Box, Button, HStack, IconButton, Text, VStack } from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { FaArrowDown, FaArrowUp } from "react-icons/fa";
import { Block } from "@/src/types/Block";
import { ExtraParams, PatternParam } from "@/src/types/PatternParams";
import { VJParameterControl } from "@/src/components/VJPage/VJParameterControl";
import { resetBlockParamsToDefaults } from "@/src/utils/resetBlockParamsToDefaults";
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

type VJEffectOrderControls = {
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
};

type VJParameterControlsProps = {
  block: Block<ExtraParams>;
  effectOrder?: VJEffectOrderControls;
};

export const VJParameterControls = observer(function VJParameterControls({
  block,
  effectOrder,
}: VJParameterControlsProps) {
  const [parameters, setParameters] = useState({});
  const [controlsKey, setControlsKey] = useState(0);

  const isEffect = block.parentBlock !== null;
  const patternName = block.pattern.name;

  const [patternFlashKey, setPatternFlashKey] = useState(0);
  const prevPatternNameRef = useRef<string | null>(null);

  const onResetDefaults = useCallback(() => {
    resetBlockParamsToDefaults(block);
    setParameters({});
    setControlsKey((k) => k + 1);
  }, [block]);

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
        <HStack justify="space-between" align="flex-start" gap={2}>
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
          <HStack spacing={0} flexShrink={0}>
            {effectOrder && (
              <>
                <IconButton
                  aria-label={`Move ${patternName} effect up`}
                  icon={<FaArrowUp />}
                  size="xs"
                  variant="ghost"
                  color="gray.400"
                  isDisabled={!effectOrder.canMoveUp}
                  onClick={effectOrder.onMoveUp}
                />
                <IconButton
                  aria-label={`Move ${patternName} effect down`}
                  icon={<FaArrowDown />}
                  size="xs"
                  variant="ghost"
                  color="gray.400"
                  isDisabled={!effectOrder.canMoveDown}
                  onClick={effectOrder.onMoveDown}
                />
              </>
            )}
            <Button
              size="xs"
              variant="ghost"
              color="gray.400"
              onClick={onResetDefaults}
              aria-label={`Reset ${patternName} parameters to defaults`}
            >
              Reset
            </Button>
          </HStack>
        </HStack>
      </Box>

      <VStack
        key={controlsKey}
        spacing={0}
        align="stretch"
        width="100%"
        minW={0}
      >
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
