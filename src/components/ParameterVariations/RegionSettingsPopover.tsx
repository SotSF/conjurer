import { Block } from "@/src/types/Block";
import { Variation } from "@/src/types/Variations/Variation";
import { PeriodicVariation } from "@/src/types/Variations/PeriodicVariation";
import { AudioVariation } from "@/src/types/Variations/AudioVariation";
import { PeriodicVariationControls } from "@/src/components/VariationControls/VariationControls";
import { AudioVariationControls } from "@/src/components/VariationControls/AudioVariationControls";
import {
  Box,
  IconButton,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverContent,
  PopoverTrigger,
  Portal,
  Text,
  Tooltip,
  VStack,
} from "@chakra-ui/react";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { TbSettings } from "react-icons/tb";

type Props = {
  block: Block;
  uniformName: string;
  variation: Variation;
};

// Settings popover for a generator region (LFO / Audio). Reuses the existing
// PeriodicVariationControls / AudioVariationControls in the hover-revealed region
// controls, mirroring the Curve Min/Max popover. Interim: these controls will be
// reworked once the region-manipulation UX lands (see the design agent).
export const RegionSettingsPopover = observer(function RegionSettingsPopover({
  block,
  uniformName,
  variation,
}: Props) {
  const isPeriodic = variation instanceof PeriodicVariation;
  const isAudio = variation instanceof AudioVariation;
  const [popoverOpen, setPopoverOpen] = useState(false);
  if (!isPeriodic && !isAudio) return null;

  const controlProps = { block, uniformName };

  return (
    <Tooltip
      label={`${variation.displayName} settings`}
      openDelay={0}
      hasArrow
      placement="top"
      fontSize="xs"
      isDisabled={popoverOpen}
    >
      <Box as="span" display="inline-flex">
        <Popover
          placement="bottom"
          isLazy
          onOpen={() => setPopoverOpen(true)}
          onClose={() => setPopoverOpen(false)}
        >
          <PopoverTrigger>
            <IconButton
              variant="unstyled"
              size="xs"
              height="14px"
              minW="14px"
              aria-label={`${variation.displayName} settings`}
              icon={<TbSettings size={12} />}
              color="gray.300"
              _hover={{ color: "blue.300" }}
              onClick={(e) => e.stopPropagation()}
            />
          </PopoverTrigger>
          <Portal>
            <PopoverContent width="248px" bg="gray.700" fontSize={10} zIndex={1600}>
              <PopoverArrow bg="gray.700" />
              <PopoverBody>
                <VStack
                  spacing={1}
                  align="stretch"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Text fontWeight="bold">{variation.displayName}</Text>
                  {isPeriodic ? (
                    <PeriodicVariationControls
                      variation={variation}
                      {...controlProps}
                    />
                  ) : (
                    <AudioVariationControls
                      variation={variation as AudioVariation}
                      {...controlProps}
                    />
                  )}
                </VStack>
              </PopoverBody>
            </PopoverContent>
          </Portal>
        </Popover>
      </Box>
    </Tooltip>
  );
});
