import { Box, Text, useToken } from "@chakra-ui/react";
import { LineChart, Line, Tooltip, YAxis } from "recharts";
import { Variation } from "@/src/types/Variations/Variation";
import { Block } from "@/src/types/Block";
import { memo } from "react";
import { VARIATION_BOUND_WIDTH } from "@/src/utils/layout";
import { SplineVariation } from "@/src/types/Variations/SplineVariation";
import { SplineVariationGraph } from "@/src/components/VariationGraph/SplineVariationGraph";

type ScalarVariationGraphProps = {
  uniformName: string;
  variation: Variation;
  width: number;
  domain: [number, number];
  block: Block;
};

export const ScalarVariationGraph = memo(function ScalarVariationGraph({
  uniformName,
  variation,
  width,
  domain,
  block,
}: ScalarVariationGraphProps) {
  const orange = useToken("colors", "orange.400");
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

  const data = variation.computeSampledData(variation.duration);
  return (
    <Box py={1} bgColor="gray.600" _hover={{ bgColor: "gray.500" }}>
      <LineChart
        width={width - VARIATION_BOUND_WIDTH}
        height={50}
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
        <Tooltip isAnimationActive={false} content={<ScalarValueTooltip />} />
        <YAxis type="number" domain={domain} hide allowDataOverflow={false} />
      </LineChart>
    </Box>
  );
});

const ScalarValueTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: any;
}) => {
  if (!(active && payload && payload.length)) {
    return null;
  }
  let value = payload[0].value;
  if (typeof payload[0].value === "number") {
    value = payload[0].value.toFixed(2);
  }

  return <Text fontSize={12}>{`${value}`}</Text>;
};
