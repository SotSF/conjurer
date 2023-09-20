#ifdef GL_ES
precision mediump float;
#endif

varying vec2 v_uv;

void main() {
    vec4 color = vec4(1.0, 0.0, 0.0, 1.0);
    gl_FragColor = color;
}
