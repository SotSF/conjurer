#ifdef GL_ES
precision mediump float;
#endif

#define tau 6.2831853

varying vec2 v_uv;
uniform float u_time;

uniform float u_globalTimeFactor;
uniform float u_spikeMotionTimeScalingFactor;
uniform float u_repetitionsPerSpiralTurn;
uniform float u_primaryOscPeriod;
uniform float u_distCutoff;
uniform float u_colorRangeStart;
uniform float u_colorRangeWidth;
uniform float u_waveOffset;
uniform float u_baseAmplitude;
uniform float u_spiralGrowthFactor;
uniform float u_spiralTightness;
uniform int u_colorIterations;
uniform int u_spiralCount;

// // For debugging
// #define u_globalTimeFactor 1.2
// #define u_spikeMotionTimeScalingFactor -0.4
// #define u_repetitionsPerSpiralTurn 14.
// #define u_primaryOscPeriod 15.
// #define u_distCutoff 1.5
// #define u_colorRangeStart 0.55
// #define u_colorRangeWidth 0.35
// #define u_waveOffset 0.0172
// #define u_baseAmplitude 0.04
// #define u_spiralGrowthFactor 0.1
// #define u_spiralTightness 0.35
// #define u_colorIterations 32
// #define u_spiralCount 4

vec3 RGBtoHCV(in vec3 RGB) {
    float Epsilon = 1e-9;
    // Based on work by Sam Hocevar and Emil Persson
    vec4 P = (RGB.g < RGB.b) ? vec4(RGB.bg, - 1.0, 2.0 / 3.0) : vec4(RGB.gb, 0.0, - 1.0 / 3.0);
    vec4 Q = (RGB.r < P.x) ? vec4(P.xyw, RGB.r) : vec4(RGB.r, P.yzx);
    float C = Q.x - min(Q.w, Q.y);
    float H = abs((Q.w - Q.y) / (6.0 * C + Epsilon) + Q.z);
    return vec3(H, C, Q.x);
}

vec3 HUEtoRGB(in float H) {
    float R = abs(H * 6.0 - 3.0) - 1.0;
    float G = 2.0 - abs(H * 6.0 - 2.0);
    float B = 2.0 - abs(H * 6.0 - 4.0);
    return clamp(vec3(R, G, B), vec3(0.0, 0.0, 0.0), vec3(1.0, 1.0, 1.0));
}

vec3 HSVtoRGB(in vec3 HSV) {
    vec3 RGB = HUEtoRGB(HSV.x);
    return ((RGB - 1.0) * HSV.y + 1.0) * HSV.z;
}

vec3 RGBtoHSV(in vec3 RGB) {
    float Epsilon = 1e-9;
    vec3 HCV = RGBtoHCV(RGB);
    float S = HCV.y / (HCV.z + Epsilon);
    return vec3(HCV.x, S, HCV.z);
}

vec4 colorLine(float dist, float radius, float theta, int spiralIdx) {
    float primaryOsc = (sin((tau * (u_time * u_globalTimeFactor)) / u_primaryOscPeriod));
    float scalingFactorPulse = 1.6 + 0.15 * primaryOsc;
    //float radialScalingFactor = exp(theta/scalingFactorPulse);
    float radialScalingFactor = pow(radius / 1.3, scalingFactorPulse);

    float transitionWidth = 1.0;

    float timeOffset = u_time * (- u_globalTimeFactor + u_spikeMotionTimeScalingFactor);
    float period = tau / u_repetitionsPerSpiralTurn;

    vec2 colorRange = vec2(u_colorRangeStart, mod((u_colorRangeStart + u_colorRangeWidth), 1.0));

    vec4 color = vec4(0.0, 0.0, 0.0, 1.0);
    for (int i = 0; i < u_colorIterations; i ++) {
        float iteratedAmplitude = u_baseAmplitude * (float(i));
        float iteratedOffset = timeOffset + (sin((tau * (float(i) + u_time * u_globalTimeFactor)) / 15.0) / 10.0);
        float triangleWave = abs(mod(theta + timeOffset, period) - period / 2.0);
        float intensity = 1.0 - smoothstep(u_distCutoff, u_distCutoff + transitionWidth, dist - u_waveOffset * radialScalingFactor + iteratedAmplitude * triangleWave * radialScalingFactor);
        intensity /= float(u_colorIterations) / float(4);
        float hue = mix(colorRange.x, colorRange.y, float(spiralIdx) / float(u_spiralCount));
        vec3 clr = HSVtoRGB(vec3(hue, 1.0 - (float(i) / float(u_colorIterations)), intensity));
        color += vec4(clr, 1.0);
    }

    return color;
}

void main() {
    // Convert from canopy space to cartesian
    float theta = v_uv.x * 2.0 * 3.1415926;
    float r = v_uv.y * 0.88888888 + 0.111111111;
    float x = r * cos(theta) * 0.5 + 0.5;
    float y = r * sin(theta) * 0.5 + 0.5;
    vec2 uv = vec2(x, y) * 2.0 - 1.0;

    // Convert the cartesian coordinates to polar coordinates
    float radius = length(uv) * 300.0;
    float angle = mod(atan(uv.y, uv.x) + u_time * u_globalTimeFactor, tau);

    // logarithmic spiral
    vec4 fragColor = vec4(0.0, 0.0, 0.0, 1.0);
    for (int spiralIdx = 0; spiralIdx < u_spiralCount; spiralIdx ++) {
        float spiralOffset = mod(angle + (float(spiralIdx) * tau / float(u_spiralCount)), tau);
        // Iterate 5 turns of the spiral
        for (int i = 0; i < 5; i ++) {
            float theta = spiralOffset + (float(i) * tau);
            float spiralRadius = u_spiralGrowthFactor * exp(u_spiralTightness * theta);
            fragColor += colorLine(abs(radius - spiralRadius), radius, theta, spiralIdx);
        }
    }
    gl_FragColor = fragColor;
}
