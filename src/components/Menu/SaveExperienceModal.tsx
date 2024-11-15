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
import { useEffect, useRef, useState } from "react";
import { action } from "mobx";
import { trpc } from "@/src/utils/trpc";
import { useSaveExperience } from "@/src/hooks/experience";

export const SaveExperienceModal = observer(function SaveExperienceModal() {
  const store = useStore();
  const { uiStore, userStore, usingLocalData } = store;
  const { username } = userStore;

  const {
    isPending,
    isError,
    data: experiences,
  } = trpc.experience.listExperiencesForUser.useQuery(
    { username, usingLocalData },
    { enabled: uiStore.showingSaveExperienceModal },
  );

  const { saveExperience } = useSaveExperience();

  const inputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [newExperienceName, setNewExperienceName] = useState("");

  useEffect(() => {
    if (inputRef.current && !isPending) inputRef.current.focus();
  }, [isPending]);

  if (isError) return null;

  const onClose = action(() => (uiStore.showingSaveExperienceModal = false));

  const onSaveExperience = async () => {
    setSaving(true);
    try {
      await saveExperience({ name: newExperienceName });
    } catch (e: any) {
      setSaving(false);
      return;
    }

    setSaving(false);
    setNewExperienceName("");
    onClose();
  };

  const onExperienceNameChange = (newValue: string) => {
    // sanitize file name
    newValue = newValue.replace(/[^a-z0-9]/gi, "-").toLowerCase();
    setNewExperienceName(newValue);
  };

  const willOverwriteExistingExperience = (experiences ?? []).some(
    ({ name }) => name === newExperienceName,
  );

  const sortedExperiences = (experiences ?? []).sort((a, b) =>
    a.name.localeCompare(b.name),
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
          {username ? (
            isPending ? (
              <Spinner />
            ) : (
              <>
                <HStack mb={2} spacing={0}>
                  <Input
                    ref={inputRef}
                    onChange={(e) => onExperienceNameChange(e.target.value)}
                    value={newExperienceName}
                  />
                </HStack>
                {experiences.length > 0 && (
                  <Text my={4}>
                    You cannot choose the name of an existing experience:
                  </Text>
                )}
                {sortedExperiences.map((experience) => (
                  <Text
                    key={experience.name}
                    color={
                      experience.name === newExperienceName
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
            isDisabled={
              saving ||
              !newExperienceName ||
              newExperienceName === "untitled" ||
              willOverwriteExistingExperience
            }
            onClick={onSaveExperience}
          >
            {saving ? <Spinner /> : "Save"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
});
