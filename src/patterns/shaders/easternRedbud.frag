#include <conjurer_common>

#ifdef GL_ES
precision mediump float;
#endif

varying vec2 v_uv;
uniform float u_time;

uniform Palette u_palette;
uniform float u_color_density;
uniform float u_time_factor;
uniform float u_time_offset;
uniform float u_period;
uniform float u_leaves;
uniform float u_trailing_leaves;
uniform float u_curve_factor;
uniform float u_leaf_crispness;
uniform float u_color_change_rate;

// // For debugging
// #define u_palette Palette(vec3(0.387, 0.8, 0.435), vec3(0.8, 0.392, 0.071), vec3(1.497, 1.219, 1.176), vec3(3.613, 5.485, 0.773))
// #define u_color_density 1.
// #define u_time_factor 1.
// #define u_time_offset 0.
// #define u_period 5.
// #define u_leaves 100.
// #define u_trailing_leaves 10.
// #define u_curve_factor .3
// #define u_leaf_crispness .5
// #define u_color_change_rate .0

// sdEgg from IQ, https://iquilezles.org/articles/distfunctions2d/)
float sdEgg(in vec2 p, in float ra, in float rb) {
    const float k = sqrt(3.0);
    p.x = abs(p.x);
    float r = ra - rb;
    return ((p.y < 0.0) ? length(vec2(p.x, p.y)) - r : (k * (p.x + r) < p.y) ? length(vec2(p.x, p.y - k * r)) : length(vec2(p.x + r, p.y)) - 2.0 * r) - rb;
}

float smoothLeaf(in vec2 p, in float radius) {
    float leaf = sdEgg(p, radius, 0.02 * radius);
    return - 400. * u_leaf_crispness * clamp(leaf, - 1., 0.);
}

void main() {
    vec2 st = v_uv;

    vec2 polar = canopyToPolarProjection(st);
    float polarTheta = polar.x;
    float polarRadialDistance = polar.y;

    vec2 cartesian = canopyToCartesianProjection(st);

    float time = u_time * u_time_factor + u_time_offset;

    vec3 color = vec3(0);
    for (float offset = 0.; offset < u_leaves; offset ++) {
        float iterationTime = time + (offset / u_leaves) * u_period;
        float timeCell = floor(iterationTime / u_period);
        float progress = mod(iterationTime, u_period) / u_period;

        float leafRadius = rand(timeCell + offset + .5) * .02 + .02;

        // move leaf cell from center outwards
        float radialDistance = mix(0., 2., progress);

        // randomized the angle that the leaf moves at
        float angle = rand(timeCell + offset + .3);
        // additionally randomize the angle over the radius for curved paths
        angle += rand(timeCell + offset + .4) * u_curve_factor * polarRadialDistance;

        // polar to cartesian
        vec2 leafCenter = polarToCartesianProjection(vec2(angle, radialDistance));

        vec2 rotated = rotate2DCentered(cartesian - leafCenter, angle * 2. * PI - PI / 2.);

        float intensity = smoothLeaf(rotated, leafRadius);

        // leave behind trailing leaves at this specified interval that fade out over time
        for (float trailingLeafIndex = 0.; trailingLeafIndex < u_trailing_leaves; trailingLeafIndex ++) {
            float trailingLeafRadialDistance = (trailingLeafIndex + 1.) / (u_trailing_leaves + 1.);
            leafCenter = polarToCartesianProjection(vec2(angle, trailingLeafRadialDistance));
            rotated = rotate2DCentered(cartesian - leafCenter, angle * 2. * PI - PI / 2.);
            intensity += step(trailingLeafRadialDistance, radialDistance) * smoothLeaf(rotated, leafRadius);
            intensity *= 1. - progress;
        }

        intensity = clamp(intensity, 0., 1.);
        color = mix(color, palette(polarRadialDistance * u_color_density * 2. + cos(time * u_color_change_rate), u_palette), intensity);
    }

    gl_FragColor = vec4(color, 1.);
}
