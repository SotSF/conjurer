// From https://godotshaders.com/shader/starfield/, credit to https://godotshaders.com/author/ivader/
#include <conjurer_common>

#ifdef GL_ES
precision mediump float;
#endif

varying vec2 v_uv;
uniform float u_time;

uniform int u_iterations;
uniform float u_magic;
uniform float u_step_size;
uniform bool u_dark_stars;
uniform float u_visible_distance;
uniform float u_zoom;
uniform float u_speed;
uniform float u_brightness;
uniform float u_dist_fading;
uniform float u_saturation;
uniform float u_transverse_speed;
uniform float u_cloud;
uniform vec3 u_cloud_color;


const float tileScale = 0.850;


float triangle(float x, float a) { 
	float output2 = 2.0*abs(  3.0*  ( (x/a) - floor( (x/a) + 0.5) ) ) - 1.0;
	return output2;
}
 
float field(in vec3 p) {	
	float strength = 7. + .03 * log(1.e-6 + fract(sin(u_time) * 373.11));
	float accum = 0.;
	float prev = 0.;
	float tw = 0.;	

	for (int i = 0; i < 6; ++i) {
		float mag = dot(p, p);
		p = abs(p) / mag + vec3(-.5, -.8 + 0.1*sin(-u_time*0.1 + 2.0), -1.1+0.3*cos(u_time*0.3));
		float w = exp(-float(i) / 7.);
		accum += w * exp(-strength * pow(abs(mag - prev), 2.3));
		tw += w;
		prev = mag;
	}
	return max(0., 5. * accum / tw - .7);
}

void main() {
    // vec2 uv2 = 2. * FRAGCOORD.xy / vec2(512) - 1.;
	vec2 uvs = v_uv;
	
    	//get coords and direction	
	vec2 uv = uvs;		       
	//mouse rotation
	float a_xz = 0.9;
	float a_yz = -.6;
	float a_xy = 0.9 + u_time*0.08;	
	
	mat2 rot_xz = mat2(vec2(cos(a_xz),sin(a_xz)),vec2(-sin(a_xz),cos(a_xz)));	
	mat2 rot_yz = mat2(vec2(cos(a_yz),sin(a_yz)),vec2(-sin(a_yz),cos(a_yz)));		
	mat2 rot_xy = mat2(vec2(cos(a_xy),sin(a_xy)),vec2(-sin(a_xy),cos(a_xy)));
	
	float v2 =1.0;	
	vec3 dir=vec3(uv*u_zoom,1.); 
	vec3 from=vec3(0.0, 0.0,0.0);                               
        // from.x -= 2.0*(mouse.x-0.5);
        // from.y -= 2.0*(mouse.y-0.5);

	vec3 forward = vec3(0.,0.,1.);   
	from.x += u_transverse_speed*(1.0)*cos(0.01*u_time) + 0.001*u_time;
	from.y += u_transverse_speed*(1.0)*sin(0.01*u_time) +0.001*u_time;
	from.z += 0.003*u_time;	
	
	dir.xy*=rot_xy;
	forward.xy *= rot_xy;
	dir.xz*=rot_xz;
	forward.xz *= rot_xz;	
	dir.yz*= rot_yz;
	forward.yz *= rot_yz;
	
	from.xy*=-1.0*rot_xy;
	from.xz*=rot_xz;
	from.yz*= rot_yz;
	 
	//zoom
	float zooom = (u_time - 3311.) * u_speed;
	from += forward* zooom;
	float sampleShift = mod( zooom, u_step_size );
	 
	float zoffset = -sampleShift;
	sampleShift /= u_step_size; // make from 0 to 1
	
	//volumetric rendering
	float s=0.24;
	float s3 = s + u_step_size/2.0;
	vec3 v=vec3(0.);
	float t3 = 0.0;	
	
	vec3 backCol2 = vec3(0.);
	for (float r=0.0; r<u_visible_distance; r++) {
		vec3 p2=from+(s+zoffset)*dir;// + vec3(0.,0.,zoffset);
		vec3 p3=from+(s3+zoffset)*dir;// + vec3(0.,0.,zoffset);
		
		p2 = abs(vec3(tileScale)-mod(p2,vec3(tileScale*2.))); // tiling fold
		p3 = abs(vec3(tileScale)-mod(p3,vec3(tileScale*2.))); // tiling fold		
		// #ifdef cloud
		t3 = field(p3);
		
		float pa,a=pa=0.;
		for (int i=0; i<u_iterations; i++) {
            if (u_dark_stars) {
                // another interesting way to reduce noise
			    p2 = abs(p2)/max(dot(p2,p2),0.005)-u_magic;
            } else {
                // the magic formula
			    p2 = abs(p2)/dot(p2,p2)-u_magic;
            }

			float D = abs(length(p2)-pa); // absolute sum of average change
			a += i > 7 ? min( 12., D) : D;
			pa=length(p2);
		}
		
		
		//float dm=max(0.,darkmatter-a*a*.001); //dark matter
		a*=a*a; // add contrast
		//if (r>3) fade*=1.-dm; // dark matter, don't render near
		// brightens stuff up a bit
		float s1 = s+zoffset;
		// need closed form expression for this, now that we shift samples
		float fade = pow(u_dist_fading,max(0.,float(r)-sampleShift));		
		//t3 += fade;		
		v+=fade;
	       	//backCol2 -= fade;

		// fade out samples as they approach the camera
		if( r == 0.0 )
			fade *= (1. - (sampleShift));
		// fade in samples as they approach from the distance
		if( r == u_visible_distance-1.0 )
			fade *= sampleShift;
		v+=vec3(s1,s1*s1,s1*s1*s1*s1)*a*u_brightness/1000.*fade; // coloring based on distance
		
		backCol2 += mix(.4, 1., v2) * vec3(1.8 * t3 * t3 * t3, 1.4 * t3 * t3, t3) * fade;

		
		s+=u_step_size;
		s3 += u_step_size;		
	}
		       
	v = mix(vec3(length(v)),v,u_saturation); //color adjust	

	vec4 forCol2 = vec4(v*.01,1.);
	backCol2 *= u_cloud;
    backCol2.rgb *= u_cloud_color.rgb;

	// backCol2.b *= 1.8;
	// backCol2.r *= 0.05;	
	// backCol2.b = 0.5*mix(backCol2.g, backCol2.b, 0.8);
	// backCol2.g = 0.0;
	// backCol2.bg = mix(backCol2.gb, backCol2.bg, 0.5*(cos(u_time*0.01) + 1.0));	
	
	gl_FragColor = forCol2 + vec4(backCol2, 1.0);
}
