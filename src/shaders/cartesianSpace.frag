#include <conjurer_common>

#ifdef GL_ES
precision mediump float;
#endif

// the input texture here is in canopy space (basically all of the textures are)
// the output texture is in cartesian space
uniform sampler2D u_texture;

varying vec2 v_uv;

float polarToCanopyRadius(float radius) {
    float canopyRadius = step(0.11111, radius) * (radius - 0.11111) / 0.88888;
    canopyRadius = clamp(canopyRadius, 0., 1.);
    return canopyRadius;
}

vec2 cartesianToCanopyProjection(vec2 _st) {
    float theta = atan(_st.y, _st.x) / PI / 2. + 0.5;
    float polarRadius = length(_st);
    float canopyRadius = polarToCanopyRadius(polarRadius);
    return vec2(theta, canopyRadius);
}

void main() {
    vec2 st = v_uv;
    st = 1. - st * 2.;
    vec2 canopyCoordinate = cartesianToCanopyProjection(st);

    gl_FragColor = texture2D(u_texture, canopyCoordinate);
}
