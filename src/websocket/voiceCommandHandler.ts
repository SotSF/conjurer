import { Store } from "@/src/types/Store";
import { VoiceCommandActionMessage } from "@/src/types/VoiceCommandMessage";
import { MAX_TIME } from "@/src/utils/time";
import { action } from "mobx";

export const handleVoiceCommandActionMessage = action(
  (store: Store, message: VoiceCommandActionMessage) => {
    console.log("Action received: ", message);

    if (message.action === "togglePlay") store.togglePlaying();
    else if (message.action === "goToBeginning")
      store.audioStore.setTimeWithCursor(0);
    else if (message.action === "goToEnd") {
      store.audioStore.setTimeWithCursor(MAX_TIME);
      store.pause();
    }
  }
);
