#include <conjurer_common>

#ifdef GL_ES
precision mediump float;
#endif

varying vec2 v_uv;
uniform float u_time;

uniform Palette u_palette;
uniform float u_time_factor;
uniform float u_time_offset;
uniform float u_period;
uniform float u_duty_cycle;
uniform float u_scale;
uniform float u_fade_factor;
uniform float u_wave_frequency;
uniform float u_wave_amplitude;
uniform float u_waviness;
uniform float u_spiral_factor;
uniform float u_number_colors;
uniform float u_white_leading_edge;
uniform float u_sector_cells;

// // For debugging
// #define u_palette Palette(vec3(0.261, 0.446, 0.315), vec3(0.843, 0.356, 0.239), vec3(0.948, 1.474, 1.361), vec3(3.042, 5.630, 5.424))
// #define u_time_factor 1.
// #define u_time_offset 0.
// #define u_period 4.
// #define u_duty_cycle .2
// #define u_scale 5.
// #define u_fade_factor .75
// #define u_wave_frequency 4.
// #define u_wave_amplitude 0.6
// #define u_waviness 1.
// #define u_spiral_factor .5
// #define u_number_colors 100.
// #define u_white_leading_edge .2
// #define u_sector_cells 4.

float triangleWave(in float x) {
    return 2. / PI * asin(sin(x));
}

void main() {
    vec2 st = v_uv;

    // offset the x coordinate based on the y coordinate to create a spiral
    float inverse_y = 1. - st.y;
    st.x += 1. - u_spiral_factor * inverse_y * inverse_y;

    // vary the shape of the wave over x
    float sinusoid = sin(st.x * PI * 2. * u_wave_frequency) * u_wave_amplitude;
    float triangle = triangleWave(st.x * PI * 2. * u_wave_frequency) * u_wave_amplitude;
    st.y += mix(triangle, sinusoid, u_waviness);

    // scale the cells based on the duty cycle
    st.y *= 1. - u_duty_cycle;

    // divide the annular space into sectors
    float sector_cell = floor(st.x * u_sector_cells);
    float is_odd_sector_cell = mod(sector_cell, 2.0);

    // every other sector cell moves in the opposite direction
    float move_factor = is_odd_sector_cell * - 2. + 1.;

    // move the cells over time
    float time = u_time_offset + u_time * u_time_factor;
    st.y += move_factor * time / u_period;

    // scale the cells
    st.y *= u_scale;

    // divide the infinite domain into color cells
    float color_cell = floor(mod(st.y, u_number_colors));
    float last_color_cell = floor(mod(st.y - 1., u_number_colors));

    // transform to color cell space
    st.y = fract(st.y);

    // create duty cells based on the duty cycle
    float number_duty_cells = floor(1. / u_duty_cycle);
    st.y *= number_duty_cells;

    // keep track of what duty cell we are in
    float duty_cell = floor(st.y);
    float duty_cell_fraction = fract(st.y);
    float duty_cell_reversed = (number_duty_cells - 1.) - floor(st.y);

    // calculate color based on color cell
    vec3 palette_color = palette(rand(color_cell), u_palette);
    vec3 palette_color_next = palette(rand(last_color_cell), u_palette);
    vec3 color = palette_color;

    // make the wavefront white, the waveback the color from the palette
    color = mix(color, vec3(1.), u_white_leading_edge * pow(duty_cell_fraction, 2.));

    // only display this color if this is the last duty cell in the duty cycle
    color = mix(color, vec3(0.0), step(1., duty_cell_reversed));

    // fade out the color of the last duty cell
    color = mix(color, vec3(0.0), smoothstep(1. - u_fade_factor, 1., 1. - duty_cell_fraction));

    // do additional blending if we are the first duty cell
    float first_duty_cell = step(0., duty_cell) * (1. - step(1., duty_cell));

    color = mix(color, vec3(palette_color_next), first_duty_cell * 0.75 * pow(1. - st.y, 10.));
    color = mix(color, vec3(1.), first_duty_cell * u_white_leading_edge * pow(1. - st.y, 10.));

    gl_FragColor = vec4(color, 1.0);
}
