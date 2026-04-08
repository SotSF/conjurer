import { useEffect } from "react";
import { PatternPlayground } from "@/src/components/PatternPlayground/PatternPlayground";
import { useStore } from "@/src/types/StoreContext";
import { observer } from "mobx-react-lite";
import { LoadingOverlay } from "@/src/components/LoadingOverlay";
import { HStack } from "@chakra-ui/react";
import { RoleSelector } from "@/src/components/RoleSelector";
import { LoginButton } from "@/src/components/LoginButton";

export const PlaygroundPage = observer(function PlaygroundPage() {
  const store = useStore();

  useEffect(() => {
    if (store.initializationState !== "uninitialized") return;
    store.initializeClientSide();
  }, [store, store.initializationState]);

  return (
    store.initializationState === "initialized" && (
      <>
        <HStack
          p={2}
          position="absolute"
          top={0}
          right={0}
          zIndex={10}
          alignItems="end"
        >
          <RoleSelector />
          <LoginButton />
        </HStack>
        <PatternPlayground />
        <LoadingOverlay />
      </>
    )
  );
});
