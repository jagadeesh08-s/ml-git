#!/usr/bin/env node

// Test quantum circuit execution
const fetch = require('node-fetch');

async function testQuantumExecution() {
  try {
    console.log('🧪 Testing Quantum Circuit Execution...');
    
    const testCircuit = {
      backend: 'local',
      circuit: {
        numQubits: 1,
        gates: [
          { name: 'H', qubits: [0] }
        ]
      },
      initialState: 'ket0',
      shots: 1024
    };

    console.log('📤 Sending request to:', 'http://localhost:3003/api/quantum/execute');
    console.log('📋 Circuit:', JSON.stringify(testCircuit, null, 2));

    const response = await fetch('http://localhost:3003/api/quantum/execute', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testCircuit),
    });

    console.log('📊 Response status:', response.status);
    
    const data = await response.json();
    console.log('📦 Response data:', JSON.stringify(data, null, 2));
    
    if (data.success) {
      console.log('✅ Quantum execution successful!');
      console.log('🎯 Backend:', data.backend);
      console.log('⏱️  Execution time:', data.executionTime, 'seconds');
      
      if (data.qubitResults && data.qubitResults.length > 0) {
        console.log('📈 Qubit results:');
        data.qubitResults.forEach((result, index) => {
          console.log(`  Qubit ${index}:`);
          console.log(`    Bloch Vector: (${result.blochVector.x.toFixed(3)}, ${result.blochVector.y.toFixed(3)}, ${result.blochVector.z.toFixed(3)})`);
          console.log(`    Purity: ${result.purity.toFixed(3)}`);
        });
      }
    } else {
      console.log('❌ Quantum execution failed:', data.error);
    }

  } catch (error) {
    console.error('❌ Error testing quantum execution:', error.message);
  }
}

// Run test
testQuantumExecution().then(() => {
  console.log('🏁 Test completed');
  process.exit(0);
}).catch(error => {
  console.error('💥 Test failed:', error);
  process.exit(1);
});