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

#define u_time_factor 0.1
// #define u_time_offset 41.1

const float NUM_OF_STEPS = 128.0;
const float MIN_DIST_TO_SDF = 0.001;
const float MAX_DIST_TO_TRAVEL = 100.0;

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

vec2 rot45(vec2 v) {
    return vec2(v.x - v.y, v.y + v.x) * 0.707107;
}

float smax(float a, float b, float k) {
    float h = max(k - abs(a - b), 0.0);
    return max(a, b) + h * h * 0.25 / k;
}

float CELL_SIZE = 1.5;
float CELLS_PER_SECOND = 2.;
float sdf(vec3 p, vec3 cell, float time) {
    float m = MAX_DIST_TO_TRAVEL;
    vec3 q = p;

    float CYLINDER_RADIUS = 0.2 + 0.15 * (2.5 * rand(cell.xy, cell.z) - 1.);
    // CYLINDER_RADIUS *= pumpingAction; // TODO: introduction of this line causes artifacts
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

    float pipeColumnOffset = 3. * rand(cell.xz);
    pipeColumnOffset += 0.5 * sin(time * pipeColumnOffset);
    float progress = clamp(CELLS_PER_SECOND * time - cell.y + 1. - pipeColumnOffset, 0., 1.);
    // slowdown the beginning and end of growth
    // progress *= - (4. * progress * progress - 4. * progress - 1.);

    m = smax(m, abs(p.y + 0.5 * CELL_SIZE) - CELL_SIZE * progress, 0.1);

    return m;
}

// corrected limited/finite repetition
float REPEAT_COUNT = 5.;
float limited_repeated(vec3 p, float time) {
    vec3 id = round(p / CELL_SIZE);
    vec3 offsetDirection = sign(p - CELL_SIZE * id);

    float d = 1e20;
    for (int k = 0; k < 2; k ++) for (int j = 0; j < 2; j ++) for (int i = 0; i < 2; i ++) {
                vec3 rid = id + vec3(i, j, k) * offsetDirection;
                // limited repetition
                rid.x = clamp(rid.x, - (REPEAT_COUNT - 1.0) * 0.5, (REPEAT_COUNT - 1.0) * 0.5);
                rid.z = clamp(rid.z, - (REPEAT_COUNT - 1.0) * 0.5, (REPEAT_COUNT - 1.0) * 0.5);
                // rid.xz = clamp(rid.xz, - (REPEAT_COUNT - 1.0) * 0.5, (REPEAT_COUNT - 1.0) * 0.5);
                vec3 r = p - CELL_SIZE * rid;
                d = min(d, sdf(r, rid, time));
            }
    return d;
}

// rotational/angular repetition
float repetition_rotational(vec3 p, int n, float time) {
    float sp = 6.283185 / float(n);
    float an = atan(p.z, p.x);
    float id = floor(an / sp);

    float a1 = sp * (id + 0.0);
    float a2 = sp * (id + 1.0);
    vec2 r1 = mat2(cos(a1), - sin(a1), sin(a1), cos(a1)) * p.xz;
    vec2 r2 = mat2(cos(a2), - sin(a2), sin(a2), cos(a2)) * p.xz;

    // return min(
    // //
    // sdBox(vec3(r1.x, p.y, r1.y) - vec3(2., 0., 0.), vec3(1.)),
    // //
    // sdBox(vec3(r2.x, p.y, r2.y) - vec3(2., 0., 0.), vec3(1.))
    // //
    // );
    vec3 offset = vec3(4., 0., 0.);

    return min(
        //
    sdf(vec3(r1.x, p.y, r1.y) - offset, vec3(id, 0., 0.), time),
        //
    sdf(vec3(r2.x, p.y, r2.y) - offset, vec3(id, 0., 0.), time)
        //
    );
}

float map(vec3 p) {
    vec3 q = p;

    float time = u_time * u_time_factor + u_time_offset;

    // move through space
    // q.y += CELL_SIZE * CELLS_PER_SECOND * time;

    // rotate over time
    // q.xz = mat2(cos(time * 0.5), - sin(time * 0.5), sin(time * 0.5), cos(time * 0.5)) * q.xz;

    // return sdf(q, vec3(0.), time);
    // return limited_repeated(q, time);
    // q.x -= CELL_SIZE * 2.5;
    return repetition_rotational(q, 10, time);
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

float CAMERA_DISTANCE = 7.;
vec3 render(vec2 uv) {
    float time = u_time * u_time_factor + u_time_offset;
    vec3 color = vec3(0.0);

    // note: ro -> ray origin, rd -> ray direction
    // ray origin = camera position
    vec3 ro = CAMERA_DISTANCE * vec3(0., 0., - 1.);
    // vec3 ro = CAMERA_DISTANCE * vec3(cos(time), 0., sin(time));

    // ray direction = vector from camera position to the current pixel
    vec3 rd = normalize(vec3(uv, 1.0));

    // // rotate ray around y axis
    // float angle = time + PI * 0.5;
    // rd = mat3(cos(angle), 0.0, sin(angle), 0.0, 1.0, 0.0, - sin(angle), 0.0, cos(angle)) * rd;

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
        float distance2 = march.x;
        if (distance2 < distToLightSource) {
            color = color * vec3(0.25);
        }

        // note: add gamma correction
        color = pow(color, vec3(1.0 / 2.2));
    }

    float colorVariation = 0. * 0.5 * sin(time * 0.1);
    vec3 paletteColor = palette((dist / 10.) + colorVariation, u_palette);
    color *= paletteColor;

    return color;
}

void main() {
    vec2 uv = v_uv;

    vec3 color = render(uv);

    gl_FragColor = vec4(color, 1.0);
}
