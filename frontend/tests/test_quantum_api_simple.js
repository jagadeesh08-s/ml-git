#!/usr/bin/env node

// Test quantum circuit execution using Node.js built-in modules
import http from 'http';
import https from 'https';

function makeRequest(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    });
    
    req.on('error', (e) => {
      reject(e);
    });
    
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

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

    const postData = JSON.stringify(testCircuit);
    
    const options = {
      hostname: 'localhost',
      port: 3003,
      path: '/api/quantum/execute',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    console.log('📤 Sending request to:', `http://localhost:3003/api/quantum/execute`);
    console.log('📋 Circuit:', JSON.stringify(testCircuit, null, 2));

    const data = await makeRequest(options, postData);
    
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
      if (data.details) {
        console.log('🔍 Details:', data.details);
      }
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