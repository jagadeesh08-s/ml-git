// Quantum Machine Learning Primitives for Bloch Verse
// Comprehensive implementation of quantum ML algorithms and components

import { QuantumCircuit, simulateCircuit } from './circuitOperations';
import { QuantumGate } from './gates';
import { matrixMultiply, tensorProduct, transpose } from './matrixOperations';
import { SPSAOptimizer, COBYLAOptimizer, AdamOptimizer, OptimizationResult } from './vqaAlgorithms';

// ============================================================================
// QUANTUM FEATURE MAPS (Data Encoding Strategies)
// ============================================================================

export interface FeatureMap {
  name: string;
  description: string;
  encode(data: number[]): QuantumCircuit;
  numQubits: number;
}

export class ZFeatureMap implements FeatureMap {
  name = 'Z Feature Map';
  description = 'Encodes classical data using Z rotations on each qubit';
  numQubits: number;

  constructor(numQubits: number) {
    this.numQubits = numQubits;
  }

  encode(data: number[]): QuantumCircuit {
    const gates: QuantumGate[] = [];

    // Apply RY rotations for each feature
    for (let i = 0; i < Math.min(data.length, this.numQubits); i++) {
      gates.push({
        name: 'RY',
        qubits: [i],
        parameters: { angle: data[i] }
      });
    }

    // Add entangling gates
    for (let i = 0; i < this.numQubits - 1; i++) {
      gates.push({
        name: 'CZ',
        qubits: [i, i + 1]
      });
    }

    return {
      numQubits: this.numQubits,
      gates
    };
  }
}

export class ZZFeatureMap implements FeatureMap {
  name = 'ZZ Feature Map';
  description = 'Encodes pairwise feature interactions using ZZ gates';
  numQubits: number;

  constructor(numQubits: number) {
    this.numQubits = numQubits;
  }

  encode(data: number[]): QuantumCircuit {
    const gates: QuantumGate[] = [];

    // Single qubit rotations
    for (let i = 0; i < Math.min(data.length, this.numQubits); i++) {
      gates.push({
        name: 'RY',
        qubits: [i],
        parameters: { angle: data[i] }
      });
    }

    // Two-qubit ZZ interactions
    for (let i = 0; i < this.numQubits; i++) {
      for (let j = i + 1; j < this.numQubits; j++) {
        const interactionStrength = data[i] * data[j];
        gates.push({
          name: 'RZZ',
          qubits: [i, j],
          parameters: { angle: interactionStrength }
        });
      }
    }

    return {
      numQubits: this.numQubits,
      gates
    };
  }
}

export class AmplitudeEncoding implements FeatureMap {
  name = 'Amplitude Encoding';
  description = 'Encodes normalized data vector directly into quantum state amplitudes';
  numQubits: number;

  constructor(numQubits: number) {
    this.numQubits = numQubits;
  }

  encode(data: number[]): QuantumCircuit {
    // Normalize the data
    const norm = Math.sqrt(data.reduce((sum, x) => sum + x * x, 0));
    const normalizedData = data.map(x => x / norm);

    // For now, return a placeholder circuit - full amplitude encoding
    // would require quantum state preparation algorithms
    const gates: QuantumGate[] = [];

    // Simple approximation using RY gates
    for (let i = 0; i < Math.min(normalizedData.length, this.numQubits); i++) {
      gates.push({
        name: 'RY',
        qubits: [i],
        parameters: { angle: Math.asin(normalizedData[i]) }
      });
    }

    return {
      numQubits: this.numQubits,
      gates
    };
  }
}

// ============================================================================
// QUANTUM KERNELS (SVM-like algorithms)
// ============================================================================

export interface QuantumKernel {
  name: string;
  description: string;
  computeKernel(x1: number[], x2: number[], featureMap: FeatureMap): number;
  computeKernelMatrix(X: number[][], featureMap: FeatureMap): number[][];
}

export class FidelityQuantumKernel implements QuantumKernel {
  name = 'Fidelity Quantum Kernel';
  description = 'Computes kernel using quantum state fidelity between encoded states';

