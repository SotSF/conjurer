
#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 u_resolution;
uniform float u_time;
varying vec2 v_uv;

float rand(float st) {
    return fract(sin(st) * 43758.5453123);
}

float rand(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) *
        43758.5453123);
}

float noise(float x) {
    float i = floor(x);
    float f = fract(x);
    float u = f * f * (3.0 - 2.0 * f);
    return mix(rand(x), rand(x + 1.), u);
}

mat2 rotate2d(float _angle) {
    return mat2(cos(_angle), - sin(_angle), sin(_angle), cos(_angle));
}

void main() {
    vec2 st = gl_FragCoord.xy / u_resolution.xy;

    // Remap the space to -1. to 1.
    st = st * 2. - 1.;

    // Rotate the space
    st = rotate2d(noise(((floor(u_time) * 1.))) - .5) * st;

    // Make the distance field
    float d = 0.0;
    // d = length( abs(st)-.3 );
    d = length(min(abs(st) - .3, 0.));
    // d = length(max(abs(st) - .3, 0.));

    // Visualize the distance field
    float distance = fract(d * 10.0);
    // distance=distance+;
    gl_FragColor = vec4(vec3(distance), 1.0);

    // gl_FragColor = vec4(vec3(noise(st.x), noise(st.y), 1.), 1.);
}
