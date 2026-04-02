import { useEffect, useRef } from "react";

import { Block } from "@/src/types/Block";
import { ExtraParams } from "@/src/types/PatternParams";
import { getVjFirstNonJumpyScalarUniform } from "@/src/utils/vjFirstNonJumpyScalarUniform";
import { setBlockScalarParameterValue } from "@/src/utils/setBlockScalarParameterValue";

function value01ToScalar(
  t: number,
  min: number,
  max: number,
  step: number,
): number {
  const raw = min + t * (max - min);
  if (step > 0) {
    const snapped = Math.round(raw / step) * step;
    return Math.min(max, Math.max(min, snapped));
  }
  return Math.min(max, Math.max(min, raw));
}

/** CC data byte 0–127 → scalar range. */
function midi7ToScalar(
  midi: number,
  min: number,
  max: number,
  step: number,
): number {
  return value01ToScalar(midi / 127, min, max, step);
}

/** Pitch bend 14-bit value 0–16383 → scalar range (treats full sweep like a 0–127 knob). */
function midiPitchBendToScalar(
  bend: number,
  min: number,
  max: number,
  step: number,
): number {
  return value01ToScalar(bend / 16383, min, max, step);
}

/**
 * Maps any control change (any CC, any channel) and pitch bend to the first non-jumpy scalar
 * on the given pattern block (same target as the top non-boolean slider in the VJ pattern panel).
 */
export function useVjMidiCcScalar(block: Block<ExtraParams>): void {
  const blockRef = useRef(block);
  blockRef.current = block;

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.requestMIDIAccess) {
      return;
    }

    let access: MIDIAccess | null = null;
    let cancelled = false;

    const handleMessage = (event: MIDIMessageEvent) => {
      const data = event.data;
      if (!data || data.length < 3) return;

      const status = data[0];
      const controller = data[1];
      const value = data[2];
      if (status === undefined || controller === undefined || value === undefined)
        return;

      const hi = status & 0xf0;
      if (hi !== 0xb0 && hi !== 0xe0) return;

      const b = blockRef.current;
      const target = getVjFirstNonJumpyScalarUniform(b);
      if (!target) return;

      const { uniformName, patternParam } = target;
      const min = typeof patternParam.min === "number" ? patternParam.min : 0;
      const max = typeof patternParam.max === "number" ? patternParam.max : 1;
      const step =
        typeof patternParam.step === "number" ? patternParam.step : 0.01;

      const next =
        hi === 0xb0
          ? midi7ToScalar(value, min, max, step)
          : midiPitchBendToScalar((value << 7) | controller, min, max, step);

      setBlockScalarParameterValue(b, uniformName, next);
    };

    const attachAllInputs = () => {
      if (!access) return;
      access.inputs.forEach((input) => {
        input.onmidimessage = handleMessage;
      });
    };

    void navigator
      .requestMIDIAccess({ sysex: false })
      .then((a) => {
        if (cancelled) return;
        access = a;
        attachAllInputs();
        access.onstatechange = () => {
          attachAllInputs();
        };
      })
      .catch(() => {
        /* permission denied or unsupported */
      });

    return () => {
      cancelled = true;
      if (access) {
        access.onstatechange = null;
        access.inputs.forEach((input) => {
          input.onmidimessage = null;
        });
      }
    };
  }, []);
}
