#ifdef GL_ES
precision mediump float;
#endif

varying vec2 v_uv;
uniform float u_time;
uniform vec2 u_resolution;
uniform sampler2D u_texture;

uniform float u_red, u_green, u_blue;
uniform float u_intensity;

// // For debugging
// #define u_intensity 1.
// #define u_color vec4(1., 0., 0., 1.)

void main() {
    vec4 sampled = texture2D(u_texture, v_uv);
    vec4 mixed = mix(sampled, vec4(u_red, u_green, u_blue, 1.), u_intensity);

    // any sampled pixels that are black, leave them black
    mixed.xyz = step(0.000001, sampled.x * sampled.y * sampled.z) * mixed.xyz;
    gl_FragColor = mixed;
}
