#include <conjurer_common>
#ifdef GL_ES
precision mediump float;
#endif

varying vec2 v_uv;
uniform float u_time;
uniform vec2 u_resolution;
uniform sampler2D u_texture;

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

    st = canopyToHalfCartesianProjection(st);

    vec3 color = vec3(0.0);

    // Divide the space in 4
    st = brickTile(st, u_tiling);

    // Use a matrix to rotate the space 45 degrees
    st = rotate2D(st, PI * u_rotation);

    // Draw a square
    color = vec3(box(st, vec2(u_box_size), u_box_smooth));

    // rotate the space back, translate
    st = rotate2D(st, - PI * u_rotation);

    st += 0.5;

    // Draw a circle
    color += vec3(circle(fract(st), u_circle_size, u_circle_smooth));

    vec4 sampled = texture2D(u_texture, v_uv);
    vec3 masked = sampled.xyz * color;

    gl_FragColor = vec4(masked, 1.0);
}
