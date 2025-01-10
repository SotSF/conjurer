import type { Store } from "@/src/types/Store";
import { ConjurerAPIMessage } from "@/src/types/ConjurerAPIMessage";

export const handleConjurerAPIMessage = (
  store: Store,
  message: ConjurerAPIMessage,
) => {
  if (message.event === "select_mode") {
    console.log("Selected mode", message.data.mode);
    store.role = message.data.mode;
  } else if (message.event === "command") {
    console.log("Received command", message.data.command);

    // role-agnostic commands
    if (message.data.command === "toggle_send_data") {
      store.toggleSendingData();
    } else if (message.data.command === "toggle_playing") {
      store.togglePlaying();
    } else if (message.data.command === "restart") {
      store.audioStore.setTimeWithCursor(0);
    }

    // emcee-specific commands
    if (store.role === "emcee") {
      if (message.data.command === "shuffle") {
        store.playlistStore.shufflingPlaylist =
          !store.playlistStore.shufflingPlaylist;
      } else if (message.data.command === "loop_all") {
        store.playlistStore.loopingPlaylist =
          !store.playlistStore.loopingPlaylist;
      } else if (message.data.command === "next_track") {
        store.playlistStore.playNextExperience();
      } else if (message.data.command === "previous_track") {
        store.playlistStore.playPreviousExperience();
      }
    }

    // vj-specific commands
    if (store.role === "vj") {
      if (message.data.command === "update_parameter") {
        store.playgroundStore.setParameterValues(message.data.params);
      } else if (message.data.command === "next_pattern") {
        store.playgroundStore.nextPattern();
      } else if (message.data.command === "previous_pattern") {
        store.playgroundStore.previousPattern();
      } else if (message.data.command === "add_effect") {
        store.playgroundStore.addEffects(
          message.data.params.map((p) => p.name),
        );
      } else if (message.data.command === "remove_effect") {
        store.playgroundStore.removeEffects(
          message.data.params.map((p) => p.name),
        );
      }
    }
  }
};
