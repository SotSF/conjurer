import { EasingVariation } from "@/src/types/Variations/EasingVariation";
import { FlatVariation } from "@/src/types/Variations/FlatVariation";
import { LinearVariation } from "@/src/types/Variations/LinearVariation";
import { LinearVariation4 } from "@/src/types/Variations/LinearVariation4";
import { PaletteVariation } from "@/src/types/Variations/PaletteVariation";
import { PeriodicVariation } from "@/src/types/Variations/PeriodicVariation";
import { SplineVariation } from "@/src/types/Variations/SplineVariation";
import { AudioVariation } from "@/src/types/Variations/AudioVariation";
import { RootStore, Variation } from "@/src/types/Variations/Variation";

export const deserializeVariation = (
  store: RootStore,
  data: any,
): Variation => {
  switch (data.type) {
    case "flat":
      return FlatVariation.deserialize(store, data);
    case "linear":
      return LinearVariation.deserialize(store, data);
    case "periodic":
      return PeriodicVariation.deserialize(store, data);
    case "spline":
      return SplineVariation.deserialize(store, data);
    case "easing":
      return EasingVariation.deserialize(store, data);
    case "audio":
      return AudioVariation.deserialize(store, data);
    case "linear4":
      return LinearVariation4.deserialize(store, data);
    case "palette":
      return PaletteVariation.deserialize(store, data);
    default:
      throw new Error(
        `Need to implement deserialization for variation type: ${data.type}`,
      );
  }
};
