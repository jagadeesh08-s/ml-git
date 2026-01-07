import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from 'sonner';

export interface IBMQuantumBackend {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'maintenance';
  type: 'hardware' | 'simulator';
  numQubits: number;
  couplingMap?: number[][];
  basisGates: string[];
  maxShots: number;
  maxExperiments: number;
  queueDepth?: number;
  pendingJobs?: number;
}

export interface QuantumJob {
  id: string;
  backendId: string;
  circuit: any;
  shots: number;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  submittedAt: Date;
  completedAt?: Date;
  result?: {
    counts: { [key: string]: number };
    probabilities: number[];
    statevector?: number[][];
    qubitResults?: any[]; // Full qubit analysis data from backend
    expectationValues?: { [key: string]: number };
  };
  error?: string;
  progress: number;
  estimatedTime?: number;
}

interface IBMQuantumContextType {
  // Authentication
  isAuthenticated: boolean;
  token: string | null;
  setToken: (token: string | null) => void;

  // Backends
  backends: IBMQuantumBackend[];
  selectedBackend: IBMQuantumBackend | null;
  setSelectedBackend: (backend: IBMQuantumBackend | null) => void;
  refreshBackends: () => Promise<void>;

  // Jobs
  jobs: QuantumJob[];
  currentJob: QuantumJob | null;
  submitJob: (circuit: any, shots: number, backendId?: string) => Promise<QuantumJob>;
  cancelJob: (jobId: string) => Promise<void>;
  getJobResult: (jobId: string) => Promise<QuantumJob | null>;

  // Status
  isLoading: boolean;
  error: string | null;
  isFallback: boolean;
}

const IBMQuantumContext = createContext<IBMQuantumContextType | undefined>(undefined);

export const useIBMQuantum = () => {
  const context = useContext(IBMQuantumContext);
  if (context === undefined) {
    throw new Error('useIBMQuantum must be used within an IBMQuantumProvider');
  }
  return context;
};

interface IBMQuantumProviderProps {
  children: ReactNode;
}

