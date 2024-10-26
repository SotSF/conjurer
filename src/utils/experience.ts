// Experience filename format: <user>-<experienceName>.json
export const extractPartsFromExperienceFilename = (
  filename: string
): { user: string; experienceName: string } => {
  const parts = filename.split("-");
  return {
    user: parts[0],
    experienceName: parts.length < 2 ? "untitled" : parts.slice(1).join("-"),
  };
};

// TODO: can be deleted after migration
