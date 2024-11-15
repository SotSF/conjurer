import { SelectUser } from "@/src/db/schema";

export type FullUser = SelectUser;
export type User = Pick<FullUser, "id" | "username">;

export const CONJURER_USER = {
  id: -1,
  username: "conjurer",
} satisfies User;
