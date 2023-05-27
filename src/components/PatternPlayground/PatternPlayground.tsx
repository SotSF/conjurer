import { Box, Grid, GridItem, VStack } from "@chakra-ui/react";
import { useStore } from "@/src/types/StoreContext";
import { observer } from "mobx-react-lite";
import { PatternList } from "@/src/components/PatternPlayground/PatternList";
import { PreviewCanvas } from "@/src/components/PatternPlayground/PreviewCanvas";
import { useMemo } from "react";
import { Block } from "@/src/types/Block";
import { ParameterControls } from "@/src/components/PatternPlayground/ParameterControls";

const PATTERN_PREVIEW_DISPLAY_SIZE = 600;

export const PatternPlayground = observer(function PatternPlayground() {
  const store = useStore();
  const { selectedPattern } = store;
  const block = useMemo(() => new Block(selectedPattern), [selectedPattern]);

  return (
    <Grid
      height="100%"
      templateAreas={`"patterns patterns"
                            "controls preview"`}
      gridTemplateColumns="50% 50%"
      gridTemplateRows="auto 1fr"
    >
      <GridItem area="patterns">
        <PatternList />
      </GridItem>
      <GridItem area="controls">
        <ParameterControls block={block} />
      </GridItem>
      <GridItem area="preview">
        <VStack
          position="sticky"
          top={0}
          height="70vh"
          justify="center"
          alignItems="center"
        >
          <Box
            width={`${PATTERN_PREVIEW_DISPLAY_SIZE}px`}
            height={`${PATTERN_PREVIEW_DISPLAY_SIZE}px`}
          >
            <PreviewCanvas block={block} />
          </Box>
        </VStack>
      </GridItem>
    </Grid>
  );
});