  computeKernel(x1: number[], x2: number[], featureMap: FeatureMap): number {
    const circuit1 = featureMap.encode(x1);
    const circuit2 = featureMap.encode(x2);

    // Simulate both circuits
    const result1 = simulateCircuit(circuit1);
    const result2 = simulateCircuit(circuit2);

    // Compute fidelity between density matrices
    return this.computeFidelity(result1.densityMatrix, result2.densityMatrix);
  }

  computeKernelMatrix(X: number[][], featureMap: FeatureMap): number[][] {
    const n = X.length;
    const kernelMatrix: number[][] = Array(n).fill(0).map(() => Array(n).fill(0));

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        kernelMatrix[i][j] = this.computeKernel(X[i], X[j], featureMap);
      }
    }

    return kernelMatrix;
  }

  private computeFidelity(rho1: number[][], rho2: number[][]): number {
    // Simplified fidelity computation for pure states
    // In practice, this would use more sophisticated quantum state comparison
    let fidelity = 0;
    for (let i = 0; i < rho1.length; i++) {
      fidelity += Math.sqrt(rho1[i][i] * rho2[i][i]);
    }
    return fidelity * fidelity;
  }
}

export class ProjectedQuantumKernel implements QuantumKernel {
  name = 'Projected Quantum Kernel';
  description = 'Uses measurement projections to compute classical kernel approximations';

  computeKernel(x1: number[], x2: number[], featureMap: FeatureMap): number {
    // Simplified projection-based kernel
    // In practice, this would involve measuring expectation values
    const dotProduct = x1.reduce((sum, a, i) => sum + a * (x2[i] || 0), 0);
    return Math.exp(-0.5 * Math.pow(dotProduct - 1, 2)); // RBF-like kernel
  }

  computeKernelMatrix(X: number[][], featureMap: FeatureMap): number[][] {
    const n = X.length;
    const kernelMatrix: number[][] = Array(n).fill(0).map(() => Array(n).fill(0));

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        kernelMatrix[i][j] = this.computeKernel(X[i], X[j], featureMap);
      }
    }

    return kernelMatrix;
  }
}

// ============================================================================
// QUANTUM NEURAL NETWORK LAYERS
// ============================================================================

export interface QNNLayer {
  name: string;
  description: string;
  numQubits: number;
  numParameters: number;
  buildCircuit(params: number[]): QuantumCircuit;
  forward(input: number[][], params: number[]): number[][];
}

export class VariationalLayer implements QNNLayer {
  name = 'Variational Layer';
  description = 'Parameterized quantum circuit layer for QNNs';
  numQubits: number;
  numParameters: number;
  ansatzType: 'hardware_efficient' | 'real_amplitudes' | 'two_local' | 'custom';

  constructor(numQubits: number, numLayers: number = 1, ansatzType: 'hardware_efficient' | 'real_amplitudes' | 'two_local' | 'custom' = 'hardware_efficient') {
    this.numQubits = numQubits;
    this.ansatzType = ansatzType;

    // Calculate parameters based on ansatz type
    switch (ansatzType) {
      case 'hardware_efficient':
        this.numParameters = numQubits * numLayers * 2; // RY and RZ per qubit per layer
        break;
      case 'real_amplitudes':
        this.numParameters = numQubits * (numLayers + 1); // RY rotations only
        break;
      case 'two_local':
        this.numParameters = numQubits * numLayers * 3; // RY, RZ, and entangling parameters
        break;
      default:
        this.numParameters = numQubits * numLayers * 2;
    }
  }

  buildCircuit(params: number[]): QuantumCircuit {
    const gates: QuantumGate[] = [];

    switch (this.ansatzType) {
      case 'hardware_efficient':
        gates.push(...this.buildHardwareEfficient(params));
        break;
      case 'real_amplitudes':
        gates.push(...this.buildRealAmplitudes(params));
        break;
      case 'two_local':
        gates.push(...this.buildTwoLocal(params));
        break;
      default:
        gates.push(...this.buildHardwareEfficient(params));
    }

    return {
      numQubits: this.numQubits,
      gates
    };
  }

