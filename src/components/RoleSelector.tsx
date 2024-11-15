import { Button, Menu, MenuButton, MenuItem, MenuList } from "@chakra-ui/react";
import { FaCaretDown } from "react-icons/fa";
import { useStore } from "@/src/types/StoreContext";
import { action } from "mobx";
import { observer } from "mobx-react-lite";
import { useRouter } from "next/router";

export const RoleSelector = observer(function RoleSelector() {
  const store = useStore();
  const router = useRouter();
  return (
    <Menu computePositionOnMount size="xs">
      <MenuButton
        as={Button}
        px={1}
        py={0}
        variant="ghost"
        size="xs"
        transition="all 0.2s"
        borderRadius="md"
        _hover={{ bg: "gray.500" }}
        _focus={{ boxShadow: "outline" }}
        rightIcon={<FaCaretDown />}
      >
        Role: {store.roleText}
      </MenuButton>
      <MenuList zIndex={12}>
        <MenuItem
          onClick={action(() => {
            store.role = "emcee";
            router.push("/");
          })}
        >
          Emcee
        </MenuItem>
        <MenuItem
          onClick={action(() => {
            store.role = "experience creator";
            router.push(`/experience/${store.experienceName || "untitled"}`);
          })}
        >
          Experience creator
        </MenuItem>
        <MenuItem
          onClick={action(() => {
            store.role = "vj";
            router.push("/playground");
          })}
        >
          VJ
        </MenuItem>
      </MenuList>
    </Menu>
  );
});
