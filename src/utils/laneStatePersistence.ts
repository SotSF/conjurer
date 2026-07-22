// Persists which parameter lanes are open (armed) per experience, so a page
// refresh restores the lanes the user was looking at. This is local-only UI
// state — it is intentionally kept out of the serialized experience data.

const KEY = "conjurer-lane-state";

// experienceName -> blockId -> armed uniform names
type LaneState = Record<string, Record<string, string[]>>;

const readAll = (): LaneState => {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}");
  } catch {
    return {};
  }
};

const writeAll = (state: LaneState) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(state));
};

export const saveBlockLanes = (
  experienceName: string,
  blockId: string,
  uniformNames: string[],
) => {
  if (!experienceName) return;
  const state = readAll();
  const forExperience = state[experienceName] ?? {};
  if (uniformNames.length) forExperience[blockId] = uniformNames;
  else delete forExperience[blockId];
  if (Object.keys(forExperience).length) state[experienceName] = forExperience;
  else delete state[experienceName];
  writeAll(state);
};

export const loadBlockLanes = (
  experienceName: string,
  blockId: string,
): string[] => (experienceName && readAll()[experienceName]?.[blockId]) || [];
