// Test script to verify Y gate produces correct Bloch vector transformation
// Y|0⟩ should give |+i⟩ state with Bloch vector (0, 1, 0)

const { simulateCircuit } = require('./src/utils/circuitOperations.ts');

console.log('Testing Y gate Bloch vector transformation...\n');

// Test Y gate on |0⟩
const circuit = {
  numQubits: 1,
  gates: [{ name: 'Y', qubits: [0] }]
};

const result = simulateCircuit(circuit, '|0⟩');

console.log('Y gate on |0⟩:');
console.log('Input state: |0⟩');
console.log('Output probabilities:', result.probabilities);
console.log('Bloch vector:', result.reducedStates[0]?.blochVector);

const bloch = result.reducedStates[0]?.blochVector;
if (bloch) {
  console.log(`\nExpected: (0, 1, 0) for |+i⟩ state`);
  console.log(`Actual: (${bloch.x.toFixed(3)}, ${bloch.y.toFixed(3)}, ${bloch.z.toFixed(3)})`);

  const xCorrect = Math.abs(bloch.x) < 0.1;
  const yCorrect = Math.abs(bloch.y - 1.0) < 0.1;
  const zCorrect = Math.abs(bloch.z) < 0.1;

  if (xCorrect && yCorrect && zCorrect) {
    console.log('✅ SUCCESS: Y gate correctly produces |+i⟩ state on +Y axis!');
  } else {
    console.log('❌ ERROR: Y gate Bloch vector is incorrect');
  }
} else {
  console.log('❌ ERROR: No Bloch vector calculated');
}