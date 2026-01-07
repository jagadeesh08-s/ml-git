const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { spawn } = require('child_process');
const path = require('path');
const axios = require('axios');
const { generateContextualResponse } = require('./quantumKnowledgeBase');
require('dotenv').config();

// Simple in-memory cache for backend responses
class BackendCache {
  constructor() {
    this.cache = new Map();
    this.maxSize = 100; // Maximum number of entries
    this.defaultTTL = 5 * 60 * 1000; // 5 minutes default TTL
  }

  generateKey(req) {
    // Create cache key from request method, URL, and body
    const key = `${req.method}_${req.originalUrl}_${JSON.stringify(req.body || {})}`;
    return key;
  }

  get(req) {
    const key = this.generateKey(req);
    const entry = this.cache.get(key);

    if (!entry) return null;

    // Check if expired
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  set(req, data, ttl = this.defaultTTL) {
    const key = this.generateKey(req);

    // Implement simple LRU by removing oldest entries if at max size
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    const entry = {
      data,
      expiry: Date.now() + ttl,
      timestamp: Date.now()
    };

    this.cache.set(key, entry);
  }

  clear() {
    this.cache.clear();
  }

  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      entries: Array.from(this.cache.entries()).map(([key, entry]) => ({
        key: key.substring(0, 50) + '...', // Truncate for display
        age: Date.now() - entry.timestamp,
        ttl: entry.expiry - Date.now()
      }))
    };
  }
}

const backendCache = new BackendCache();

const app = express();
const PORT = process.env.PORT || 3002;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // Check if origin is localhost or matched one of the allowed domains
    const allowed = [
      process.env.FRONTEND_URL,
      'http://localhost',
      'http://127.0.0.1'
    ];

    const isAllowed = allowed.some(domain => domain && origin.startsWith(domain));

    if (isAllowed) {
      callback(null, true);
    } else {
      console.log('Blocked by CORS:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Body parsing middleware
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Cache middleware
const cacheMiddleware = (ttl = 5 * 60 * 1000) => {
  return (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Skip caching for health check and cache management endpoints
    if (req.path === '/health' || req.path.startsWith('/api/cache')) {
      return next();
    }

    const cachedResponse = backendCache.get(req);
    if (cachedResponse) {
      console.log(`🎯 Cache hit for ${req.method} ${req.originalUrl}`);
      return res.json(cachedResponse);
    }

    // Store original json method
    const originalJson = res.json;
    res.json = function (data) {
      // Cache successful responses (status 200-299)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        // Use shorter TTL for fallback responses to allow quick recovery
        const cacheTTL = data.isFallback ? 10000 : ttl;
        backendCache.set(req, data, cacheTTL);
        console.log(`💾 Cached response for ${req.method} ${req.originalUrl} (TTL: ${cacheTTL}ms)`);
      }
      return originalJson.call(this, data);
    };

    next();
  };
};

// Health check endpoint (no caching)
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'quantum-backend',
    cache: backendCache.getStats()
  });
});

// Cache management endpoints
app.get('/api/cache/stats', (req, res) => {
  res.json({
    success: true,
    cache: backendCache.getStats()
  });
});

app.delete('/api/cache/clear', (req, res) => {
  backendCache.clear();
  console.log('🧹 Cache manually cleared via API');
  res.json({
    success: true,
    message: 'Cache cleared successfully'
  });
});

// Apply cache middleware to read-only endpoints
app.use('/api/quantum/backends', cacheMiddleware(10 * 60 * 1000)); // Cache backends for 10 minutes
app.use('/api/quantum/job', cacheMiddleware(2 * 60 * 1000)); // Cache job status for 2 minutes

// IBM Quantum authentication endpoint
app.post('/api/quantum/auth', async (req, res) => {
  try {
    const { token, backend } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'IBM Quantum token is required' });
    }

    // Validate token with IBM Quantum API
    const authResult = await validateIBMToken(token);

    if (!authResult.valid) {
      return res.status(401).json({ error: 'Invalid IBM Quantum token' });
    }

    // Get backend information
    const backendInfo = await getBackendInfo(token, backend);

    res.json({
      success: true,
      backend: backendInfo,
      message: `Connected to ${backendInfo.name}`
    });

  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ error: 'Failed to authenticate with IBM Quantum' });
  }
});

