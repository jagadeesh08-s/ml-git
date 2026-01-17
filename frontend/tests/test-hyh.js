// Test script to verify H-Y-H sequence produces correct transformation
// H-Y-H should produce |0⟩ → |1⟩ (π rotation around Y-axis)

const testHYHSequence = () => {
  console.log('Testing H-Y-H sequence transformation...\n');

  // Test matrices (using the corrected Y gate matrix)
  const H = [
    [0.7071067811865476, 0.7071067811865476],
    [0.7071067811865476, -0.7071067811865476]
  ];

  const Y = [
    [0, -1],
    [1, 0]
  ];

  // Compute H-Y-H = H * Y * H
  const HYH = multiplyMatrices(H, multiplyMatrices(Y, H));

  console.log('Computed H-Y-H matrix:');
  console.log(HYH.map(row => row.map(x => x.toFixed(6)).join(', ')).join('\n'));

  // Expected Z gate matrix (H-Y-H should equal Z)
  const Z = [
    [1, 0],
    [0, -1]
  ];

  console.log('\nExpected Z gate matrix:');
  console.log(Z.map(row => row.map(x => x.toFixed(6)).join(', ')).join('\n'));

  // Check if H-Y-H equals Z (within numerical precision)
  const isEqual = matricesEqual(HYH, Z);
  console.log(`\nH-Y-H equals Z gate: ${isEqual ? '✓ YES' : '✗ NO'}`);

  if (isEqual) {
    console.log('\n✅ SUCCESS: H-Y-H sequence correctly produces Z gate transformation!');
    console.log('This confirms: X → -X, Y → Y, Z → -Z (π rotation around Y-axis)');
  } else {
    console.log('\n❌ ERROR: H-Y-H sequence does not match Z gate');
  }

  return isEqual;
};

// Test the step-by-step state evolution
const testHYHStateEvolution = () => {
  console.log('\n' + '='.repeat(50));
  console.log('Testing H-Y-H state evolution step by step...\n');

  // Start with |0⟩ state: density matrix [[1, 0], [0, 0]]
  let currentRho = [
    [1, 0],
    [0, 0]
  ];

  const H = [
    [0.7071067811865476, 0.7071067811865476],
    [0.7071067811865476, -0.7071067811865476]
  ];

  const Y = [
    [0, -1],
    [1, 0]
  ];

  console.log('Initial state |0⟩:');
  console.log('Density matrix:', currentRho.map(row => row.join(', ')));
  console.log('Bloch vector:', densityMatrixToBlochVector(currentRho));

  // Apply H gate
  currentRho = applyGateToDensityMatrix(currentRho, H);
  console.log('\nAfter H gate:');
  console.log('Density matrix:', currentRho.map(row => row.map(x => x.toFixed(6)).join(', ')));
  console.log('Bloch vector:', densityMatrixToBlochVector(currentRho));

  // Apply Y gate
  currentRho = applyGateToDensityMatrix(currentRho, Y);
  console.log('\nAfter Y gate:');
  console.log('Density matrix:', currentRho.map(row => row.map(x => x.toFixed(6)).join(', ')));
  console.log('Bloch vector:', densityMatrixToBlochVector(currentRho));

  // Apply H gate
  currentRho = applyGateToDensityMatrix(currentRho, H);
  console.log('\nAfter final H gate (H-Y-H):');
  console.log('Density matrix:', currentRho.map(row => row.map(x => x.toFixed(6)).join(', ')));
  console.log('Bloch vector:', densityMatrixToBlochVector(currentRho));

  console.log('\nExpected final state: |1⟩ with Bloch vector {x: 0, y: 0, z: -1}');
};

// Helper functions
function densityMatrixToBlochVector(rho) {
  const rho00 = rho[0][0];
  const rho11 = rho[1][1];
  const rho01 = rho[0][1];

  return {
    x: 2 * rho01,
    y: 0, // For real matrices, imaginary part is 0
    z: rho00 - rho11
  };
}

function applyGateToDensityMatrix(rho, gate) {
  // Apply gate: U ρ U†
  const uRho = multiplyMatrices(gate, rho);
  return multiplyMatrices(uRho, transpose(gate));
}

function multiplyMatrices(a, b) {
  const result = Array(a.length).fill(0).map(() => Array(b[0].length).fill(0));

  for (let i = 0; i < a.length; i++) {
    for (let j = 0; j < b[0].length; j++) {
      for (let k = 0; k < a[0].length; k++) {
        result[i][j] += a[i][k] * b[k][j];
      }
    }
  }

  return result;
}

function transpose(matrix) {
  const result = Array(matrix[0].length).fill(0).map(() => Array(matrix.length).fill(0));

  for (let i = 0; i < matrix.length; i++) {
    for (let j = 0; j < matrix[0].length; j++) {
      result[j][i] = matrix[i][j];
    }
  }

  return result;
}

function matricesEqual(a, b, tolerance = 1e-10) {
  if (a.length !== b.length || a[0].length !== b[0].length) {
    return false;
  }

  for (let i = 0; i < a.length; i++) {
    for (let j = 0; j < a[0].length; j++) {
      if (Math.abs(a[i][j] - b[i][j]) > tolerance) {
        return false;
      }
    }
  }

  return true;
}

// Run the tests
testHYHSequence();
testHYHStateEvolution();