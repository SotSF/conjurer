import { generateId } from "@/src/utils/id";

/**
 * Migrates serialized v1 experience data to the v2 format consumed by
 * `LayerV2.deserialize`.
 *
 * v1 stored each layer's pattern blocks as an ordered array with at most one
 * block active at a time; v2 stores them as a BlockMap keyed by block id and
 * permits concurrency. Beyond re-keying, migration enforces the v1
 * one-block-at-a-time semantics that the stored data only loosely upholds:
 * production v1 data contains sub-millisecond block overlaps left behind by
 * editor rounding, which the v1 renderer never displayed but which v2 would
 * faithfully render as concurrent patterns.
 *
 * `layer.opacityBlock`, present in some older v1 rows, is intentionally
 * dropped: the feature was removed in #282 and the renderer has ignored the
 * data since.
 */

// Largest block overlap attributable to v1 editor rounding artifacts. The
// measured maximum across all production experiences is 0.0001s. Anything
// larger is preserved as-is (and will render concurrently) rather than
// silently truncated.
const V1_OVERLAP_TOLERANCE = 0.01;

export const migrateV1ExperienceData = (data: any) => ({
  ...data,
  layers: (data.layers ?? []).map(migrateV1Layer),
});

const migrateV1Layer = (layer: any) => {
  const blocks = [...(layer.patternBlocks ?? [])].sort(
    (a, b) => a.startTime - b.startTime,
  );

  const blockMap: Record<string, any> = {};
  blocks.forEach((originalBlock, i) => {
    const block = { ...originalBlock };

    // the oldest v1 data predates block ids; ids double as BlockMap keys, so
    // they must exist and be unique
    if (!block.id || block.id in blockMap) block.id = generateId();

    const next = blocks[i + 1];
    if (next) {
      const overlap = block.startTime + block.duration - next.startTime;
      if (overlap > V1_OVERLAP_TOLERANCE) {
        console.warn(
          `Migrating v1 layer: blocks overlap by ${overlap}s and will render concurrently`,
        );
      } else if (overlap > 0 && next.startTime > block.startTime) {
        block.duration = next.startTime - block.startTime;
      }
    }

    blockMap[block.id] = block;
  });

  return { id: layer.id, name: layer.name ?? "", blockMap };
};
