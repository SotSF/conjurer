import { observer } from "mobx-react-lite";
import { Button, HStack } from "@chakra-ui/react";
import { useStore } from "@/src/types/StoreContext";

export const MobileController = observer(function MobileController() {
  const store = useStore();
  const { audioStore } = store;

  return (
    <HStack width="100%" justify="center">
      <Button>Play</Button>
    </HStack>
  );
});
