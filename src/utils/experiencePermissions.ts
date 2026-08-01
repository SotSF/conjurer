import type { FullUser } from "@/src/types/User";

export function canUpdateExperienceStatus(
  me: FullUser | null,
  experienceUserId: number,
) {
  if (!me) return false;
  return me.id === experienceUserId || me.isAdmin;
}
