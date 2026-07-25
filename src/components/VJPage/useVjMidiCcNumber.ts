import type { MutableRefObject } from "react";
import { useEffect, useRef } from "react";

import type { VjMidiDeviceMapping } from "@/src/utils/vjMidiDeviceStorage";
import type { VjMidiNumberTargetWithBlock } from "@/src/utils/vjFirstNonJumpyNumberUniform";
import { setBlockNumberParameterValue } from "@/src/utils/setBlockNumberParameterValue";

function value01ToNumber(
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

/** CC data byte 0–127 → number param range. */
function midi7ToNumber(
  midi: number,
  min: number,
  max: number,
  step: number,
): number {
  return value01ToNumber(midi / 127, min, max, step);
}

/** Pitch bend 14-bit value 0–16383 → number param range (treats full sweep like a 0–127 knob). */
function midiPitchBendToNumber(
  bend: number,
  min: number,
  max: number,
  step: number,
): number {
  return value01ToNumber(bend / 16383, min, max, step);
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

export type VjMidiTargetsFlatRef = MutableRefObject<VjMidiNumberTargetWithBlock[]>;

/**
 * Maps control change and pitch bend to VJ number params (pattern, then enabled effects in order).
 * With a non-empty device mapping ({@link VjMidiDeviceMapping}), only that input's CCs are used:
 * ordered CC list → ordered number params in that flat list. Otherwise any CC / pitch bend from any
 * device targets the first number param in that list only.
 */
export type VjMidiCcLearnState = {
  active: boolean;
  portName: string;
  onLearnCc: (controller: number) => void;
};

export type VjMidiCcLearnRef = MutableRefObject<VjMidiCcLearnState>;

export function useVjMidiCcNumber(
  midiLoggingEnabled: boolean,
  midiMapping: VjMidiDeviceMapping,
  midiCcLearnRef: VjMidiCcLearnRef,
  midiTargetsFlatRef: VjMidiTargetsFlatRef,
): void {
  const midiLoggingRef = useRef(midiLoggingEnabled);
  midiLoggingRef.current = midiLoggingEnabled;
  const midiMappingRef = useRef(midiMapping);
  midiMappingRef.current = midiMapping;

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

      if (midiLoggingRef.current) {
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

      const input = event.target as MIDIInput | null;
      const learn = midiCcLearnRef.current;
      if (learn.active && learn.portName.length > 0) {
        if (hi === 0xb0 && input?.name === learn.portName) {
          learn.onLearnCc(controller);
        }
        return;
      }

      const flat = midiTargetsFlatRef.current;
      const map = midiMappingRef.current;
      const useMapping =
        map.portName.length > 0 && map.ccNumbers.length > 0;

      if (useMapping) {
        if (input?.name !== map.portName) return;
        if (hi === 0xe0) return;

        const slot = map.ccNumbers.indexOf(controller);
        if (slot < 0) return;

        const target = flat[slot];
        if (!target) return;

        const { block, uniformName, patternParam } = target;
        const min = typeof patternParam.min === "number" ? patternParam.min : 0;
        const max = typeof patternParam.max === "number" ? patternParam.max : 1;
        const step =
          typeof patternParam.step === "number" ? patternParam.step : 0.01;

        const next = midi7ToNumber(value, min, max, step);
        setBlockNumberParameterValue(block, uniformName, next);
        return;
      }

      const first = flat[0];
      if (!first) return;

      const { block, uniformName, patternParam } = first;
      const min = typeof patternParam.min === "number" ? patternParam.min : 0;
      const max = typeof patternParam.max === "number" ? patternParam.max : 1;
      const step =
        typeof patternParam.step === "number" ? patternParam.step : 0.01;

      const next =
        hi === 0xb0
          ? midi7ToNumber(value, min, max, step)
          : midiPitchBendToNumber((value << 7) | controller, min, max, step);

      setBlockNumberParameterValue(block, uniformName, next);
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
    // midiCcLearnRef is read via .current inside handleMessage; no re-attach on ref updates.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
