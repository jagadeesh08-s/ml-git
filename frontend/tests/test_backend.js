#!/usr/bin/env node

/**
 * Backend Server Connectivity Test
 * Tests if the backend server is running and responding correctly
 */

import axios from 'axios';

const BACKEND_URL = 'http://localhost:3001';

async function testBackendConnectivity() {
  console.log('🔍 Testing Backend Server Connectivity');
  console.log('=' .repeat(50));
  console.log(`📡 Backend URL: ${BACKEND_URL}`);
  console.log('');

  const tests = [
    {
      name: 'Health Check',
      endpoint: '/health',
      method: 'GET',
      description: 'Basic server health check'
    },
    {
      name: 'Available Backends (Local)',
      endpoint: '/api/quantum/backends?token=local',
      method: 'GET',
      description: 'Get available backends without IBM token'
    },
    {
      name: 'Authentication Test',
      endpoint: '/api/quantum/auth',
      method: 'POST',
      data: {
        token: 'test_token',
        backend: 'ibmq_qasm_simulator'
      },
      description: 'Test authentication endpoint'
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      console.log(`🧪 Testing: ${test.name}`);
      console.log(`   ${test.description}`);
      console.log(`   Endpoint: ${test.method} ${test.endpoint}`);

      const config = {
        method: test.method,
        url: `${BACKEND_URL}${test.endpoint}`,
        timeout: 10000
      };

      if (test.data) {
        config.data = test.data;
        config.headers = { 'Content-Type': 'application/json' };
      }

      const response = await axios(config);

      console.log(`   ✅ Status: ${response.status} ${response.statusText}`);

      if (response.data) {
        if (typeof response.data === 'object') {
          const keys = Object.keys(response.data);
          console.log(`   📊 Response contains: ${keys.join(', ')}`);

          // Show some sample data for backends test
          if (test.endpoint.includes('/backends') && response.data.backends) {
            console.log(`   📈 Available backends: ${response.data.backends.length}`);
            response.data.backends.slice(0, 3).forEach((backend, index) => {
              console.log(`      ${index + 1}. ${backend.name} (${backend.qubits} qubits) - ${backend.type}`);
            });
          }
        } else {
          console.log(`   📄 Response: ${response.data}`);
        }
      }

      console.log('   ✅ PASSED\n');
      passed++;

    } catch (error) {
      console.log(`   ❌ FAILED`);

      if (error.code === 'ECONNREFUSED') {
        console.log(`   🚫 Cannot connect to backend server at ${BACKEND_URL}`);
        console.log(`   💡 Make sure the backend server is running:`);
        console.log(`      cd backend && node server.js`);
      } else if (error.response) {
        console.log(`   🚫 HTTP ${error.response.status}: ${error.response.statusText}`);
        if (error.response.data?.error) {
          console.log(`   📝 Error: ${error.response.data.error}`);
        }
      } else {
        console.log(`   🚫 ${error.message}`);
      }

      console.log('   ❌ FAILED\n');
      failed++;
    }
  }

  console.log('📊 Test Results Summary');
  console.log('=' .repeat(30));
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${passed + failed > 0 ? Math.round((passed / (passed + failed)) * 100) : 0}%`);

  if (failed === 0) {
    console.log('\n🎉 All tests passed! Backend server is working correctly.');
    console.log('🚀 You can now use Bloch Verse with quantum computing features.');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the errors above.');
    console.log('💡 Common solutions:');
    console.log('   1. Start the backend server: cd backend && node server.js');
    console.log('   2. Check if port 3001 is already in use');
    console.log('   3. Verify your IBM Quantum token is configured (optional)');
    console.log('   4. Check your internet connection for IBM Quantum features');
  }

  return failed === 0;
}

// Handle command line arguments
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log('Backend Server Connectivity Test');
  console.log('');
  console.log('Usage:');
  console.log('  node test_backend.js    # Run connectivity tests');
  console.log('');
  console.log('Options:');
  console.log('  --help, -h    Show this help message');
  console.log('');
  console.log('This script tests if the backend server is running and responding correctly.');
  process.exit(0);
}

// Run the tests
testBackendConnectivity().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('💥 Test script failed:', error.message);
  process.exit(1);
});