import { generateId } from "@/src/utils/id";
import { RegionParams } from "wavesurfer.js/dist/plugins/regions";

// Mirrors the RegionParams interface from wavesurfer.js
// This class is useful for serialization and deserialization
export class AudioRegion {
  id: string;
  start: number;
  end?: number;
  drag? = false;
  resize? = false;
  color = "#ffffff";
  content?: string | HTMLElement;
  minLength?: number;
  maxLength?: number;

  constructor(region: Partial<RegionParams>) {
    this.id = region.id || generateId();
    this.start = region.start || 0;
    this.end = region.end;
    this.drag = region.drag || false;
    this.resize = region.resize || false;
    this.color = region.color || "#ffffff";
    this.content = region.content;
    this.minLength = region.minLength;
    this.maxLength = region.maxLength;
  }

  withNewContentElement = () => {
    const label = document.createElement("div");
    label.innerHTML =
      typeof this.content === "string"
        ? this.content
        : this.content?.textContent || "";
    label.setAttribute(
      "style",
      "width: fit-content; max-width: 100px; color: white; font-size: 12px; background-color: rgba(1, 1, 1, 0.3);"
    );
    this.content = label;
    return this;
  };

  serialize = () => ({
    id: this.id,
    start: this.start,
    end: this.end,
    color: this.color,
    content:
      typeof this.content === "string"
        ? this.content
        : this.content?.textContent || "",
  });

  static deserialize = (region: any) => new AudioRegion(region);
}