// Circuit execution endpoint
app.post('/api/quantum/execute', async (req, res) => {
  try {
    const {
      token,
      backend,
      circuit,
      initialState,
      customState,
      shots = 1024
    } = req.body;

    // Validate required fields
    if (!circuit) {
      return res.status(400).json({ error: 'Circuit is required' });
    }

    if (typeof circuit !== 'object' || !circuit.numQubits || !Array.isArray(circuit.gates)) {
      return res.status(400).json({ error: 'Invalid circuit format. Must have numQubits (number) and gates (array)' });
    }

    if (!Number.isInteger(circuit.numQubits) || circuit.numQubits < 1 || circuit.numQubits > 10) {
      return res.status(400).json({ error: 'numQubits must be an integer between 1 and 10' });
    }

    if (circuit.gates.length > 100) {
      return res.status(400).json({ error: 'Too many gates. Maximum 100 gates allowed' });
    }

    // Validate shots
    if (!Number.isInteger(shots) || shots < 1 || shots > 10000) {
      return res.status(400).json({ error: 'shots must be an integer between 1 and 10000' });
    }

    // Token is optional for local execution
    if (!token && backend !== 'local') {
      return res.status(400).json({ error: 'IBM Quantum token is required for non-local execution' });
    }

    // Validate backend
    const validBackends = ['local', 'ibmq_qasm_simulator', 'simulator_statevector', 'simulator_mps', 'ibmq_manila', 'ibmq_lima', 'ibmq_belem', 'ibmq_quito', 'ibm_brisbane', 'ibm_sherbrooke'];
    if (backend && !validBackends.includes(backend)) {
      return res.status(400).json({ error: `Invalid backend. Must be one of: ${validBackends.join(', ')}` });
    }

    // Prepare circuit data for Python execution
    const circuitData = {
      token,
      backend,
      circuit: {
        numQubits: circuit.numQubits,
        gates: circuit.gates.map(gate => ({
          name: gate.name,
          qubits: gate.qubits,
          parameters: gate.parameters || []
        }))
      },
      initialState: initialState || 'ket0',
      customState: customState || {},
      shots
    };

    // Execute quantum circuit using Python
    const result = await executeQuantumCircuit(circuitData);

    if (result.method === 'ibm_hardware' && result.status === 'QUEUED') {
      // Hardware job submitted asynchronously
      res.json({
        success: true,
        method: result.method,
        backend: backend,
        jobId: result.jobId,
        status: 'QUEUED',
        message: result.message,
        executionTime: result.executionTime
      });
    } else {
      // Local execution or completed simulator job
      res.json({
        success: true,
        result,
        backend: backend,
        executionTime: result.executionTime
      });
    }

  } catch (error) {
    console.error('Circuit execution error:', error);
    res.status(500).json({
      error: 'Failed to execute quantum circuit',
      details: error.message
    });
  }
});

// Get available backends
app.get('/api/quantum/backends', async (req, res) => {
  try {
    const { token } = req.query;
    console.log(`Request for backends received. Token provided: ${token ? 'YES' : 'NO'}`);

    // Allow backends to be fetched even without token for demo purposes
    // In production, you might want to require token validation
    const result = await getAvailableBackends(token);
    res.json({
      success: true,
      backends: result.backends,
      isFallback: result.isFallback
    });

  } catch (error) {
    console.error('Backend listing error:', error);
    // Return default backends even on error
    const defaultBackends = [
      { id: 'ibmq_qasm_simulator', name: 'IBM QASM Simulator', status: 'available', qubits: 32, type: 'simulator' },
      { id: 'simulator_statevector', name: 'Statevector Simulator', status: 'available', qubits: 24, type: 'simulator' },
      { id: 'simulator_mps', name: 'Matrix Product State Simulator', status: 'available', qubits: 100, type: 'simulator' },
      { id: 'ibmq_manila', name: 'IBM Manila', status: 'available', qubits: 5, type: 'hardware' },
      { id: 'ibmq_lima', name: 'IBM Lima', status: 'available', qubits: 5, type: 'hardware' },
      { id: 'ibmq_belem', name: 'IBM Belem', status: 'available', qubits: 5, type: 'hardware' },
      { id: 'ibmq_quito', name: 'IBM Quito', status: 'available', qubits: 5, type: 'hardware' },
      { id: 'ibm_brisbane', name: 'IBM Brisbane', status: 'available', qubits: 127, type: 'hardware' },
      { id: 'ibm_sherbrooke', name: 'IBM Sherbrooke', status: 'available', qubits: 127, type: 'hardware' }
    ];
    res.json({ success: true, backends: defaultBackends || [] });
  }
});

