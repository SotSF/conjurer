import { useState } from "react";
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
  VStack,
} from "@chakra-ui/react";
import { FaUser } from "react-icons/fa";
import { useStore } from "@/src/types/StoreContext";
import { action } from "mobx";
import { observer } from "mobx-react-lite";
import { trpc } from "@/src/utils/trpc";

export const UserPicker = observer(function UserPicker() {
  const store = useStore();
  const { uiStore, user, usingLocalAssets } = store;

  const [newUser, setNewUser] = useState("");

  const {
    isPending,
    isError,
    data: experiences,
  } = trpc.experience.listExperiences.useQuery(
    { user: "", usingLocalAssets },
    { enabled: uiStore.showingUserPickerModal }
  );

  const usersWithDuplicates = (experiences ?? [])
    .map((experience) => experience.split("-")[0] || "")
    .filter((user) => !!user);
  const users = Array.from(new Set(usersWithDuplicates));

  const onClose = action(() => (uiStore.showingUserPickerModal = false));

  if (isError) return null;

  return (
    <>
      <Button
        variant="ghost"
        onClick={action(() => (uiStore.showingUserPickerModal = true))}
        leftIcon={<FaUser />}
        size="xs"
      >
        {user || "Log in"}
      </Button>

      <Modal isOpen={uiStore.showingUserPickerModal} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            Time to &quot;log in&quot; {isPending && <Spinner />}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack alignItems="center">
              {!isPending &&
                users.map((user) => (
                  <Button
                    key={user}
                    leftIcon={<FaUser />}
                    width="100%"
                    onClick={action(() => {
                      store.user = user;
                      store.uiStore.showPendingModal();
                      onClose();
                    })}
                  >
                    {user}
                  </Button>
                ))}
            </VStack>

            <Text my={4}>Click a name above or type a new name:</Text>
            <HStack>
              <Input
                value={newUser}
                onChange={(e) => setNewUser(e.target.value)}
              />
              <Button
                isDisabled={!newUser}
                onClick={action(() => {
                  store.user = newUser;
                  store.newExperience();
                  onClose();
                })}
              >
                Create
              </Button>
            </HStack>
          </ModalBody>
          <ModalFooter />
        </ModalContent>
      </Modal>
    </>
  );
});
