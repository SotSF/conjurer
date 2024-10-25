import type { SelectSong } from "@/src/db/schema";

export class Song implements SelectSong {
  id: number;
  name: string;
  artist: string;
  filename: string;
  createdAt: string;
  updatedAt: string;

  constructor(song: Partial<SelectSong>) {
    this.id = song.id ?? -1;
    this.name = song.name ?? "";
    this.artist = song.artist ?? "";
    this.filename = song.filename ?? "";
    this.createdAt = song.createdAt ?? "";
    this.updatedAt = song.updatedAt ?? "";
  }
}

export const NO_SONG = new Song({ id: -1, name: "No song selected" });
