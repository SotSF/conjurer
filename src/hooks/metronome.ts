import { useEffect } from "react";
import { useStore } from "@/src/types/StoreContext";

const SCHEDULER_INTERVAL_MS = 25;
const LOOKAHEAD_SECONDS = 0.15;
// Re-anchor when the playhead disagrees with the projected position by more
// than this, which is what a seek or a rate change looks like from here.
const RESYNC_THRESHOLD_SECONDS = 0.05;

const playClick = (
  audioContext: AudioContext,
  destination: AudioNode,
  when: number,
  accented: boolean,
) => {
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.frequency.value = accented ? 1600 : 1000;
  gain.gain.setValueAtTime(0, when);
  gain.gain.linearRampToValueAtTime(accented ? 0.45 : 0.25, when + 0.002);
  gain.gain.exponentialRampToValueAtTime(0.0001, when + 0.05);
  oscillator.connect(gain);
  gain.connect(destination);
  oscillator.start(when);
  oscillator.stop(when + 0.06);
};

/**
 * Click track on the beat grid — the fastest way to tell whether the grid
 * actually matches the music.
 *
 * Clicks are scheduled ahead of the playhead on the audio clock rather than
 * fired from a timer, so they land sample-accurately, and they are routed
 * through the same delay node as the song. Sending them straight to the
 * destination instead would make the click lead the music by the configured
 * audio latency, and anyone trusting their ears would then "fix" a grid that
 * was already correct.
 */
export const useMetronome = () => {
  const store = useStore();
  const { audioStore, beatGridStore } = store;
  const { metronomeEnabled, grid } = beatGridStore;
  const { audioContext, delayNode, playbackRate } = audioStore;
  const playing = store.playing;

  useEffect(() => {
    if (!metronomeEnabled || !playing || !audioContext) return;

    const destination: AudioNode = delayNode ?? audioContext.destination;
    let anchor: { songTime: number; contextTime: number } | null = null;
    let nextBeat = 0;

    const schedule = () => {
      const contextNow = audioContext.currentTime;
      const songNow = audioStore.globalTime;

      const projected = anchor
        ? anchor.songTime + (contextNow - anchor.contextTime) * playbackRate
        : Infinity;
      if (Math.abs(projected - songNow) > RESYNC_THRESHOLD_SECONDS) {
        anchor = { songTime: songNow, contextTime: contextNow };
        nextBeat = Math.ceil(grid.timeToBeat(songNow));
      }
      if (!anchor) return;

      const horizon = songNow + LOOKAHEAD_SECONDS;
      // Bounded so a pathological grid can't spin here forever.
      for (let i = 0; i < 64; i++) {
        const beatTime = grid.beatToTime(nextBeat);
        if (beatTime > horizon) break;
        const when =
          anchor.contextTime + (beatTime - anchor.songTime) / playbackRate;
        if (when > contextNow)
          playClick(audioContext, destination, when, grid.isBarStart(nextBeat));
        nextBeat++;
      }
    };

    schedule();
    const interval = setInterval(schedule, SCHEDULER_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [
    metronomeEnabled,
    playing,
    audioContext,
    delayNode,
    playbackRate,
    grid,
    audioStore,
  ]);
};
