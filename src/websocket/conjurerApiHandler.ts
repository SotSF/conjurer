import { ConjurerAPIMessage } from "@/src/types/ConjurerAPIMessage";
import type { Store } from "@/src/types/Store";

export const handleConjurerAPIMessage = (
  store: Store,
  message: ConjurerAPIMessage,
) => {
  if (message.event === "select_mode") {
    console.log("Selected mode", message.data.mode);
    store.role = message.data.mode;
  } else if (message.event === "command") {
    console.log("Received command", message.data.command);
    if (message.data.command === "next_track") {
      store.playlistStore.playNextExperience();
    }
  }
};
