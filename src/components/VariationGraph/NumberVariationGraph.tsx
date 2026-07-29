import { Box, useToken } from "@chakra-ui/react";
import { LineChart, Line, YAxis } from "recharts";
import { Variation } from "@/src/types/Variations/Variation";
import { Block } from "@/src/types/Block";
import { SplineVariation } from "@/src/types/Variations/SplineVariation";
import { SplineVariationGraph } from "@/src/components/VariationGraph/SplineVariationGraph";
import { CurveVariation } from "@/src/types/Variations/CurveVariation";
import { EnvelopeGraph } from "@/src/components/VariationGraph/EnvelopeGraph";
import { PeriodicVariation } from "@/src/types/Variations/PeriodicVariation";
import { AudioVariation } from "@/src/types/Variations/AudioVariation";
import { RegionSettingsPopover } from "@/src/components/ParameterVariations/RegionSettingsPopover";
import { useVariationClick } from "@/src/hooks/variationClick";

type NumberVariationGraphProps = {
  uniformName: string;
  variation: Variation;
  width: number;
  domain: [number, number];
  block: Block;
  // Lane context for time-span selection. Absent when a graph is rendered
  // outside an automation lane (the param controls / VJ panel), where there is
  // no lane to select a span in.
  laneStartTime?: number;
  laneSpan?: { startTime: number; endTime: number } | null;
  graphHeight?: number;
};

export const NumberVariationGraph = function NumberVariationGraph({
  uniformName,
  variation,
  width,
  domain,
  block,
  laneStartTime = 0,
  laneSpan = null,
  graphHeight = 50,
}: NumberVariationGraphProps) {
  const orange = useToken("colors", "orange.400");

  const onVariationClick = useVariationClick(block, uniformName);

  if (variation instanceof CurveVariation)
    // No key={width} here: the SVG editor recomputes all coordinates from the
    // `width` prop on each render, so it must NOT remount when zoom changes the
    // width — remounting would wipe the selected-segment/handle state, making
    // the curvature handles disappear on zoom.
    return (
      <EnvelopeGraph
        uniformName={uniformName}
        variation={variation}
        width={width}
        domain={domain}
        block={block}
        laneStartTime={laneStartTime}
        laneSpan={laneSpan}
        height={graphHeight}
      />
    );

  if (variation instanceof SplineVariation)
    return (
      <SplineVariationGraph
        key={width}
        uniformName={uniformName}
        variation={variation}
        width={width}
        domain={domain}
        block={block}
      />
    );

  const data = variation.computeSampledData(
    variation.duration,
    block.startTime,
  );

  const isGenerator =
    variation instanceof PeriodicVariation ||
    variation instanceof AudioVariation;

  const graph = (
    <Box
      py={1}
      bgColor="gray.600"
      _hover={{ bgColor: "gray.500" }}
      role="button"
      cursor="pointer"
      onClick={
        isGenerator ? undefined : (e) => onVariationClick(e, variation)
      }
    >
      <LineChart
        width={width}
        height={graphHeight}
        data={data}
        margin={{ top: 0, left: 0, right: 0, bottom: 0 }}
      >
        <Line
          dot={false}
          isAnimationActive={false}
          type="monotone"
          dataKey="value"
          stroke={orange}
          yAxisId={0}
        />
        <YAxis type="number" domain={domain} hide allowDataOverflow={false} />
      </LineChart>
    </Box>
  );

  // Mirror palette/color regions: clicking the LFO or Audio band opens settings.
  if (isGenerator) {
    return (
      <RegionSettingsPopover
        block={block}
        uniformName={uniformName}
        variation={variation}
      >
        {graph}
      </RegionSettingsPopover>
    );
  }

  return graph;
};
