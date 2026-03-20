/**
 * Single source of truth for VJ "Live" / transmit-to-canopy accent colors.
 * Red is used only while data is actually being sent; otherwise a neutral accent (not green/red).
 */

/** Live pane + xfade-to-live chrome while `store.sendingData` is true. */
export const VJ_LIVE_ACCENT_SENDING = "red.300";

/** Live pane + related controls while not transmitting (preview stays green). */
export const VJ_LIVE_ACCENT_IDLE = "blue.300";

/** Send button background when actively sending (slightly stronger than border accent). */
export const VJ_LIVE_SENDING_BUTTON_BG = "red.500";

export function vjLiveAccent(isSendingData: boolean): string {
  return isSendingData ? VJ_LIVE_ACCENT_SENDING : VJ_LIVE_ACCENT_IDLE;
}

/** Hover border/text for outline controls tied to the live accent. */
export function vjLiveAccentHover(isSendingData: boolean): string {
  return isSendingData ? "red.200" : "blue.200";
}
