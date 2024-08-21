export const convertSpokenTimeToSeconds = (spokenTime: number): number => {
  const minutes = Math.floor(spokenTime / 100);
  const seconds = spokenTime % 100;
  return minutes * 60 + seconds;
};
