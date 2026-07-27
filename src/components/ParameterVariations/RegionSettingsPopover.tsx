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
import { ReactElement, useState } from "react";
import { TbSettings } from "react-icons/tb";

type Props = {
  block: Block;
  uniformName: string;
  variation: Variation;
  // Optional custom trigger (e.g. the region graph). Defaults to the gear
  // icon used in the region bar — same pattern as palette/color regions,
  // where clicking the band opens settings.
  children?: ReactElement;
};

// Settings popover for a generator region (LFO / Audio). Reuses the existing
// PeriodicVariationControls / AudioVariationControls. Can be triggered from the
// region-bar gear or by wrapping the region graph (click opens settings).
export const RegionSettingsPopover = observer(function RegionSettingsPopover({
  block,
  uniformName,
  variation,
  children,
}: Props) {
  const isPeriodic = variation instanceof PeriodicVariation;
  const isAudio = variation instanceof AudioVariation;
  const [popoverOpen, setPopoverOpen] = useState(false);
  if (!isPeriodic && !isAudio) return null;

  const controlProps = { block, uniformName };

  const popover = (
    <Popover
      placement="bottom"
      isLazy
      onOpen={() => setPopoverOpen(true)}
      onClose={() => setPopoverOpen(false)}
    >
      <PopoverTrigger>
        {children ?? (
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
        )}
      </PopoverTrigger>
      <Portal>
        <PopoverContent
          width="248px"
          bg="gray.700"
          fontSize={10}
          // z-index must clear the sticky layer header (zIndex 11), same as
          // palette/color region popovers
          rootProps={{ style: { zIndex: 1600 } }}
        >
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
  );

  // Gear trigger keeps its tooltip; a custom trigger (graph) does not.
  if (children) return popover;

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
        {popover}
      </Box>
    </Tooltip>
  );
});
