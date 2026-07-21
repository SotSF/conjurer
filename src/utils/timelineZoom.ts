/** Label/tick density for Wavesurfer's TimelinePlugin, tuned to pixels-per-second. */
export function getTimelineLabelIntervals(pixelsPerSecond: number) {
  // Aim for roughly readable spacing (~40–100px between notches)
  if (pixelsPerSecond >= 100)
    return {
      timeInterval: 0.25,
      secondaryLabelInterval: 1,
      primaryLabelInterval: 5,
    };
  if (pixelsPerSecond >= 50)
    return {
      timeInterval: 0.5,
      secondaryLabelInterval: 1,
      primaryLabelInterval: 5,
    };
  if (pixelsPerSecond >= 25)
    return {
      timeInterval: 1,
      secondaryLabelInterval: 5,
      primaryLabelInterval: 10,
    };
  if (pixelsPerSecond >= 12)
    return {
      timeInterval: 2,
      secondaryLabelInterval: 10,
      primaryLabelInterval: 30,
    };
  if (pixelsPerSecond >= 6)
    return {
      timeInterval: 5,
      secondaryLabelInterval: 15,
      primaryLabelInterval: 30,
    };
  return {
    timeInterval: 15,
    secondaryLabelInterval: 30,
    primaryLabelInterval: 60,
  };
}
