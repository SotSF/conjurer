import { Button, HStack } from "@chakra-ui/react";
import { memo, useEffect, useRef } from "react";
import {
  sendControllerMessage,
  setupControllerWebsocket,
} from "@/src/utils/controllerWebsocket";
import { PatternPlayground } from "@/src/components/PatternPlayground/PatternPlayground";

export const MobileController = memo(function MobileController() {
  // const store = useStore();

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
