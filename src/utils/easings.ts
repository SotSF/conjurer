const easeInSine = (x: number) => {
  return 1 - Math.cos((x * Math.PI) / 2);
};
const easeOutSine = (x: number) => {
  return Math.sin((x * Math.PI) / 2);
};
const easeInOutSine = (x: number) => {
  return -(Math.cos(Math.PI * x) - 1) / 2;
};
const easeInQuad = (x: number) => {
  return x * x;
};
const easeOutQuad = (x: number) => {
  return 1 - (1 - x) * (1 - x);
};
const easeInOutQuad = (x: number) => {
  return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
};
const easeInCubic = (x: number) => {
  return x * x * x;
};
const easeOutCubic = (x: number) => {
  return 1 - Math.pow(1 - x, 3);
};
const easeInOutCubic = (x: number) => {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};
const easeInQuart = (x: number) => {
  return x * x * x * x;
};
const easeOutQuart = (x: number) => {
  return 1 - Math.pow(1 - x, 4);
};
const easeInOutQuart = (x: number) => {
  return x < 0.5 ? 8 * x * x * x * x : 1 - Math.pow(-2 * x + 2, 4) / 2;
};
const easeInQuint = (x: number) => {
  return x * x * x * x * x;
};
const easeOutQuint = (x: number) => {
  return 1 - Math.pow(1 - x, 5);
};
const easeInOutQuint = (x: number) => {
  return x < 0.5 ? 16 * x * x * x * x * x : 1 - Math.pow(-2 * x + 2, 5) / 2;
};
const easeInExpo = (x: number) => {
  return x === 0 ? 0 : Math.pow(2, 10 * x - 10);
};
const easeOutExpo = (x: number) => {
  return x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
};
const easeInOutExpo = (x: number) => {
  return x === 0
    ? 0
    : x === 1
      ? 1
      : x < 0.5
        ? Math.pow(2, 20 * x - 10) / 2
        : (2 - Math.pow(2, -20 * x + 10)) / 2;
};
const easeInCirc = (x: number) => {
  return 1 - Math.sqrt(1 - Math.pow(x, 2));
};
const easeOutCirc = (x: number) => {
  return Math.sqrt(1 - Math.pow(x - 1, 2));
};
const easeInOutCirc = (x: number) => {
  return x < 0.5
    ? (1 - Math.sqrt(1 - Math.pow(2 * x, 2))) / 2
    : (Math.sqrt(1 - Math.pow(-2 * x + 2, 2)) + 1) / 2;
};
const easeInBack = (x: number) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;

  return c3 * x * x * x - c1 * x * x;
};
const easeOutBack = (x: number) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;

  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
};
const easeInOutBack = (x: number) => {
  const c1 = 1.70158;
  const c2 = c1 * 1.525;

  return x < 0.5
    ? (Math.pow(2 * x, 2) * ((c2 + 1) * 2 * x - c2)) / 2
    : (Math.pow(2 * x - 2, 2) * ((c2 + 1) * (x * 2 - 2) + c2) + 2) / 2;
};
const easeInElastic = (x: number) => {
  const c4 = (2 * Math.PI) / 3;

  return x === 0
    ? 0
    : x === 1
      ? 1
      : -Math.pow(2, 10 * x - 10) * Math.sin((x * 10 - 10.75) * c4);
};
const easeOutElastic = (x: number) => {
  const c4 = (2 * Math.PI) / 3;

  return x === 0
    ? 0
    : x === 1
      ? 1
      : Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * c4) + 1;
};
const easeInOutElastic = (x: number) => {
  const c5 = (2 * Math.PI) / 4.5;

  return x === 0
    ? 0
    : x === 1
      ? 1
      : x < 0.5
        ? -(Math.pow(2, 20 * x - 10) * Math.sin((20 * x - 11.125) * c5)) / 2
        : (Math.pow(2, -20 * x + 10) * Math.sin((20 * x - 11.125) * c5)) / 2 +
          1;
};
const easeInBounce = (x: number) => {
  return 1 - easeOutBounce(1 - x);
};
const easeOutBounce = (x: number) => {
  const n1 = 7.5625;
  const d1 = 2.75;

  if (x < 1 / d1) {
    return n1 * x * x;
  } else if (x < 2 / d1) {
    return n1 * (x -= 1.5 / d1) * x + 0.75;
  } else if (x < 2.5 / d1) {
    return n1 * (x -= 2.25 / d1) * x + 0.9375;
  } else {
    return n1 * (x -= 2.625 / d1) * x + 0.984375;
  }
};
const easeInOutBounce = (x: number) => {
  return x < 0.5
    ? (1 - easeOutBounce(1 - 2 * x)) / 2
    : (1 + easeOutBounce(2 * x - 1)) / 2;
};

export const easings = {
  easeInSine,
  easeOutSine,
  easeInOutSine,
  easeInQuad,
  easeOutQuad,
  easeInOutQuad,
  easeInCubic,
  easeOutCubic,
  easeInOutCubic,
  easeInQuart,
  easeOutQuart,
  easeInOutQuart,
  easeInQuint,
  easeOutQuint,
  easeInOutQuint,
  easeInExpo,
  easeOutExpo,
  easeInOutExpo,
  easeInCirc,
  easeOutCirc,
  easeInOutCirc,
  easeInBack,
  easeOutBack,
  easeInOutBack,
  easeInElastic,
  easeOutElastic,
  easeInOutElastic,
  easeInBounce,
  easeOutBounce,
  easeInOutBounce,
};
