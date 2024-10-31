import { observer } from "mobx-react-lite";
import {
  Button,
  IconButton,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Spinner,
  Switch,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
} from "@chakra-ui/react";
import { useStore } from "@/src/types/StoreContext";
import { action } from "mobx";
import { trpc } from "@/src/utils/trpc";
import { useState } from "react";
import { FaTrashAlt } from "react-icons/fa";

export const OpenExperienceModal = observer(function OpenExperienceModal() {
  const store = useStore();
  const { experienceStore, uiStore, username, usingLocalData } = store;

  const [filterMyExperiencesOnly, setFilterMyExperiencesOnly] = useState(true);
  const [isLoadingNewExperience, setIsLoadingNewExperience] = useState(false);

  const {
    isPending,
    isError,
    data: experiencesAndUsers,
    isRefetching,
  } = trpc.experience.listExperiencesAndUsers.useQuery(
    {
      username: filterMyExperiencesOnly ? username : undefined,
      usingLocalData,
    },
    { enabled: uiStore.showingOpenExperienceModal }
  );

  const onClose = action(() => (uiStore.showingOpenExperienceModal = false));

  if (isError) return null;

  // TODO: extract into a utility function
  const sortedExperiencesAndUsers = (experiencesAndUsers ?? []).sort((a, b) =>
    `${a.user.username}${a.experience.name}`.localeCompare(
      `${b.user.username}${b.experience.name}`
    )
  );

  return (
    <Modal
      onClose={onClose}
      isOpen={uiStore.showingOpenExperienceModal}
      isCentered
      size="4xl"
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          Open experience{" "}
          {(isPending || isRefetching || isLoadingNewExperience) && (
            <Spinner ml={2} />
          )}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {!isPending && experiencesAndUsers.length === 0 && (
            <Text color="gray.400">
              {username} has no saved experiences yet!
            </Text>
          )}
          <Switch
            mb={4}
            isChecked={filterMyExperiencesOnly}
            onChange={(e) => setFilterMyExperiencesOnly(e.target.checked)}
          >
            Only my experiences
          </Switch>
          {!isPending && (
            <TableContainer>
              <Table size="sm">
                <Thead>
                  <Tr>
                    <Th>Author</Th>
                    <Th>Name</Th>
                    <Th>Song</Th>
                    <Th />
                  </Tr>
                </Thead>
                <Tbody>
                  {sortedExperiencesAndUsers.map(({ user, experience }) => (
                    <Tr key={experience.id}>
                      <Td>{user.username}</Td>
                      <Td>
                        <Button
                          ml={-3}
                          size="md"
                          height={8}
                          variant="ghost"
                          onClick={action(async () => {
                            setIsLoadingNewExperience(true);
                            await experienceStore.load(experience.name);
                            setIsLoadingNewExperience(false);
                            onClose();
                          })}
                        >
                          {experience.name}
                        </Button>
                      </Td>
                      <Td>
                        {experience.song?.artist} - {experience.song?.name}
                      </Td>
                      <Td>
                        {user.username === username && (
                          <IconButton
                            variant="ghost"
                            size="sm"
                            aria-label="Delete experience"
                            title="Delete experience"
                            icon={<FaTrashAlt size={14} />}
                            disabled={true}
                          />
                        )}
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </TableContainer>
          )}
        </ModalBody>
        <ModalFooter>
          <Button onClick={onClose}>Close</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
});
