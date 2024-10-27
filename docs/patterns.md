# How to make a pattern

Let's create a pattern called Blah. The goal will be to create a barebones pattern that we can get to hot reload as we make changes to the shader. This way, we can immediately see the effects of our cool complicated maths. Yay!

1. Follow the usual steps to install dependencies and run the dev server:

```
yarn && yarn dev
```

2. Create the pattern with the following command:

```
yarn generatePattern Blah
```

This will create two files and edit one file:

- `src/patterns/shaders/blah.frag` (new)
- `src/patterns/Blah.ts` (new)
- `src/patterns/patterns.ts` (edit)

3. View the pattern in the pattern playground! Visit http://localhost:3000/playground.

You should see a new pattern called "Blah" - click it!

4. Edit the shader code and make sure that the pattern is hot reloaded and shows the change in the browser.

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
