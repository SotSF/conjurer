#include <conjurer_common>

#ifdef GL_ES
precision mediump float;
#endif

varying vec2 v_uv;
uniform float u_time;

uniform Palette u_palette;
uniform float u_time_factor;
uniform float u_time_offset;

// #define u_palette Palette(vec3(0.5774455613585161, 0.918901534803475, 0.9183302614725621), vec3(0.8214304234785681, 0.5104221980835277, 0.08214322007047792), vec3(0.711588398332782, 0.871542869224424, 0.5801340330878866), vec3(0.7204852048004471, 0.45233742857529746, 0.12917934855128466))

// #define u_time_factor 0.001
// #define u_time_offset 41.1

const float NUM_OF_STEPS = 128.0;
const float MIN_DIST_TO_SDF = 0.001;
const float MAX_DIST_TO_TRAVEL = 512.0;

float opSmoothUnion(float d1, float d2, float k) {
    float h = clamp(0.5 + 0.5 * (d2 - d1) / k, 0.0, 1.0);
    return mix(d2, d1, h) - k * h * (1.0 - h);
}

float sdfPlane(vec3 p, vec3 n, float h) {
    // n must be normalized
    return dot(p, n) + h;
}

float sdfSphere(vec3 p, vec3 c, float r) {
    return length(p - c) - r;
}

float sdBox(vec3 p, vec3 b) {
    vec3 q = abs(p) - b;
    return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
}

float sdRoundBox(vec3 p, vec3 b, float r) {
    vec3 q = abs(p) - b;
    return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0) - r;
}

float sdCappedCylinder(vec3 p, float h, float r) {
    vec2 d = abs(vec2(length(p.xz), p.y)) - vec2(r, h);
    return min(max(d.x, d.y), 0.0) + length(max(d, 0.0));
}

// rotational/angular repetition
// NOTE: this is a naive version
vec2 repetitionRotational(vec2 p, int n) {
    float b = 2. * PI / float(n);
    float a = atan(p.y, p.x);
    float i = round(a / b);

    float c = b * i;
    vec2 q = mat2(cos(c), - sin(c), sin(c), cos(c)) * p;
    return q;
}

float CELL_SIZE = 3.;

vec2 rot45(vec2 v) {
    return vec2(v.x - v.y, v.y + v.x) * 0.707107;
}

float sdf(vec3 p, vec3 cell, float time) {
    float m = MAX_DIST_TO_TRAVEL;
    vec3 q = p;

    float pipeColumnOffset = 10. * rand(cell.xz);
    float pumpingAction = 1. + 0.2 * pow(0.5 + 0.5 * sin(time * 7. + q.y * 2. + pipeColumnOffset), 5.);
    float CYLINDER_RADIUS = 0.2 + 0.15 * (2.5 * rand(cell.xy, cell.z) - 1.);
    CYLINDER_RADIUS *= pumpingAction; // TODO: introduction of this line causes artifacts
    float CYLINDER_HEIGHT = CELL_SIZE * 0.5;
    float cylinder = sdCappedCylinder(q, CYLINDER_HEIGHT - 0., CYLINDER_RADIUS);
    m = min(m, cylinder);

    float FLANGE_HEIGHT = 0.05;
    float FLANGE_EXTRA_RADIUS = 0.1;
    q.y = abs(q.y) - CYLINDER_HEIGHT + FLANGE_HEIGHT + 0.;
    float flange = sdCappedCylinder(q, FLANGE_HEIGHT, CYLINDER_RADIUS + FLANGE_EXTRA_RADIUS);
    m = min(m, flange);

    float SCREW_RADIUS = 0.04;
    q.y -= - FLANGE_HEIGHT;
    // q.xz = repetitionRotational(q.xz, 10);
    // q.xz = rot45(q.xz);

    q.xz = abs(q.xz);
    float screwOffset = CYLINDER_RADIUS + 0.5 * FLANGE_EXTRA_RADIUS;
    vec2 screwCenter = rot45(vec2(screwOffset, 0.));
    float screwHead = sdfSphere(q, vec3(screwCenter.x, 0.0, screwCenter.y), SCREW_RADIUS);
    m = min(m, screwHead);

    return m;
}

