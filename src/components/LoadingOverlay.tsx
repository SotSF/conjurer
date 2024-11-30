import { Context, Role } from "@/src/types/context";
import { useStore } from "@/src/types/StoreContext";
import { Center, Modal, ModalOverlay, Spinner } from "@chakra-ui/react";
import { observer } from "mobx-react-lite";

const contextMatchesRole = (context: Context, role: Role) => {
  switch (context) {
    case "experienceEditor":
      return role === "experienceCreator";
    case "playlistEditor":
      return role === "emcee";
    case "playground":
      return role === "vj";
    default:
      return false;
  }
};

export const LoadingOverlay = observer(function LoadingOverlay() {
  const store = useStore();
  const { context, role, experienceStore } = store;
  return (
    <Modal
      isOpen={
        store.initializationState !== "initialized" ||
        experienceStore.loadingExperienceName !== null ||
        !contextMatchesRole(context, role)
      }
      onClose={() => {}}
      closeOnEsc={false}
      closeOnOverlayClick={false}
      blockScrollOnMount
    >
      <ModalOverlay>
        <Center width="100vw" height="100vh">
          <Spinner size="xl" speed={"0.9s"} />
        </Center>
      </ModalOverlay>
    </Modal>
  );
});
