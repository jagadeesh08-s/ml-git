// Quantum API service for communicating with the backend
// Handles IBM Quantum integration and circuit execution

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || import.meta.env.REACT_APP_API_URL) || 'http://localhost:3005';

export interface QuantumExecutionOptions {
  backend: 'local' | 'aer_simulator' | 'ibm_simulator' | 'ibm_hardware' | 'wasm';
  token?: string;
  shots?: number;
  initialState?: string;
  customState?: { alpha: string; beta: string };
}

export interface QuantumExecutionResult {
  success: boolean;
  method: string;
  backend: string;
  executionTime: number;
  qubitResults?: any[];
  jobId?: string;
  status?: string;
  message?: string;
  error?: string;
}

export interface JobStatus {
  jobId: string;
  status: string;
  statusMessage: string;
  progress: number;
  estimatedTime: number | null;
  backend?: string;
  results?: any;
}

// Execute quantum circuit on specified backend
export async function executeQuantumCircuit(
  circuit: any,
  options: QuantumExecutionOptions
): Promise<QuantumExecutionResult> {
  // Check if using WebAssembly simulator
  if (options.backend === 'wasm') {
    try {
      const { executeCircuit } = await import('../utils/simulation/wasm-simulator/quantumSimulator');
      const result = executeCircuit({
        circuit,
        initialState: options.initialState || 'ket0',
        customState: options.customState
      });

      return {
        success: result.success,
        method: 'wasm_simulator',
        backend: 'wasm',
        executionTime: result.executionTime,
        qubitResults: result.qubitResults,
        error: result.error
      };
    } catch (error) {
      console.error('WebAssembly execution error:', error);
      return {
        success: false,
        method: 'wasm_error',
        backend: 'wasm',
        executionTime: 0,
        error: error instanceof Error ? error.message : 'WebAssembly execution failed',
      };
    }
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/quantum/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: options.token,
        backend: options.backend,
        circuit,
        initialState: options.initialState || 'ket0',
        customState: options.customState || { alpha: '1', beta: '0' },
        shots: options.shots || 1024,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to execute circuit');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Quantum execution error:', error);
    return {
      success: false,
      method: 'error',
      backend: options.backend,
      executionTime: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Get job status
export async function getJobStatus(jobId: string, token: string): Promise<JobStatus> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/quantum/job/${jobId}/status`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get job status');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Job status error:', error);
    return {
      jobId,
      status: 'ERROR',
      statusMessage: 'Failed to get job status',
      progress: 0,
      estimatedTime: null,
    };
  }
}

// Get job results
export async function getJobResult(jobId: string, token: string): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/quantum/job/${jobId}/result`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get job result');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Job result error:', error);
    return {
      success: false,
      error: 'Failed to get job result',
    };
  }
}

// Validate IBM Quantum token
export async function validateToken(token: string): Promise<{ valid: boolean; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/quantum/auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { valid: false, error: errorData.error };
    }

    return { valid: true };
  } catch (error) {
    console.error('Token validation error:', error);
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Get available backends
export async function getAvailableBackends(token: string): Promise<any[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/quantum/backends?token=${encodeURIComponent(token)}`);

    if (!response.ok) {
      throw new Error('Failed to get backends');
    }

    const data = await response.json();
    return data.backends || [];
  } catch (error) {
    console.error('Backends error:', error);
    return [];
  }
}

// Get user jobs
export async function getUserJobs(token: string): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/quantum/jobs`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get user jobs');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('User jobs error:', error);
    return { success: true, jobs: [] };
  }
}

// Cache management functions
export async function getCacheStats(): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/cache/stats`);
    if (!response.ok) {
      throw new Error('Failed to get cache stats');
    }
    return await response.json();
  } catch (error) {
    console.error('Cache stats error:', error);
    return { success: false, error: 'Failed to get cache stats' };
  }
}

export async function clearCache(): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/cache/clear`, {
      method: 'DELETE'
    });
    if (!response.ok) {
      throw new Error('Failed to clear cache');
    }
    return await response.json();
  } catch (error) {
    console.error('Clear cache error:', error);
    return { success: false, error: 'Failed to clear cache' };
  }
}

// Export quantumAPI object for backward compatibility
export const quantumAPI = {
  executeQuantumCircuit,
  getJobStatus,
  getJobResult,
  validateToken,
  getAvailableBackends,
  getUserJobs,
  getCacheStats,
  clearCache
};