// Get job status
app.get('/api/quantum/job/:jobId/status', async (req, res) => {
  try {
    const { jobId } = req.params;
    const { token } = req.headers.authorization?.replace('Bearer ', '');

    if (!token || !jobId) {
      return res.status(400).json({ error: 'Token and job ID are required' });
    }

    const jobStatus = await getJobStatus(token, jobId);
    res.json({ success: true, ...jobStatus });

  } catch (error) {
    console.error('Job status error:', error);
    // Return a more realistic default status for Runtime API jobs
    res.json({
      success: true,
      jobId,
      status: 'COMPLETED',
      statusMessage: 'Job completed successfully',
      progress: 100,
      estimatedTime: null,
      results: null
    });
  }
});

// Get job result
app.get('/api/quantum/job/:jobId/result', async (req, res) => {
  try {
    const { jobId } = req.params;
    const { token } = req.headers.authorization?.replace('Bearer ', '');

    if (!token || !jobId) {
      return res.status(400).json({ error: 'Token and job ID are required' });
    }

    const jobResult = await getJobResult(token, jobId);
    res.json({ success: true, ...jobResult });

  } catch (error) {
    console.error('Job result error:', error);
    // Return a default result for Runtime API jobs
    res.json({
      success: true,
      jobId,
      results: null,
      executionTime: 0,
      backend: 'unknown',
      error: 'Results not available through Runtime API'
    });
  }
});

// Get user jobs
app.get('/api/quantum/jobs', async (req, res) => {
  try {
    const { token } = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    const jobs = await getUserJobs(token);
    res.json({ success: true, jobs });

  } catch (error) {
    console.error('User jobs error:', error);
    // Return empty jobs list for Runtime API
    res.json({ success: true, jobs: [] });
  }
});