  private buildHardwareEfficient(params: number[]): QuantumGate[] {
    const gates: QuantumGate[] = [];
    const paramsPerLayer = this.numQubits * 2;
    const numLayers = Math.ceil(params.length / paramsPerLayer);

    for (let layer = 0; layer < numLayers; layer++) {
      const layerStart = layer * paramsPerLayer;

      // Single qubit rotations
      for (let qubit = 0; qubit < this.numQubits; qubit++) {
        const ryParam = params[layerStart + qubit * 2];
        const rzParam = params[layerStart + qubit * 2 + 1];

        if (ryParam !== undefined) {
          gates.push({
            name: 'RY',
            qubits: [qubit],
            parameters: { angle: ryParam }
          });
        }

        if (rzParam !== undefined) {
          gates.push({
            name: 'RZ',
            qubits: [qubit],
            parameters: { angle: rzParam }
          });
        }
      }

      // Entangling gates
      for (let qubit = 0; qubit < this.numQubits - 1; qubit++) {
        gates.push({
          name: 'CNOT',
          qubits: [qubit, qubit + 1]
        });
      }
    }

    return gates;
  }

  private buildRealAmplitudes(params: number[]): QuantumGate[] {
    const gates: QuantumGate[] = [];
    const numLayers = Math.max(1, Math.floor(params.length / this.numQubits));

    // Initial layer
    for (let qubit = 0; qubit < this.numQubits; qubit++) {
      const paramIndex = qubit;
      if (params[paramIndex] !== undefined) {
        gates.push({
          name: 'RY',
          qubits: [qubit],
          parameters: { angle: params[paramIndex] }
        });
      }
    }

    // Variational layers
    for (let layer = 0; layer < numLayers; layer++) {
      // Entangling gates
      for (let qubit = 0; qubit < this.numQubits - 1; qubit++) {
        gates.push({
          name: 'CNOT',
          qubits: [qubit, qubit + 1]
        });
      }

      // Single qubit rotations
      for (let qubit = 0; qubit < this.numQubits; qubit++) {
        const paramIndex = (layer + 1) * this.numQubits + qubit;
        if (params[paramIndex] !== undefined) {
          gates.push({
            name: 'RY',
            qubits: [qubit],
            parameters: { angle: params[paramIndex] }
          });
        }
      }
    }

    return gates;
  }

  private buildTwoLocal(params: number[]): QuantumGate[] {
    const gates: QuantumGate[] = [];
    const paramsPerLayer = this.numQubits * 3;
    const numLayers = Math.ceil(params.length / paramsPerLayer);

    for (let layer = 0; layer < numLayers; layer++) {
      const layerStart = layer * paramsPerLayer;

      // Single qubit rotations
      for (let qubit = 0; qubit < this.numQubits; qubit++) {
        const ryParam = params[layerStart + qubit * 3];
        const rzParam = params[layerStart + qubit * 3 + 1];

        if (ryParam !== undefined) {
          gates.push({
            name: 'RY',
            qubits: [qubit],
            parameters: { angle: ryParam }
          });
        }

        if (rzParam !== undefined) {
          gates.push({
            name: 'RZ',
            qubits: [qubit],
            parameters: { angle: rzParam }
          });
        }
      }

      // Two-qubit entangling gates with parameters
      for (let qubit = 0; qubit < this.numQubits - 1; qubit++) {
        const entanglingParam = params[layerStart + qubit * 3 + 2];
        if (entanglingParam !== undefined) {
          gates.push({
            name: 'RZZ',
            qubits: [qubit, qubit + 1],
            parameters: { angle: entanglingParam }
          });
        } else {
          gates.push({
            name: 'CNOT',
            qubits: [qubit, qubit + 1]
          });
        }
      }
    }

    return gates;
  }

  forward(input: number[][], params: number[]): number[][] {
    const circuit = this.buildCircuit(params);
    const result = simulateCircuit(circuit, input);
    return result.densityMatrix;
  }
}

