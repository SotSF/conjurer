# How to make a pattern

Let's create a pattern called Blah. In total we will create two files and edit one file:

- `src/patterns/shaders/blah.frag` (new)
- `src/patterns/Blah.ts` (new)
- `src/patterns/patterns.ts` (edit)

The goal will be to create a barebones pattern that we can get to hot reload as we make changes to the shader so that we can immediately see the effects of our cool complicated maths. Yay!

1. Follow the usual steps to install dependencies and run the dev server:

```
yarn && yarn dev
```

2. Create the shader file, `src/patterns/shaders/blah.frag`:

```glsl
#include <conjurer_common>

#ifdef GL_ES
precision mediump float;
#endif

varying vec2 v_uv;
uniform float u_time;
uniform vec2 u_resolution;

// these are custom uniforms. we will start with two that are typically useful:
uniform float u_time_factor;
uniform float u_time_offset;
// TODO: specify more uniforms here

// For debugging, you can overwrite uniform values like the following and
// hot reloading will respect the new values. Remember! Only leave these lines
// uncommented during development, and when you are ready to commit, comment
// them again.
// #define u_time_factor 1.
// #define u_time_offset 0.

void main() {
    vec2 st = v_uv;

    float time = u_time * u_time_factor + u_time_offset;

    vec3 color = vec3(0., sin(time), cos(time));
    gl_FragColor = vec4(color, 1.);
}
```

3. Create the pattern file, `src/patterns/Blah.ts`:

```typescript
import { Pattern } from "@/src/types/Pattern";
import blah from "./shaders/blah.frag";

export { blah };
export const Blah = () =>
  new Pattern("Blah", blah, {
    // define two uniforms that are typically useful
    u_time_factor: {
      name: "Time Factor",
      value: 1,
    },
    u_time_offset: {
      name: "Time Offset",
      value: 0,
    },
    // TODO: specify more uniforms here
  });
```

4. Edit the file `src/patterns/patterns.ts` to include your pattern:

```typescript
// ... various imports
import { Blah } from "@/src/patterns/blah"; // <--- add this line

const patternFactories: Array<() => Pattern> = [
  LogSpirals,
  Barcode,
  // ... more patterns
  Blah, // <--- add this line
];

// more stuff
```

5. View the pattern in the pattern playground! Visit http://localhost:3000/playground.

You should see a new pattern called "Blah" - click it!

6. Edit the shader code and make sure that the pattern is hot reloaded and shows the change in the browser.

In the shader file `src/patterns/shaders/blah.frag`, let's simply uncomment the line:

```glsl
// #define u_time_factor 1.
```

and update the time factor to `10.` (the period tells the compiler that it is a float):

```glsl
#define u_time_factor 10.
```

Upon saving the file, you should now see the pattern in the pattern playground cycling more rapidly. If so, that's great! Hot reloading is working!

It's not pretty yet, but you've got the bear minimum setup. Happy math arting!
