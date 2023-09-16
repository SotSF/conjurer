// Source: http://joesul.li/van/beat-detection-using-web-audio/

// Function to identify peaks
export function getPeaksAtThreshold(data: Float32Array, threshold: number) {
  const peaksArray = [];
  const length = data.length;
  for (let i = 0; i < length; ) {
    if (data[i] > threshold) {
      peaksArray.push(i);
      // Skip forward ~ 1/4s to get past this peak.
      i += 1000;
    }
    i++;
  }
  return peaksArray;
}

// Function used to return a histogram of peak intervals
export function countIntervalsBetweenNearbyPeaks(
  peaks: number[],
  roundFactor: number
) {
  const intervalCounts: { interval: number; count: number }[] = [];
  peaks.forEach((peak, index) => {
    for (let i = 0; i < 10; i++) {
      const interval =
        Math.round((peaks[index + i] - peak) / roundFactor) * roundFactor;
      const foundInterval = intervalCounts.some(function (intervalCount) {
        if (intervalCount.interval === interval) return intervalCount.count++;
      });
      if (!foundInterval) {
        intervalCounts.push({
          interval: interval,
          count: 1,
        });
      }
    }
  });
  return intervalCounts;
}
