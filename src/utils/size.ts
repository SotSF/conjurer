import { Vector2 } from "three";

export const LED_COUNTS = new Vector2(96, 151);

const FEET_PR_METER = 3.28084;
const STRIP_LENGTH_METERS = 2.5;
export const STRIP_LENGTH = STRIP_LENGTH_METERS * FEET_PR_METER; // feet

export const APEX_HEIGHT = -3; // feet, 0 = level with base
export const APEX_RADIUS = 1; // feet
export const BASE_RADIUS = 8; // feet
