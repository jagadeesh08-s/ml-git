import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  BarChart3,
  TrendingUp,
  Target,
  Zap,
  CheckCircle,
  AlertCircle,
  Activity,
  Settings,
  Play,
  RotateCcw,
  Info
} from 'lucide-react';
import { toast } from 'sonner';

// Import quantum ML and evaluation functions
import {
  VariationalQuantumClassifier,
  evaluateClassification,
  evaluateRegression,
  generateClassificationDataset,
  generateRegressionDataset,
  type VQCConfig,
  type MLPerformanceMetrics
} from '@/utils/quantumMLPrimitives';

// Simple classical ML implementations for comparison
class ClassicalSVM {
  private weights: number[] = [];
  private bias: number = 0;
  private learningRate: number = 0.01;
  private epochs: number = 100;

  train(X: number[][], y: number[]): void {
    const nFeatures = X[0].length;
    this.weights = new Array(nFeatures).fill(0);
    this.bias = 0;

    // Simple gradient descent for SVM
    for (let epoch = 0; epoch < this.epochs; epoch++) {
      for (let i = 0; i < X.length; i++) {
        const prediction = this.predictSample(X[i]);
        const error = y[i] - prediction;

        // Update weights and bias
        for (let j = 0; j < nFeatures; j++) {
          this.weights[j] += this.learningRate * error * X[i][j];
        }
        this.bias += this.learningRate * error;
      }
    }
  }

  predict(X: number[][]): number[] {
    return X.map(sample => this.predictSample(sample));
  }

  private predictSample(x: number[]): number {
    const linear = x.reduce((sum, xi, i) => sum + xi * this.weights[i], 0) + this.bias;
    return linear > 0 ? 1 : 0; // Binary classification
  }
}

class ClassicalNeuralNetwork {
  private weights: number[][] = [];
  private biases: number[] = [];
  private learningRate: number = 0.01;
  private epochs: number = 100;
  private hiddenSize: number = 10;

  constructor(inputSize: number, hiddenSize: number = 10) {
    this.hiddenSize = hiddenSize;

    // Initialize weights
    this.weights = [
      Array.from({ length: hiddenSize }, () => Array.from({ length: inputSize }, () => Math.random() * 0.1 - 0.05)),
      Array.from({ length: 1 }, () => Array.from({ length: hiddenSize }, () => Math.random() * 0.1 - 0.05))
    ];

    this.biases = [
      new Array(hiddenSize).fill(0),
      [0]
    ];
  }

  train(X: number[][], y: number[]): void {
    for (let epoch = 0; epoch < this.epochs; epoch++) {
      for (let i = 0; i < X.length; i++) {
        // Forward pass
        const hidden = this.sigmoid(this.addBias(this.matrixMultiply([X[i]], this.weights[0])[0], this.biases[0]));
        const output = this.sigmoid(this.addBias(this.matrixMultiply([hidden], this.weights[1])[0], this.biases[1]))[0];

        // Backward pass
        const outputError = (y[i] - output) * output * (1 - output);
        const hiddenErrors = this.weights[1][0].map((w, j) =>
          outputError * w * hidden[j] * (1 - hidden[j])
        );

        // Update weights and biases
        for (let j = 0; j < this.weights[1][0].length; j++) {
          this.weights[1][0][j] += this.learningRate * outputError * hidden[j];
        }
        this.biases[1][0] += this.learningRate * outputError;

        for (let j = 0; j < this.weights[0].length; j++) {
          for (let k = 0; k < this.weights[0][0].length; k++) {
            this.weights[0][j][k] += this.learningRate * hiddenErrors[j] * X[i][k];
          }
          this.biases[0][j] += this.learningRate * hiddenErrors[j];
        }
      }
    }
  }

  predict(X: number[][]): number[] {
    return X.map(sample => {
      const hidden = this.sigmoid(this.addBias(this.matrixMultiply([sample], this.weights[0])[0], this.biases[0]));
      const output = this.sigmoid(this.addBias(this.matrixMultiply([hidden], this.weights[1])[0], this.biases[1]))[0];
      return output > 0.5 ? 1 : 0;
    });
  }

  private sigmoid(x: number[]): number[] {
    return x.map(val => 1 / (1 + Math.exp(-val)));
  }

  private matrixMultiply(a: number[][], b: number[][]): number[][] {
    const result: number[][] = [];
    for (let i = 0; i < a.length; i++) {
      result[i] = [];
      for (let j = 0; j < b[0].length; j++) {
        result[i][j] = 0;
        for (let k = 0; k < b.length; k++) {
          result[i][j] += a[i][k] * b[k][j];
        }
      }
    }
    return result;
  }

  private addBias(x: number[], bias: number[]): number[] {
    return x.map((val, i) => val + (bias[i] || 0));
  }
}

