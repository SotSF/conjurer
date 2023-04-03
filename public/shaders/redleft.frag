uniform vec2 u_resolution;
uniform float u_time;

void main() {
    vec2 st = (gl_FragCoord.xy * 2.0)/u_resolution.xy-1.0;
    st.x *= u_resolution.xy.x / u_resolution.xy.y;
    float d = step(st.x, 0.0);
    gl_FragColor=vec4(d,0.0,0.0,1.0);
}