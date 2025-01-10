import type { Store } from "@/src/types/Store";
import {
  CommandSpec,
  ConjurerAPIMessage,
  ConjurerAPIStateMessage,
  ExtraStateData,
} from "@/src/types/ConjurerAPIMessage";
import { PatternParam } from "@/src/types/PatternParams";

export const handleConjurerAPIMessage = (
  store: Store,
  message: ConjurerAPIMessage,
  sendConjurerStateUpdate: (store: Store) => void,
) => {
  if (message.event === "request_state") {
    // console.log("Received request for state");
    sendConjurerStateUpdate(store);
  } else if (message.event === "select_mode") {
    // console.log("Selected mode", message.data.mode);
    store.role = message.data.mode;
  } else if (message.event === "command") {
    // console.log("Received command", message.data.command);

    // role-agnostic commands
    if (message.data.command === "toggle_send_data") {
      store.toggleSendingData();
    } else if (message.data.command === "toggle_playing") {
      store.togglePlaying();
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
      } else if (message.data.command === "restart") {
        store.audioStore.setTimeWithCursor(0);
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

export const generateConjurerAPIStateMessage = (
  store: Store,
): ConjurerAPIStateMessage => {
  const extraData: ExtraStateData = {};

  // role-agnostic commands
  const commands: CommandSpec[] = [
    { name: "toggle_send_data", params: [] },
    { name: "toggle_playing", params: [] },
  ];
  if (store.role === "emcee") {
    // emcee-specific commands
    commands.push(
      { name: "toggle_send_data", params: [] },
      { name: "toggle_playing", params: [] },
      { name: "shuffle", params: [] },
      { name: "loop_all", params: [] },
      { name: "restart", params: [] },
      { name: "next_track", params: [] },
      { name: "previous_track", params: [] },
    );
  } else if (store.role === "vj") {
    // vj-specific commands and extra data
    commands.push(
      { name: "toggle_send_data", params: [] },
      { name: "toggle_playing", params: [] },
      { name: "next_pattern", params: [] },
      { name: "previous_pattern", params: [] },
      { name: "add_effect", params: [{ name: "string" }] },
      { name: "remove_effect", params: [{ name: "string" }] },
      {
        name: "update_parameter",
        params: [{ name: "string", value: "number" }],
      },
    );
    extraData["patterns_available"] = store.playgroundStore.patternBlocks.map(
      (block) => block.pattern.name,
    );
    extraData["effects_available"] = store.playgroundStore.effectBlocks.map(
      (block) => block.pattern.name,
    );

    const numericParams = Object.entries(
      store.playgroundStore.selectedPatternBlock.pattern.params,
    ).filter(([, paramData]) => typeof paramData.value === "number") as [
      string,
      PatternParam<number>,
    ][];
    const params: Record<string, PatternParam<number>> = {};
    for (const [uniformName, paramData] of numericParams) {
      params[uniformName] = { name: paramData.name, value: paramData.value };
      if (typeof paramData.min === "number")
        params[uniformName].min = paramData.min;
      if (typeof paramData.max === "number")
        params[uniformName].max = paramData.max;
      if (typeof paramData.step === "number")
        params[uniformName].step = paramData.step;
    }

    extraData["current_pattern"] = {
      name: store.playgroundStore.selectedPatternBlock.pattern.name,
      params,
    };
  }

  return {
    event: "conjurer_state_update",
    data: {
      browser_tab_state: "connected",
      modes_available: ["emcee", "experienceCreator", "vj"],
      current_mode: { name: store.role, commands, ...extraData },
    },
  };
};
