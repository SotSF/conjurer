// Source: http://joesul.li/van/beat-detection-using-web-audio/

// Function to identify peaks
export function getPeaksAtThreshold(
  data: Float32Array,
  threshold: number,
  sampleRate: number,
) {
  const peaksArray = [];
  const length = data.length;
  for (let i = 0; i < length; ) {
    if (data[i] > threshold) {
      peaksArray.push(i);
      // Skip forward 1/10s to get past this peak.
      i += sampleRate / 10;
    }
    i++;
  }
  return peaksArray;
}

// Function used to return a histogram of peak intervals
export function countIntervalsBetweenNearbyPeaks(
  peaks: number[],
  roundFactor: number,
) {
  const intervalCounts: { interval: number; count: number }[] = [];
  peaks.forEach((peak, index) => {
    for (let i = 0; i < 10; i++) {
      const interval =
        Math.round((peaks[index + i] - peak) / roundFactor) * roundFactor;
      if (interval === 0) continue;
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

// Function used to return a histogram of tempo candidates.
export function groupNeighborsByTempo(
  intervalCounts: { interval: number; count: number }[],
  sampleRate: number,
) {
  const tempoCounts: { tempo: number; count: number }[] = [];
  intervalCounts.forEach(
    (intervalCount: { interval: number; count: number }, i: number) => {
      // Convert an interval to tempo
      let theoreticalTempo = 60 / (intervalCount.interval / sampleRate);

      // Adjust the tempo to fit within the 90-180 BPM range
      while (theoreticalTempo < 90) theoreticalTempo *= 2;
      while (theoreticalTempo > 180) theoreticalTempo /= 2;

      const foundTempo = tempoCounts.some(function (tempoCount) {
        if (tempoCount.tempo === theoreticalTempo)
          return (tempoCount.count += intervalCount.count);
      });
      if (!foundTempo) {
        tempoCounts.push({
          tempo: theoreticalTempo,
          count: intervalCount.count,
        });
      }
    },
  );
  return tempoCounts;
}
