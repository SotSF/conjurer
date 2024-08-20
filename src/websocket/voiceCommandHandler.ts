import { Store } from "@/src/types/Store";
import { VoiceCommandActionMessage } from "@/src/types/VoiceCommandMessage";
import { MAX_TIME } from "@/src/utils/time";
import { action } from "mobx";

export const handleVoiceCommandActionMessage = action(
  (store: Store, message: VoiceCommandActionMessage) => {
    console.log("Action received: ", message);

    const { action } = message;
    if (action === "togglePlay") {
      store.togglePlaying();
    } else if (action === "goToBeginning") {
      store.audioStore.setTimeWithCursor(0);
    } else if (action === "goToEnd") {
      store.audioStore.setTimeWithCursor(MAX_TIME);
      store.pause();
    } else if (action === "selectLayer") {
      if (message.value < 1 || message.value > store.layers.length) return;
      store.selectedLayer = store.layers[message.value - 1];
    }
  }
);
