import { Store } from "@/src/types/Store";
import { VoiceCommandActionMessage } from "@/src/types/VoiceCommandMessage";
import { convertSpokenTimeToSeconds } from "@/src/utils/spoken";
import { MAX_TIME } from "@/src/utils/time";
import { action } from "mobx";
import { clamp } from "three/src/math/MathUtils";

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
    } else if (action === "goToTime") {
      const time = clamp(
        convertSpokenTimeToSeconds(message.value),
        0,
        MAX_TIME
      );
      store.audioStore.setTimeWithCursor(time);
    }
  }
);
