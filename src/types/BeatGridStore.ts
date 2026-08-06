import { makeAutoObservable, runInAction } from "mobx";
import {
  BeatGrid,
  DEFAULT_BPM,
  GridDivisionId,
  SerializedBeatGrid,
} from "@/src/types/BeatGrid";
import { detectBeatGrid } from "@/src/utils/beatDetection/detectBeatGrid";
import { trpcClient } from "@/src/utils/trpc";
import type { Store } from "@/src/types/Store";
import type { Song } from "@/src/types/Song";
import { NO_SONG } from "@/src/types/Song";

/**
 * How close a drag has to land, in screen pixels, before it is pulled onto the
 * grid. A pixel threshold rather than a time threshold makes snapping
 * zoom-invariant: zoomed out everything snaps, zoomed in you can place freely
 * between lines without fighting the magnet.
 */
export const SNAP_THRESHOLD_PX = 12;

export type AnalysisState = "idle" | "analyzing" | "done" | "failed";

type SnapOptions = {
  /** Set while a modifier is held to bypass the grid entirely. */
  freehand?: boolean;
  /** Overrides the timeline zoom for lanes drawn at their own scale. */
  pixelsPerSecond?: number;
};

export class BeatGridStore {
  grid: BeatGrid = BeatGrid.constant(DEFAULT_BPM, 0);

  snapEnabled = true;
  showGrid = false;
  divisionId: GridDivisionId = "1/4";
  /**
   * Transient by design: a click track left on across sessions is a nasty
   * surprise, and it is only ever wanted while checking alignment.
   */
  metronomeEnabled = false;

  analysisState: AnalysisState = "idle";
  /** Id of the song `grid` describes, so a late analysis can be discarded. */
  private gridSongId: number = NO_SONG.id;

  constructor(readonly store: Store) {
    makeAutoObservable(this, { store: false });
  }

  initialize = () => this.loadFromLocalStorage();

  get divisionBeats() {
    return this.grid.divisionBeats(this.divisionId);
  }

  /** Tempo under the playhead — with anchors there is no single song tempo. */
  get bpmAtPlayhead() {
    return this.grid.bpmAt(this.store.audioStore.globalTime);
  }

  get hasMultipleTempos() {
    return !this.grid.isConstant;
  }

  // ================================ snapping ================================

  /**
   * Pull `time` onto the nearest grid line when it is close enough to read as
   * intentional. Returns `time` unchanged when snapping is off, bypassed, or
   * the pointer is nowhere near a line.
   */
  snapTime = (time: number, options: SnapOptions = {}) => {
    if (options.freehand || !this.snapEnabled) return time;
    const pixelsPerSecond =
      options.pixelsPerSecond ?? this.store.uiStore.pixelsPerSecond;
    const snapped = this.grid.quantizeTime(time, this.divisionBeats);
    if (Math.abs(snapped - time) * pixelsPerSecond > SNAP_THRESHOLD_PX)
      return time;
    return snapped;
  };

  /** Snap a delta applied to `origin`, so the moved edge lands on the grid. */
  snapDelta = (origin: number, delta: number, options: SnapOptions = {}) =>
    this.snapTime(origin + delta, options) - origin;

  setDivision = (divisionId: GridDivisionId) => {
    this.divisionId = divisionId;
    this.saveToLocalStorage();
  };

  toggleSnapping = () => {
    this.snapEnabled = !this.snapEnabled;
    this.saveToLocalStorage();
  };

  toggleGrid = () => {
    this.showGrid = !this.showGrid;
    this.saveToLocalStorage();
  };

  toggleMetronome = () => {
    this.metronomeEnabled = !this.metronomeEnabled;
  };

  // ================================ editing =================================

  /** Replace the grid from a UI edit and persist it against the current song. */
  setGrid = (grid: BeatGrid, { persist = true } = {}) => {
    this.grid = grid;
    if (persist) void this.saveToSong();
  };

  // ============================ song lifecycle ==============================

  /**
   * Adopt the grid stored on a song. A song with no stored grid gets a neutral
   * placeholder until analysis replaces it.
   */
  loadForSong = (song: Song) => {
    this.gridSongId = song.id;
    const stored = song.beatGrid as SerializedBeatGrid | null | undefined;
    if (stored?.anchors?.length) {
      this.grid = BeatGrid.deserialize(stored);
      this.analysisState = "done";
      return;
    }
    this.grid = BeatGrid.constant(DEFAULT_BPM, 0);
    this.analysisState = "idle";
  };

  /**
   * Detect tempo and beat positions from decoded audio. Runs off the main
   * thread, and never clobbers a grid a human has edited.
   */
  analyzeAudioBuffer = async (audioBuffer: AudioBuffer, song: Song) => {
    if (song.id === NO_SONG.id) return;
    if (this.analysisState === "analyzing") return;
    // a stored grid is already the answer, and a manual one outranks detection
    if (this.analysisState === "done" || this.grid.source === "manual") return;

    this.analysisState = "analyzing";
    try {
      const detected = await detectBeatGrid(audioBuffer);
      runInAction(() => {
        // the user may have switched songs while this was running
        if (this.gridSongId !== song.id) return;
        if (this.grid.source === "manual") return;
        this.grid = detected;
        this.analysisState = "done";
      });
      if (this.gridSongId === song.id) await this.saveToSong();
    } catch (e) {
      console.error("Beat detection failed:", e);
      runInAction(() => (this.analysisState = "failed"));
    }
  };

  /** Re-run detection from scratch, discarding manual edits. */
  reanalyze = async (audioBuffer: AudioBuffer, song: Song) => {
    this.analysisState = "idle";
    this.grid = BeatGrid.constant(DEFAULT_BPM, 0);
    await this.analyzeAudioBuffer(audioBuffer, song);
  };

  /**
   * Write the grid onto the song row so every experience using that song picks
   * it up. Best-effort: a read-only or offline session still gets a working
   * grid for the current session.
   */
  private saveToSong = async () => {
    const song = this.store.audioStore.selectedSong;
    if (song.id === NO_SONG.id || song.id !== this.gridSongId) return;
    try {
      await trpcClient.song.setBeatGrid.mutate({
        songId: song.id,
        beatGrid: this.grid.serialize(),
        usingLocalData: this.store.usingLocalData,
      });
      runInAction(() => {
        // keep the in-memory song in sync so a re-selection doesn't re-analyze
        this.store.audioStore.patchSelectedSongBeatGrid(this.grid.serialize());
      });
    } catch (e) {
      console.error("Failed to save beat grid:", e);
    }
  };

  // ============================== preferences ===============================
  // Snap/grid settings are per-user editing preferences, not song data, so they
  // live in localStorage next to the other UI settings.

  loadFromLocalStorage = () => {
    if (typeof window === "undefined") return;
    const data = localStorage.getItem("beatGridStore");
    if (!data) return;
    try {
      const settings = JSON.parse(data);
      this.snapEnabled = settings.snapEnabled ?? true;
      this.showGrid = settings.showGrid ?? false;
      this.divisionId = settings.divisionId ?? "1/4";
    } catch {
      // corrupt settings shouldn't stop the editor from loading
    }
  };

  saveToLocalStorage = () => {
    if (typeof window === "undefined") return;
    localStorage.setItem(
      "beatGridStore",
      JSON.stringify({
        snapEnabled: this.snapEnabled,
        showGrid: this.showGrid,
        divisionId: this.divisionId,
      }),
    );
  };
}
