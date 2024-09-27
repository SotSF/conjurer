import { observer } from "mobx-react-lite";
import { Modal, ModalOverlay } from "@chakra-ui/react";
import { useStore } from "@/src/types/StoreContext";
import { action } from "mobx";
import { lazy, Suspense } from "react";

// lazy load to keep the S3 client out of the initial bundle
const UploadAudioModalContent = lazy(
  () => import("@/src/components/UploadAudioModalContent")
);

export const UploadAudioModal = observer(function UploadAudioModal() {
  const store = useStore();
  const { uiStore } = store;

  return (
    <Modal
      onClose={action(() => (uiStore.showingUploadAudioModal = false))}
      isOpen={uiStore.showingUploadAudioModal}
      isCentered
    >
      <ModalOverlay />
      <Suspense fallback={null}>
        <UploadAudioModalContent />
      </Suspense>
    </Modal>
  );
});
