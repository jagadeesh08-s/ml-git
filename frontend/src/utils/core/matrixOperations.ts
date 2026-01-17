// Matrix Operations for Quantum Computing
// Extracted from quantumSimulation.ts for better modularity

// Matrix multiplication with safety checks
export const matrixMultiply = (A: number[][], B: number[][]): number[][] => {
  // Add safety checks
  if (!A || !A.length || !B || !B.length || !A[0] || !B[0]) {
    console.error('Invalid matrices for multiplication:', { A, B });
    return [[0]]; // Return zero matrix as fallback
  }

  const rows = A.length;
  const cols = B[0].length;
  const result = Array(rows).fill(0).map(() => Array(cols).fill(0));

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      let sum = 0;
      for (let k = 0; k < B.length; k++) {
        const aVal = Number(A[i][k]) || 0;
        const bVal = Number(B[k][j]) || 0;
        const product = aVal * bVal;
        sum += isNaN(product) ? 0 : product;
      }
      result[i][j] = isNaN(sum) ? 0 : sum;
    }
  }
  return result;
};

// Tensor product of two matrices
export const tensorProduct = (A: number[][], B: number[][]): number[][] => {
  // Add safety checks
  if (!A || !A.length || !A[0] || !B || !B.length || !B[0]) {
    console.error('Invalid matrices for tensor product:', { A, B });
    return [[1]]; // Return identity as fallback
  }

  const m = A.length;
  const n = A[0].length;
  const p = B.length;
  const q = B[0].length;

  const result = Array(m * p).fill(0).map(() => Array(n * q).fill(0));

  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      for (let k = 0; k < p; k++) {
        for (let l = 0; l < q; l++) {
          const aVal = Number(A[i][j]) || 0;
          const bVal = Number(B[k][l]) || 0;
          const product = aVal * bVal;
          result[i * p + k][j * q + l] = isNaN(product) ? 0 : product;
        }
      }
    }
  }
  return result;
};

// Matrix trace
export const trace = (matrix: number[][]): number => {
  let tr = 0;
  for (let i = 0; i < matrix.length; i++) {
    tr += matrix[i][i];
  }
  return tr;
};

// Matrix transpose
export const transpose = (matrix: number[][]): number[][] => {
  return matrix[0].map((_, colIndex) => matrix.map(row => row[colIndex]));
};

// Matrix addition
export const matrixAdd = (A: number[][], B: number[][]): number[][] => {
  if (A.length !== B.length || A[0].length !== B[0].length) {
    throw new Error('Matrices must have the same dimensions for addition');
  }

  return A.map((row, i) =>
    row.map((val, j) => (Number(val) || 0) + (Number(B[i][j]) || 0))
  );
};

// Scalar multiplication
export const scalarMultiply = (matrix: number[][], scalar: number): number[][] => {
  return matrix.map(row =>
    row.map(val => (Number(val) || 0) * scalar)
  );
};

// Identity matrix
export const identity = (size: number): number[][] => {
  const result = Array(size).fill(0).map(() => Array(size).fill(0));
  for (let i = 0; i < size; i++) {
    result[i][i] = 1;
  }
  return result;
};

// Zero matrix
export const zeros = (rows: number, cols: number): number[][] => {
  return Array(rows).fill(0).map(() => Array(cols).fill(0));
};

// Check if matrix is square
export const isSquare = (matrix: number[][]): boolean => {
  return matrix.length > 0 && matrix.length === matrix[0].length;
};

// Check if matrix is Hermitian (simplified for real matrices)
export const isHermitian = (matrix: number[][]): boolean => {
  if (!isSquare(matrix)) return false;

  const n = matrix.length;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (Math.abs(matrix[i][j] - matrix[j][i]) > 1e-10) {
        return false;
      }
    }
  }
  return true;
};

// Matrix norm (Frobenius norm)
export const frobeniusNorm = (matrix: number[][]): number => {
  let sum = 0;
  for (const row of matrix) {
    for (const val of row) {
      sum += (Number(val) || 0) ** 2;
    }
  }
  return Math.sqrt(sum);
};

// Check matrix equality with tolerance
export const matrixEquals = (A: number[][], B: number[][], tolerance: number = 1e-10): boolean => {
  if (A.length !== B.length || A[0].length !== B[0].length) {
    return false;
  }

  for (let i = 0; i < A.length; i++) {
    for (let j = 0; j < A[0].length; j++) {
      if (Math.abs((Number(A[i][j]) || 0) - (Number(B[i][j]) || 0)) > tolerance) {
        return false;
      }
    }
  }
  return true;
};