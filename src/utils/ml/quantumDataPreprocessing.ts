// Quantum Data Preprocessing Techniques for Bloch Verse
// Advanced preprocessing methods optimized for quantum machine learning

export interface DataSample {
  features: number[];
  label?: number;
  target?: number;
  metadata?: any;
}

export interface PreprocessingConfig {
  normalization: 'none' | 'minmax' | 'zscore' | 'robust';
  encoding: 'raw' | 'angle' | 'amplitude' | 'basis';
  dimensionality: {
    reduction: 'none' | 'pca' | 'autoencoder' | 'feature_selection';
    targetDimensions?: number;
  };
  augmentation: {
    enabled: boolean;
    noise: number;
    rotations: boolean;
    permutations: boolean;
  };
  validation: {
    trainSplit: number;
    stratify: boolean;
    shuffle: boolean;
  };
}

export class QuantumDataPreprocessor {
  private config: PreprocessingConfig;
  private statistics: {
    mean?: number[];
    std?: number[];
    min?: number[];
    max?: number[];
    median?: number[];
    mad?: number[]; // Median Absolute Deviation
  } = {};

  constructor(config: Partial<PreprocessingConfig> = {}) {
    this.config = {
      normalization: 'zscore',
      encoding: 'angle',
      dimensionality: {
        reduction: 'none'
      },
      augmentation: {
        enabled: false,
        noise: 0.1,
        rotations: false,
        permutations: false
      },
      validation: {
        trainSplit: 0.8,
        stratify: true,
        shuffle: true
      },
      ...config
    };
  }

  // Fit preprocessor on training data
  fit(data: DataSample[]): void {
    const features = data.map(sample => sample.features);

    // Calculate statistics for normalization
    this.calculateStatistics(features);

    // Fit dimensionality reduction if needed
    if (this.config.dimensionality.reduction !== 'none') {
      this.fitDimensionalityReduction(features);
    }
  }

  // Transform data using fitted preprocessor
  transform(data: DataSample[]): DataSample[] {
    let processedData = [...data];

    // Apply normalization
    processedData = this.applyNormalization(processedData);

    // Apply dimensionality reduction
    processedData = this.applyDimensionalityReduction(processedData);

    // Apply quantum-specific encoding
    processedData = this.applyEncoding(processedData);

    return processedData;
  }

  // Fit and transform in one step
  fitTransform(data: DataSample[]): DataSample[] {
    this.fit(data);
    return this.transform(data);
  }

  // Split data into train/validation sets
  splitData(data: DataSample[]): { train: DataSample[]; validation: DataSample[] } {
    const { trainSplit, stratify, shuffle } = this.config.validation;

    let processedData = [...data];

    // Shuffle if requested
    if (shuffle) {
      processedData = this.shuffleArray(processedData);
    }

    // Stratified split if requested and labels are available
    if (stratify && data.some(d => d.label !== undefined)) {
      return this.stratifiedSplit(processedData, trainSplit);
    } else {
      const splitIndex = Math.floor(processedData.length * trainSplit);
      return {
        train: processedData.slice(0, splitIndex),
        validation: processedData.slice(splitIndex)
      };
    }
  }

  // Generate augmented data samples
  augmentData(data: DataSample[], numAugmentations: number = 1): DataSample[] {
    if (!this.config.augmentation.enabled) {
      return data;
    }

    const augmentedData: DataSample[] = [];

    for (const sample of data) {
      // Add original sample
      augmentedData.push({ ...sample });

      // Generate augmentations
      for (let i = 0; i < numAugmentations; i++) {
        const augmented = this.augmentSample(sample);
        augmentedData.push(augmented);
      }
    }

    return augmentedData;
  }

