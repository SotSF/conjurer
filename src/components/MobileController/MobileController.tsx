import { observer } from "mobx-react-lite";
import { Button, HStack } from "@chakra-ui/react";
import { useStore } from "@/src/types/StoreContext";
import { useEffect, useRef } from "react";
import {
  sendControllerMessage,
  setupControllerWebsocket,
} from "@/src/utils/controllerWebsocket";
import { PatternPlayground } from "@/src/components/PatternPlayground/PatternPlayground";

export const MobileController = observer(function MobileController() {
  const store = useStore();

  const initialized = useRef(false);
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    setupControllerWebsocket();
  }, []);

  return (
    <>
      <HStack width="100%" justify="center">
        <Button
          onClick={() => {
            sendControllerMessage({ type: "update" });
          }}
        >
          Play
        </Button>
      </HStack>
      <PatternPlayground />
    </>
  );
});
