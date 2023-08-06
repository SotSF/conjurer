import { Pattern } from "@/src/types/Pattern";
import logSpirals from "@/src/patterns/shaders/logSpirals.frag";

export { logSpirals };
export const LogSpirals = () =>
  new Pattern("Log Spirals", logSpirals, {
    u_spikeMotionTimeScalingFactor: {
      name: "spikeMotionTimeScalingFactor",
      value: -0.4,
      min: -1,
      max: 1,
      step: 0.01,
    },
    u_globalTimeFactor: {
      name: "globalTimeFactor",
      value: 1.2,

      min: 0,
      max: 5,
      step: 0.01,
    },
    u_repetitionsPerSpiralTurn: {
      name: "repetitionsPerSpiralTurn",
      value: 14,
      min: 1,
      max: 30,
      step: 1,
    },
    u_primaryOscPeriod: {
      name: "primaryOscPeriod",
      value: 15,
      min: 0,
      max: 30,
      step: 0.1,
    },
    u_distCutoff: {
      name: "distCutoff",
      value: 1.5,
      min: 0,
      max: 5,
      step: 0.01,
    },
    u_colorRangeStart: {
      name: "colorRangeStart",
      value: 0.55,
      min: 0,
      max: 1,
      step: 0.01,
    },
    u_colorRangeWidth: {
      name: "colorRangeWidth",
      value: 0.35,
      min: 0,
      max: 1,
      step: 0.01,
    },
    u_waveOffset: {
      name: "waveOffset",
      value: 0.0172,
      min: 0.001,
      max: 0.035,
      step: 0.0001,
    },
    u_baseAmplitude: {
      name: "baseAmplitude",
      value: 0.04,
      min: 0,
      max: 0.5,
      step: 0.01,
    },
    u_spiralGrowthFactor: {
      name: "spiralGrowthFactor",
      value: 0.1,
      min: 0.01,
      max: 1,
      step: 0.01,
    },
    u_spiralTightness: {
      name: "spiralTightness",
      value: 0.35,
      min: 0,
      max: 1,
      step: 0.01,
    },
    u_colorIterations: {
      name: "colorIterations",
      value: 32,
      min: 1,
      max: 100,
      step: 1,
    },
    u_spiralCount: {
      name: "spiralCount",
      value: 4,
      min: 1,
      max: 10,
      step: 1,
    },
  });