  private calculateStatistics(features: number[][]): void {
    const numFeatures = features[0].length;
    const numSamples = features.length;

    // Initialize arrays
    this.statistics.mean = new Array(numFeatures).fill(0);
    this.statistics.std = new Array(numFeatures).fill(0);
    this.statistics.min = new Array(numFeatures).fill(Infinity);
    this.statistics.max = new Array(numFeatures).fill(-Infinity);
    this.statistics.median = new Array(numFeatures).fill(0);
    this.statistics.mad = new Array(numFeatures).fill(0);

    // Calculate mean and min/max
    for (let i = 0; i < numSamples; i++) {
      for (let j = 0; j < numFeatures; j++) {
        const value = features[i][j];
        this.statistics.mean![j] += value;
        this.statistics.min![j] = Math.min(this.statistics.min![j], value);
        this.statistics.max![j] = Math.max(this.statistics.max![j], value);
      }
    }

    for (let j = 0; j < numFeatures; j++) {
      this.statistics.mean![j] /= numSamples;
    }

    // Calculate standard deviation and median
    for (let j = 0; j < numFeatures; j++) {
      const values = features.map(f => f[j]);
      values.sort((a, b) => a - b);

      // Standard deviation
      let variance = 0;
      for (let i = 0; i < numSamples; i++) {
        variance += Math.pow(features[i][j] - this.statistics.mean![j], 2);
      }
      this.statistics.std![j] = Math.sqrt(variance / numSamples);

      // Median
      this.statistics.median![j] = numSamples % 2 === 0
        ? (values[numSamples / 2 - 1] + values[numSamples / 2]) / 2
        : values[Math.floor(numSamples / 2)];

      // MAD (Median Absolute Deviation)
      const deviations = values.map(v => Math.abs(v - this.statistics.median![j]));
      deviations.sort((a, b) => a - b);
      this.statistics.mad![j] = deviations[Math.floor(numSamples / 2)];
    }
  }

  private applyNormalization(data: DataSample[]): DataSample[] {
    const { normalization } = this.config;

    if (normalization === 'none') {
      return data;
    }

    return data.map(sample => {
      const normalizedFeatures = [...sample.features];

      for (let i = 0; i < normalizedFeatures.length; i++) {
        const value = normalizedFeatures[i];

        switch (normalization) {
          case 'minmax':
            if (this.statistics.max![i] !== this.statistics.min![i]) {
              normalizedFeatures[i] = (value - this.statistics.min![i]) /
                (this.statistics.max![i] - this.statistics.min![i]);
            }
            break;

          case 'zscore':
            if (this.statistics.std![i] !== 0) {
              normalizedFeatures[i] = (value - this.statistics.mean![i]) /
                this.statistics.std![i];
            }
            break;

          case 'robust':
            if (this.statistics.mad![i] !== 0) {
              normalizedFeatures[i] = (value - this.statistics.median![i]) /
                this.statistics.mad![i];
            }
            break;
        }
      }

      return {
        ...sample,
        features: normalizedFeatures
      };
    });
  }

  private fitDimensionalityReduction(features: number[][]): void {
    const { reduction, targetDimensions } = this.config.dimensionality;

    switch (reduction) {
      case 'pca':
        this.fitPCA(features, targetDimensions || 2);
        break;
      case 'autoencoder':
        // Would implement autoencoder-based dimensionality reduction
        break;
      case 'feature_selection':
        this.fitFeatureSelection(features, targetDimensions || 2);
        break;
    }
  }

  private applyDimensionalityReduction(data: DataSample[]): DataSample[] {
    const { reduction } = this.config.dimensionality;

    if (reduction === 'none') {
      return data;
    }

    switch (reduction) {
      case 'pca':
        return this.applyPCA(data);
      case 'autoencoder':
        return this.applyAutoencoderReduction(data);
      case 'feature_selection':
        return this.applyFeatureSelection(data);
      default:
        return data;
    }
  }

  private fitPCA(features: number[][], targetDimensions: number): void {
    // Simplified PCA implementation
    const numFeatures = features[0].length;
    const numSamples = features.length;

    // Calculate covariance matrix
    const covarianceMatrix = Array(numFeatures).fill(0).map(() => Array(numFeatures).fill(0));

    for (let i = 0; i < numFeatures; i++) {
      for (let j = 0; j < numFeatures; j++) {
        let cov = 0;
        for (let k = 0; k < numSamples; k++) {
          cov += (features[k][i] - this.statistics.mean![i]) *
                 (features[k][j] - this.statistics.mean![j]);
        }
        covarianceMatrix[i][j] = cov / numSamples;
      }
    }

    // Store PCA components (simplified - would need proper eigenvector calculation)
    (this.statistics as any).pcaComponents = covarianceMatrix.slice(0, targetDimensions);
  }

