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

    if (store.role === "emcee") {
      if (message.data.command === "next_track") {
        store.playlistStore.playNextExperience();
      } else if (message.data.command === "previous_track") {
        store.playlistStore.playPreviousExperience();
      } else if (message.data.command === "toggle_playing") {
        store.togglePlaying();
      } else if (message.data.command === "shuffle") {
        store.playlistStore.shufflingPlaylist =
          !store.playlistStore.shufflingPlaylist;
      } else if (message.data.command === "loop_all") {
        store.playlistStore.loopingPlaylist =
          !store.playlistStore.loopingPlaylist;
      } else if (message.data.command === "restart") {
        store.audioStore.setTimeWithCursor(0);
      }
    }

    if (store.role === "vj") {
      if (message.data.command === "update_parameter") {
        store.playgroundStore.setParameterValues(message.data.params);
      }
    }
  }
};