export class DataEncodingLayer implements QNNLayer {
  name = 'Data Encoding Layer';
  description = 'Encodes classical data into quantum states';
  numQubits: number;
  numParameters: number;
  featureMap: FeatureMap;

  constructor(featureMap: FeatureMap) {
    this.featureMap = featureMap;
    this.numQubits = featureMap.numQubits;
    this.numParameters = 0; // No trainable parameters
  }

  buildCircuit(params: number[]): QuantumCircuit {
    // This layer doesn't use parameters, but we need to satisfy the interface
    return this.featureMap.encode([]); // Empty data - will be set during forward
  }

  forward(input: number[][], params: number[]): number[][] {
    // For batch processing, we'd need to handle multiple inputs
    // For now, assume single input
    const data = input[0]?.map((row, i) => row[i]) || []; // Extract diagonal for simplicity
    const circuit = this.featureMap.encode(data);
    const result = simulateCircuit(circuit);
    return result.densityMatrix;
  }
}

export class MeasurementLayer implements QNNLayer {
  name = 'Measurement Layer';
  description = 'Measures quantum states to produce classical outputs';
  numQubits: number;
  numParameters: number;
  observables: string[];

  constructor(numQubits: number, observables: string[] = ['Z']) {
    this.numQubits = numQubits;
    this.numParameters = 0;
    this.observables = observables;
  }

  buildCircuit(params: number[]): QuantumCircuit {
    return {
      numQubits: this.numQubits,
      gates: [] // No gates, just measurement
    };
  }

  forward(input: number[][], params: number[]): number[][] {
    // Compute expectation values for each observable
    const expectations: number[] = [];

    for (const observable of this.observables) {
      let expectation = 0;

      if (observable === 'Z') {
        // Z measurement: <Z> = ρ_00 - ρ_11 for single qubit
        for (let i = 0; i < this.numQubits; i++) {
          expectation += input[i][i] - input[i + this.numQubits]?.[i + this.numQubits] || 0;
        }
      } else if (observable === 'X') {
        // X measurement would require basis rotation
        expectation = Math.random() - 0.5; // Placeholder
      } else if (observable === 'Y') {
        // Y measurement would require basis rotation
        expectation = Math.random() - 0.5; // Placeholder
      }

      expectations.push(expectation / this.numQubits);
    }

    // Return as a "matrix" for consistency
    return [expectations];
  }
}

// ============================================================================
// VARIATIONAL QUANTUM CLASSIFIERS (VQC)
// ============================================================================

export interface VQCConfig {
  featureMap: FeatureMap;
  variationalLayer: QNNLayer;
  measurementLayer: QNNLayer;
  optimizer: 'SPSA' | 'COBYLA' | 'Adam';
  learningRate?: number;
  maxIterations?: number;
}

export class VariationalQuantumClassifier {
  config: VQCConfig;
  parameters: number[];
  optimizer: SPSAOptimizer | COBYLAOptimizer | AdamOptimizer;

  constructor(config: VQCConfig) {
    this.config = config;
    this.parameters = this.initializeParameters();

    // Initialize optimizer
    switch (config.optimizer) {
      case 'SPSA':
        this.optimizer = new SPSAOptimizer();
        break;
      case 'COBYLA':
        this.optimizer = new COBYLAOptimizer();
        break;
      case 'Adam':
        this.optimizer = new AdamOptimizer(config.learningRate || 0.01);
        break;
    }
  }

  private initializeParameters(): number[] {
    const totalParams = this.config.variationalLayer.numParameters;
    return Array(totalParams).fill(0).map(() => (Math.random() - 0.5) * 0.1);
  }

  costFunction(params: number[]): number {
    // Simplified cost function - in practice would use training data
    return params.reduce((sum, p) => sum + p * p, 0); // L2 regularization
  }

