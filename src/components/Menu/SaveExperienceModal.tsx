import { observer } from "mobx-react-lite";
import {
  Button,
  HStack,
  Input,
  InputGroup,
  InputLeftAddon,
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
import { useEffect, useRef, useState } from "react";
import { action } from "mobx";
import { trpc } from "@/src/utils/trpc";
import { useSaveExperience } from "@/src/hooks/experience";

export const SaveExperienceModal = observer(function SaveExperienceModal() {
  const store = useStore();
  const { uiStore, user, usingLocalData } = store;

  const {
    isPending,
    isError,
    data: experiences,
  } = trpc.experience.listExperiences.useQuery(
    { username: user, usingLocalData },
    { enabled: uiStore.showingSaveExperienceModal }
  );

  const { saveExperience } = useSaveExperience();

  const inputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [experienceName, setExperienceName] = useState("");
  const experienceFilename = `${user}-${experienceName}`;

  useEffect(() => {
    if (inputRef.current && !isPending) inputRef.current.focus();
  }, [isPending]);

  const onClose = action(() => (uiStore.showingSaveExperienceModal = false));

  const onSaveExperience = action(async () => {
    setSaving(true);
    store.experienceName = experienceName;
    await saveExperience();
    setSaving(false);
    onClose();
  });

  const onExperienceNameChange = (newValue: string) => {
    // sanitize file name
    newValue = newValue.replace(/[^a-z0-9]/gi, "-").toLowerCase();
    setExperienceName(newValue);
  };

  if (isError) return null;

  const willOverwriteExistingExperience = (experiences ?? []).some(
    ({ name }) => name === experienceFilename
  );

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
          {user ? (
            isPending ? (
              <Spinner />
            ) : (
              <>
                <HStack mb={2} spacing={0}>
                  <InputGroup>
                    <InputLeftAddon pr={1}>{user}-</InputLeftAddon>
                    <Input
                      ref={inputRef}
                      onChange={(e) => onExperienceNameChange(e.target.value)}
                      value={experienceName}
                    />
                  </InputGroup>
                </HStack>
                {experiences.length > 0 && (
                  <Text mb={4}>
                    Be aware that you may overwrite an existing experience:
                  </Text>
                )}
                {experiences.map((experience) => (
                  <Text
                    key={experience.name}
                    color={
                      experience.name === experienceFilename
                        ? "orange.400"
                        : "chakra-body-text"
                    }
                    fontWeight="bold"
                  >
                    {experience.name}
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
            colorScheme={willOverwriteExistingExperience ? "red" : "gray"}
          >
            {saving ? (
              <Spinner />
            ) : willOverwriteExistingExperience ? (
              "Overwrite"
            ) : (
              "Save"
            )}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
});
