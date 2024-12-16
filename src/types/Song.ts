import type { SelectSong } from "@/src/db/schema";

export type Song = SelectSong;

export const NO_SONG = {
  id: -1,
  name: "No song selected",
  artist: "",
  filename: "",
  createdAt: "",
  updatedAt: "",
} as const satisfies Song;