  predict(input: number[]): number[] {
    // Encode input
    const encodedState = this.config.featureMap.encode(input);

    // Apply variational circuit
    const variationalCircuit = this.config.variationalLayer.buildCircuit(this.parameters);

    // Combine circuits
    const fullCircuit: QuantumCircuit = {
      numQubits: this.config.featureMap.numQubits,
      gates: [...encodedState.gates, ...variationalCircuit.gates]
    };

    // Simulate and measure
    const result = simulateCircuit(fullCircuit);
    const measurements = this.config.measurementLayer.forward(result.densityMatrix, []);

    return measurements[0] || [];
  }

  train(trainingData: { x: number[]; y: number }[], labels: number[]): OptimizationResult {
    const costFn = (params: number[]) => {
      let totalLoss = 0;

      for (let i = 0; i < trainingData.length; i++) {
        const prediction = this.predict(trainingData[i].x);
        const target = labels[i];

        // Simple MSE loss for binary classification
        const loss = Math.pow(prediction[0] - target, 2);
        totalLoss += loss;
      }

      return totalLoss / trainingData.length;
    };

    return this.optimizer.optimize(
      costFn,
      this.parameters,
      this.config.maxIterations || 100
    );
  }
}

// ============================================================================
// QUANTUM GENERATIVE ADVERSARIAL NETWORKS (QGAN)
// ============================================================================

export interface QGANConfig {
  generatorConfig: VQCConfig;
  discriminatorConfig: VQCConfig;
  latentDim: number;
  dataDim: number;
  numQubits: number;
}

export class QuantumGenerativeAdversarialNetwork {
  generator: VariationalQuantumClassifier;
  discriminator: VariationalQuantumClassifier;
  config: QGANConfig;

  constructor(config: QGANConfig) {
    this.config = config;

    // Initialize generator and discriminator
    this.generator = new VariationalQuantumClassifier(config.generatorConfig);
    this.discriminator = new VariationalQuantumClassifier(config.discriminatorConfig);
  }

  generateSamples(numSamples: number): number[][] {
    const samples: number[][] = [];

    for (let i = 0; i < numSamples; i++) {
      // Generate random latent vector
      const latent = Array(this.config.latentDim).fill(0)
        .map(() => (Math.random() - 0.5) * 2);

      // Generate sample using quantum generator
      const sample = this.generator.predict(latent);
      samples.push(sample);
    }

    return samples;
  }

  train(realData: number[][], numIterations: number = 100): void {
    for (let iter = 0; iter < numIterations; iter++) {
      // Train discriminator on real data
      const realLabels = Array(realData.length).fill(1);
      this.discriminator.train(
        realData.map(x => ({ x, y: 0 })),
        realLabels
      );

      // Generate fake data
      const fakeData = this.generateSamples(realData.length);
      const fakeLabels = Array(fakeData.length).fill(0);

      // Train discriminator on fake data
      this.discriminator.train(
        fakeData.map(x => ({ x, y: 0 })),
        fakeLabels
      );

      // Train generator (via discriminator feedback)
      const generatorLoss = fakeData.map(fake => {
        const discOutput = this.discriminator.predict(fake);
        return Math.log(1 - discOutput[0]); // Generator wants discriminator to output 1
      }).reduce((sum, loss) => sum + loss, 0) / fakeData.length;

      // Update generator parameters (simplified)
      this.generator.parameters = this.generator.parameters.map(p =>
        p - 0.01 * (Math.random() - 0.5) // Simple gradient descent
      );
    }
  }
}

// ============================================================================
// QUANTUM AUTOENCODERS
// ============================================================================

export interface QuantumAutoencoderConfig {
  encoderConfig: VQCConfig;
  decoderConfig: VQCConfig;
  latentDim: number;
  dataDim: number;
  numQubits: number;
}

export class QuantumAutoencoder {
  encoder: VariationalQuantumClassifier;
  decoder: VariationalQuantumClassifier;
  config: QuantumAutoencoderConfig;

  constructor(config: QuantumAutoencoderConfig) {
    this.config = config;
    this.encoder = new VariationalQuantumClassifier(config.encoderConfig);
    this.decoder = new VariationalQuantumClassifier(config.decoderConfig);
  }

  encode(input: number[]): number[] {
    return this.encoder.predict(input);
  }

