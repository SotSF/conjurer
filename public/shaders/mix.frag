uniform vec2 u_resolution;
uniform float u_time;

uniform sampler2D u_texA;
uniform sampler2D u_texB;

void main() {
    vec2 st = gl_FragCoord.xy / u_resolution;
    vec4 a = texture2D(u_texA, st);
    vec4 b = texture2D(u_texB, st);

    float t = sin(u_time) / 2.0 + 0.5;

    gl_FragColor=mix(a, b, t);
    // gl_FragColor=vec4(0.0,0.0,1.0,1.0);
    // gl_FragColor = b;
}