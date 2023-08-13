import { observer } from "mobx-react-lite";
import { Button, HStack } from "@chakra-ui/react";
import { useStore } from "@/src/types/StoreContext";
import { useEffect } from "react";
import {
  sendControllerMessage,
  setupControllerWebsocket,
} from "@/src/utils/controllerWebsocket";

export const MobileController = observer(function MobileController() {
  const store = useStore();
  const { audioStore } = store;

  useEffect(() => {
    setupControllerWebsocket();
  }, []);

  return (
    <HStack width="100%" justify="center">
      <Button
        onClick={() => {
          // setupControllerWebsocket();
          sendControllerMessage(JSON.stringify({ type: "turtle" }));
        }}
      >
        Play
      </Button>
    </HStack>
  );
});
