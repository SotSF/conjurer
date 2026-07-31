#include <conjurer_common>

#ifdef GL_ES
precision mediump float;
#endif

varying vec2 v_uv;
uniform float u_time;
uniform sampler2D u_texture;

uniform float u_offset;
uniform float u_amplitude;
uniform float u_speed;
uniform float u_phase;

void main() {
    vec2 p = v_uv;
    float r = length(p);

    // Offset is a static bias; amplitude/speed/phase drive an optional sinusoid.
    // Zero amplitude to breathe only via Offset (e.g. with a variation envelope).
    float amount = u_offset + u_amplitude * sin(u_time * u_speed + u_phase * PI);

    // Positive amount expands outward (power < 1); negative pulls inward.
    float power = pow(2.0, -amount);
    float rNew = r > 0.0 ? pow(r, power) : 0.0;

    vec2 remapped = (r > 0.0) ? p * (rNew / r) : p;
    gl_FragColor = texture2D(u_texture, cartesianToNormalizedProjection(remapped));
}
