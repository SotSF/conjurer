import { Pattern } from "@/src/types/Pattern";
import logSpirals from "@/src/patterns/shaders/logSpirals.frag";

export { logSpirals };
export const LogSpirals = () =>
  new Pattern("Log Spirals", logSpirals, {
    u_spikeMotionTimeScalingFactor: {
      name: "spikeMotionTimeScalingFactor",
      value: -0.4,
    },
    u_globalTimeFactor: {
      name: "globalTimeFactor",
      value: 1.2,
    },
    u_repetitionsPerSpiralTurn: {
      name: "repetitionsPerSpiralTurn",
      value: 14,
    },
    u_primaryOscPeriod: {
      name: "primaryOscPeriod",
      value: 15,
    },
    u_distCutoff: {
      name: "distCutoff",
      value: 1.5,
    },
    u_colorRangeStart: {
      name: "colorRangeStart",
      value: 0.55,
    },
    u_colorRangeWidth: {
      name: "colorRangeWidth",
      value: 0.35,
    },
    u_waveOffset: {
      name: "waveOffset",
      value: 0.0172,
    },
    u_baseAmplitude: {
      name: "baseAmplitude",
      value: 0.04,
    },
    u_spiralGrowthFactor: {
      name: "spiralGrowthFactor",
      value: 0.1,
    },
    u_spiralTightness: {
      name: "spiralTightness",
      value: 0.35,
    },
    u_colorIterations: {
      name: "colorIterations",
      value: 32,
    },
    u_spiralCount: {
      name: "spiralCount",
      value: 4,
    },
  });
