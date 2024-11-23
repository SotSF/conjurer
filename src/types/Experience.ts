import { Song } from "@/src/types/Song";
import { User } from "@/src/types/User";

export const EXPERIENCE_VERSION = 1;

export const EXPERIENCE_STATUSES = ["inprogress", "complete"] as const;
export type ExperienceStatus = (typeof EXPERIENCE_STATUSES)[number];

export type Experience = {
  id: number | undefined;
  name: string;
  user: User;
  song: Song;
  status: ExperienceStatus;
  version: number;
  data?: any;
  thumbnailURL: string;
};
