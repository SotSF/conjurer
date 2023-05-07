import { FlatVariation } from "@/src/types/Variations/FlatVariation";
import { LinearVariation } from "@/src/types/Variations/LinearVariation";
import { LinearVariation4 } from "@/src/types/Variations/LinearVariation4";
import { SineVariation } from "@/src/types/Variations/SineVariation";
import { SplineVariation } from "@/src/types/Variations/SplineVariation";
import { Variation } from "@/src/types/Variations/Variation";

export const deserializeVariation = (data: any): Variation => {
  switch (data.type) {
    case "flat":
      return FlatVariation.deserialize(data);
    case "linear":
      return LinearVariation.deserialize(data);
    case "sine":
      return SineVariation.deserialize(data);
    case "spline":
      return SplineVariation.deserialize(data);
    case "linear4":
      return LinearVariation4.deserialize(data);
    default:
      throw new Error(
        `Need to implement deserialization for variation type: ${data.type}`
      );
  }
};
