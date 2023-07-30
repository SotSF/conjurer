import {
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
} from "@chakra-ui/react";
import { useStore } from "@/src/types/StoreContext";
import { observer } from "mobx-react-lite";
import { action } from "mobx";
import Link from "next/link";

export const PlaylistEditor = observer(function PlaylistEditor() {
  const store = useStore();
  const { uiStore } = store;
  const { playlistDrawerOpen } = uiStore;

  return "test";
});
