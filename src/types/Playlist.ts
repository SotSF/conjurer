import { CONJURER_USER } from "@/src/types/User";

export const MY_EXPERIENCES_SMART_PLAYLIST = {
  id: -10,
  slug: "mine",
  name: "Experiences by X",
  description:
    "This is an auto-generated playlist of all the experiences you've created.",
  user: CONJURER_USER,
} as const;

export const ALL_FINISHED_SMART_PLAYLIST = {
  id: -11,
  slug: "welcome",
  name: "Welcome to Conjurer",
  description:
    "This is an auto-generated playlist of everyone's finished experiences. Enjoy!",
  user: CONJURER_USER,
} as const;

const SMART_PLAYLISTS = [
  MY_EXPERIENCES_SMART_PLAYLIST,
  ALL_FINISHED_SMART_PLAYLIST,
] as const;

/** Encode a playlist id for `?playlist=` — smart playlists use slugs, not negative ids. */
export const playlistToQueryParam = (id: number): string =>
  SMART_PLAYLISTS.find((playlist) => playlist.id === id)?.slug ?? String(id);

/** Decode a `?playlist=` value back to a numeric playlist id. */
export const queryParamToPlaylistId = (param: string): number | null => {
  const smart = SMART_PLAYLISTS.find((playlist) => playlist.slug === param);
  if (smart) return smart.id;
  const id = Number(param);
  return Number.isFinite(id) ? id : null;
};

export type Playlist = {
  id: number;
  name: string;
  description: string;
  orderedExperienceIds: number[];
  user: {
    id: number;
    username: string;
  };
};

export type PlaylistWithExperiences = {
  id: number;
  name: string;
  description: string;
  orderedExperienceIds: number[];
  user: {
    id: number;
    username: string;
  };
  experiences: {
    id: number;
    name: string;
    status: string;
    song: {
      id: number;
      name: string;
      artist: string;
    };
  }[];
};
