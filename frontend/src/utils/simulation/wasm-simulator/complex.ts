/**
 * Complex number implementation for quantum simulations
 */
export class Complex {
  constructor(public real: number = 0, public imag: number = 0) {}

  static from(real: number, imag: number = 0): Complex {
    return new Complex(real, imag);
  }

  static fromPolar(magnitude: number, phase: number): Complex {
    return new Complex(
      magnitude * Math.cos(phase),
      magnitude * Math.sin(phase)
    );
  }

  add(other: Complex): Complex {
    return new Complex(this.real + other.real, this.imag + other.imag);
  }

  subtract(other: Complex): Complex {
    return new Complex(this.real - other.real, this.imag - other.imag);
  }

  multiply(other: Complex): Complex {
    return new Complex(
      this.real * other.real - this.imag * other.imag,
      this.real * other.imag + this.imag * other.real
    );
  }

  multiplyScalar(scalar: number): Complex {
    return new Complex(this.real * scalar, this.imag * scalar);
  }

  conjugate(): Complex {
    return new Complex(this.real, -this.imag);
  }

  magnitude(): number {
    return Math.sqrt(this.real * this.real + this.imag * this.imag);
  }

  magnitudeSquared(): number {
    return this.real * this.real + this.imag * this.imag;
  }

  phase(): number {
    return Math.atan2(this.imag, this.real);
  }

  toString(): string {
    if (this.imag === 0) return this.real.toString();
    if (this.real === 0) return this.imag === 1 ? 'i' : this.imag === -1 ? '-i' : `${this.imag}i`;
    const sign = this.imag >= 0 ? '+' : '';
    return `${this.real}${sign}${this.imag === 1 ? '' : this.imag === -1 ? '-' : this.imag}i`;
  }

  clone(): Complex {
    return new Complex(this.real, this.imag);
  }
}