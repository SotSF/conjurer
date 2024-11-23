import { CONJURER_USER } from "@/src/types/User";

export const MY_EXPERIENCES_SMART_PLAYLIST = {
  id: -10,
  name: "Experiences by X",
  description:
    "This is an auto-generated playlist of all the experiences you've created.",
  user: CONJURER_USER,
} as const;

export const ALL_FINISHED_SMART_PLAYLIST = {
  id: -11,
  name: "Welcome to Conjurer",
  description:
    "This is an auto-generated playlist of everyone's finished experiences. Enjoy!",
  user: CONJURER_USER,
} as const;

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