// correct way to repeat space every s units
float repeated(vec3 p, float s) {
    float time = u_time * u_time_factor + u_time_offset;
    vec3 id = round(p / s);
    vec3 o = sign(p - s * id); // neighbor offset direction

    float d = 1e20;
    for (int j = 0; j < 2; j ++) for (int i = 0; i < 2; i ++) {
    // for (int k = 0; k < 2; k ++) for (int j = 0; j < 2; j ++) for (int i = 0; i < 2; i ++) {
            vec3 rid = id + vec3(0, i, j) * o;
            vec3 r = p - s * rid;
            d = min(d, sdf(r, rid, time));
        }
    return d;
}

float map(vec3 p) {
    vec3 q = p;

    float time = u_time * u_time_factor + u_time_offset;

    // move forward through space
    q.x += 10. * sin(time * 0.5 * PI * 0.05);
    q.y += 10. * sin(time * 0.5 * PI * 0.05);
    q.z += time * .5 + 1.;

    // return sdf(q, vec3(0.));
    return repeated(q, CELL_SIZE);
}

vec4 rayMarch(vec3 ro, vec3 rd, float maxDistToTravel) {
    float dist = 0.0;

    vec3 currentPos = vec3(0.0);
    for (float i = 0.0; i < NUM_OF_STEPS; i ++) {
        currentPos = ro + rd * dist;
        float distToSdf = map(currentPos);

        if (distToSdf < MIN_DIST_TO_SDF) {
            break;
        }

        dist = dist + distToSdf;

        if (dist > maxDistToTravel) {
            break;
        }
    }

    return vec4(dist, currentPos);
}

vec3 getNormal(vec3 p) {
    vec2 d = vec2(0.01, 0.0);
    float gx = map(p + d.xyy) - map(p - d.xyy);
    float gy = map(p + d.yxy) - map(p - d.yxy);
    float gz = map(p + d.yyx) - map(p - d.yyx);
    vec3 normal = vec3(gx, gy, gz);
    return normalize(normal);
}

vec3 render(vec2 uv) {
    float time = u_time * u_time_factor + u_time_offset;
    vec3 color = vec3(0.0);

    // note: ro -> ray origin, rd -> ray direction
    // ray origin = camera position
    vec3 ro = vec3(0.0, 1.90, - 4.4);
    // ray direction = vector from camera position to the current pixel
    vec3 rd = normalize(vec3(uv, 1.0));

    vec4 march = rayMarch(ro, rd, MAX_DIST_TO_TRAVEL);
    float dist = march.x;

    if (dist < MAX_DIST_TO_TRAVEL) {
        // part 1 - display ray marching result
        color = vec3(1.0);

        // part 2.1 - calculate normals
        // calculate normals at the exact point where we hit SDF
        vec3 p = ro + rd * dist;
        vec3 normal = getNormal(p);
        color = normal;

        // part 2.2 - add lighting

        // part 2.2.1 - calculate diffuse lighting
        vec3 lightColor = vec3(1.0);
        // vary the distance of the light source
        // vec3 lightSource = vec3(2.5, 2.5, 2.0 - sin(time * 0.015) * 5.);
        vec3 lightSource = vec3(2.5, 2.5, - 2.0);
        float diffuseStrength = max(0.0, dot(normalize(lightSource), normal));
        vec3 diffuse = lightColor * diffuseStrength;

        // part 2.2.2 - calculate specular lighting
        vec3 viewSource = normalize(ro);
        vec3 reflectSource = normalize(reflect(- lightSource, normal));
        float specularStrength = max(0.0, dot(viewSource, reflectSource));
        specularStrength = pow(specularStrength, 64.0);
        vec3 specular = specularStrength * lightColor;

        // part 2.2.3 - calculate lighting
        vec3 lighting = diffuse * 0.75 + specular * 0.25;
        color = lighting;

        // part 3 - add shadows

        // part 3.1 - update the ray origin and ray direction
        vec3 lightDirection = normalize(lightSource);
        float distToLightSource = length(lightSource - p);
        ro = p + normal * 0.1;
        rd = lightDirection;

        // part 3.2 - ray march based on new ro + rd
        march = rayMarch(ro, rd, distToLightSource);
        float dist = march.x;
        if (dist < distToLightSource) {
            color = color * vec3(0.25);
        }

        // note: add gamma correction
        color = pow(color, vec3(1.0 / 2.2));
    }

    float colorVariation = 0. * 0.5 * sin(time * 0.1);
    vec3 paletteColor = palette((dist / MAX_DIST_TO_TRAVEL * 8.) + colorVariation, u_palette);
    color *= paletteColor;

    return color;
}

void main() {
    vec2 uv = v_uv;

    vec3 color = render(uv);

    gl_FragColor = vec4(color, 1.0);
}
