import { Box, useToken } from "@chakra-ui/react";
import { Block } from "@/src/types/Block";
import { memo, useEffect, useRef } from "react";
import { SplineVariation } from "@/src/types/Variations/SplineVariation";
import { useVariationClick } from "@/src/hooks/variationClick";
import { VARIATION_BOUND_WIDTH } from "@/src/utils/layout";

type ScalarVariationGraphProps = {
  uniformName: string;
  variation: SplineVariation;
  width: number;
  domain: [number, number];
  block: Block;
};

export const SplineVariationGraph = memo(function SplineVariationGraph({
  uniformName,
  variation,
  width,
  domain,
  block,
}: ScalarVariationGraphProps) {
  const didInitialize = useRef(false);
  const id = `spline-${variation.id}`;

  const [orange, blue] = useToken("colors", ["orange.400", "blue.400"]);

  useEffect(() => {
    if (didInitialize.current) return;
    didInitialize.current = true;

    const create = async () => {
      // Cannot be run on the server, so we need to use dynamic import
      const CanvasSpliner = (await import("CanvasSpliner")).CanvasSpliner;

      const HEIGHT = 58;
      const spliner = new CanvasSpliner(
        id,
        width - VARIATION_BOUND_WIDTH,
        HEIGHT,
      );
      for (let i = 0; i < variation.points.length; i++) {
        const { x, y } = variation.points[i];
        const xLocked = i === 0 || i === variation.points.length - 1;
        const safe = i === 0 || i === variation.points.length - 1;
        spliner.add({ x, y, xLocked, safe });
      }
      spliner.setControlPointRadius(5);
      spliner.setControlPointColor("idle", orange);
      spliner.setControlPointColor("hovered", blue);
      spliner.setControlPointColor("grabbed", blue);
      spliner.setCurveColor("idle", orange);
      spliner.setTextColor("#ffffff");
      spliner.setGridStep(0.25);
      // spliner.setGridColor(5);
      // spliner.setCurveThickness(5);
      // spliner.setBackgroundColor(null);

      const handler = (newSpliner: any) => {
        variation.points = newSpliner._pointCollection._points.map(
          // renormalize points
          (p: { x: number; y: number }) => ({
            x: p.x / width,
            y: p.y / HEIGHT,
          }),
        );
      };
      spliner.on("movePoint", handler);
      spliner.on("pointAdded", handler);
      spliner.on("pointRemoved", handler);

      spliner.draw();
    };

    create();
  }, [variation, id, width, orange, blue]);

  const onVariationClick = useVariationClick(block, uniformName);

  return (
    <Box
      className="spline-container"
      id={id}
      bgColor="gray.600"
      onClick={(e) => onVariationClick(e, variation)}
    />
  );
});
