import { observer } from "mobx-react-lite";
import {
  Button,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Spinner,
  Switch,
  Text,
} from "@chakra-ui/react";
import { useStore } from "@/src/types/StoreContext";
import { action } from "mobx";
import { ExperiencesTable } from "@/src/components/ExperiencesTable/ExperiencesTable";
import { useState } from "react";
import { Playlist } from "@/src/types/Playlist";
import { useSavePlaylist } from "@/src/hooks/playlist";
import { useExperiencesAndUsers } from "@/src/hooks/experiencesAndUsers";

export const AddExperienceModal = observer(function AddExperienceModal({
  playlist,
}: {
  playlist: Playlist;
}) {
  const store = useStore();
  const { username, uiStore } = store;

  const [viewingAllExperiences, setViewingAllExperiences] = useState(false);
  const [selectedExperienceIds, setSelectedExperienceIds] = useState<number[]>(
    []
  );

  const { isPending, isError, experiencesAndUsers } = useExperiencesAndUsers({
    username: viewingAllExperiences ? undefined : username,
    enabled: uiStore.showingPlaylistAddExperienceModal,
  });

  const { savePlaylist } = useSavePlaylist();

  if (isError) return null;

  const onClose = action(() => {
    setSelectedExperienceIds([]);
    uiStore.showingPlaylistAddExperienceModal = false;
  });

  return (
    <Modal
      onClose={onClose}
      isOpen={uiStore.showingPlaylistAddExperienceModal}
      isCentered
      size="4xl"
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          Add experience to playlist {isPending && <Spinner />}
        </ModalHeader>
        <ModalBody>
          {!isPending && experiencesAndUsers.length === 0 && (
            <Text color="gray.400">
              {username} has no saved experiences yet!
            </Text>
          )}
          <Switch
            mb={4}
            isChecked={viewingAllExperiences}
            onChange={(e) => setViewingAllExperiences(e.target.checked)}
          >
            View all experiences
          </Switch>
          {!isPending && (
            <ExperiencesTable
              experiencesAndUsers={experiencesAndUsers}
              omitIds={playlist.orderedExperienceIds}
              selectable
              selectedExperienceIds={selectedExperienceIds}
              setSelectedExperienceIds={setSelectedExperienceIds}
            />
          )}
        </ModalBody>
        <ModalFooter>
          <Button
            isDisabled={!selectedExperienceIds.length || isPending}
            onClick={action(() => {
              savePlaylist({
                ...playlist,
                orderedExperienceIds: [
                  ...playlist.orderedExperienceIds,
                  ...selectedExperienceIds,
                ],
              });
              onClose();
            })}
          >
            {isPending ? <Spinner /> : "Add"}
          </Button>
        </ModalFooter>
        <ModalCloseButton />
      </ModalContent>
    </Modal>
  );
});
