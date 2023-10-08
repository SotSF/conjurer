#ifndef conjurer_common_included
#define conjurer_common_included

#define PI 3.14159265358979323846

// ========== PALETTES ==========

// cosine based palette, 4 vec3 params
// https://iquilezles.org/articles/palettes/
// http://dev.thi.ng/gradients/
vec3 palette(in float t, in vec3 a, in vec3 b, in vec3 c, in vec3 d) {
    return a + b * cos(6.28318 * (c * t + d));
}

struct Palette {
    vec3 a;
    vec3 b;
    vec3 c;
    vec3 d;
};

// custom palette function utilizing above struct
//   t: number between 0 and 1 (although you can also go outside this range)
//   u_palette: a Palette struct
//   returns: a vec3 color
vec3 palette(in float t, in Palette u_palette) {
    return palette(t, u_palette.a, u_palette.b, u_palette.c, u_palette.d);
}

// ========== RANDOMNESS ==========

float rand(float n) {
    return fract(sin(n) * 43758.5453123);
}

float rand(vec2 co) {
    return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
}

vec3 hsv(float h, float s, float v) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(vec3(h) + K.xyz) * 6.0 - K.www);
    return v * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), s);
}

// plots a line by returning 1.0 if the point is on the line, 0.0 otherwise with a little bit of smoothing
float plot(vec2 st, float pct) {
    return smoothstep(pct - 0.02, pct, st.y) -
        smoothstep(pct, pct + 0.02, st.y);
}

// ========== COORDINATE PROJECTIONS ==========

// We make use of a number of coordinate systems. Importantly, by default shaders are provided with
// a "varying" called v_uv which is a vec2 in what we call "canopy coordinates".

// ---------- CANOPY COORDINATES ----------

// Think of these coordinates as: x is the angle around the center of the canopy, and y is the
// distance away from the apex. It is very similar to polar coordinates (theta, radius), but with a
// different radius. In the case of canopy coordinates, a "radius" of 0.0 does not mean the exact
// center of the circle, but rather means the edge of the apex. Or, the distance to the first led.

// Canopy coordinates are normalized:
//   x goes from 0.0 to 1.0, which describes the angle around the center from 0 to 2pi
//   y goes from 0.0 to 1.0, which describes the distance from the apex to the edge of the canopy

// Cannot be coordinate can be useful to write patterns so that you can described behavior with the
// boundaries of the canopy in mind. However, the coordinate space being so specialized can be
// limiting. Use the functions below to convert to other coordinate systems whenever desired.

// ---------- CARTESIAN COORDINATES ----------

// Cartesian coordinates mean the usual x,y coordinates, where:
//  (0, 0) is at the center of the canopy
//  (1.0, 1.0) is at the top right corner of the canopy
//  (-1.0, -1.0) is at the bottom left corner of the canopy

// ---------- HALF CARTESIAN COORDINATES ----------

// For lack of a better name, "half cartesian coordinates" is what we will call cartesian coordinates but with
// the axes going from -0.5 to 0.5, so:
//  (0, 0) is at the center of the canopy
//  (0.5, 0.5) is at the top right corner of the canopy
//  (-0.5, -0.5) is at the bottom left corner of the canopy

// ---------- NORMALIZED COORDINATES ----------
// Normalized coordinates are the usual x,y coordinates, used in a variety of contexts.
// Coordinate are in the range 0.0 to 1.0, where:
//  (0, 0) is at the bottom left corner of the space
//  (1.0, 1.0) is at the top right corner of the space
//  (0.5, 0.5) is at the center of the space

// ---------- POLAR COORDINATES ----------

// Polar coordinates are the usual theta, radius coordinates, where:
//  theta goes from 0.0 to 1.0, which describes the angle around the center from 0 to 2pi
//  radius goes from 0.0 to 1.0, which describes the distance from the center to the edge of the canopy

// ---------- ---------- ---------- ----------

// Converts canopy coordinates to cartesian coordinates
vec2 canopyToCartesianProjection(vec2 _st) {
    float theta = _st.x * 2.0 * PI;
    float r = _st.y * 0.88888888 + 0.111111111;
    return vec2(r * cos(theta), r * sin(theta));
}

// Converts canopy coordinates to half cartesian coordinates
vec2 canopyToHalfCartesianProjection(vec2 _st) {
    float theta = _st.x * 2.0 * PI;
    float r = _st.y * 0.88888888 + 0.111111111;
    return vec2(r * .5 * cos(theta), r * .5 * sin(theta));
}

// Converts cartesian coordinates to normalized coordinates
vec2 cartesianToNormalizedProjection(vec2 _st) {
    return _st * 0.5 + 0.5;
}

vec2 canopyToNormalizedProjection(vec2 _st) {
    vec2 cartesian = canopyToCartesianProjection(_st);
    return cartesianToNormalizedProjection(cartesian);
}

vec2 canopyToPolarProjection(vec2 _st) {
    float theta = _st.x * 2.0 * PI;
    float r = _st.y * 0.88888888 + 0.111111111;
    return vec2(theta, r);
}

vec2 cartesianToPolarProjection(vec2 _st) {
    float theta = atan(_st.y, _st.x) / PI / 2. + 0.5;
    float r = length(_st);
    return vec2(theta, r);
}

vec2 polarToCartesianProjection(vec2 _st) {
    float theta = _st.x * 2.0 * PI;
    float r = _st.y;
    return vec2(r * cos(theta), r * sin(theta));
}

float polarToCanopyRadius(float radius) {
    float canopyRadius = step(0.11111, radius) * (radius - 0.11111) / 0.88888;
    canopyRadius = clamp(canopyRadius, 0., 1.);
    return canopyRadius;
}

vec2 cartesianToCanopyProjection(vec2 _st) {
    float theta = atan(_st.y, _st.x) / PI / 2. + 0.5;
    float canopyRadius = polarToCanopyRadius(length(_st));
    return vec2(theta, canopyRadius);
}

// requires centered cartesian space
vec2 tileCentered(vec2 _st, float _zoom) {
    _st *= _zoom;
    return fract(_st - 0.5) - 0.5;
}

// requires bottom-left-origin cartesian space (normalized space)
vec2 tile(vec2 _st, float _zoom) {
    _st *= _zoom;
    return fract(_st);
}

// requires centered cartesian space
vec2 rotate2DCentered(vec2 _st, float _angle) {
    _st = mat2(cos(_angle), - sin(_angle), sin(_angle), cos(_angle)) * _st;
    return _st;
}

// requires bottom-left-origin cartesian space (normalized space)
vec2 rotate2D(vec2 _st, float _angle) {
    _st -= 0.5;
    _st = mat2(cos(_angle), - sin(_angle), sin(_angle), cos(_angle)) * _st;
    _st += 0.5;
    return _st;
}

#endif
