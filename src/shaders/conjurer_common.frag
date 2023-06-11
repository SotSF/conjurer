#ifndef conjurer_common_included
#define conjurer_common_included
// START conjurer_common

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
    float r = _st.y * 0.88888888 + 0.111111111;
    return vec2(r * cos(theta) * 0.5, r * sin(theta) * 0.5);
}

// END conjurer_common
#endif
