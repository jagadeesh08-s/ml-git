// Test script for quantum simulator functionality
import { simulateCircuit, EXAMPLE_CIRCUITS, GATES } from './src/utils/quantumSimulation.js';

console.log('🧪 Testing Quantum Circuit Simulator...\n');

// Test 1: Basic |0⟩ state
console.log('Test 1: |0⟩ state');
const test1 = simulateCircuit({ numQubits: 1, gates: [] });
console.log('Probabilities:', test1.probabilities);
console.log('Bloch vector:', test1.reducedStates[0]?.blochVector);
console.log('Expected: [0, 0, 1] for Bloch vector\n');

// Test 2: X gate on |0⟩
console.log('Test 2: X|0⟩');
const test2 = simulateCircuit({ numQubits: 1, gates: [{ name: 'X', qubits: [0] }] });
console.log('Probabilities:', test2.probabilities);
console.log('Bloch vector:', test2.reducedStates[0]?.blochVector);
console.log('Expected: [0, 0, -1] for Bloch vector\n');

// Test 3: H gate on |0⟩
console.log('Test 3: H|0⟩');
const test3 = simulateCircuit({ numQubits: 1, gates: [{ name: 'H', qubits: [0] }] });
console.log('Probabilities:', test3.probabilities);
console.log('Bloch vector:', test3.reducedStates[0]?.blochVector);
console.log('Expected: [1, 0, 0] for Bloch vector\n');

// Test 4: RX gate with parameter
console.log('Test 4: RX(π/2)|0⟩');
const test4 = simulateCircuit({
  numQubits: 1,
  gates: [{ name: 'RX', qubits: [0], parameters: { angle: Math.PI / 2 } }]
});
console.log('Probabilities:', test4.probabilities);
console.log('Bloch vector:', test4.reducedStates[0]?.blochVector);
console.log('Expected: [0, -1, 0] for Bloch vector\n');

// Test 5: RY gate with parameter
console.log('Test 5: RY(π/2)|0⟩');
const test5 = simulateCircuit({
  numQubits: 1,
  gates: [{ name: 'RY', qubits: [0], parameters: { angle: Math.PI / 2 } }]
});
console.log('Probabilities:', test5.probabilities);
console.log('Bloch vector:', test5.reducedStates[0]?.blochVector);
console.log('Expected: [1, 0, 0] for Bloch vector\n');

// Test 6: Bell state
console.log('Test 6: Bell state (H ⊗ I) CNOT(|00⟩)');
const test6 = simulateCircuit(EXAMPLE_CIRCUITS['Bell State']);
console.log('Probabilities:', test6.probabilities);
console.log('Qubit 0 Bloch vector:', test6.reducedStates[0]?.blochVector);
console.log('Qubit 1 Bloch vector:', test6.reducedStates[1]?.blochVector);
console.log('Expected: Both qubits should have Bloch vectors [0, 0, 0] (maximally mixed)\n');

// Test 7: Parameter validation
console.log('Test 7: Parameter validation');
try {
  const test7 = simulateCircuit({
    numQubits: 1,
    gates: [{ name: 'RX', qubits: [0], parameters: { angle: 'invalid' } }]
  });
  console.log('Should have failed with invalid parameter');
} catch (error) {
  console.log('Correctly caught error:', error.message);
}

// Test 8: Multiple parameterized gates
console.log('Test 8: Multiple parameterized gates');
const test8 = simulateCircuit({
  numQubits: 2,
  gates: [
    { name: 'RX', qubits: [0], parameters: { angle: Math.PI / 4 } },
    { name: 'RY', qubits: [1], parameters: { angle: Math.PI / 3 } },
    { name: 'CNOT', qubits: [0, 1] }
  ]
});
console.log('Probabilities:', test8.probabilities);
console.log('Qubit 0 Bloch vector:', test8.reducedStates[0]?.blochVector);
console.log('Qubit 1 Bloch vector:', test8.reducedStates[1]?.blochVector);

// Test 9: Gate matrix validation
console.log('Test 9: Gate matrix validation');
const test9 = simulateCircuit({
  numQubits: 1,
  gates: [{ name: 'X', qubits: [0], matrix: [[0, 1], [1, 0]] }]
});
console.log('Probabilities:', test9.probabilities);
console.log('Bloch vector:', test9.reducedStates[0]?.blochVector);

console.log('\n✅ Testing completed!');
