import { Song } from "@/src/types/Song";

export const EXPERIENCE_VERSION = 1;

export type ExperienceStatus = "inprogress" | "complete";

export type SerialExperience = {
  id: number | undefined;
  name: string;
  song: Song;
  status: ExperienceStatus;
  version: number;
  data: any;
};
