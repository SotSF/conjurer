#include <conjurer_common>
#ifdef GL_ES
precision mediump float;
#endif

varying vec2 v_uv;
uniform float u_time;
uniform vec2 u_resolution;
uniform sampler2D u_texture;

// TODO: implement more of these
uniform float u_tiling;
uniform float u_rotation;
uniform float u_box_size;
uniform float u_circle_size;
uniform float u_box_smooth;
uniform float u_circle_smooth;
uniform float u_brick_offset_x;
uniform float u_brick_offset_y;

// float u_tiling = 8.0;
// float u_rotation = 0.0;
// float u_box_size = 0.6;
// float u_circle_size = 0.0;
// float u_box_smooth = 0.01;
// float u_circle_smooth = 0.00;
// float u_brick_offset_x = 1.0;
// float u_brick_offset_y = 0.0;

#define PI 3.14159265358979323846

vec2 brickTile(vec2 _st, float _zoom) {
    _st *= _zoom;
    float brickOffsetX = u_brick_offset_x * step(1.0, mod(u_time, 2.0)) * u_time;
    float brickOffsetY = u_brick_offset_y * (1.0 - step(1.0, mod(u_time, 2.0))) * u_time;
    _st.x += step(1.0, mod(_st.y, 2.0)) * brickOffsetX;
    _st.x += (1.0 - step(1.0, mod(_st.y, 2.0))) * - brickOffsetX;
    _st.y += step(1.0, mod(_st.x, 2.0)) * brickOffsetY;
    _st.y += (1.0 - step(1.0, mod(_st.x, 2.0))) * - brickOffsetY;
    return fract(_st);
}

float box(vec2 _st, vec2 _size, float _smoothEdges) {
    _size = vec2(0.5) - _size * 0.5;
    vec2 aa = vec2(_smoothEdges * 0.5);
    vec2 uv = smoothstep(_size, _size + aa, _st);
    uv *= smoothstep(_size, _size + aa, vec2(1.0) - _st);
    return uv.x * uv.y;
}

float circle(vec2 _st, float _radius, float _smoothEdges) {
    vec2 dist = _st - vec2(0.5);
    return 1.0 - smoothstep(_radius, _radius + _smoothEdges, dot(dist, dist) * 4.0);
}

void main(void) {
    // vec2 st = gl_FragCoord.xy / u_resolution.xy;
    vec2 st = v_uv;

    // canopy to centered cartesian space
    st = canopyToCartesianProjection(st);

    // tile space
    st = tileCentered(st, u_tiling);

    // TODO: apply a vignette frame

    // rotate the space
    st = rotate2DCentered(st, PI * u_rotation);

    // centered cartesian to polar
    st = cartesianToPolarProjection(st);

    vec4 sampled = texture2D(u_texture, st);

    gl_FragColor = vec4(sampled.xyz, 1.0);
}
