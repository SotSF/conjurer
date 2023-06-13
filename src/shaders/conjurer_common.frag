#ifndef conjurer_common_included
#define conjurer_common_included
// START conjurer_common

#define PI 3.14159265358979323846

float rand(vec2 co) {
    return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
}

vec3 hsv(float h, float s, float v) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(vec3(h) + K.xyz) * 6.0 - K.www);
    return v * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), s);
}

// Converts canopy coordinates to cartesian coordinates
// Canopy coordinates mean:
//  x: 0.0 means the location of the first led on the first strip
//  x: 1.0 means the location of the first led on the last strip
//  y: 0.0 means the location of the last led on the first strip
//  y: 1.0 means the location of the last led on the last strip
// Cartesian coordinates mean the usual x,y coordinates, where (0, 0) is at the center of the canopy
vec2 canopyToCartesianProjection(vec2 _st) {
    float theta = _st.x * 2.0 * 3.1415926;
    // TODO: double check these numbers
    float r = _st.y * 0.88888888 + 0.111111111;
    return vec2(r * cos(theta) * 0.5, r * sin(theta) * 0.5);
}

vec2 cartesianToPolarProjection(vec2 _st) {
    float theta = atan(_st.y, _st.x) / PI / 2. + 0.5;
    float r = length(_st);
    return vec2(theta, r);
}

// requires centered cartesian space
vec2 tileCentered(vec2 _st, float _zoom) {
    _st *= _zoom;
    return fract(_st - 0.5) - 0.5;
}

// requires bottom-left-origin cartesian space
vec2 tile(vec2 _st, float _zoom) {
    _st *= _zoom;
    return fract(_st);
}

// requires centered cartesian space
vec2 rotate2DCentered(vec2 _st, float _angle) {
    _st = mat2(cos(_angle), - sin(_angle), sin(_angle), cos(_angle)) * _st;
    return _st;
}

// requires bottom-left-origin cartesian space
vec2 rotate2D(vec2 _st, float _angle) {
    _st -= 0.5;
    _st = mat2(cos(_angle), - sin(_angle), sin(_angle), cos(_angle)) * _st;
    _st += 0.5;
    return _st;
}

// END conjurer_common
#endif
