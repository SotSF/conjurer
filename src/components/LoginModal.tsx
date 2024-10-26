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

export const LoginModal = observer(function LoginModal() {
  const store = useStore();
  const { experienceStore, uiStore, user, usingLocalData } = store;

  const [newUser, setNewUser] = useState("");

  const {
    isPending,
    isError,
    data: users,
  } = trpc.user.listUsers.useQuery(
    { usingLocalData },
    { enabled: uiStore.showingUserPickerModal }
  );

  const createUser = trpc.user.createUser.useMutation();

  const onClose = action(() => {
    uiStore.showingUserPickerModal = false;
    setNewUser("");
  });

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
                users
                  .filter(({ username }) => username !== user)
                  .map((user) => (
                    <Button
                      key={user.id}
                      leftIcon={<FaUser />}
                      width="100%"
                      onClick={action(() => {
                        store.user = user.username;
                        experienceStore.loadEmptyExperience();
                        store.uiStore.showingOpenExperienceModal = true;
                        onClose();
                      })}
                    >
                      {user.username}
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
                isDisabled={
                  !newUser || users?.some((u) => u.username === newUser)
                }
                onClick={action(async () => {
                  await createUser.mutateAsync({
                    usingLocalData,
                    username: newUser,
                  });
                  store.user = newUser;
                  experienceStore.loadEmptyExperience();
                  onClose();
                })}
              >
                {createUser.isPending ? <Spinner /> : "Create"}
              </Button>
            </HStack>
          </ModalBody>
          <ModalFooter />
        </ModalContent>
      </Modal>
    </>
  );
});
