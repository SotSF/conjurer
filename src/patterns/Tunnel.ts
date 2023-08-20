import { Pattern } from "@/src/types/Pattern";
import tunnel from "./shaders/tunnel.frag";

export { tunnel };
export const Tunnel = () =>
  new Pattern("Tunnel", tunnel, {
    u_time_factor: {
      name: "Time Factor",
      value: 1,
      min: -5,
      max: 5,
    },
    u_time_offset: {
      name: "Time Offset",
      value: 0,
      min: -5,
      max: 5,
    },
    u_max_space: {
      name: "Max Space",
      value: 0,
    },
    u_max_depth_spacing: {
      name: "Max Depth Spacing",
      value: 0,
    },
    u_nucleus_size: {
      name: "Nucleus Size",
      value: 0.5,
    },
    u_permanent_gap: {
      name: "Permanent Gap",
      value: 0,
    },
    u_gap_factor: {
      name: "Gap Factor",
      value: 1,
    },
  });
