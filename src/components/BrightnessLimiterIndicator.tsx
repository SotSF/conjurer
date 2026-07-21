import { observer } from "mobx-react-lite";
import { Box, HStack, Text, Tooltip, useDisclosure } from "@chakra-ui/react";
import { useStore } from "@/src/types/StoreContext";
import { BrightnessLimiterModal } from "@/src/components/BrightnessLimiterModal";

const METER_WIDTH = 56;

export const BrightnessLimiterIndicator = observer(
  function BrightnessLimiterIndicator() {
    const store = useStore();
    const { isOpen, onOpen, onClose } = useDisclosure();

    const reduction = store.brightnessLimiterEnabled
      ? 1 - store.brightnessLimiterGain
      : 0;
    const reductionPct = reduction * 100;
    const active = store.brightnessLimiterEnabled && reduction > 0.001;

    return (
      <>
        <Tooltip
          hasArrow
          label={
            store.brightnessLimiterEnabled
              ? `Brightness limiter GR −${reductionPct.toFixed(0)}% — click for settings`
              : "Brightness limiter off — click for settings"
          }
          placement="top"
        >
          <HStack
            as="button"
            type="button"
            spacing={1.5}
            h={6}
            mx={2}
            px={1}
            userSelect="none"
            cursor="pointer"
            borderRadius="sm"
            opacity={store.brightnessLimiterEnabled ? 1 : 0.55}
            _hover={{ bg: "whiteAlpha.100" }}
            onClick={onOpen}
            aria-label="Open brightness limiter settings"
          >
            <Text
              fontSize="0.65em"
              fontWeight="bold"
              letterSpacing="wider"
              color={active ? "orange.300" : "gray.500"}
              lineHeight={1}
            >
              GR
            </Text>
            <Box
              position="relative"
              w={`${METER_WIDTH}px`}
              h="10px"
              bg="whiteAlpha.200"
              borderRadius="sm"
              overflow="hidden"
            >
              <Box
                position="absolute"
                left={0}
                top={0}
                bottom={0}
                width={`${Math.min(reduction, 1) * 100}%`}
                bg={reduction > 0.5 ? "red.400" : "orange.400"}
                transition="width 80ms linear, background-color 150ms ease"
              />
            </Box>
            <Text
              fontSize="0.65em"
              fontWeight="semibold"
              color={active ? "orange.200" : "gray.600"}
              minW="28px"
              textAlign="right"
              lineHeight={1}
            >
              {reductionPct.toFixed(0)}%
            </Text>
          </HStack>
        </Tooltip>
        <BrightnessLimiterModal isOpen={isOpen} onClose={onClose} />
      </>
    );
  },
);
