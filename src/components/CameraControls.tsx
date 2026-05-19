import dynamic from "next/dynamic";

export const CameraControls = dynamic(
  () =>
    import("@/src/components/CameraControlsInner").then((mod) => ({
      default: mod.CameraControlsInner,
    })),
  { ssr: false },
);
