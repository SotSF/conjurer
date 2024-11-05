export const CONJURER_USER_ID = -1;
export const MY_EXPERIENCES_SMART_PLAYLIST = {
  id: -10,
  name: "My Experiences",
  description:
    "This is an auto-generated playlist of all the experiences you've created.",
  user: {
    id: CONJURER_USER_ID,
    username: "conjurer",
  },
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
