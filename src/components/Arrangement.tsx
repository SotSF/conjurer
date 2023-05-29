import { Box, Grid, GridItem } from "@chakra-ui/react";
import { MainControls } from "@/src/components/MainControls";
import { Timeline } from "@/src/components/Timeline";
import { memo } from "react";
import { TimerControls } from "@/src/components/TimerControls";
import { TimerReadout } from "@/src/components/TimerReadout";

export const Arrangement = memo(function Arrangement() {
  return (
    <Grid
      height="100%"
      templateAreas={`"timer controls"
                      "timeline timeline"`}
      gridTemplateColumns="165px 100%"
      gridTemplateRows="auto"
    >
      <GridItem area="timer">
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
