import { Grid, GridItem } from "@chakra-ui/react";
import { MainControls } from "@/src/components/MainControls";
import { Timeline } from "@/src/components/Timeline";
import { memo } from "react";
import { TimerControls } from "@/src/components/TimerControls";

export const Arrangement = memo(function Arrangement() {
  return (
    <Grid
      width="100%"
      templateAreas={`"timerControls  controls"
                      "timeline       timeline"`}
      gridTemplateColumns="150px 1fr"
      gridTemplateRows="auto"
    >
      <GridItem area="timerControls">
        <TimerControls />
      </GridItem>
      <GridItem area="controls">
        <MainControls />
      </GridItem>
      <GridItem area="timeline" bgColor="gray.400">
        <Timeline />
      </GridItem>
    </Grid>
  );
});