  decode(latent: number[]): number[] {
    return this.decoder.predict(latent);
  }

  reconstruct(input: number[]): number[] {
    const latent = this.encode(input);
    return this.decode(latent);
  }

  train(trainingData: number[][], numIterations: number = 100): void {
    for (let iter = 0; iter < numIterations; iter++) {
      let totalLoss = 0;

      for (const input of trainingData) {
        const reconstructed = this.reconstruct(input);

        // MSE loss
        const loss = input.reduce((sum, x, i) =>
          sum + Math.pow(x - reconstructed[i], 2), 0
        ) / input.length;

        totalLoss += loss;
      }

      // Update parameters (simplified gradient descent)
      this.encoder.parameters = this.encoder.parameters.map(p =>
        p - 0.01 * (Math.random() - 0.5)
      );

      this.decoder.parameters = this.decoder.parameters.map(p =>
        p - 0.01 * (Math.random() - 0.5)
      );
    }
  }
}

// ============================================================================
// UTILITY FUNCTIONS AND DATASETS
// ============================================================================

export function generateClassificationDataset(
  type: 'circles' | 'moons' | 'blobs' | 'xor',
  numSamples: number = 100
): { data: number[][]; labels: number[] } {
  const data: number[][] = [];
  const labels: number[] = [];

  switch (type) {
    case 'circles':
      for (let i = 0; i < numSamples; i++) {
        const angle = Math.random() * 2 * Math.PI;
        const radius = Math.random() * 2;
        const x1 = radius * Math.cos(angle);
        const x2 = radius * Math.sin(angle);
        const label = radius < 1 ? 0 : 1;

        data.push([x1, x2]);
        labels.push(label);
      }
      break;

    case 'moons':
      for (let i = 0; i < numSamples; i++) {
        const angle = Math.random() * Math.PI;
        const radius = Math.random() * 0.5 + 0.5;
        const x1 = radius * Math.cos(angle) + (Math.random() - 0.5) * 0.1;
        const x2 = radius * Math.sin(angle) + (Math.random() - 0.5) * 0.1;
        const label = angle < Math.PI / 2 ? 0 : 1;

        data.push([x1, x2]);
        labels.push(label);
      }
      break;

    case 'xor':
      for (let i = 0; i < numSamples; i++) {
        const x1 = (Math.random() - 0.5) * 2;
        const x2 = (Math.random() - 0.5) * 2;
        const label = (x1 * x2 > 0) ? 0 : 1;

        data.push([x1, x2]);
        labels.push(label);
      }
      break;

    default: // blobs
      for (let i = 0; i < numSamples; i++) {
        const centerX = Math.random() > 0.5 ? 1 : -1;
        const centerY = Math.random() > 0.5 ? 1 : -1;
        const x1 = centerX + (Math.random() - 0.5) * 0.5;
        const x2 = centerY + (Math.random() - 0.5) * 0.5;
        const label = (centerX > 0 && centerY > 0) || (centerX < 0 && centerY < 0) ? 0 : 1;

        data.push([x1, x2]);
        labels.push(label);
      }
  }

  return { data, labels };
}

export function generateRegressionDataset(
  type: 'linear' | 'quadratic' | 'sine' | 'exponential',
  numSamples: number = 100
): { data: number[][]; targets: number[] } {
  const data: number[][] = [];
  const targets: number[] = [];

  for (let i = 0; i < numSamples; i++) {
    const x = (Math.random() - 0.5) * 4;
    let y: number;

    switch (type) {
      case 'linear':
        y = 2 * x + 1 + (Math.random() - 0.5) * 0.5;
        break;
      case 'quadratic':
        y = x * x + (Math.random() - 0.5) * 0.5;
        break;
      case 'sine':
        y = Math.sin(x) + (Math.random() - 0.5) * 0.2;
        break;
      case 'exponential':
        y = Math.exp(x * 0.5) + (Math.random() - 0.5) * 0.1;
        break;
      default:
        y = x;
    }

    data.push([x]);
    targets.push(y);
  }

  return { data, targets };
}

