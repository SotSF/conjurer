import { useState, useEffect } from "react";
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
import { action, runInAction } from "mobx";
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
    error,
    refetch,
    data: users,
  } = trpc.user.listUsers.useQuery(
    { usingLocalData },
    { enabled: uiStore.showingUserPickerModal, retry: 1 },
  );

  const createUser = trpc.user.createUser.useMutation();

  // Stale localStorage may point at prod DB without Turso credentials configured
  useEffect(() => {
    if (
      !isError ||
      usingLocalData ||
      process.env.NEXT_PUBLIC_NODE_ENV === "production"
    )
      return;
    runInAction(() => {
      store.usingLocalData = true;
    });
  }, [isError, usingLocalData, store]);

  const onClose = action(() => {
    uiStore.showingUserPickerModal = false;
    setNewUsername("");
  });

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
            {isError && usingLocalData && (
              <Text color="red.300" mb={4}>
                Could not load users ({error?.message ?? "unknown error"}).{" "}
                <Button size="xs" variant="link" onClick={() => refetch()}>
                  Retry
                </Button>
              </Text>
            )}
            <VStack alignItems="center">
              {!isPending &&
                (users ?? [])
                  .filter((user) => user.username !== userStore.username)
                  .map((user) => (
                    <Button
                      key={user.id}
                      leftIcon={<FaUser />}
                      width="100%"
                      onClick={action(() => {
                        userStore.setMe(user);
                        if (store.context === "experienceEditor") {
                          uiStore.showingOpenExperienceModal = true;
                          experienceStore.openEmptyExperience(router);
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
                  userStore.setMe(newUser);
                  if (store.context === "experienceEditor") {
                    experienceStore.openEmptyExperience(router);
                  }
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