  private applyPCA(data: DataSample[]): DataSample[] {
    // Simplified PCA application
    return data.map(sample => ({
      ...sample,
      features: sample.features.slice(0, this.config.dimensionality.targetDimensions || 2)
    }));
  }

  private fitFeatureSelection(features: number[][], targetDimensions: number): void {
    // Simple feature selection based on variance
    const variances = features[0].map((_, i) => {
      const values = features.map(f => f[i]);
      const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
      const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
      return { index: i, variance };
    });

    variances.sort((a, b) => b.variance - a.variance);
    (this.statistics as any).selectedFeatures = variances
      .slice(0, targetDimensions)
      .map(v => v.index);
  }

  private applyFeatureSelection(data: DataSample[]): DataSample[] {
    const selectedFeatures = (this.statistics as any).selectedFeatures || [];
    return data.map(sample => ({
      ...sample,
      features: selectedFeatures.map((i: number) => sample.features[i])
    }));
  }

  private applyAutoencoderReduction(data: DataSample[]): DataSample[] {
    // Placeholder for autoencoder-based reduction
    return data;
  }

  private applyEncoding(data: DataSample[]): DataSample[] {
    const { encoding } = this.config;

    switch (encoding) {
      case 'angle':
        return this.applyAngleEncoding(data);
      case 'amplitude':
        return this.applyAmplitudeEncoding(data);
      case 'basis':
        return this.applyBasisEncoding(data);
      default:
        return data;
    }
  }

  private applyAngleEncoding(data: DataSample[]): DataSample[] {
    // Encode features as rotation angles for quantum gates
    return data.map(sample => ({
      ...sample,
      features: sample.features.map(feature =>
        // Normalize to [-π, π] range suitable for rotation gates
        ((feature + 1) * Math.PI) - Math.PI
      )
    }));
  }

  private applyAmplitudeEncoding(data: DataSample[]): DataSample[] {
    // Encode features as amplitudes (would need quantum state preparation)
    return data.map(sample => ({
      ...sample,
      features: sample.features.map(feature =>
        Math.max(0, Math.min(1, (feature + 1) / 2)) // Normalize to [0, 1]
      )
    }));
  }

  private applyBasisEncoding(data: DataSample[]): DataSample[] {
    // Encode features in computational basis
    return data.map(sample => ({
      ...sample,
      features: sample.features.map(feature =>
        feature > 0 ? 1 : 0 // Binary encoding
      )
    }));
  }

  private augmentSample(sample: DataSample): DataSample {
    const { noise, rotations, permutations } = this.config.augmentation;
    let augmentedFeatures = [...sample.features];

    // Add noise
    if (noise > 0) {
      augmentedFeatures = augmentedFeatures.map(feature =>
        feature + (Math.random() - 0.5) * noise
      );
    }

    // Apply rotations (for 2D data)
    if (rotations && augmentedFeatures.length >= 2) {
      const angle = (Math.random() - 0.5) * Math.PI / 4; // Small rotations
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);

      const x = augmentedFeatures[0] * cos - augmentedFeatures[1] * sin;
      const y = augmentedFeatures[0] * sin + augmentedFeatures[1] * cos;

      augmentedFeatures[0] = x;
      augmentedFeatures[1] = y;
    }

    // Apply feature permutations (for robustness testing)
    if (permutations && Math.random() < 0.3) {
      const indices = augmentedFeatures.map((_, i) => i);
      this.shuffleArray(indices);
      augmentedFeatures = indices.map(i => augmentedFeatures[i]);
    }

    return {
      ...sample,
      features: augmentedFeatures,
      metadata: {
        ...sample.metadata,
        augmented: true
      }
    };
  }

  private stratifiedSplit(data: DataSample[], trainSplit: number): { train: DataSample[]; validation: DataSample[] } {
    // Group by labels
    const labelGroups: { [key: number]: DataSample[] } = {};

    data.forEach(sample => {
      const label = sample.label || 0;
      if (!labelGroups[label]) {
        labelGroups[label] = [];
      }
      labelGroups[label].push(sample);
    });

    const trainData: DataSample[] = [];
    const validationData: DataSample[] = [];

    // Split each group proportionally
    Object.values(labelGroups).forEach(group => {
      const splitIndex = Math.floor(group.length * trainSplit);
      trainData.push(...group.slice(0, splitIndex));
      validationData.push(...group.slice(splitIndex));
    });

    return { train: trainData, validation: validationData };
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  // Get preprocessing statistics
  getStatistics() {
    return { ...this.statistics };
  }

  // Export configuration
  exportConfig(): PreprocessingConfig {
    return { ...this.config };
  }

  // Import configuration
  importConfig(config: PreprocessingConfig): void {
    this.config = { ...config };
  }
}

