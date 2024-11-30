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
import { sanitize } from "@/src/utils/sanitize";
import { CONJURER_USER } from "@/src/types/User";
import { useRouter } from "next/router";

export const LoginButton = observer(function LoginButton() {
  const store = useStore();
  const { experienceStore, uiStore, userStore, usingLocalData } = store;

  const router = useRouter();
  const [newUsername, setNewUsername] = useState("");

  const {
    isPending,
    isError,
    data: users,
  } = trpc.user.listUsers.useQuery(
    { usingLocalData },
    { enabled: uiStore.showingUserPickerModal },
  );

  const createUser = trpc.user.createUser.useMutation();

  const onClose = action(() => {
    uiStore.showingUserPickerModal = false;
    setNewUsername("");
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
        {userStore.username || "Log in"}
      </Button>

      <Modal
        isOpen={uiStore.showingUserPickerModal}
        onClose={onClose}
        isCentered
      >
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
                  .filter((user) => user.username !== userStore.username)
                  .map((user) => (
                    <Button
                      key={user.id}
                      leftIcon={<FaUser />}
                      width="100%"
                      onClick={action(() => {
                        userStore.me = user;
                        experienceStore.openEmptyExperience(router);
                        if (store.context === "experienceEditor") {
                          uiStore.showingOpenExperienceModal = true;
                        }
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
                value={newUsername}
                onChange={(e) => setNewUsername(sanitize(e.target.value))}
              />
              <Button
                isDisabled={
                  !newUsername ||
                  users?.some((u) => u.username === newUsername) ||
                  newUsername === CONJURER_USER.username
                }
                onClick={action(async () => {
                  const newUser = await createUser.mutateAsync({
                    usingLocalData,
                    username: newUsername,
                  });
                  userStore.me = newUser;
                  experienceStore.openEmptyExperience(router);
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
