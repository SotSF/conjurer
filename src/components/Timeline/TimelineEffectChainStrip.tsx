import { Box } from "@chakra-ui/react";
import { observer } from "mobx-react-lite";
import { EffectChain } from "@/src/types/EffectChain";
import { TimelineBlockStack } from "@/src/components/TimelineBlockStack/TimelineBlockStack";

type Props = {
  chain: EffectChain;
  // vertical start of the strip within its layer row, below the block lanes
  topOffset: number;
};

// A layer's effect chain, laid out on the timeline directly beneath the blocks
// it processes. An empty chain has no height, so a layer without one occupies
// exactly the space its blocks do.
export const TimelineEffectChainStrip = observer(
  function TimelineEffectChainStrip({ chain, topOffset }: Props) {
    const blocks = chain.blocks;
    if (blocks.length === 0) return null;

    return (
      <Box
        position="absolute"
        left={0}
        top={`${topOffset}px`}
        width="100%"
        height={`${chain.height}px`}
        bgColor="blackAlpha.200"
        borderTopWidth={1}
        borderColor="blackAlpha.600"
        borderStyle="dashed"
        opacity={chain.visible ? 1 : 0.4}
      >
        {blocks.map((block) => (
          <TimelineBlockStack key={block.id} patternBlock={block} />
        ))}
      </Box>
    );
  },
);
