import { observer } from "mobx-react-lite";
import { Text, VStack } from "@chakra-ui/react";
import { useStore } from "@/src/types/StoreContext";

// Display the time in minutes and seconds: 00:00.0
const formatTime = (time: number) => {
  const minutes = Math.floor(time / 60);
  const seconds = time % 60;
  return `${minutes < 10 ? "0" : ""}${minutes}:${
    seconds < 10 ? "0" : ""
  }${seconds.toFixed(1)}`;
};

export const TimerReadout = observer(function TimerReadout() {
  const { timer } = useStore();

  return (
    <VStack
      position="sticky"
      top={0}
      left={0}
      height={10}
      width="150px"
      flexShrink={0}
      zIndex={11}
      bgColor="gray.500"
      justify="center"
      boxSizing="border-box"
      borderRightWidth={1}
      borderBottomWidth={1}
      borderColor="black"
    >
      <Text
        color="black"
        fontSize={18}
        fontFamily="monospace"
        userSelect="none"
      >
        {formatTime(timer.globalTimeRounded)}
      </Text>
    </VStack>
  );
});
