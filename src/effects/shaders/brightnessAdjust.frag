#ifdef GL_ES
precision mediump float;
#endif

varying vec2 v_uv;
uniform sampler2D u_texture;
uniform float u_intensity;

void main() {
    vec4 sampled = texture2D(u_texture, v_uv);
    gl_FragColor = vec4(sampled.xyz * u_intensity, 1.0);
}
