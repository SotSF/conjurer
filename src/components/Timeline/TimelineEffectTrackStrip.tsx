import { Box } from "@chakra-ui/react";
import { action } from "mobx";
import { observer } from "mobx-react-lite";
import { EffectTrack } from "@/src/types/EffectTrack";
import { useStore } from "@/src/types/StoreContext";
import { TimelineBlockStack } from "@/src/components/TimelineBlockStack/TimelineBlockStack";

type Props = {
  track: EffectTrack;
  // vertical start of the strip within its layer row, below the block lanes
  topOffset: number;
};

// A layer's effect track, laid out on the timeline directly beneath the blocks
// it processes. An empty track has no height, so a layer without one occupies
// exactly the space its blocks do.
export const TimelineEffectTrackStrip = observer(
  function TimelineEffectTrackStrip({ track, topOffset }: Props) {
    const store = useStore();
    const { audioStore, uiStore } = store;
    const blocks = track.blocks;
    if (blocks.length === 0) return null;

    return (
      <Box
        position="absolute"
        left={0}
        top={`${topOffset}px`}
        width="100%"
        height={`${track.height}px`}
        bgColor="blackAlpha.200"
        borderTopWidth={1}
        borderColor="blackAlpha.600"
        borderStyle="dashed"
        opacity={track.visible ? 1 : 0.4}
        // Selects the effect track as the working row. The click must not
        // bubble: the enclosing layer row's handler would reselect the layer.
        // Time-set and deselect are replicated from that handler so clicking
        // the strip still behaves like clicking timeline background.
        onClick={action((e) => {
          e.stopPropagation();
          audioStore.setTimeWithCursor(
            Math.max(
              0,
              uiStore.xToTime(
                e.clientX - e.currentTarget.getBoundingClientRect().x,
              ),
            ),
          );
          store.deselectAll();
          store.selectedTrack = track;
        })}
      >
        {blocks.map((block) => (
          <TimelineBlockStack key={block.id} patternBlock={block} />
        ))}
      </Box>
    );
  },
);
