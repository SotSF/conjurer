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