export const IBMQuantumProvider: React.FC<IBMQuantumProviderProps> = ({ children }) => {
  // Token is NOT persisted - will reset on page refresh
  const [token, setTokenState] = useState<string | null>(null);
  const [backends, setBackends] = useState<IBMQuantumBackend[]>([]);
  const [selectedBackend, setSelectedBackend] = useState<IBMQuantumBackend | null>(null);
  const [jobs, setJobs] = useState<QuantumJob[]>([]);
  const [currentJob, setCurrentJob] = useState<QuantumJob | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFallback, setIsFallback] = useState(false);

  const isAuthenticated = !!token;

  const setToken = (newToken: string | null) => {
    setTokenState(newToken);
    if (newToken) {
      // Token is stored in memory only - NOT in localStorage
      // This means it will be cleared on page refresh
      refreshBackends(newToken);
    }
  };

  const refreshBackends = async (currentToken: string | null = token) => {
    console.log("refreshBackends called with token:", currentToken ? "Token exists" : "No token");
    if (!currentToken) return;

    setIsLoading(true);
    setError(null);

    try {
      const url = `${import.meta.env.VITE_API_BASE_URL}/api/quantum/backends?token=${currentToken}`;
      console.log("Fetching backends from:", url);

      // Call the backend API to get real IBM Quantum backends
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log("Response status:", response.status);
      const data = await response.json();
      console.log("Response data:", data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch backends');
      }

      // Transform backend data to match our interface
      const transformedBackends: IBMQuantumBackend[] = data.backends.map((backend: any) => ({
        id: backend.id,
        name: backend.name,
        status: backend.status === 'available' ? 'online' : backend.status === 'maintenance' ? 'maintenance' : 'offline',
        type: backend.type as 'hardware' | 'simulator',
        numQubits: backend.qubits,
        basisGates: ['id', 'rz', 'sx', 'x', 'cx', 'reset'], // Default basis gates
        maxShots: backend.type === 'hardware' ? 8192 : 10000,
        maxExperiments: 1,
        queueDepth: backend.type === 'hardware' ? 5 : undefined,
        pendingJobs: backend.type === 'hardware' ? Math.floor(Math.random() * 20) : undefined,
      }));

      console.log("Transformed backends:", transformedBackends);

      setBackends(transformedBackends);

      // Auto-select first available backend
      const availableBackend = transformedBackends.find(b => b.status === 'online');
      if (availableBackend && !selectedBackend) {
        setSelectedBackend(availableBackend);
      }

      if (data.isFallback) {
        setIsFallback(true);
        toast.warning('IBM Connection Failed: Showing offline simulators');
        setError('Connection failed - Using fallback simulators');
      } else {
        setIsFallback(false);
        toast.success('IBM Quantum backends refreshed');
      }
    } catch (err) {
      console.error("Error refreshing backends:", err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh backends';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const submitJob = async (circuit: any, shots: number, backendId?: string): Promise<QuantumJob> => {
    if (!isAuthenticated) {
      throw new Error('Not authenticated with IBM Quantum');
    }

    const targetBackend = backendId ? backends.find(b => b.id === backendId) : selectedBackend;
    if (!targetBackend) {
      throw new Error('No backend selected');
    }

    setIsLoading(true);
    setError(null);

    try {
      // Call the backend API to submit the job
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/quantum/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          backend: targetBackend.id,
          circuit,
          shots
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit job');
      }

      // Create job object from response
      const job: QuantumJob = {
        id: data.jobId || `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        backendId: targetBackend.id,
        circuit,
        shots,
        status: data.status === 'QUEUED' ? 'queued' : 'running',
        submittedAt: new Date(),
        progress: data.status === 'QUEUED' ? 10 : 25,
        estimatedTime: targetBackend.type === 'hardware' ? 300 : 30,
      };

      setJobs(prev => [job, ...prev]);
      setCurrentJob(job);

      toast.success(`Job submitted to ${targetBackend.name}`);
      return job;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit job';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const cancelJob = async (jobId: string) => {
    try {
      setJobs(prev => prev.map(job =>
        job.id === jobId ? { ...job, status: 'cancelled' as const } : job
      ));

      if (currentJob?.id === jobId) {
        setCurrentJob(prev => prev ? { ...prev, status: 'cancelled' } : null);
      }

      toast.info('Job cancelled');
    } catch (err) {
      toast.error('Failed to cancel job');
    }
  };

  const getJobResult = async (jobId: string): Promise<QuantumJob | null> => {
    try {
      // First check local jobs array
      const localJob = jobs.find(job => job.id === jobId);
      if (localJob && localJob.status === 'completed' && localJob.result) {
        return localJob;
      }

      // If not completed locally, check with backend API
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/quantum/job/${jobId}/result`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Job result API error:', data);
        return localJob || null;
      }

      // Update local job with result from API
      if (data.success && data.results) {
        const updatedJob: QuantumJob = {
          ...localJob!,
          status: 'completed',
          progress: 100,
          completedAt: new Date(),
          result: {
            counts: data.results.counts || {},
            probabilities: data.results.probabilities || [],
            qubitResults: data.results.qubitResults || [],
          }
        };

        // Update jobs array
        setJobs(prev => prev.map(job =>
          job.id === jobId ? updatedJob : job
        ));

        // Update current job if it's the one we're tracking
        if (currentJob?.id === jobId) {
          setCurrentJob(updatedJob);
        }

        return updatedJob;
      }

      return localJob || null;
    } catch (error) {
      console.error('Error getting job result:', error);
      // Return local job if API call fails
      return jobs.find(job => job.id === jobId) || null;
    }
  };

  // Auto-refresh backends when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      refreshBackends();
    }
  }, [isAuthenticated]);

  // Update job progress periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setJobs(prev => prev.map(job => {
        if (job.status === 'running' && job.progress < 90) {
          return { ...job, progress: Math.min(job.progress + 10, 90) };
        }
        return job;
      }));

      if (currentJob?.status === 'running' && currentJob.progress < 90) {
        setCurrentJob(prev => prev ? { ...prev, progress: Math.min(prev.progress + 10, 90) } : null);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [currentJob]);

  const value: IBMQuantumContextType = {
    isAuthenticated,
    token,
    setToken,
    backends,
    selectedBackend,
    setSelectedBackend,
    refreshBackends,
    jobs,
    currentJob,
    submitJob,
    cancelJob,
    getJobResult,
    isLoading,
    error,
    isFallback,
  };

  return (
    <IBMQuantumContext.Provider value={value}>
      {children}
    </IBMQuantumContext.Provider>
  );
};