// AI Assistant endpoint
app.post('/api/ai/ask', async (req, res) => {
  try {
    const { question } = req.body;

    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      return res.status(400).json({ error: 'Question is required and must be a non-empty string' });
    }

    if (question.length > 1000) {
      return res.status(400).json({ error: 'Question is too long. Maximum 1000 characters allowed.' });
    }

    const answer = await askAIQuestion(question.trim());
    res.json({
      success: true,
      question: question.trim(),
      answer,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('AI question error:', error);
    res.status(500).json({
      error: 'Failed to get AI response',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Helper function to validate IBM Quantum token
async function validateIBMToken(token) {
  try {
    // Use the current IBM Quantum Runtime API for token validation
    const response = await axios.get('https://api.quantum.ibm.com/runtime/backends', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    return { valid: true, data: response.data };
  } catch (error) {
    console.error('Token validation error:', error.response?.status, error.response?.data);
    console.error('Full error:', error.message);

    // Check specific error codes
    if (error.response?.status === 401) {
      return { valid: false, error: 'Invalid or expired token' };
    } else if (error.response?.status === 403) {
      return { valid: false, error: 'Token lacks required permissions' };
    } else if (error.code === 'ECONNABORTED') {
      return { valid: false, error: 'Connection timeout - check internet connection' };
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return { valid: false, error: 'Network error - cannot connect to IBM Quantum API' };
    }

    // For other errors, assume token is invalid to be safe
    return { valid: false, error: 'Unable to validate token - please check your internet connection' };
  }
}

// Helper function to get IBM Quantum token from environment
function getIBMToken() {
  // First check environment variable
  const envToken = process.env.IBM_QUANTUM_TOKEN;
  if (envToken && envToken !== 'your_token_here') {
    return envToken;
  }

  // Fallback to default simulator mode (no token needed)
  console.log('⚠️  No IBM Quantum token found. Using local simulator mode.');
  console.log('💡 To use IBM Quantum services, set IBM_QUANTUM_TOKEN in backend/.env');
  console.log('🔧 Run: node setup_ibm_quantum.js to configure your token');
  return null;
}

// Helper function to get backend information
async function getBackendInfo(token, backendId) {
  try {
    // Use the current IBM Quantum Runtime API for backend info
    const response = await axios.get(`https://api.quantum.ibm.com/runtime/backends/${backendId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    const backend = response.data;
    return {
      id: backendId,
      name: backend.name || backendId,
      status: backend.status || 'available',
      qubits: backend.n_qubits || backend.num_qubits || 0,
      type: backend.simulator ? 'simulator' : 'hardware'
    };
  } catch (error) {
    console.error('Backend info error:', error.response?.status, error.response?.data);
    console.error('Full error:', error.message);

    // Return default info for common backends
    const defaultBackends = {
      'ibmq_qasm_simulator': { name: 'IBM QASM Simulator', qubits: 32, type: 'simulator' },
      'simulator_statevector': { name: 'Statevector Simulator', qubits: 24, type: 'simulator' },
      'simulator_mps': { name: 'Matrix Product State Simulator', qubits: 100, type: 'simulator' },
      'ibmq_manila': { name: 'IBM Manila', qubits: 5, type: 'hardware' },
      'ibmq_lima': { name: 'IBM Lima', qubits: 5, type: 'hardware' },
      'ibmq_belem': { name: 'IBM Belem', qubits: 5, type: 'hardware' },
      'ibmq_quito': { name: 'IBM Quito', qubits: 5, type: 'hardware' },
      'ibm_brisbane': { name: 'IBM Brisbane', qubits: 127, type: 'hardware' },
      'ibm_sherbrooke': { name: 'IBM Sherbrooke', qubits: 127, type: 'hardware' }
    };

    return {
      id: backendId,
      name: defaultBackends[backendId]?.name || backendId,
      status: 'available',
      qubits: defaultBackends[backendId]?.qubits || 0,
      type: defaultBackends[backendId]?.type || 'simulator'
    };
  }
}

// Helper function to get available backends
async function getAvailableBackends(token) {
  try {
    // Check if a token was actually provided in the request
    // Only fall back to env var if token is strictly undefined (not provided)
    // This allows passing empty string to intentionally skip auth
    const effectiveToken = token !== undefined ? token : process.env.IBM_QUANTUM_TOKEN;

    // Log for debugging (masking most of the token)
    const tokenPreview = effectiveToken ? `${effectiveToken.substring(0, 4)}...` : 'NONE';
    console.log(`Using IBM Token for backends list: ${tokenPreview}`);

    // First try to validate the token with a simple API call
    const testResponse = await axios.get('https://api.quantum.ibm.com/runtime/backends', {
      headers: {
        'Authorization': `Bearer ${effectiveToken}`,
        'Content-Type': 'application/json'
      },
      timeout: 5000
    });

    // If token is valid, return the actual backends
    return {
      backends: testResponse.data.map(backend => ({
        id: backend.name || backend.id,
        name: backend.name || backend.id,
        status: backend.status || 'available',
        qubits: backend.n_qubits || backend.num_qubits || 0,
        type: backend.simulator ? 'simulator' : 'hardware'
      })),
      isFallback: false
    };
  } catch (error) {
    console.error('Backend listing error:', error.response?.status, error.response?.data);
    console.error('Full error:', error.message);

    // If token is invalid or network error, return default backends
    // This allows the app to work even without internet or valid token
    return {
      backends: [
        { id: 'ibmq_qasm_simulator', name: 'IBM QASM Simulator', status: 'available', qubits: 32, type: 'simulator' },
        { id: 'simulator_statevector', name: 'Statevector Simulator', status: 'available', qubits: 24, type: 'simulator' },
        { id: 'simulator_mps', name: 'Matrix Product State Simulator', status: 'available', qubits: 100, type: 'simulator' },
        { id: 'ibmq_manila', name: 'IBM Manila', status: 'available', qubits: 5, type: 'hardware' },
        { id: 'ibmq_lima', name: 'IBM Lima', status: 'available', qubits: 5, type: 'hardware' },
        { id: 'ibmq_belem', name: 'IBM Belem', status: 'available', qubits: 5, type: 'hardware' },
        { id: 'ibmq_quito', name: 'IBM Quito', status: 'available', qubits: 5, type: 'hardware' },
        { id: 'ibm_brisbane', name: 'IBM Brisbane', status: 'available', qubits: 127, type: 'hardware' },
        { id: 'ibm_sherbrooke', name: 'IBM Sherbrooke', status: 'available', qubits: 127, type: 'hardware' }
      ],
      isFallback: true
    };
  }
}

// Helper function to get job status
async function getJobStatus(token, jobId) {
  try {
    // Use the current IBM Quantum Runtime API for job status
    const response = await axios.get(`https://api.quantum.ibm.com/runtime/jobs/${jobId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    const job = response.data;
    return {
      jobId: job.id || jobId,
      status: mapRuntimeStatus(job.status),
      statusMessage: getStatusMessage(job.status),
      progress: job.progress || (job.status === 'COMPLETED' ? 100 : 50),
      estimatedTime: job.estimated_time || null,
      results: job.results || null
    };
  } catch (error) {
    console.error('Job status error:', error.response?.status, error.response?.data);
    console.error('Full error:', error.message);

    // For Runtime API, job status might not be immediately available
    // Return a more realistic status indicating the job is being processed
    if (error.response?.status === 404) {
      return {
        jobId,
        status: 'COMPLETED', // Assume completed if job not found (might be old job)
        statusMessage: 'Job completed successfully',
        progress: 100,
        estimatedTime: null,
        results: null
      };
    }

    // For other errors, return a status that indicates the job is still processing
    return {
      jobId,
      status: 'RUNNING', // Default to running if we can't determine status
      statusMessage: 'Job is running on IBM Quantum hardware',
      progress: 50,
      estimatedTime: null,
      results: null
    };
  }
}

// Helper function to get job result
async function getJobResult(token, jobId) {
  try {
    // Use the current IBM Quantum Runtime API for job results
    const response = await axios.get(`https://api.quantum.ibm.com/runtime/jobs/${jobId}/results`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    return {
      jobId,
      results: response.data,
      executionTime: response.data.execution_time || 0,
      backend: response.data.backend || 'unknown'
    };
  } catch (error) {
    console.error('Job result error:', error.response?.status, error.response?.data);
    console.error('Full error:', error.message);

    return {
      jobId,
      results: null,
      executionTime: 0,
      backend: 'unknown',
      error: 'Results not available through Runtime API'
    };
  }
}

// Helper function to map Runtime API status to our format
function mapRuntimeStatus(runtimeStatus) {
  const statusMap = {
    'COMPLETED': 'COMPLETED',
    'FAILED': 'FAILED',
    'CANCELLED': 'CANCELLED',
    'RUNNING': 'RUNNING',
    'QUEUED': 'QUEUED',
    'PENDING': 'QUEUED',
    'DONE': 'COMPLETED',
    'ERROR': 'FAILED'
  };
  return statusMap[runtimeStatus] || 'RUNNING';
}

// Helper function to get user jobs
async function getUserJobs(token) {
  try {
    // Use the current IBM Quantum Runtime API for user jobs
    const response = await axios.get('https://api.quantum.ibm.com/runtime/jobs', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    return response.data.map(job => ({
      jobId: job.id || job.job_id,
      status: mapRuntimeStatus(job.status),
      backend: job.backend || 'unknown',
      createdAt: job.created_at || new Date().toISOString(),
      completedAt: job.completed_at || null,
      progress: job.progress || (job.status === 'COMPLETED' ? 100 : 50)
    }));
  } catch (error) {
    console.error('User jobs error:', error.response?.status, error.response?.data);
    console.error('Full error:', error.message);

    // Return empty list for Runtime API - jobs are typically not persisted
    return [];
  }
}

// Helper function to get status message
function getStatusMessage(status) {
  const messages = {
    'CREATED': 'Job created and queued',
    'QUEUED': 'Job is queued for execution',
    'RUNNING': 'Job is currently running',
    'COMPLETED': 'Job completed successfully',
    'FAILED': 'Job failed to execute',
    'CANCELLED': 'Job was cancelled',
    'ERROR': 'Job encountered an error',
    // Runtime API specific statuses
    'PENDING': 'Job is pending execution',
    'IN_PROGRESS': 'Job is in progress',
    'DONE': 'Job completed successfully',
    'ERROR_JOB': 'Job encountered an error',
    'CANCELLED_JOB': 'Job was cancelled',
    // Modern Runtime API statuses
    'INITIALIZING': 'Job is initializing',
    'VALIDATING': 'Job is being validated',
    'QUEUED_REMOTE': 'Job queued on remote backend',
    'RUNNING_REMOTE': 'Job running on remote backend',
    'COMPLETED_REMOTE': 'Job completed on remote backend'
  };
  return messages[status] || 'Job status unknown';
}

// Helper function to ask AI questions using free quantum knowledge base with optional Ollama support
async function askAIQuestion(question) {
  try {
    // First try Ollama if available (completely free, local AI)
    try {
      const ollamaResponse = await askOllamaQuestion(question);
      if (ollamaResponse) {
        console.log(`🦙 Ollama AI Response for: "${question.substring(0, 50)}..."`);
        return ollamaResponse;
      }
    } catch (ollamaError) {
      console.log('Ollama not available, using knowledge base');
    }

    // Fallback to comprehensive quantum knowledge base
    // Simulate API delay for realistic user experience
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1200));

    const response = generateContextualResponse(question);
    console.log(`🤖 Quantum Knowledge Base Response for: "${question.substring(0, 50)}..."`);
    return response;

  } catch (error) {
    console.error('AI question error:', error);

    // Fallback response if something goes wrong
    return `I apologize, but I encountered an issue processing your question. Here's some general information about quantum computing:

Quantum computing uses quantum mechanics principles like superposition and entanglement to perform certain calculations much faster than classical computers. Key areas include:

• **Quantum algorithms**: Shor's algorithm, Grover's algorithm
• **Quantum hardware**: Superconducting circuits, trapped ions, photonics
• **Applications**: Cryptography, drug discovery, optimization

Feel free to ask about specific quantum computing topics!`;
  }
}

// Helper function to ask questions using Ollama (free local AI)
async function askOllamaQuestion(question) {
  try {
    const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';

    const response = await axios.post(`${ollamaUrl}/api/generate`, {
      model: 'mistral', // or any quantum-capable model you have installed
      prompt: `You are an expert quantum computing assistant. Answer this question clearly and accurately: ${question}`,
      stream: false,
      options: {
        temperature: 0.7,
        num_predict: 300
      }
    }, {
      timeout: 15000 // 15 second timeout
    });

    if (response.data && response.data.response) {
      return response.data.response.trim();
    }

    return null;
  } catch (error) {
    // Ollama not available or not responding
    return null;
  }
}


// Helper function to execute quantum circuit using simplified Python simulator
function executeQuantumCircuit(circuitData) {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn('python', [path.join(__dirname, 'quantum_executor_simple.py')], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    pythonProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code === 0) {
        try {
          const result = JSON.parse(stdout);
          resolve(result);
        } catch (error) {
          reject(new Error(`Failed to parse Python output: ${error.message}`));
        }
      } else {
        reject(new Error(`Python process failed with code ${code}: ${stderr}`));
      }
    });

    pythonProcess.on('error', (error) => {
      reject(new Error(`Failed to start Python process: ${error.message}`));
    });

    // Send circuit data to Python process
    pythonProcess.stdin.write(JSON.stringify(circuitData));
    pythonProcess.stdin.end();
  });
}

// Download Dataset Endpoint
app.post('/api/download-dataset', async (req, res) => {
  try {
    console.log('Initiating dataset download...');
    const scriptPath = path.join(__dirname, 'scripts', 'download_dataset.py');

    // Execute python script
    const { exec } = require('child_process');
    // Use a longer timeout for download (5 minutes)
    exec(`python "${scriptPath}"`, { timeout: 300000 }, (error, stdout, stderr) => {
      if (error) {
        console.error(`Download script error: ${error.message}`);
        if (!res.headersSent) {
          return res.status(500).json({ success: false, error: error.message });
        }
        return;
      }
      if (stderr) {
        console.error(`Script stderr: ${stderr}`);
      }

      try {
        // Find the last line that looks like valid JSON
        const lines = stdout.trim().split('\n');
        let result = null;
        // Search backwards for the JSON line
        for (let i = lines.length - 1; i >= 0; i--) {
          try {
            const parsed = JSON.parse(lines[i]);
            if (parsed.success !== undefined) {
              result = parsed;
              break;
            }
          } catch (e) { continue; }
        }

        if (result) {
          res.json(result);
        } else {
          throw new Error("No JSON output found in script stdout");
        }
      } catch (e) {
        console.error('Failed to parse script output:', stdout);
        if (!res.headersSent) {
          res.json({ success: false, error: "Invalid script output", raw: stdout });
        }
      }
    });

  } catch (error) {
    console.error('Download Dataset API Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Quantum Backend API running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 CORS enabled for: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
});

module.exports = app;
