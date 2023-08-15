import { Button, HStack } from "@chakra-ui/react";
import { useEffect, useRef } from "react";
import {
  sendControllerMessage,
  setupControllerWebsocket,
} from "@/src/utils/controllerWebsocket";
import { PatternPlayground } from "@/src/components/PatternPlayground/PatternPlayground";
import { useStore } from "@/src/types/StoreContext";
import { observer } from "mobx-react-lite";

export const MobileController = observer(function MobileController() {
  const store = useStore();

  const initialized = useRef(false);
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    store.initialize();
    setupControllerWebsocket();
  }, [store]);

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
      {store.initialized && <PatternPlayground />}
    </>
  );
});
