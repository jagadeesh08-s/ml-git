#!/usr/bin/env node

/**
 * Frontend-Backend Communication Test
 * Tests if the frontend can communicate with the backend server correctly
 */

import axios from 'axios';

// Mock the quantum API service functionality
class MockQuantumAPI {
  constructor() {
    this.baseURL = 'http://localhost:3001';
  }

  async makeRequest(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;

    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      console.log(`📡 Making request to: ${options.method || 'GET'} ${url}`);
      const response = await axios(url, defaultOptions);

      console.log(`✅ Response status: ${response.status}`);
      console.log(`📊 Response data:`, response.data);

      return response.data;
    } catch (error) {
      console.error(`❌ Request failed:`, error.message);
      if (error.response) {
        console.error(`   Status: ${error.response.status}`);
        console.error(`   Data:`, error.response.data);
      }
      throw error;
    }
  }

  async healthCheck() {
    return this.makeRequest('/health');
  }

  async getAvailableBackends() {
    return this.makeRequest('/api/quantum/backends?token=local');
  }

  async authenticate() {
    return this.makeRequest('/api/quantum/auth', {
      method: 'POST',
      data: {
        token: 'test_token',
        backend: 'ibmq_qasm_simulator'
      }
    });
  }

  async executeCircuit() {
    return this.makeRequest('/api/quantum/execute', {
      method: 'POST',
      data: {
        token: 'local',
        backend: 'local',
        circuit: {
          numQubits: 1,
          gates: [{ name: 'H', qubits: [0] }]
        },
        initialState: 'ket0',
        customState: { alpha: '1', beta: '0' },
        shots: 1024
      }
    });
  }
}

async function testFrontendBackendCommunication() {
  console.log('🔗 Testing Frontend-Backend Communication');
  console.log('=' .repeat(50));
  console.log('📡 Frontend will communicate with backend at: http://localhost:3001');
  console.log('');

  const api = new MockQuantumAPI();

  const tests = [
    {
      name: 'Health Check',
      test: () => api.healthCheck(),
      description: 'Basic connectivity test'
    },
    {
      name: 'Get Available Backends',
      test: () => api.getAvailableBackends(),
      description: 'Test backend listing functionality'
    },
    {
      name: 'Authentication Test',
      test: () => api.authenticate(),
      description: 'Test authentication endpoint'
    },
    {
      name: 'Circuit Execution Test',
      test: () => api.executeCircuit(),
      description: 'Test quantum circuit execution'
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      console.log(`🧪 Testing: ${test.name}`);
      console.log(`   ${test.description}`);

      const result = await test.test();

      console.log('   ✅ PASSED\n');
      passed++;

    } catch (error) {
      console.log('   ❌ FAILED\n');
      failed++;
    }
  }

  console.log('📊 Communication Test Results Summary');
  console.log('=' .repeat(40));
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${passed + failed > 0 ? Math.round((passed / (passed + failed)) * 100) : 0}%`);

  if (failed === 0) {
    console.log('\n🎉 All communication tests passed!');
    console.log('✅ Frontend can successfully communicate with the backend server.');
    console.log('🚀 Bloch Verse is ready to use with full functionality.');
  } else {
    console.log('\n⚠️  Some communication tests failed.');
    console.log('💡 Troubleshooting steps:');
    console.log('   1. Ensure the backend server is running on port 3001');
    console.log('   2. Check if there are any firewall or network issues');
    console.log('   3. Verify CORS settings in the backend server');
    console.log('   4. Check the browser console for any CORS errors');
  }

  return failed === 0;
}

// Handle command line arguments
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log('Frontend-Backend Communication Test');
  console.log('');
  console.log('Usage:');
  console.log('  node test_frontend_backend.js    # Test communication');
  console.log('');
  console.log('Options:');
  console.log('  --help, -h    Show this help message');
  console.log('');
  console.log('This script tests if the frontend can communicate with the backend server.');
  process.exit(0);
}

// Run the tests
testFrontendBackendCommunication().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('💥 Test script failed:', error.message);
  process.exit(1);
});