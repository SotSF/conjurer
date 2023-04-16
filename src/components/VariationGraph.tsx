import { HStack, IconButton, Text } from "@chakra-ui/react";
import { memo, useMemo } from "react";
import { LineChart, Line, Tooltip, YAxis } from "recharts";
import Variation from "@/src/types/Variations/Variation";
import FlatVariation from "@/src/types/Variations/FlatVariation";
import LinearVariation from "@/src/types/Variations/LinearVariation";
import { action } from "mobx";
import { FaPencilAlt, FaTrashAlt } from "react-icons/fa";
import Block from "@/src/types/Block";

type VariationGraphProps = {
  uniformName: string;
  variation: Variation;
  width: number;
  domain: [number, number];
  block: Block;
};

export default memo(function VariationGraph({
  uniformName,
  variation,
  width,
  domain,
  block,
}: VariationGraphProps) {
  const data = useMemo(() => {
    if (variation instanceof FlatVariation) {
      return [
        {
          value: variation.value,
        },
        {
          value: variation.value,
        },
      ];
    } else if (variation instanceof LinearVariation) {
      return [
        {
          value: variation.from,
        },
        {
          value: variation.to,
        },
      ];
    }

    // TODO: do something smarter than hard coding the sample rate here
    const sampleRate = 50;
    const data = [];
    for (let i = 0; i < sampleRate; i++) {
      data.push({
        value: variation.valueAtTime((block.duration * i) / (sampleRate - 1)),
      });
    }
    return data;
  }, [variation, block.duration]);

  return (
    <>
      <LineChart
        width={width}
        height={30}
        data={data}
        margin={{ top: 0, left: 0, right: 0, bottom: 0 }}
      >
        <Line
          isAnimationActive={false}
          type="monotone"
          dataKey="value"
          stroke="#ff7300"
          yAxisId={0}
        />
        <Tooltip content={<CustomTooltip />} />
        <YAxis type="number" domain={domain} hide allowDataOverflow={false} />
      </LineChart>
      <HStack>
        <IconButton
          aria-label="Edit"
          variant="ghost"
          size="xs"
          color="gray.400"
          icon={<FaPencilAlt size={12} />}
          onClick={action(() => block.removeVariation(uniformName, variation))}
        />
        <IconButton
          aria-label="Delete"
          variant="ghost"
          size="xs"
          color="gray.400"
          icon={<FaTrashAlt size={12} />}
          onClick={action(() => block.removeVariation(uniformName, variation))}
        />
      </HStack>
    </>
  );
});

const CustomTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: any;
}) => {
  if (!(active && payload && payload.length)) {
    return null;
  }

  return <Text fontSize={12}>{`${payload[0].value}`}</Text>;
};
