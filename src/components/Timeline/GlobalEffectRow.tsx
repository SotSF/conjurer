import { Box, HStack, IconButton, Text } from "@chakra-ui/react";
import { action } from "mobx";
import { observer } from "mobx-react-lite";
import { useRef } from "react";
import { MdBlurOn } from "react-icons/md";
import { useStore } from "@/src/types/StoreContext";
import { TIMELINE_HEADER_WIDTH } from "@/src/types/UIStore";
import { MAX_TIME } from "@/src/utils/time";
import { hoverHelpProps } from "@/src/utils/hoverHelp";
import { AddChainEffectMenu } from "@/src/components/Timeline/AddChainEffectMenu";
import { TimelineBlockStack } from "@/src/components/TimelineBlockStack/TimelineBlockStack";

// Tall enough for the row's header controls when the chain is empty.
const EMPTY_ROW_HEIGHT = 26;

/**
 * The experience's global effect chain, pinned below the layer stack: these
 * effects process the merged output of every layer, which is why the row sits
 * downstream of them all.
 *
 * Shaped like the Add-layer row — a sticky header gutter plus a spacer as wide
 * as a layer's content — so the header stays pinned across the full horizontal
 * scroll.
 */
export const GlobalEffectRow = observer(function GlobalEffectRow() {
  const store = useStore();
  const { audioStore, uiStore, globalEffectChain: chain } = store;

  const contentRef = useRef<HTMLDivElement>(null);
  const blocks = chain.blocks;
  const height = Math.max(chain.height, EMPTY_ROW_HEIGHT);

  return (
    <HStack
      spacing={0}
      flexShrink={0}
      alignItems="flex-start"
      height={`${height}px`}
    >
      <Box
        position="sticky"
        left={0}
        zIndex={11}
        width={`${TIMELINE_HEADER_WIDTH}px`}
        height="100%"
        flexShrink={0}
        boxSizing="border-box"
        bgColor="gray.500"
        borderTopWidth={1}
        borderRightWidth={1}
        borderColor="black"
      >
        {/* Stick below the 80px TimerAndWaveform, as the layer headers do */}
        <HStack
          position="sticky"
          top="80px"
          width="100%"
          px={1}
          spacing={1}
          justify="center"
          minH="20px"
          bgColor="gray.500"
        >
          <Text fontSize={11} fontWeight="bold" color="black" noOfLines={1}>
            Global FX
          </Text>
          <AddChainEffectMenu
            chain={chain}
            helpTitle="Add global effect"
            helpDescription="Append an effect applied to the entire frame, after every layer is merged together."
          />
          {blocks.length > 0 && (
            <IconButton
              minW="20px"
              w="20px"
              h="20px"
              variant="unstyled"
              color={chain.visible ? "blue.600" : "gray.600"}
              display="flex"
              alignItems="center"
              justifyContent="center"
              aria-label="Bypass global effects"
              title="Bypass global effects"
              icon={<MdBlurOn size={15} />}
              onClick={action(() => chain.toggleVisible())}
              {...hoverHelpProps(
                uiStore,
                "Global effect chain",
                "Take the global effect chain out of the signal path without deleting it.",
              )}
            />
          )}
        </HStack>
      </Box>
      <Box
        ref={contentRef}
        position="relative"
        width={uiStore.timeToXPixels(MAX_TIME)}
        height="100%"
        flexShrink={0}
        boxSizing="border-box"
        bgColor="gray.500"
        borderTopWidth={1}
        borderColor="black"
        opacity={chain.visible ? 1 : 0.4}
        onClick={action((e) => {
          audioStore.setTimeWithCursor(
            Math.max(
              0,
              uiStore.xToTime(
                e.clientX - contentRef.current!.getBoundingClientRect().x,
              ),
            ),
          );
          store.deselectAll();
        })}
      >
        {blocks.map((block) => (
          <TimelineBlockStack key={block.id} patternBlock={block} />
        ))}
      </Box>
    </HStack>
  );
});
