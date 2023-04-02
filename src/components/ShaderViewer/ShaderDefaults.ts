// defaultVertexShader is basically a noop shader that doesn't transform
// positions passed to it.  It is used to render the fragment shader as a pixel
// shader.
export const defaultVertexShader = `
void main() {
  gl_Position = vec4( position, 1.0 );
}
`

// defaultFragmentShader is a simple placeholder shader that just renders a
// centered dot that fades back and forth between black and white
export const defaultFragmentShader = `
uniform vec2 u_resolution;
uniform float u_time;

float circle(vec2 xy, float r) {
  return length(xy) - r;
}

void main() {
    vec2 st = (gl_FragCoord.xy * 2.0)/u_resolution.xy-1.0;
    st.x *= u_resolution.xy.x / u_resolution.xy.y;

    float d = step(circle(st, .2), 0.0) * (sin(u_time * 3.0) * .5 + .5);
    gl_FragColor=vec4(d,d,d,1.0);
}
`
