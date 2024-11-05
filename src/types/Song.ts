import type { SelectSong } from "@/src/db/schema";

export type Song = SelectSong;

export const NO_SONG: Song = {
  id: -1,
  name: "No song selected",
  artist: "",
  filename: "",
  createdAt: "",
  updatedAt: "",
};