interface ComparisonResult {
  algorithm: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  trainingTime: number;
  inferenceTime: number;
}

interface QuantumMLComparisonProps {
  datasetType?: 'classification' | 'regression';
  datasetPattern?: string;
  numSamples?: number;
}

const QuantumMLComparison: React.FC<QuantumMLComparisonProps> = ({
  datasetType = 'classification',
  datasetPattern = 'circles',
  numSamples = 200
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<ComparisonResult[]>([]);
  const [dataset, setDataset] = useState<{ data: number[][]; labels: number[] }>({ data: [], labels: [] });

  // Generate dataset
  const generateDataset = useCallback(() => {
    let generatedData;
    if (datasetType === 'classification') {
      generatedData = generateClassificationDataset(datasetPattern as any, numSamples);
    } else {
      generatedData = generateRegressionDataset(datasetPattern as any, numSamples);
    }

    setDataset({
      data: generatedData.data,
      labels: Array.isArray(generatedData.labels) ? generatedData.labels : generatedData.targets?.map((t: number) => t > 0 ? 1 : 0) || []
    });
  }, [datasetType, datasetPattern, numSamples]);

  useEffect(() => {
    generateDataset();
  }, [generateDataset]);

  // Run comparison
  const runComparison = async () => {
    if (dataset.data.length === 0) {
      toast.error('No dataset available');
      return;
    }

    setIsRunning(true);
    setProgress(0);
    const comparisonResults: ComparisonResult[] = [];

    try {
      // Split data
      const splitIndex = Math.floor(dataset.data.length * 0.8);
      const trainData = dataset.data.slice(0, splitIndex);
      const trainLabels = dataset.labels.slice(0, splitIndex);
      const testData = dataset.data.slice(splitIndex);
      const testLabels = dataset.labels.slice(splitIndex);

      // 1. Classical SVM
      setProgress(10);
      const svmStart = Date.now();
      const svm = new ClassicalSVM();
      svm.train(trainData, trainLabels);
      const svmTrainTime = Date.now() - svmStart;

      const svmInferenceStart = Date.now();
      const svmPredictions = svm.predict(testData);
      const svmInferenceTime = Date.now() - svmInferenceStart;

      const svmMetrics = evaluateClassification(svmPredictions, testLabels);
      comparisonResults.push({
        algorithm: 'Classical SVM',
        accuracy: svmMetrics.accuracy,
        precision: svmMetrics.precision,
        recall: svmMetrics.recall,
        f1Score: svmMetrics.f1Score,
        trainingTime: svmTrainTime,
        inferenceTime: svmInferenceTime
      });

      // 2. Classical Neural Network
      setProgress(30);
      const nnStart = Date.now();
      const nn = new ClassicalNeuralNetwork(trainData[0].length);
      nn.train(trainData, trainLabels);
      const nnTrainTime = Date.now() - nnStart;

      const nnInferenceStart = Date.now();
      const nnPredictions = nn.predict(testData);
      const nnInferenceTime = Date.now() - nnInferenceStart;

      const nnMetrics = evaluateClassification(nnPredictions, testLabels);
      comparisonResults.push({
        algorithm: 'Classical NN',
        accuracy: nnMetrics.accuracy,
        precision: nnMetrics.precision,
        recall: nnMetrics.recall,
        f1Score: nnMetrics.f1Score,
        trainingTime: nnTrainTime,
        inferenceTime: nnInferenceTime
      });

      // 3. Quantum VQC
      setProgress(60);
      const numQubits = Math.max(2, Math.min(4, trainData[0].length));
      const featureMap = { name: 'Z Feature Map', numQubits };
      const variationalLayer = { numQubits, numParameters: numQubits * 2 * 2 };
      const measurementLayer = { numQubits, observables: ['Z'] };

      const vqcConfig: VQCConfig = {
        featureMap: featureMap as any,
        variationalLayer: variationalLayer as any,
        measurementLayer: measurementLayer as any,
        optimizer: 'Adam',
        learningRate: 0.01,
        maxIterations: 20
      };

      const vqcStart = Date.now();
      const vqc = new VariationalQuantumClassifier(vqcConfig);
      vqc.train(trainData.map((x, i) => ({ x, y: trainLabels[i] })), trainLabels);
      const vqcTrainTime = Date.now() - vqcStart;

      const vqcInferenceStart = Date.now();
      const vqcPredictions = testData.map(sample => vqc.predict(sample));
      const vqcInferenceTime = Date.now() - vqcInferenceStart;

      const vqcMetrics = evaluateClassification(vqcPredictions.map(p => Array.isArray(p) ? p[0] : p), testLabels);
      comparisonResults.push({
        algorithm: 'Quantum VQC',
        accuracy: vqcMetrics.accuracy,
        precision: vqcMetrics.precision,
        recall: vqcMetrics.recall,
        f1Score: vqcMetrics.f1Score,
        trainingTime: vqcTrainTime,
        inferenceTime: vqcInferenceTime
      });

      setProgress(100);
      setResults(comparisonResults);
      toast.success('Comparison completed successfully!');

    } catch (error) {
      console.error('Comparison error:', error);
      toast.error('Comparison failed');
    } finally {
      setIsRunning(false);
    }
  };

  const resetComparison = () => {
    setResults([]);
    setProgress(0);
  };

  const getBestAlgorithm = () => {
    if (results.length === 0) return null;
    return results.reduce((best, current) =>
      current.accuracy > best.accuracy ? current : best
    );
  };

  const bestAlgorithm = getBestAlgorithm();

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Quantum vs Classical ML Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Compare the performance of quantum machine learning algorithms against classical counterparts
            on standardized datasets.
          </p>

          <div className="flex gap-2 mt-4">
            {!isRunning ? (
              <Button onClick={runComparison} className="flex-1">
                <Play className="w-4 h-4 mr-2" />
                Run Comparison
              </Button>
            ) : (
              <Button disabled className="flex-1">
                <Activity className="w-4 h-4 mr-2" />
                Running...
              </Button>
            )}

            <Button onClick={resetComparison} variant="outline">
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>

          {isRunning && (
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-2">
                <span>Progress</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dataset Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Dataset Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{dataset.data.length}</div>
              <div className="text-sm text-muted-foreground">Total Samples</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{dataset.data[0]?.length || 0}</div>
              <div className="text-sm text-muted-foreground">Features</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {datasetType === 'classification' ? new Set(dataset.labels).size : 'N/A'}
              </div>
              <div className="text-sm text-muted-foreground">Classes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{datasetPattern}</div>
              <div className="text-sm text-muted-foreground">Pattern</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {results.length > 0 && (
        <>
          {/* Best Algorithm Highlight */}
          {bestAlgorithm && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Best Performance:</strong> {bestAlgorithm.algorithm} achieved
                {(bestAlgorithm.accuracy * 100).toFixed(1)}% accuracy
              </AlertDescription>
            </Alert>
          )}

          {/* Performance Comparison Table */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Algorithm</th>
                      <th className="text-center p-2">Accuracy</th>
                      <th className="text-center p-2">Precision</th>
                      <th className="text-center p-2">Recall</th>
                      <th className="text-center p-2">F1 Score</th>
                      <th className="text-center p-2">Train Time</th>
                      <th className="text-center p-2">Inference Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((result, index) => (
                      <tr key={index} className="border-b">
                        <td className="p-2 font-medium">
                          <div className="flex items-center gap-2">
                            {result.algorithm}
                            {bestAlgorithm?.algorithm === result.algorithm && (
                              <Badge variant="secondary" className="text-xs">Best</Badge>
                            )}
                          </div>
                        </td>
                        <td className="text-center p-2">{(result.accuracy * 100).toFixed(1)}%</td>
                        <td className="text-center p-2">{(result.precision * 100).toFixed(1)}%</td>
                        <td className="text-center p-2">{(result.recall * 100).toFixed(1)}%</td>
                        <td className="text-center p-2">{(result.f1Score * 100).toFixed(1)}%</td>
                        <td className="text-center p-2">{result.trainingTime.toFixed(0)}ms</td>
                        <td className="text-center p-2">{result.inferenceTime.toFixed(0)}ms</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Performance Visualization */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-muted/20 rounded-lg flex items-center justify-center">
                <div className="text-center space-y-2">
                  <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto" />
                  <p className="text-sm text-muted-foreground">
                    Performance charts would be displayed here
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Comparing accuracy, training time, and other metrics
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="w-5 h-5" />
                Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="prose prose-sm max-w-none">
                <h4>Key Insights</h4>
                <ul className="space-y-2">
                  <li>
                    <strong>Quantum Advantage:</strong> Quantum algorithms may show advantages on specific
                    problem structures that classical algorithms struggle with.
                  </li>
                  <li>
                    <strong>Training Time:</strong> Quantum algorithms often require more computational
                    resources but may converge faster on certain optimization landscapes.
                  </li>
                  <li>
                    <strong>Scalability:</strong> As problem complexity increases, quantum algorithms
                    may provide better scaling properties than classical counterparts.
                  </li>
                  <li>
                    <strong>Noise Sensitivity:</strong> Current quantum hardware introduces noise that
                    can affect algorithm performance compared to ideal classical implementations.
                  </li>
                </ul>
              </div>

              {bestAlgorithm && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    The best performing algorithm was <strong>{bestAlgorithm.algorithm}</strong> with
                    {(bestAlgorithm.accuracy * 100).toFixed(1)}% accuracy. This demonstrates the
                    potential of quantum machine learning for certain problem domains.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default QuantumMLComparison;