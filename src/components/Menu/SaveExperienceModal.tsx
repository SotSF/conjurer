import { observer } from "mobx-react-lite";
import {
  Button,
  HStack,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Spinner,
  Text,
} from "@chakra-ui/react";
import { useStore } from "@/src/types/StoreContext";
import { useExperiences } from "@/src/hooks/experiences";
import { useEffect, useRef, useState } from "react";
import { action, runInAction } from "mobx";

export const SaveExperienceModal = observer(function SaveExperienceModal() {
  const store = useStore();
  const { experienceStore, uiStore } = store;

  const { loading, experiences } = useExperiences(
    uiStore.showingSaveExperienceModal
  );

  const inputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [experienceName, setExperienceName] = useState("");
  const experienceFilename = `${store.user}-${experienceName}`;

  useEffect(() => {
    if (inputRef.current && !loading) inputRef.current.focus();
  }, [loading]);

  const onClose = action(() => {
    uiStore.showingSaveExperienceModal = false;
  });

  const onSaveExperience = async () => {
    setSaving(true);
    runInAction(() => {
      store.experienceName = experienceName;
    });
    await experienceStore.saveToS3();
    setSaving(false);
    onClose();
  };

  return (
    <Modal
      onClose={onClose}
      isOpen={uiStore.showingSaveExperienceModal}
      isCentered
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Save experience as...</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {store.user ? (
            loading ? (
              <Spinner />
            ) : (
              <>
                <HStack mb={2} spacing={0}>
                  <Text>{store.user}-</Text>
                  <Input
                    ref={inputRef}
                    onChange={(e) => setExperienceName(e.target.value)}
                    value={experienceName}
                  />
                </HStack>
                {experiences.length > 0 && (
                  <Text>Careful not to overwrite an existing experience:</Text>
                )}
                {experiences.map((experience) => (
                  <Text
                    key={experience}
                    color={
                      experience === experienceFilename
                        ? "orange.400"
                        : "chakra-body-text"
                    }
                    fontWeight="bold"
                  >
                    {experience}
                  </Text>
                ))}
              </>
            )
          ) : (
            <Text>Please log in first!</Text>
          )}
        </ModalBody>
        <ModalFooter>
          <Button
            isDisabled={saving || !experienceName}
            onClick={() => onSaveExperience()}
          >
            {saving ? <Spinner /> : "Save"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
});
