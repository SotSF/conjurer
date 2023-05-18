#define PI 3.14159265359
#define blackout_lower_bound 0.05
#define fullbright_lower_bound 0.90
#define minimum_brightness 0.02

uniform vec3 u_view_vector;
varying vec2 v_uv;
varying float v_intensity;

void main() {
    // Pass the intensity to the fragment shader.

    // The object normal should be multiplied by the normalMatrix
    vec3 pixelNormal = normalize(normalMatrix * normal);
    // The object-to-camera vector projects the object position by the view matrix, then takes the difference from the view vector
    vec3 cameraToPixelVector = (modelViewMatrix * vec4(position, 1.0)).xyz - u_view_vector;
    // The dot product gives us a measure of how close the normal is to facing the camera
    float normalizedItensity = 1. - dot(pixelNormal, normalize(cameraToPixelVector));
    // The intensity should decay faster off-angle than a simple dot product, hence the square
    float adjustedIntensity = pow(normalizedItensity, 2.0);
    // Drop to a minimum intensity below the blackout lower bound, and rise to max intensity above the fullbright lower bound
    float boundedIntensity = clamp(smoothstep(blackout_lower_bound, fullbright_lower_bound, adjustedIntensity), minimum_brightness, 1.0);
    v_intensity = boundedIntensity;

    // Pass uv coordinates to the fragment shader.
    // uv.x, uv.y are in the range [0, 1]
    // x represents the angle around the center of the canopy
    // y represents the distance from the apex of the canopy
    v_uv = uv;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = 100.0 / length(cameraToPixelVector);
}
