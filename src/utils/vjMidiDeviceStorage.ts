const STORAGE_KEY_CONFIGS = "conjurer:vjMidi:deviceConfigs";
const STORAGE_KEY_LAST_PORT = "conjurer:vjMidi:lastPortName";

export type VjMidiDeviceMapping = {
  portName: string;
  /** Ordered CC numbers: index i maps to the i-th scalar slider in the pattern panel. */
  ccNumbers: number[];
};

export type VjMidiDeviceConfigsFile = {
  /** portName (MIDIInput.name) → ordered CC list */
  byPortName: Record<string, { ccNumbers: number[] }>;
  lastPortName: string | null;
};

function safeParse(raw: string | null): VjMidiDeviceConfigsFile | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as unknown;
    if (!v || typeof v !== "object") return null;
    const o = v as Record<string, unknown>;
    const byPortName = o.byPortName;
    const lastPortName = o.lastPortName;
    if (typeof byPortName !== "object" || byPortName === null) return null;
    const out: Record<string, { ccNumbers: number[] }> = {};
    for (const [k, val] of Object.entries(byPortName)) {
      if (!val || typeof val !== "object") continue;
      const cc = (val as { ccNumbers?: unknown }).ccNumbers;
      if (!Array.isArray(cc)) continue;
      const nums = cc.filter((n): n is number => typeof n === "number" && n >= 0 && n <= 127);
      out[k] = { ccNumbers: nums };
    }
    return {
      byPortName: out,
      lastPortName: typeof lastPortName === "string" ? lastPortName : null,
    };
  } catch {
    return null;
  }
}

export function loadVjMidiDeviceConfigsFromStorage(): VjMidiDeviceConfigsFile {
  const fromConfigs = safeParse(
    typeof localStorage !== "undefined"
      ? localStorage.getItem(STORAGE_KEY_CONFIGS)
      : null,
  );
  if (fromConfigs) return fromConfigs;

  const legacyPort =
    typeof localStorage !== "undefined"
      ? localStorage.getItem(STORAGE_KEY_LAST_PORT)
      : null;

  return {
    byPortName: {},
    lastPortName: legacyPort || null,
  };
}

export function saveVjMidiDeviceConfigsToStorage(file: VjMidiDeviceConfigsFile): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(STORAGE_KEY_CONFIGS, JSON.stringify(file));
  if (file.lastPortName) {
    localStorage.setItem(STORAGE_KEY_LAST_PORT, file.lastPortName);
  }
}

/** Current mapping for MIDI CC routing (last selected device + its CC list). */
export function mappingFromStorageFile(
  file: VjMidiDeviceConfigsFile,
): VjMidiDeviceMapping {
  const name = file.lastPortName;
  if (!name) return { portName: "", ccNumbers: [] };
  const entry = file.byPortName[name];
  return {
    portName: name,
    ccNumbers: entry?.ccNumbers ?? [],
  };
}
