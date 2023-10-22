#include <conjurer_common>

#ifdef GL_ES
precision mediump float;
#endif

varying vec2 v_uv;
uniform float u_time;

uniform Palette u_palette;
uniform float u_time_factor;
uniform float u_time_offset;
uniform float u_camera_y;
uniform float u_camera_distance;
uniform float u_camera_rotation_factor;
uniform float u_rust_threshold;
uniform float u_cell_size;
uniform float u_cells_per_second;
uniform float u_repeat_count;

// #define u_palette Palette(vec3(0.5774455613585161, 0.918901534803475, 0.9183302614725621), vec3(0.8214304234785681, 0.5104221980835277, 0.08214322007047792), vec3(0.711588398332782, 0.871542869224424, 0.5801340330878866), vec3(0.7204852048004471, 0.45233742857529746, 0.12917934855128466))

// #define u_time_factor 1.
// #define u_time_offset 41.1
// #define u_camera_y -25.
// #define u_camera_distance 9.
// #define u_camera_rotation_factor 0.1
// #define u_rust_threshold 0.5
// #define u_cell_size 1.5
// #define u_cells_per_second 2.
// #define u_repeat_count 5.

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

float sdf(vec3 p, vec3 cell, float time) {
    float m = MAX_DIST_TO_TRAVEL;
    vec3 q = p;

    float CYLINDER_RADIUS = 0.2 + 0.15 * (2.5 * rand(cell.xy, cell.z) - 1.);
    float CYLINDER_HEIGHT = u_cell_size * 0.5;
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
    float progress = clamp(u_cells_per_second * time - cell.y + 1. - pipeColumnOffset, 0., 1.);
    // slowdown the beginning and end of growth
    // progress *= - (4. * progress * progress - 4. * progress - 1.);

    m = smax(m, abs(p.y + 0.5 * u_cell_size) - u_cell_size * progress, 0.1);

    return m;
}

// corrected limited/finite repetition
vec2 limited_repeated(vec3 p, float time) {
    vec3 id = round(p / u_cell_size);
    vec3 offsetDirection = sign(p - u_cell_size * id);

    float bound = (u_repeat_count - 1.0) * 0.5;

    float d = 1e20;
    float objectId = 0.;
    for (int k = 0; k < 2; k ++) for (int j = 0; j < 2; j ++) for (int i = 0; i < 2; i ++) {
                vec3 rid = id + vec3(i, j, k) * offsetDirection;
                // limited repetition
                rid.xz = clamp(rid.xz, - bound, bound);
                vec3 r = p - u_cell_size * rid;
                float sdfValue = sdf(r, rid, time);
                objectId = sdfValue < d ? rand(rid.xz) : objectId;

                d = min(d, sdfValue);
            }
    return vec2(d, objectId);
}

vec2 map(vec3 p) {
    vec3 q = p;

    float time = u_time * u_time_factor + u_time_offset;

    // move through space
    q.y += u_cell_size * u_cells_per_second * time;

    // rotate over time
    // q.xz = mat2(cos(time * 0.5), - sin(time * 0.5), sin(time * 0.5), cos(time * 0.5)) * q.xz;

    // return sdf(q, vec3(0.), time);
    return limited_repeated(q, time);
}

vec2 rayMarch(vec3 ro, vec3 rd, float maxDistToTravel) {
    float dist = 0.0;
    float objectId = 0.0;

    for (float i = 0.0; i < NUM_OF_STEPS; i ++) {
        vec3 currentPos = ro + rd * dist;

        vec2 mapped = map(currentPos);
        float distToSdf = mapped.x;
        objectId = mapped.y;

        if (distToSdf < MIN_DIST_TO_SDF) {
            break;
        }

        dist = dist + distToSdf;

        if (dist > maxDistToTravel) {
            break;
        }
    }

    return vec2(dist, objectId);
}

vec3 getNormal(vec3 p) {
    vec2 d = vec2(0.01, 0.0);
    float gx = map(p + d.xyy).x - map(p - d.xyy).x;
    float gy = map(p + d.yxy).x - map(p - d.yxy).x;
    float gz = map(p + d.yyx).x - map(p - d.yyx).x;
    vec3 normal = vec3(gx, gy, gz);
    return normalize(normal);
}

