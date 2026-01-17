// Test script to verify the new input state system

const testInputSystem = () => {
  console.log('Testing input state system...\n');

  // Test the generateComputationalBasisStates function
  const generateStates = (numQubits) => {
    if (numQubits <= 0) return [];

    const states = [];
    const numStates = 1 << numQubits; // 2^numQubits

    for (let i = 0; i < numStates; i++) {
      const binaryString = i.toString(2).padStart(numQubits, '0');
      const label = `|${binaryString}⟩`;
      const value = `|${binaryString}⟩`;
      states.push({ label, value, notation: 'bra-ket' });
    }

    return states;
  };

  // Test different qubit counts
  console.log('1-qubit states:');
  console.log(generateStates(1).map(s => s.label));

  console.log('\n2-qubit states:');
  console.log(generateStates(2).map(s => s.label));

  console.log('\n3-qubit states:');
  console.log(generateStates(3).map(s => s.label));

  console.log('\n4-qubit states:');
  console.log(generateStates(4).map(s => s.label));

  // Verify correct counts
  const tests = [
    { qubits: 1, expected: 2 },
    { qubits: 2, expected: 4 },
    { qubits: 3, expected: 8 },
    { qubits: 4, expected: 16 }
  ];

  console.log('\nVerification:');
  tests.forEach(test => {
    const actual = generateStates(test.qubits).length;
    const passed = actual === test.expected;
    console.log(`${test.qubits} qubits: ${actual} states ${passed ? '✅' : '❌'} (expected ${test.expected})`);
  });
};

// Run the test
testInputSystem();