// Complex number utilities for quantum computing
export interface Complex {
  real: number;
  imag: number;
}

export const complex = (real: number, imag: number = 0): Complex => ({ real, imag });

export const add = (a: Complex, b: Complex): Complex => ({
  real: a.real + b.real,
  imag: a.imag + b.imag
});

export const subtract = (a: Complex, b: Complex): Complex => ({
  real: a.real - b.real,
  imag: a.imag - b.imag
});

export const multiply = (a: Complex, b: Complex): Complex => ({
  real: a.real * b.real - a.imag * b.imag,
  imag: a.real * b.imag + a.imag * b.real
});

export const divide = (a: Complex, b: Complex): Complex => {
  const denominator = b.real * b.real + b.imag * b.imag;
  return {
    real: (a.real * b.real + a.imag * b.imag) / denominator,
    imag: (a.imag * b.real - a.real * b.imag) / denominator
  };
};

export const conjugate = (a: Complex): Complex => ({
  real: a.real,
  imag: -a.imag
});

export const magnitude = (a: Complex): number => Math.sqrt(a.real * a.real + a.imag * a.imag);

export const phase = (a: Complex): number => Math.atan2(a.imag, a.real);

export const exp = (a: Complex): Complex => {
  const e = Math.exp(a.real);
  return {
    real: e * Math.cos(a.imag),
    imag: e * Math.sin(a.imag)
  };
};

export const pow = (base: Complex, exponent: number): Complex => {
  if (exponent === 0) return complex(1, 0);
  if (exponent === 1) return base;

  const mag = magnitude(base);
  const arg = phase(base);
  const newMag = Math.pow(mag, exponent);
  const newArg = arg * exponent;

  return {
    real: newMag * Math.cos(newArg),
    imag: newMag * Math.sin(newArg)
  };
};

export const sin = (a: Complex): Complex => {
  // sin(z) = (e^(iz) - e^(-iz)) / (2i)
  const iz = multiply(complex(0, 1), a);
  const eiz = exp(iz);
  const emiz = exp(multiply(complex(0, -1), a));
  const diff = subtract(eiz, emiz);
  return divide(diff, complex(0, 2));
};

export const cos = (a: Complex): Complex => {
  // cos(z) = (e^(iz) + e^(-iz)) / 2
  const iz = multiply(complex(0, 1), a);
  const eiz = exp(iz);
  const emiz = exp(multiply(complex(0, -1), a));
  const sum = add(eiz, emiz);
  return multiply(sum, complex(0.5, 0));
};

// Complex matrix type
export type ComplexMatrix = Complex[][];

// Convert complex matrix to real matrix representation (for compatibility)
export const complexToRealMatrix = (matrix: ComplexMatrix): number[][] => {
  const rows = matrix.length;
  const cols = matrix[0].length;
  const result: number[][] = Array(rows * 2).fill(0).map(() => Array(cols * 2).fill(0));

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const val = matrix[i][j];
      result[i * 2][j * 2] = val.real;
      result[i * 2][j * 2 + 1] = -val.imag; // -imag for conjugate transpose
      result[i * 2 + 1][j * 2] = val.imag;
      result[i * 2 + 1][j * 2 + 1] = val.real;
    }
  }

  return result;
};

// Convert real matrix back to complex matrix (simplified for 2x2 case)
export const realToComplexMatrix = (matrix: number[][]): ComplexMatrix => {
  if (matrix.length === 2 && matrix[0].length === 2) {
    // Standard 2x2 complex matrix
    return [
      [complex(matrix[0][0], matrix[0][1]), complex(matrix[0][2] || 0, matrix[0][3] || 0)],
      [complex(matrix[1][0], matrix[1][1]), complex(matrix[1][2] || 0, matrix[1][3] || 0)]
    ];
  }

  // For larger matrices, assume real part only (fallback)
  return matrix.map(row => row.map(val => complex(val, 0)));
};

// Matrix operations for complex matrices
export const multiplyComplexMatrices = (a: ComplexMatrix, b: ComplexMatrix): ComplexMatrix => {
  const result: ComplexMatrix = [];
  for (let i = 0; i < a.length; i++) {
    result[i] = [];
    for (let j = 0; j < b[0].length; j++) {
      let sum = complex(0, 0);
      for (let k = 0; k < a[0].length; k++) {
        sum = add(sum, multiply(a[i][k], b[k][j]));
      }
      result[i][j] = sum;
    }
  }
  return result;
};

export const conjugateTranspose = (matrix: ComplexMatrix): ComplexMatrix => {
  const rows = matrix.length;
  const cols = matrix[0].length;
  const result: ComplexMatrix = Array(cols).fill(0).map(() => Array(rows).fill(complex(0, 0)));

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      result[j][i] = conjugate(matrix[i][j]);
    }
  }

  return result;
};

// Constants
export const I = complex(0, 1); // Imaginary unit
export const ZERO = complex(0, 0);
export const ONE = complex(1, 0);

// Tensor product of two complex matrices
export const tensorProduct = (a: ComplexMatrix, b: ComplexMatrix): ComplexMatrix => {
  const m = a.length;
  const n = a[0].length;
  const p = b.length;
  const q = b[0].length;

  const result: ComplexMatrix = [];

  for (let i = 0; i < m * p; i++) {
    result[i] = [];
    for (let j = 0; j < n * q; j++) {
      // Index in a: floor(i / p), floor(j / q)
      // Index in b: i % p, j % q
      result[i][j] = multiply(
        a[Math.floor(i / p)][Math.floor(j / q)],
        b[i % p][j % q]
      );
    }
  }
  return result;
};


// Trace of a complex matrix
export const trace = (matrix: ComplexMatrix): Complex => {
  let tr = complex(0, 0);
  for (let i = 0; i < matrix.length; i++) {
    tr = add(tr, matrix[i][i]);
  }
  return tr;
};

// Check if two complex matrices are equal
export const complexMatrixEquals = (A: ComplexMatrix, B: ComplexMatrix, tolerance: number = 1e-10): boolean => {
  if (A.length !== B.length || A[0].length !== B[0].length) return false;

  for (let i = 0; i < A.length; i++) {
    for (let j = 0; j < A[0].length; j++) {
      const diff = subtract(A[i][j], B[i][j]);
      if (magnitude(diff) > tolerance) return false;
    }
  }
  return true;
};