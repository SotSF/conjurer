#ifdef GL_ES
precision mediump float;
#endif

uniform sampler2D u_texture;

varying vec2 v_uv;

void main() {
    vec2 st = v_uv;
    float theta = st.x * 2.0 * 3.1415926;
    float r = st.y * 0.88888888 + 0.111111111;
    float x = r * cos(theta) * 0.5 + 0.5;
    float y = r * sin(theta) * 0.5 + 0.5;

    gl_FragColor = texture2D(u_texture, vec2(x, y));
}
