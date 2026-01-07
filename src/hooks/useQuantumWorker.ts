// React hook for quantum computation Web Worker
// Provides non-blocking quantum simulations with progress tracking

import { useState, useRef, useCallback, useEffect } from 'react';
import { QuantumCircuit } from '@/utils/quantum/circuitOperations';

interface WorkerState {
  isWorking: boolean;
  progress: number;
  currentTask: string;
  error: string | null;
}

interface UseQuantumWorkerReturn {
  workerState: WorkerState;
  simulateCircuit: (circuit: QuantumCircuit, initialState?: number[][] | string) => Promise<any>;
  matrixMultiply: (A: number[][], B: number[][]) => Promise<number[][]>;
  tensorProduct: (A: number[][], B: number[][]) => Promise<number[][]>;
  cancelCurrentTask: () => void;
}

export const useQuantumWorker = (): UseQuantumWorkerReturn => {
  const [workerState, setWorkerState] = useState<WorkerState>({
    isWorking: false,
    progress: 0,
    currentTask: '',
    error: null
  });

  const workerRef = useRef<Worker | null>(null);
  const taskIdRef = useRef<string>('');
  const abortControllerRef = useRef<AbortController | null>(null);

  // Initialize worker
  useEffect(() => {
    if (typeof window !== 'undefined' && window.Worker) {
      try {
        workerRef.current = new Worker('/src/utils/quantum/quantumWorker.ts', { type: 'module' });

        workerRef.current.onmessage = (e) => {
          const { type, id, data, error } = e.data;

          if (id !== taskIdRef.current) return; // Ignore outdated responses

          if (type === 'result') {
            setWorkerState(prev => ({
              ...prev,
              isWorking: false,
              progress: 100,
              error: null
            }));

            // Resolve the promise
            if (pendingPromisesRef.current[id]) {
              pendingPromisesRef.current[id].resolve(data);
              delete pendingPromisesRef.current[id];
            }
          } else if (type === 'error') {
            setWorkerState(prev => ({
              ...prev,
              isWorking: false,
              error: error || 'Worker error'
            }));

            if (pendingPromisesRef.current[id]) {
              pendingPromisesRef.current[id].reject(new Error(error));
              delete pendingPromisesRef.current[id];
            }
          }
        };

        workerRef.current.onerror = (error) => {
          setWorkerState(prev => ({
            ...prev,
            isWorking: false,
            error: 'Worker failed to initialize'
          }));
        };
      } catch (error) {
        console.warn('Web Worker not supported, falling back to main thread');
        setWorkerState(prev => ({
          ...prev,
          error: 'Web Worker not supported'
        }));
      }
    }

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, []);

  // Track pending promises
  const pendingPromisesRef = useRef<{ [id: string]: { resolve: Function; reject: Function } }>({});

  const generateTaskId = () => `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const simulateCircuit = useCallback((circuit: QuantumCircuit, initialState?: number[][] | string): Promise<any> => {
    return new Promise((resolve, reject) => {
      if (!workerRef.current) {
        // Fallback to main thread simulation
        import('@/utils/quantum/circuitOperations').then(({ simulateCircuit }) => {
          try {
            setWorkerState(prev => ({ ...prev, isWorking: true, currentTask: 'Simulating circuit', progress: 10 }));
            const result = simulateCircuit(circuit, initialState);
            setWorkerState(prev => ({ ...prev, isWorking: false, progress: 100 }));
            resolve(result);
          } catch (error) {
            setWorkerState(prev => ({ ...prev, isWorking: false, error: 'Simulation failed' }));
            reject(error);
          }
        });
        return;
      }

      const taskId = generateTaskId();
      taskIdRef.current = taskId;

      pendingPromisesRef.current[taskId] = { resolve, reject };

      setWorkerState(prev => ({
        ...prev,
        isWorking: true,
        currentTask: 'Simulating quantum circuit',
        progress: 0,
        error: null
      }));

      workerRef.current.postMessage({
        type: 'simulate',
        id: taskId,
        data: { circuit, initialState }
      });

      // Simulate progress updates
      let progress = 0;
      const progressInterval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress >= 90) {
          clearInterval(progressInterval);
        } else {
          setWorkerState(prev => ({ ...prev, progress: Math.min(progress, 90) }));
        }
      }, 100);
    });
  }, []);

  const matrixMultiply = useCallback((A: number[][], B: number[][]): Promise<number[][]> => {
    return new Promise((resolve, reject) => {
      if (!workerRef.current) {
        // Fallback to main thread
        import('@/utils/core/matrixOperations').then(({ matrixMultiply }) => {
          try {
            const result = matrixMultiply(A, B);
            resolve(result);
          } catch (error) {
            reject(error);
          }
        });
        return;
      }

      const taskId = generateTaskId();
      pendingPromisesRef.current[taskId] = { resolve, reject };

      workerRef.current.postMessage({
        type: 'matrix_multiply',
        id: taskId,
        data: { A, B }
      });
    });
  }, []);

  const tensorProduct = useCallback((A: number[][], B: number[][]): Promise<number[][]> => {
    return new Promise((resolve, reject) => {
      if (!workerRef.current) {
        // Fallback to main thread
        import('@/utils/core/matrixOperations').then(({ tensorProduct }) => {
          try {
            const result = tensorProduct(A, B);
            resolve(result);
          } catch (error) {
            reject(error);
          }
        });
        return;
      }

      const taskId = generateTaskId();
      pendingPromisesRef.current[taskId] = { resolve, reject };

      workerRef.current.postMessage({
        type: 'tensor_product',
        id: taskId,
        data: { A, B }
      });
    });
  }, []);

  const cancelCurrentTask = useCallback(() => {
    if (taskIdRef.current && pendingPromisesRef.current[taskIdRef.current]) {
      pendingPromisesRef.current[taskIdRef.current].reject(new Error('Task cancelled'));
      delete pendingPromisesRef.current[taskIdRef.current];
    }

    setWorkerState(prev => ({
      ...prev,
      isWorking: false,
      progress: 0,
      currentTask: '',
      error: 'Task cancelled'
    }));

    taskIdRef.current = '';
  }, []);

  return {
    workerState,
    simulateCircuit,
    matrixMultiply,
    tensorProduct,
    cancelCurrentTask
  };
};