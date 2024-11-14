type Point = {
  x: number;
  y: number;
};

/**
 * given two points a = [ax, ay] and b = [bx, by] in the vertical plane,
 * rope length rLength, and the number of intermediate points N,
 * outputs the coordinates X and Y of the hanging rope from a to b
 * the optional input sagInit initializes the sag parameter for the
 * root-finding procedure.
 *
 * Ported from MATLAB code written by Yuval:
 * https://www.mathworks.com/matlabcentral/fileexchange/38550-catenary-hanging-rope-between-two-points
 */
export const catenary = (
  { x: x1, y: y1 }: Point,
  { x: x2, y: y2 }: Point,
  rLength: number,
  N: number,
  sagInit: number = 1,
) => {
  const maxIter = 100; // maximum number of iterations
  const minGrad = 1e-10; // minimum norm of gradient
  const minVal = 1e-8; // minimum norm of sag function
  const stepDec = 0.5; // factor for decreasing stepsize
  const minStep = 1e-9; // minimum step size
  const minHoriz = 1e-3; // minimum horizontal distance
  let sag = sagInit;
  let X = new Array(N);
  let Y = new Array(N);

  if (x1 > x2) {
    [x1, x2] = [x2, x1];
  }

  const d = x2 - x1;
  const h = y2 - y1;

  if (Math.abs(d) < minHoriz) {
    // almost perfectly vertical
    for (let i = 0; i < N; i++) {
      X[i] = (x1 + x2) / 2;
    }

    if (rLength < Math.abs(h)) {
      // rope is stretched
      Y = linearSpacing(y1, y2, N);
    } else {
      sag = (rLength - Math.abs(h)) / 2;
      const nSag = Math.ceil((N * sag) / rLength);
      const yMax = Math.max(y1, y2);
      const yMin = Math.min(y1, y2);
      Y = [
        ...linearSpacing(yMax, yMin - sag, N - nSag),
        ...linearSpacing(yMin - sag, yMin, nSag),
      ];
    }

    return zip(X, Y);
  }

  X = linearSpacing(x1, x2, N);

  if (rLength <= Math.sqrt(d ** 2 + h ** 2)) {
    // rope is stretched: straight line
    Y = linearSpacing(y1, y2, N);
  } else {
    // find rope sag
    for (let iter = 0; iter < maxIter; iter++) {
      const val = g(sag, d, h, rLength);
      const grad = dg(sag, d);

      if (Math.abs(val) < minVal || Math.abs(grad) < minGrad) {
        break;
      }

      const search = -g(sag, d, h, rLength) / dg(sag, d);
      let alpha = 1;
      let sagNew = sag + alpha * search;

      while (sagNew < 0 || Math.abs(g(sagNew, d, h, rLength)) > Math.abs(val)) {
        alpha = stepDec * alpha;
        if (alpha < minStep) {
          break;
        }

        sagNew = sag + alpha * search;
      }

      sag = sagNew;
    }

    // get location of rope minimum and vertical bias
    const xLeft = 0.5 * (Math.log((rLength + h) / (rLength - h)) / sag - d);
    const xMin = x1 - xLeft;
    const bias = y1 - Math.cosh(xLeft * sag) / sag;

    for (let i = 0; i < Y.length; i++) {
      Y[i] = Math.cosh((X[i] - xMin) * sag) / sag + bias;
    }
  }

  return zip(X, Y);
};

/********************************************************************************
 * Helper methods
 ********************************************************************************/

/**
 * Mocks the MATLAB `linspace` method:
 *   https://www.mathworks.com/help/matlab/ref/linspace.html#bufmmx4
 *
 * Generates a linearly spaced vector of `n` points in the interval[`x1`, `x2`]
 */
const linearSpacing = (x1: number, x2: number, n: number) => {
  const vector = new Array(n);
  vector[0] = x1;
  vector[n - 1] = x2;

  const spacingInterval = (x2 - x1) / (n - 1);
  for (let i = 1; i < n; i++) {
    vector[i] = x1 + spacingInterval * i;
  }

  return vector;
};

/** Not exactly sure what these two methods do... */
const g = (s: number, d: number, h: number, rLength: number) =>
  (2 * Math.sinh((s * d) / 2)) / s - Math.sqrt(rLength ** 2 - h ** 2);
const dg = (s: number, d: number) =>
  (2 * Math.cosh((s * d) / 2) * d) / (2 * s) -
  (2 * Math.sinh((s * d) / 2)) / s ** 2;

/**
 * Zips two arrays together into a single array of tuples.
 */
const zip = <T, U>(a: T[], b: U[]): Array<[T, U]> => {
  const zipped: Array<[T, U]> = [];
  for (let i = 0; i < a.length; i++) {
    zipped.push([a[i], b[i]]);
  }
  return zipped;
};
