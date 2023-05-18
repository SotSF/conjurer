import useAxios from "axios-hooks";
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
  useDisclosure,
} from "@chakra-ui/react";
import { FaUser } from "react-icons/fa";
import { useStore } from "@/src/types/StoreContext";
import { action } from "mobx";
import { observer } from "mobx-react-lite";

export const UserPicker = observer(function UserPicker() {
  const store = useStore();

  const { isOpen, onOpen, onClose } = useDisclosure({});

  const [newUser, setNewUser] = useState("");

  const [{ data, loading }, refetch] = useAxios(
    { url: "/api/users" },
    { useCache: false, manual: true }
  );

  let users: string[] = [];
  if (data) users = data.users.map((row: any) => row.name);

  const [, createUser] = useAxios(
    {
      url: "/api/users",
      method: "POST",
    },
    { manual: true }
  );

  return (
    <>
      <Button
        variant="ghost"
        onClick={() => {
          refetch();
          onOpen();
        }}
        leftIcon={<FaUser />}
        size="xs"
      >
        {store.user || "Log in"}
      </Button>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Time to &quot;log in&quot;</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack alignItems="center">
              {loading ? (
                <Spinner />
              ) : (
                users.map((user) => (
                  <Button
                    key={user}
                    leftIcon={<FaUser />}
                    width="100%"
                    onClick={action(() => {
                      store.user = user;
                      onClose();
                    })}
                  >
                    {user}
                  </Button>
                ))
              )}
            </VStack>

            <Text my={4}>Click a name above or type a new name:</Text>
            <HStack>
              <Input
                value={newUser}
                onChange={(e) => setNewUser(e.target.value)}
              />
              <Button
                disabled={!newUser}
                onClick={action(async () => {
                  if (!newUser) return;

                  await createUser({ data: { name: newUser } });
                  store.user = newUser;
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