// ============================================================================
// PERFORMANCE METRICS AND EVALUATION
// ============================================================================

export interface MLPerformanceMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  mse?: number;
  mae?: number;
}

export function evaluateClassification(
  predictions: number[],
  trueLabels: number[],
  threshold: number = 0.5
): MLPerformanceMetrics {
  const binaryPreds = predictions.map(p => p > threshold ? 1 : 0);

  let tp = 0, fp = 0, tn = 0, fn = 0;

  for (let i = 0; i < binaryPreds.length; i++) {
    if (binaryPreds[i] === 1 && trueLabels[i] === 1) tp++;
    else if (binaryPreds[i] === 1 && trueLabels[i] === 0) fp++;
    else if (binaryPreds[i] === 0 && trueLabels[i] === 0) tn++;
    else if (binaryPreds[i] === 0 && trueLabels[i] === 1) fn++;
  }

  const accuracy = (tp + tn) / (tp + tn + fp + fn);
  const precision = tp / (tp + fp) || 0;
  const recall = tp / (tp + fn) || 0;
  const f1Score = 2 * precision * recall / (precision + recall) || 0;

  return { accuracy, precision, recall, f1Score };
}

export function evaluateRegression(
  predictions: number[],
  trueValues: number[]
): Pick<MLPerformanceMetrics, 'mse' | 'mae'> {
  const mse = predictions.reduce((sum, pred, i) =>
    sum + Math.pow(pred - trueValues[i], 2), 0
  ) / predictions.length;

  const mae = predictions.reduce((sum, pred, i) =>
    sum + Math.abs(pred - trueValues[i]), 0
  ) / predictions.length;

  return { mse, mae };
}

// ============================================================================
// MODEL SERIALIZATION
// ============================================================================

export interface SerializedQuantumModel {
  type: 'VQC' | 'QGAN' | 'QAE';
  config: any;
  parameters: number[];
  metadata: {
    created: string;
    version: string;
    description?: string;
  };
}

export function serializeModel(
  model: VariationalQuantumClassifier | QuantumGenerativeAdversarialNetwork | QuantumAutoencoder,
  description?: string
): SerializedQuantumModel {
  let type: 'VQC' | 'QGAN' | 'QAE';
  let config: any;
  let parameters: number[];

  if (model instanceof VariationalQuantumClassifier) {
    type = 'VQC';
    config = model.config;
    parameters = model.parameters;
  } else if (model instanceof QuantumGenerativeAdversarialNetwork) {
    type = 'QGAN';
    config = model.config;
    parameters = [...model.generator.parameters, ...model.discriminator.parameters];
  } else if (model instanceof QuantumAutoencoder) {
    type = 'QAE';
    config = model.config;
    parameters = [...model.encoder.parameters, ...model.decoder.parameters];
  } else {
    throw new Error('Unsupported model type');
  }

  return {
    type,
    config,
    parameters,
    metadata: {
      created: new Date().toISOString(),
      version: '1.0.0',
      description
    }
  };
}

export function deserializeModel(data: SerializedQuantumModel):
  VariationalQuantumClassifier | QuantumGenerativeAdversarialNetwork | QuantumAutoencoder {

  switch (data.type) {
    case 'VQC':
      const vqc = new VariationalQuantumClassifier(data.config);
      vqc.parameters = data.parameters;
      return vqc;

    case 'QGAN':
      const qgan = new QuantumGenerativeAdversarialNetwork(data.config);
      const genParams = data.parameters.slice(0, qgan.generator.parameters.length);
      const discParams = data.parameters.slice(qgan.generator.parameters.length);
      qgan.generator.parameters = genParams;
      qgan.discriminator.parameters = discParams;
      return qgan;

    case 'QAE':
      const qae = new QuantumAutoencoder(data.config);
      const encParams = data.parameters.slice(0, qae.encoder.parameters.length);
      const decParams = data.parameters.slice(qae.encoder.parameters.length);
      qae.encoder.parameters = encParams;
      qae.decoder.parameters = decParams;
      return qae;

    default:
      throw new Error('Unknown model type');
  }
}