// Utility functions for common preprocessing tasks

export function standardizeFeatures(data: DataSample[]): DataSample[] {
  const preprocessor = new QuantumDataPreprocessor({ normalization: 'zscore' });
  return preprocessor.fitTransform(data);
}

export function normalizeFeatures(data: DataSample[], method: 'minmax' | 'zscore' | 'robust' = 'zscore'): DataSample[] {
  const preprocessor = new QuantumDataPreprocessor({ normalization: method });
  return preprocessor.fitTransform(data);
}

export function encodeForQuantum(data: DataSample[], encoding: 'angle' | 'amplitude' | 'basis' = 'angle'): DataSample[] {
  const preprocessor = new QuantumDataPreprocessor({ encoding });
  return preprocessor.fitTransform(data);
}

export function reduceDimensionality(data: DataSample[], method: 'pca' | 'feature_selection', targetDims: number): DataSample[] {
  const preprocessor = new QuantumDataPreprocessor({
    dimensionality: {
      reduction: method,
      targetDimensions: targetDims
    }
  });
  return preprocessor.fitTransform(data);
}

export function createTrainValidationSplit(
  data: DataSample[],
  trainSplit: number = 0.8,
  stratify: boolean = true
): { train: DataSample[]; validation: DataSample[] } {
  const preprocessor = new QuantumDataPreprocessor({
    validation: { trainSplit, stratify, shuffle: true }
  });
  return preprocessor.splitData(data);
}

// Quantum-specific data analysis functions

export function analyzeQuantumReadiness(data: DataSample[]): {
  quantumCompatible: boolean;
  recommendations: string[];
  statistics: {
    featureCorrelations: number[][];
    quantumStateFidelity: number;
    encodingEfficiency: number;
  };
} {
  const features = data.map(d => d.features);
  const numFeatures = features[0].length;
  const numSamples = features.length;

  // Calculate feature correlations
  const correlations: number[][] = Array(numFeatures).fill(0).map(() => Array(numFeatures).fill(0));

  for (let i = 0; i < numFeatures; i++) {
    for (let j = 0; j < numFeatures; j++) {
      let correlation = 0;
      for (let k = 0; k < numSamples; k++) {
        correlation += features[k][i] * features[k][j];
      }
      correlations[i][j] = correlation / numSamples;
    }
  }

  // Assess quantum compatibility
  const recommendations: string[] = [];
  let quantumCompatible = true;

  // Check feature count vs qubit availability
  if (numFeatures > 20) {
    recommendations.push('Consider dimensionality reduction - high feature count may exceed practical qubit limits');
    quantumCompatible = false;
  }

  // Check for highly correlated features
  let highCorrelationCount = 0;
  for (let i = 0; i < numFeatures; i++) {
    for (let j = i + 1; j < numFeatures; j++) {
      if (Math.abs(correlations[i][j]) > 0.8) {
        highCorrelationCount++;
      }
    }
  }

  if (highCorrelationCount > numFeatures) {
    recommendations.push('High feature correlations detected - consider feature selection or quantum kernel methods');
  }

  // Check data distribution
  const featureRanges = features[0].map((_, i) => {
    const values = features.map(f => f[i]);
    return Math.max(...values) - Math.min(...values);
  });

  if (featureRanges.some(range => range < 0.1)) {
    recommendations.push('Some features have very small ranges - consider normalization');
  }

  return {
    quantumCompatible,
    recommendations,
    statistics: {
      featureCorrelations: correlations,
      quantumStateFidelity: 0.85, // Placeholder
      encodingEfficiency: Math.min(1, 10 / numFeatures) // Rough estimate
    }
  };
}