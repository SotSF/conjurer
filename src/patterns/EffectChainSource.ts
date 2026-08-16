import { Pattern } from "@/src/types/Pattern";

/**
 * The source of a block in an effect chain: the composited output the chain is
 * handed, standing where a pattern block has its pattern.
 *
 * Like Opacity, it carries no shader. The pipeline feeds the composite texture
 * straight into the block's first effect, so this is never rendered — it exists
 * so a chain block is an ordinary Block, with a name to show on the timeline
 * and an entry in the pattern registry for serialization to round-trip.
 */
export const EffectChainSource = () => new Pattern("Effects", "", {});
