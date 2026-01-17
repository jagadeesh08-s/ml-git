// Simple test script to verify IBM Quantum connection and job submission
import axios from 'axios';

async function testIBMConnection(token) {
  console.log('Testing IBM Quantum connection...');

  try {
    // Test 1: Check if token is valid by accessing backends
    console.log('1. Testing token validation...');
    const response = await axios.get('https://api.quantum.ibm.com/runtime/backends', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    console.log('✅ Token is valid!');
    console.log(`Found ${response.data.length} backends`);

    // Test 2: Check if we can access a specific backend
    if (response.data.length > 0) {
      const firstBackend = response.data[0];
      console.log(`2. Testing backend access: ${firstBackend.name}...`);

      const backendResponse = await axios.get(`https://api.quantum.ibm.com/runtime/backends/${firstBackend.name}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      console.log('✅ Backend access successful!');
      console.log(`Backend: ${backendResponse.data.name}`);
      console.log(`Qubits: ${backendResponse.data.n_qubits || backendResponse.data.num_qubits}`);
      console.log(`Status: ${backendResponse.data.status}`);
    }

    console.log('\n🎉 IBM Quantum connection test PASSED!');
    return true;

  } catch (error) {
    console.error('❌ IBM Quantum connection test FAILED:');
    console.error('Error:', error.response?.data || error.message);

    if (error.response?.status === 401) {
      console.error('Token appears to be invalid or expired');
    } else if (error.response?.status === 403) {
      console.error('Token may not have required permissions');
    } else if (error.code === 'ECONNABORTED') {
      console.error('Request timed out - check internet connection');
    }

    return false;
  }
}

async function testJobSubmission(token, backend = 'ibmq_qasm_simulator') {
  console.log('\nTesting job submission...');

  try {
    // Create a simple quantum circuit (Bell state)
    const circuit = {
      numQubits: 2,
      gates: [
        { name: 'H', qubits: [0] },
        { name: 'CNOT', qubits: [0, 1] }
      ]
    };

    console.log('1. Submitting Bell state circuit to IBM Quantum...');

    // Submit job to local backend first (for testing)
    const response = await axios.post('http://localhost:3001/api/quantum/execute', {
      token: token,
      backend: backend,
      circuit: circuit,
      initialState: 'ket0',
      customState: { alpha: '1', beta: '0' },
      shots: 1024
    }, {
      timeout: 30000
    });

    console.log('✅ Job submission successful!');
    console.log(`Job ID: ${response.data.jobId}`);
    console.log(`Method: ${response.data.method}`);
    console.log(`Status: ${response.data.status}`);
    console.log(`Message: ${response.data.message}`);

    if (response.data.jobId) {
      console.log('\n2. Testing job status polling...');

      // Poll job status
      for (let i = 0; i < 5; i++) {
        console.log(`Polling attempt ${i + 1}...`);

        const statusResponse = await axios.get(`http://localhost:3001/api/quantum/job/${response.data.jobId}/status`, {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          timeout: 10000
        });

        console.log(`Job Status: ${statusResponse.data.status}`);
        console.log(`Progress: ${statusResponse.data.progress}%`);
        console.log(`Message: ${statusResponse.data.statusMessage}`);

        if (statusResponse.data.status === 'COMPLETED') {
          console.log('✅ Job completed successfully!');
          break;
        } else if (statusResponse.data.status === 'FAILED') {
          console.log('❌ Job failed');
          break;
        }

        // Wait 2 seconds before next poll
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    console.log('\n🎉 Job submission and tracking test PASSED!');
    return true;

  } catch (error) {
    console.error('❌ Job submission test FAILED:');
    console.error('Error:', error.response?.data || error.message);
    return false;
  }
}

// Run test if token is provided as argument
const token = process.argv[2];
const backend = process.argv[3] || 'ibmq_qasm_simulator';

if (!token) {
  console.error('Usage: node test_ibm_connection.js <IBM_QUANTUM_TOKEN> [backend_name]');
  console.error('Get your token from: https://quantum-computing.ibm.com/account');
  console.error('Example: node test_ibm_connection.js your_token_here ibmq_qasm_simulator');
  process.exit(1);
}

async function runAllTests() {
  const connectionSuccess = await testIBMConnection(token);

  if (connectionSuccess) {
    console.log('\n' + '='.repeat(50));
    console.log('Starting job submission and tracking tests...');
    console.log('Make sure your backend server is running on port 3001');
    console.log('='.repeat(50));

    const jobSuccess = await testJobSubmission(token, backend);
    process.exit(connectionSuccess && jobSuccess ? 0 : 1);
  } else {
    process.exit(1);
  }
}

runAllTests();