export type ConjurerAPIStateMessage = {
  event: "conjurer_state_update";
  browser_tab_state: "connected";
};

export type ConjurerAPIMessage = ConjurerAPIStateMessage;