float mod289(float x) {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
}
vec4 mod289(vec4 x) {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
}
vec4 perm(vec4 x) {
    return mod289(((x * 34.0) + 1.0) * x);
}

float noise(vec3 p) {
    vec3 a = floor(p);
    vec3 d = p - a;
    d = d * d * (3.0 - 2.0 * d);

    vec4 b = a.xxyy + vec4(0.0, 1.0, 0.0, 1.0);
    vec4 k1 = perm(b.xyxy);
    vec4 k2 = perm(k1.xyxy + b.zzww);

    vec4 c = k2 + a.zzzz;
    vec4 k3 = perm(c);
    vec4 k4 = perm(c + 1.0);

    vec4 o1 = fract(k3 * (1.0 / 41.0));
    vec4 o2 = fract(k4 * (1.0 / 41.0));

    vec4 o3 = o2 * d.z + o1 * (1.0 - d.z);
    vec2 o4 = o3.yw * d.x + o3.xz * (1.0 - d.x);

    return o4.y * d.y + o4.x * (1.0 - d.y);
}

int NUM_OCTAVES = 6;
float fbm(vec3 x) {
    float v = 0.0;
    float a = 0.5;
    vec3 shift = vec3(100);
    for (int i = 0; i < NUM_OCTAVES; ++ i) {
        v += a * noise(x);
        x = x * 2.0 + shift;
        a *= 0.5;
    }
    return v;
}

vec3 textureColor(vec3 position, float objectId) {
    vec3 color = vec3(1.);
    float time = u_time * u_time_factor + u_time_offset;

    // Apply a pallet color based on objectId and time
    float colorVariation = 0.2 * sin(time * 0.5);
    vec3 paletteColor = palette((objectId) + colorVariation, u_palette);
    color *= paletteColor;

    // apply rust based on y rust threshold
    vec3 stationaryVerticalPosition = position;
    stationaryVerticalPosition.y += u_cell_size * u_cells_per_second * time;
    color.x = mix(color.x, fbm(stationaryVerticalPosition * 5.), 1. - clamp(position.y - u_rust_threshold, 0., 1.));

    return color;
}

vec3 render(vec2 uv) {
    vec3 color = vec3(0.0);
    float time = u_time * u_time_factor + u_time_offset;

    // note: ro -> ray origin, rd -> ray direction
    // ray origin = camera position
    // vec3 ro = u_camera_distance * vec3(0., 0., - 1.);
    float cameraAngle = time * u_camera_rotation_factor;
    vec3 ro = u_camera_distance * vec3(cos(cameraAngle), 0., sin(cameraAngle));
    ro.y = u_camera_y;

    // ray direction = vector from camera position to the current pixel
    vec3 rd = normalize(vec3(uv, 1.0));

    // // rotate ray around y axis
    float angle = cameraAngle + PI * 0.5;
    rd = mat3(cos(angle), 0.0, sin(angle), 0.0, 1.0, 0.0, - sin(angle), 0.0, cos(angle)) * rd;

    vec2 march = rayMarch(ro, rd, MAX_DIST_TO_TRAVEL);
    float dist = march.x;
    float objectId = march.y;
    vec3 p = ro + rd * dist;

    if (dist < MAX_DIST_TO_TRAVEL) {
        // part 1 - display ray marching result
        color = vec3(1.0);

        // part 2.1 - calculate normals
        // calculate normals at the exact point where we hit SDF
        vec3 normal = getNormal(p);
        color = normal;

        // part 2.2 - add lighting

        // part 2.2.1 - calculate diffuse lighting
        vec3 lightColor = vec3(1.0);
        // vary the distance of the light source
        // vec3 lightSource = vec3(2.5, 2.5, 2.0 - sin(time * 0.015) * 5.);
        vec3 lightSource = ro * 0.25 + vec3(0., 2.5, 0.);
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
        vec2 march2 = rayMarch(ro, rd, distToLightSource);
        float dist2 = march2.x;
        if (dist2 < distToLightSource) {
            color = color * vec3(0.25);
        }

        // note: add gamma correction
        color = pow(color, vec3(1.0 / 2.2));

        // part 4 - add texture
        color *= textureColor(p, objectId);
    }

    return color;
}

void main() {
    vec2 uv = v_uv;

    vec3 color = render(uv);

    gl_FragColor = vec4(color, 1.0);
}
