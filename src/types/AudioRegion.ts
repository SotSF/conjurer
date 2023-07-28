import { RegionParams } from "wavesurfer.js/dist/plugins/regions";

// Mirrors the RegionParams interface from wavesurfer.js
// This class is useful for serialization and deserialization
export class AudioRegion {
  id: string;
  start: number;
  end?: number;
  drag = false;
  resize = false;
  color = "#ffffff";
  content?: string | HTMLElement;
  minLength?: number;
  maxLength?: number;

  constructor(region: Partial<RegionParams>) {
    this.id = region.id || Math.random().toString(16).slice(2);
    this.start = region.start || 0;
    this.end = region.end;
    this.drag = region.drag || false;
    this.resize = region.resize || false;
    this.color = region.color || "#ffffff";
    this.content = region.content;
    this.minLength = region.minLength;
    this.maxLength = region.maxLength;
  }

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
