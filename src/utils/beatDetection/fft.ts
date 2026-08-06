/**
 * Iterative in-place radix-2 FFT with precomputed twiddle and bit-reversal
 * tables. Sized once per analysis and reused across every frame, so the tables
 * cost nothing per frame.
 */
export class FFT {
  readonly size: number;
  private readonly cosTable: Float64Array;
  private readonly sinTable: Float64Array;
  private readonly reverseTable: Uint32Array;

  constructor(size: number) {
    if (size < 2 || (size & (size - 1)) !== 0)
      throw new Error(`FFT size must be a power of two, got ${size}`);

    this.size = size;
    const half = size >> 1;

    this.cosTable = new Float64Array(half);
    this.sinTable = new Float64Array(half);
    for (let i = 0; i < half; i++) {
      this.cosTable[i] = Math.cos((2 * Math.PI * i) / size);
      this.sinTable[i] = Math.sin((2 * Math.PI * i) / size);
    }

    const bits = Math.round(Math.log2(size));
    this.reverseTable = new Uint32Array(size);
    for (let i = 0; i < size; i++) {
      let reversed = 0;
      for (let bit = 0; bit < bits; bit++)
        reversed |= ((i >> bit) & 1) << (bits - 1 - bit);
      this.reverseTable[i] = reversed;
    }
  }

  /** Forward transform, overwriting `real` and `imag` in place. */
  transform(real: Float64Array, imag: Float64Array) {
    const n = this.size;

    for (let i = 0; i < n; i++) {
      const j = this.reverseTable[i];
      if (j > i) {
        let swap = real[i];
        real[i] = real[j];
        real[j] = swap;
        swap = imag[i];
        imag[i] = imag[j];
        imag[j] = swap;
      }
    }

    for (let width = 2; width <= n; width <<= 1) {
      const half = width >> 1;
      const tableStep = n / width;
      for (let start = 0; start < n; start += width) {
        for (let i = start, k = 0; i < start + half; i++, k += tableStep) {
          const cos = this.cosTable[k];
          // negative sine gives the forward (e^-i2πk/N) transform
          const sin = -this.sinTable[k];
          const partner = i + half;
          const realPart = real[partner] * cos - imag[partner] * sin;
          const imagPart = real[partner] * sin + imag[partner] * cos;
          real[partner] = real[i] - realPart;
          imag[partner] = imag[i] - imagPart;
          real[i] += realPart;
          imag[i] += imagPart;
        }
      }
    }
  }
}
