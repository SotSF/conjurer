import { useEffect, useRef } from "react";

import { Block } from "@/src/types/Block";
import { ExtraParams } from "@/src/types/PatternParams";
import { getVjFirstNonJumpyScalarUniform } from "@/src/utils/vjFirstNonJumpyScalarUniform";
import { setBlockScalarParameterValue } from "@/src/utils/setBlockScalarParameterValue";

/** Set to `true` to log each MIDI message to the console. */
const DEBUG = true;

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

/** High nibble of status byte → human-readable MIDI 1.0 channel voice message name. */
function midiStatusHighName(hi: number): string {
  switch (hi) {
    case 0x80:
      return "Note Off";
    case 0x90:
      return "Note On";
    case 0xa0:
      return "Polyphonic Key Pressure";
    case 0xb0:
      return "Control Change (CC)";
    case 0xc0:
      return "Program Change";
    case 0xd0:
      return "Channel Pressure";
    case 0xe0:
      return "Pitch Bend";
    default:
      return `Unknown (0x${hi.toString(16).padStart(2, "0")})`;
  }
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
      if (
        status === undefined ||
        controller === undefined ||
        value === undefined
      )
        return;

      const hi = status & 0xf0;

      if (DEBUG) {
        const channel = (status & 0x0f) + 1; // MIDI channels are 1–16 in UI; wire format is 0–15
        const input = event.target as MIDIInput | null;
        const rawHex = Array.from(data)
          .map((b) => b.toString(16).padStart(2, "0"))
          .join(" ");

        const midiLog: Record<string, unknown> = {
          portName: input?.name ?? "(unknown)",
          portId: input?.id,
          channel,
          message: midiStatusHighName(hi),
          statusByte: `0x${status.toString(16).padStart(2, "0")}`,
          rawHex,
          timeStampMs: event.timeStamp,
        };

        if (hi === 0x80 || hi === 0x90) {
          midiLog.note = controller;
          midiLog.velocity = value;
        } else if (hi === 0xb0) {
          // CC: second byte is the controller number (which knob/slider/function); third is value 0–127
          midiLog.ccNumber = controller;
          midiLog.ccValue = value;
          midiLog.ccHint =
            "CC number = which controller on the device (0–127); value is usually 0–127.";
        } else if (hi === 0xe0) {
          midiLog.pitchBend14 = (value << 7) | controller;
        } else if (hi === 0xc0) {
          midiLog.program = controller;
        } else {
          midiLog.data1 = controller;
          midiLog.data2 = value;
        }

        console.log(`[MIDI]\n${JSON.stringify(midiLog, null, 2)}`);
      }
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
