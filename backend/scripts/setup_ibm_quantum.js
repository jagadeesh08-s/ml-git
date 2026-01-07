#!/usr/bin/env node

/**
 * IBM Quantum Token Setup Script
 * This script helps you configure your IBM Quantum token for the Bloch Verse application
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const ENV_FILE_PATH = path.join(__dirname, 'backend', '.env');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setupIBMToken() {
  console.log('🔧 IBM Quantum Token Setup');
  console.log('=' .repeat(50));
  console.log('');
  console.log('To use IBM Quantum services, you need to:');
  console.log('1. Go to https://quantum-computing.ibm.com/account');
  console.log('2. Sign in to your IBM Quantum account');
  console.log('3. Copy your API token from the account page');
  console.log('');
  console.log('The token looks like: 1a2b3c4d5e6f7g8h9i0j...');
  console.log('');

  const token = await question('Enter your IBM Quantum token (or press Enter to skip): ');

  if (!token.trim()) {
    console.log('⚠️  No token provided. Using local simulator mode only.');
    console.log('💡 You can run this script again later to add your token.');
    return false;
  }

  try {
    // Read current .env file
    let envContent = '';
    if (fs.existsSync(ENV_FILE_PATH)) {
      envContent = fs.readFileSync(ENV_FILE_PATH, 'utf8');
    }

    // Update or add the IBM_QUANTUM_TOKEN
    if (envContent.includes('IBM_QUANTUM_TOKEN=')) {
      // Replace existing token
      envContent = envContent.replace(
        /IBM_QUANTUM_TOKEN=.*/,
        `IBM_QUANTUM_TOKEN=${token}`
      );
    } else {
      // Add new token
      envContent += `\nIBM_QUANTUM_TOKEN=${token}\n`;
    }

    // Write back to .env file
    fs.writeFileSync(ENV_FILE_PATH, envContent);

    console.log('✅ IBM Quantum token saved successfully!');
    console.log(`📁 Token stored in: ${ENV_FILE_PATH}`);
    console.log('');
    console.log('🔄 You need to restart the backend server for changes to take effect.');
    console.log('💡 Run: cd backend && node server.js');

    return true;

  } catch (error) {
    console.error('❌ Error saving token:', error.message);
    return false;
  }
}

async function testToken(token) {
  console.log('\n🧪 Testing IBM Quantum token...');

  try {
    const axios = require('axios');

    const response = await axios.get('https://api.quantum.ibm.com/runtime/backends', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    console.log('✅ Token is valid!');
    console.log(`📊 Found ${response.data.length} available backends:`);

    response.data.slice(0, 5).forEach((backend, index) => {
      console.log(`   ${index + 1}. ${backend.name} (${backend.n_qubits || backend.num_qubits} qubits) - ${backend.status}`);
    });

    if (response.data.length > 5) {
      console.log(`   ... and ${response.data.length - 5} more`);
    }

    return true;

  } catch (error) {
    console.error('❌ Token validation failed:');
    if (error.response?.status === 401) {
      console.error('   Invalid or expired token');
    } else if (error.response?.status === 403) {
      console.error('   Token lacks required permissions');
    } else if (error.code === 'ECONNABORTED') {
      console.error('   Connection timeout - check internet connection');
    } else {
      console.error(`   ${error.message}`);
    }
    return false;
  }
}

async function main() {
  console.log('🚀 Bloch Verse - IBM Quantum Setup');
  console.log('=' .repeat(50));

  try {
    const tokenConfigured = await setupIBMToken();

    if (tokenConfigured) {
      // Read the token from the .env file to test it
      const envContent = fs.readFileSync(ENV_FILE_PATH, 'utf8');
      const tokenMatch = envContent.match(/IBM_QUANTUM_TOKEN=(.+)/);

      if (tokenMatch && tokenMatch[1] && tokenMatch[1] !== 'your_token_here') {
        const isValid = await testToken(tokenMatch[1]);

        if (isValid) {
          console.log('\n🎉 Setup completed successfully!');
          console.log('✅ You can now use IBM Quantum services in Bloch Verse');
        } else {
          console.log('\n⚠️  Token saved but validation failed.');
          console.log('💡 Please check your token and try again.');
        }
      }
    } else {
      console.log('\n✅ Setup completed in local simulator mode.');
      console.log('💡 You can add your IBM Quantum token later by running this script again.');
    }

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
  } finally {
    rl.close();
  }
}

// Handle command line arguments
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log('IBM Quantum Token Setup Script');
  console.log('');
  console.log('Usage:');
  console.log('  node setup_ibm_quantum.js          # Interactive setup');
  console.log('  node setup_ibm_quantum.js <token>  # Direct token setup');
  console.log('');
  console.log('Options:');
  console.log('  --help, -h    Show this help message');
  console.log('');
  process.exit(0);
}

if (args.length > 0 && !args[0].startsWith('-')) {
  // Direct token setup
  const token = args[0];

  if (token && token !== 'your_token_here') {
    // Save token directly
    try {
      let envContent = '';
      if (fs.existsSync(ENV_FILE_PATH)) {
        envContent = fs.readFileSync(ENV_FILE_PATH, 'utf8');
      }

      if (envContent.includes('IBM_QUANTUM_TOKEN=')) {
        envContent = envContent.replace(/IBM_QUANTUM_TOKEN=.*/, `IBM_QUANTUM_TOKEN=${token}`);
      } else {
        envContent += `\nIBM_QUANTUM_TOKEN=${token}\n`;
      }

      fs.writeFileSync(ENV_FILE_PATH, envContent);
      console.log('✅ IBM Quantum token saved successfully!');
      console.log(`📁 Token stored in: ${ENV_FILE_PATH}`);

      // Test the token
      testToken(token).then(isValid => {
        if (isValid) {
          console.log('🎉 Token validation successful!');
        } else {
          console.log('⚠️  Token saved but validation failed.');
        }
        process.exit(isValid ? 0 : 1);
      });

    } catch (error) {
      console.error('❌ Error saving token:', error.message);
      process.exit(1);
    }
  } else {
    console.error('❌ Invalid token provided');
    process.exit(1);
  }
} else {
  // Interactive setup
  main();
}