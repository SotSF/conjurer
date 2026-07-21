import {
  APEX_HEIGHT,
  APEX_RADIUS,
  BASE_RADIUS,
  LED_COUNTS,
  STRIP_LENGTH,
} from "../utils/size";
import { catenary } from "../utils/catenary";
import * as fs from "fs";
import { Vector2 } from "three";
import { CanopyGeometry } from "../types/CanopyGeometry";

const CANOPY_GEOMETRY_OUTPUT_PATH = "./src/data/canopyGeometry";
const JSON_DECIMAL_PLACES = 3;
const DENSE_SAMPLE_COUNT = 5001;

const saveJson = (filename: string, data: CanopyGeometry) =>
  fs.writeFileSync(
    filename,
    JSON.stringify(data, (key, val) =>
      val.toFixed ? Number(val.toFixed(JSON_DECIMAL_PLACES)) : val,
    ),
  );

const saveBinary = (filename: string, data: CanopyGeometry) => {
  const float32Array = new Float32Array([
    ...data.position,
    ...data.uv,
    ...data.normal,
  ]);
  const buffer = Buffer.from(float32Array.buffer);
  fs.writeFileSync(filename, new Uint8Array(buffer));
};

/**
 * The catenary() helper returns points linearly spaced in x, but the physical LEDs are
 * equidistant along the strip itself (i.e. along the arc of the catenary). Resample a dense
 * polyline at uniform arc length intervals to get the true LED positions.
 */
const resampleByArcLength = (
  points: Array<[number, number]>,
  n: number,
): Array<[number, number]> => {
  const cumulative = [0];
  for (let i = 1; i < points.length; i++) {
    const dx = points[i][0] - points[i - 1][0];
    const dy = points[i][1] - points[i - 1][1];
    cumulative.push(cumulative[i - 1] + Math.hypot(dx, dy));
  }
  const totalLength = cumulative[cumulative.length - 1];

  const resampled: Array<[number, number]> = [];
  let segment = 0;
  for (let i = 0; i < n; i++) {
    const target = (i / (n - 1)) * totalLength;
    while (segment < points.length - 2 && cumulative[segment + 1] < target) {
      segment++;
    }
    const segmentLength = cumulative[segment + 1] - cumulative[segment];
    const t =
      segmentLength === 0 ? 0 : (target - cumulative[segment]) / segmentLength;
    resampled.push([
      points[segment][0] + t * (points[segment + 1][0] - points[segment][0]),
      points[segment][1] + t * (points[segment + 1][1] - points[segment][1]),
    ]);
  }
  return resampled;
};

/**
 * Solves for the catenary y = cosh(a * (x - xMin)) / a + bias hanging between
 * (APEX_RADIUS, APEX_HEIGHT) and (BASE_RADIUS, 0) with length STRIP_LENGTH, and logs the
 * constants used by canopyArcToRadialFraction in src/shaders/conjurer_common.frag. If the
 * physical dimensions in src/utils/size.ts change, update the shader with these values.
 */
const logShaderConstants = () => {
  const d = BASE_RADIUS - APEX_RADIUS;
  const h = 0 - APEX_HEIGHT;
  const target = Math.sqrt(STRIP_LENGTH ** 2 - h ** 2);
  let lo = 1e-6;
  let hi = 5;
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    if ((2 * Math.sinh((mid * d) / 2)) / mid > target) hi = mid;
    else lo = mid;
  }
  const a = (lo + hi) / 2;
  const xLeft =
    0.5 * (Math.log((STRIP_LENGTH + h) / (STRIP_LENGTH - h)) / a - d);
  const xMin = APEX_RADIUS - xLeft;
  const sinhApex = Math.sinh(a * (APEX_RADIUS - xMin));

  console.log("Catenary constants for src/shaders/conjurer_common.frag:");
  console.log(`  #define CATENARY_A ${a.toFixed(7)}`);
  console.log(`  #define CATENARY_X_MIN ${xMin.toFixed(7)}`);
  console.log(`  #define CATENARY_SINH_APEX ${sinhApex.toFixed(7)}`);
  console.log(`  #define CATENARY_STRIP_LENGTH ${STRIP_LENGTH.toFixed(4)}`);
  console.log(`  #define CATENARY_APEX_RADIUS ${APEX_RADIUS.toFixed(1)}`);
  console.log(`  #define CATENARY_BASE_RADIUS ${BASE_RADIUS.toFixed(1)}`);
};

const main = async () => {
  console.log("Generating canopy geometry...");

  const denseCatenaryCoordinates = catenary(
    { x: APEX_RADIUS, y: APEX_HEIGHT },
    { x: BASE_RADIUS, y: 0 },
    STRIP_LENGTH,
    DENSE_SAMPLE_COUNT,
  );
  const catenaryCoordinates = resampleByArcLength(
    denseCatenaryCoordinates,
    LED_COUNTS.y,
  );
  const catenaryNormal = [];
  for (let i = 0; i < catenaryCoordinates.length; i++) {
    const point1Index = i === 0 ? 0 : i - 1;
    const point2Index = i === catenaryCoordinates.length - 1 ? i : i + 1;

    const x1 = catenaryCoordinates[point1Index][0];
    const y1 = catenaryCoordinates[point1Index][1];
    const x2 = catenaryCoordinates[point2Index][0];
    const y2 = catenaryCoordinates[point2Index][1];

    const slope = (y2 - y1) / (x2 - x1);
    const normalSlope = -1 / slope;
    const normal = new Vector2(1, normalSlope).normalize().toArray();
    if (normal[1] > 0) {
      normal[0] = -normal[0];
      normal[1] = -normal[1];
    }
    catenaryNormal.push(normal);
  }

  const uv = [];
  const position = [];
  const normal = [];
  for (let x = 0; x < LED_COUNTS.x; x++) {
    for (let y = 0; y < LED_COUNTS.y; y++) {
      const normalizedX = x / (LED_COUNTS.x - 1);
      const normalizedY = y / (LED_COUNTS.y - 1);
      const theta = (x / LED_COUNTS.x) * 2 * Math.PI;

      uv.push(normalizedX, normalizedY);
      position.push(
        catenaryCoordinates[y][0] * Math.cos(theta),
        catenaryCoordinates[y][0] * Math.sin(theta),
        -catenaryCoordinates[y][1],
      );
      normal.push(
        catenaryNormal[y][0] * Math.cos(theta),
        catenaryNormal[y][0] * Math.sin(theta),
        -catenaryNormal[y][1],
      );
    }
  }

  const canopyGeometry = { position, uv, normal };

  saveJson(`${CANOPY_GEOMETRY_OUTPUT_PATH}.json`, canopyGeometry);
  saveBinary(`${CANOPY_GEOMETRY_OUTPUT_PATH}.bin`, canopyGeometry);

  logShaderConstants();
  console.log("Complete!", CANOPY_GEOMETRY_OUTPUT_PATH);
};

main();
