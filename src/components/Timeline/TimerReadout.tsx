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
  const { audioStore } = useStore();

  return (
    <VStack
      justify="center"
      borderWidth={1}
      bgColor="gray.400"
      borderRadius={2}
      lineHeight="1"
      px={1}
      py={0.25}
      m={1}
    >
      <Text
        color="black"
        fontSize={18}
        fontFamily="monospace"
        userSelect="none"
      >
        {formatTime(audioStore.globalTimeRounded)}
      </Text>
    </VStack>
  );
});
