#include <conjurer_common>

#ifdef GL_ES
precision mediump float;
#endif

varying vec2 v_uv;
varying vec2 v_normalized_uv;
uniform sampler2D u_texture;

uniform float u_inner_radius;
uniform float u_radius;
uniform float u_theta_min;
uniform float u_theta_max;
uniform float u_inverse;

// // For debugging
// #define u_inner_radius 0.0
// #define u_radius 0.5
// #define u_theta_min 0.0
// #define u_theta_max 360.0
// #define u_inverse 0.0

void main() {
    vec2 st = v_uv;
    st = cartesianToCanopyProjection(st);
    // In canopy coordinates: st.y is the radial distance (0 = apex, 1 = outer
    // edge) and st.x is the angle around the center, normalized to 0..1.

    // Radial band: keep pixels between the inner and outer radius. The default
    // inner radius of 0 keeps the full inner disc, matching legacy behavior
    // (visible where st.y < u_radius).
    float radial = step(u_inner_radius, st.y) * (1.0 - step(u_radius, st.y));

    // Angular arc: keep pixels between the min and max angle (in degrees). The
    // default range of 0..360 covers the full circle, matching legacy behavior.
    float theta = st.x * 360.0;
    float aboveMin = step(u_theta_min, theta); // theta >= u_theta_min
    float belowMax = step(theta, u_theta_max); // theta <= u_theta_max
    float arc;
    if (u_theta_min <= u_theta_max) {
        arc = aboveMin * belowMax;
    } else {
        // Wrapped arc crossing 0 degrees (e.g. min = 350, max = 10).
        arc = clamp(aboveMin + belowMax, 0.0, 1.0);
    }

    float mask = radial * arc;
    float inverse = 1.0 - mask;
    float intensity = mix(mask, inverse, u_inverse);

    vec4 sampled = texture2D(u_texture, v_normalized_uv);
    vec3 masked = sampled.xyz * intensity;

    gl_FragColor = vec4(masked, 1.0);
}
