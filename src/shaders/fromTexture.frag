#ifdef GL_ES
precision mediump float;
#endif

uniform sampler2D u_texture;
uniform float u_intensity;

varying vec2 v_uv;

void main() {
    vec4 sampled = texture2D(u_texture, v_uv);
    vec4 black = vec4(0.0, 0.0, 0.0, 1.0);
    vec4 color = mix(black, sampled, u_intensity);
    gl_FragColor = color;
}
