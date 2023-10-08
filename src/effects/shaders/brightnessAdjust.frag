#ifdef GL_ES
precision mediump float;
#endif

varying vec2 v_normalized_uv;
uniform sampler2D u_texture;
uniform float u_intensity;

void main() {
    vec2 st = v_normalized_uv;
    vec4 sampled = texture2D(u_texture, st);
    gl_FragColor = vec4(sampled.xyz * u_intensity, 1.0);
}
