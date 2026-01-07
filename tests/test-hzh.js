// Test script to verify HZH sequence produces correct transformation
// HZH should produce: X → X, Y → −Y, Z → −Z (π rotation around X-axis)

const testHZHSequence = () => {
  console.log('Testing HZH sequence transformation...\n');

  // Test matrices (using the corrected Y gate matrix)
  const H = [
    [0.7071067811865476, 0.7071067811865476],
    [0.7071067811865476, -0.7071067811865476]
  ];

  const Z = [
    [1, 0],
    [0, -1]
  ];

  const Y = [
    [0, -1],
    [1, 0]
  ];

  // Compute HZH = H * Z * H
  const HZH = multiplyMatrices(H, multiplyMatrices(Z, H));

  console.log('Computed HZH matrix:');
  console.log(HZH.map(row => row.map(x => x.toFixed(6)).join(', ')).join('\n'));

  // Expected X gate matrix
  const X = [
    [0, 1],
    [1, 0]
  ];

  console.log('\nExpected X gate matrix:');
  console.log(X.map(row => row.map(x => x.toFixed(6)).join(', ')).join('\n'));

  // Check if HZH equals X (within numerical precision)
  const isEqual = matricesEqual(HZH, X);
  console.log(`\nHZH equals X gate: ${isEqual ? '✓ YES' : '✗ NO'}`);

  if (isEqual) {
    console.log('\n✅ SUCCESS: HZH sequence correctly produces X gate transformation!');
    console.log('This confirms: X → X, Y → −Y, Z → −Z');
  } else {
    console.log('\n❌ ERROR: HZH sequence does not match X gate');
  }

  return isEqual;
};

// Matrix multiplication helper
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

// Matrix equality check with tolerance
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

// Run the test
testHZHSequence();