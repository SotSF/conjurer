#include <conjurer_common>

#ifdef GL_ES
precision mediump float;
#endif

uniform sampler2D u_texture;
uniform float u_intensity;
uniform float u_limiterGain;

varying vec2 v_uv;

// goal: display a given texture in canopy space
void main() {
    vec2 st = v_uv;

    // example input coordinate [1,0] = right middle of viewport
    // viewport space [1,0] **in this case** corresponds to canopy space [1,0.5]
    vec2 canopyCoordinates = cartesianToNormalizedProjection(st);

    // canopyCoordinates.y is the normalized position along the strip (the LED index). Convert
    // it to the LED's true radial position, accounting for the catenary curve of the strip, so
    // that the texture is sampled where the LED actually appears when viewed from below.
    canopyCoordinates.y = canopyArcToRadialFraction(canopyCoordinates.y);

    // canopy space [1,0.5] is cartesian space [0.6,0] (canopyToCartesianProjection)
    vec2 cartesianCoordinates = canopyToCartesianProjection(canopyCoordinates);

    // cartesian space [0.6,0] is texture space [0.75,0.5]
    vec2 textureCoordinates = cartesianToNormalizedProjection(cartesianCoordinates);

    vec4 sampled = texture2D(u_texture, textureCoordinates);
    vec4 black = vec4(0.0, 0.0, 0.0, 1.0);
    vec4 color = mix(black, sampled, u_intensity);
    color.rgb *= u_limiterGain;

    gl_FragColor = color;
}
