import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Settings,
  Play,
  Pause,
  RotateCcw,
  TrendingUp,
  Target,
  Zap,
  BarChart3,
  CheckCircle,
  AlertCircle,
  Activity,
  Search,
  Grid3X3,
  Shuffle
} from 'lucide-react';
import { toast } from 'sonner';

// Import quantum ML components
import {
  VariationalQuantumClassifier,
  generateClassificationDataset,
  evaluateClassification,
  type VQCConfig,
  type FeatureMap,
  ZFeatureMap,
  ZZFeatureMap,
  AmplitudeEncoding,
  VariationalLayer
} from '@/utils/quantumMLPrimitives';

interface HyperparameterConfig {
  learningRate: number;
  maxIterations: number;
  numLayers: number;
  numQubits: number;
  featureMap: 'Z' | 'ZZ' | 'Amplitude';
  ansatz: 'hardware_efficient' | 'real_amplitudes' | 'two_local';
  optimizer: 'SPSA' | 'COBYLA' | 'Adam';
}

interface TuningResult {
  config: HyperparameterConfig;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  trainingTime: number;
}

interface QuantumMLHyperparameterTuningProps {
  onBestConfigFound?: (config: HyperparameterConfig) => void;
}

const QuantumMLHyperparameterTuning: React.FC<QuantumMLHyperparameterTuningProps> = ({
  onBestConfigFound
}) => {
  const [isTuning, setIsTuning] = useState(false);
  const [tuningProgress, setTuningProgress] = useState(0);
  const [currentTrial, setCurrentTrial] = useState(0);
  const [totalTrials, setTotalTrials] = useState(0);
  const [results, setResults] = useState<TuningResult[]>([]);
  const [bestResult, setBestResult] = useState<TuningResult | null>(null);

  // Tuning configuration
  const [tuningMethod, setTuningMethod] = useState<'grid' | 'random' | 'bayesian'>('grid');
  const [numTrials, setNumTrials] = useState(10);
  const [datasetType, setDatasetType] = useState<'circles' | 'moons' | 'blobs' | 'xor'>('circles');

  // Hyperparameter ranges
  const [paramRanges, setParamRanges] = useState({
    learningRate: { min: 0.001, max: 0.1, step: 0.01 },
    maxIterations: { min: 25, max: 100, step: 25 },
    numLayers: { min: 1, max: 4, step: 1 },
    numQubits: { min: 2, max: 6, step: 1 }
  });

  // Generate hyperparameter configurations
  const generateConfigs = useCallback((method: 'grid' | 'random' | 'bayesian', numConfigs: number): HyperparameterConfig[] => {
    const configs: HyperparameterConfig[] = [];
    const featureMaps: ('Z' | 'ZZ' | 'Amplitude')[] = ['Z', 'ZZ', 'Amplitude'];
    const ansatzTypes: ('hardware_efficient' | 'real_amplitudes' | 'two_local')[] = ['hardware_efficient', 'real_amplitudes', 'two_local'];
    const optimizers: ('SPSA' | 'COBYLA' | 'Adam')[] = ['SPSA', 'COBYLA', 'Adam'];

    if (method === 'grid') {
      // Grid search over key parameters
      const learningRates = [0.01, 0.05, 0.1];
      const layerCounts = [1, 2, 3];
      const qubitCounts = [2, 4, 6];

      for (const lr of learningRates) {
        for (const layers of layerCounts) {
          for (const qubits of qubitCounts) {
            for (const fm of featureMaps.slice(0, 2)) { // Limit to reduce combinations
              configs.push({
                learningRate: lr,
                maxIterations: 50,
                numLayers: layers,
                numQubits: qubits,
                featureMap: fm,
                ansatz: 'hardware_efficient',
                optimizer: 'Adam'
              });
            }
          }
        }
      }
    } else if (method === 'random') {
      // Random search
      for (let i = 0; i < numConfigs; i++) {
        configs.push({
          learningRate: Math.random() * (paramRanges.learningRate.max - paramRanges.learningRate.min) + paramRanges.learningRate.min,
          maxIterations: Math.floor(Math.random() * (paramRanges.maxIterations.max - paramRanges.maxIterations.min) / paramRanges.maxIterations.step) * paramRanges.maxIterations.step + paramRanges.maxIterations.min,
          numLayers: Math.floor(Math.random() * (paramRanges.numLayers.max - paramRanges.numLayers.min + 1)) + paramRanges.numLayers.min,
          numQubits: Math.floor(Math.random() * (paramRanges.numQubits.max - paramRanges.numQubits.min + 1)) + paramRanges.numQubits.min,
          featureMap: featureMaps[Math.floor(Math.random() * featureMaps.length)],
          ansatz: ansatzTypes[Math.floor(Math.random() * ansatzTypes.length)],
          optimizer: optimizers[Math.floor(Math.random() * optimizers.length)]
        });
      }
    }

    return configs.slice(0, numConfigs);
  }, [paramRanges]);

  // Evaluate a single configuration
  const evaluateConfig = async (config: HyperparameterConfig, trainingData: { data: number[][]; labels: number[] }): Promise<TuningResult> => {
    const startTime = Date.now();

    try {
      // Create feature map
      let featureMap: FeatureMap;
      switch (config.featureMap) {
        case 'Z':
          featureMap = new ZFeatureMap(config.numQubits);
          break;
        case 'ZZ':
          featureMap = new ZZFeatureMap(config.numQubits);
          break;
        case 'Amplitude':
          featureMap = new AmplitudeEncoding(config.numQubits);
          break;
      }

      // Create VQC configuration
      const vqcConfig: VQCConfig = {
        featureMap,
        variationalLayer: new VariationalLayer(config.numQubits, config.numLayers, config.ansatz),
        measurementLayer: {
          name: 'Measurement Layer',
          description: 'Z measurement',
          numQubits: config.numQubits,
          numParameters: 0,
          buildCircuit: () => ({ numQubits: config.numQubits, gates: [] }),
          forward: (input: number[][]) => [input.map(row => row[0] || 0)]
        },
        optimizer: config.optimizer,
        learningRate: config.learningRate,
        maxIterations: config.maxIterations
      };

      // Initialize and train model
      const vqc = new VariationalQuantumClassifier(vqcConfig);
      const trainingSamples = trainingData.data.map((x, i) => ({ x, y: trainingData.labels[i] }));

      const result = vqc.train(trainingSamples, trainingData.labels);

      // Generate predictions
      const predictions = trainingData.data.map(sample => vqc.predict(sample)[0]);

      // Evaluate performance
      const metrics = evaluateClassification(predictions, trainingData.labels);

      const tuningResult: TuningResult = {
        config,
        accuracy: metrics.accuracy,
        precision: metrics.precision,
        recall: metrics.recall,
        f1Score: metrics.f1Score,
        trainingTime: Date.now() - startTime
      };

      return tuningResult;

    } catch (error) {
      console.error('Configuration evaluation failed:', error);
      // Return a result with zero performance
      return {
        config,
        accuracy: 0,
        precision: 0,
        recall: 0,
        f1Score: 0,
        trainingTime: Date.now() - startTime
      };
    }
  };

  // Run hyperparameter tuning
  const runTuning = async () => {
    if (isTuning) return;

    setIsTuning(true);
    setTuningProgress(0);
    setCurrentTrial(0);
    setResults([]);
    setBestResult(null);

    try {
      // Generate training data
      const dataset = generateClassificationDataset(datasetType, 100);

      // Generate hyperparameter configurations
      const configs = generateConfigs(tuningMethod, numTrials);
      setTotalTrials(configs.length);

      const tuningResults: TuningResult[] = [];
      let bestResult: TuningResult | null = null;

      for (let i = 0; i < configs.length; i++) {
        setCurrentTrial(i + 1);
        setTuningProgress(((i + 1) / configs.length) * 100);

        const result = await evaluateConfig(configs[i], dataset);
        tuningResults.push(result);

        // Update best result
        if (!bestResult || result.accuracy > bestResult.accuracy) {
          bestResult = result;
          setBestResult(bestResult);
        }

        // Allow UI updates
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      setResults(tuningResults);

      if (bestResult && onBestConfigFound) {
        onBestConfigFound(bestResult.config);
      }

      toast.success(`Hyperparameter tuning completed! Best accuracy: ${(bestResult?.accuracy ?? 0 * 100).toFixed(1)}%`);

    } catch (error) {
      console.error('Tuning failed:', error);
      toast.error('Hyperparameter tuning failed');
    } finally {
      setIsTuning(false);
    }
  };

  // Stop tuning
  const stopTuning = () => {
    setIsTuning(false);
    toast.info('Hyperparameter tuning stopped');
  };

  // Reset tuning
  const resetTuning = () => {
    setResults([]);
    setBestResult(null);
    setTuningProgress(0);
    setCurrentTrial(0);
    setIsTuning(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-6 h-6 text-primary" />
            Hyperparameter Tuning for Quantum ML
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Automatically optimize quantum machine learning model hyperparameters using grid search,
            random search, or Bayesian optimization to find the best configuration for your task.
          </p>
        </CardContent>
      </Card>

      <Tabs defaultValue="configuration" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="configuration" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Configuration
          </TabsTrigger>
          <TabsTrigger value="tuning" className="flex items-center gap-2">
            <Play className="w-4 h-4" />
            Tuning
          </TabsTrigger>
          <TabsTrigger value="results" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Results
          </TabsTrigger>
          <TabsTrigger value="analysis" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Analysis
          </TabsTrigger>
        </TabsList>

        {/* Configuration */}
        <TabsContent value="configuration" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Tuning Method */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="w-5 h-5" />
                  Tuning Method
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Search Strategy</label>
                  <Select value={tuningMethod} onValueChange={(value: any) => setTuningMethod(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="grid">Grid Search - Systematic exploration</SelectItem>
                      <SelectItem value="random">Random Search - Stochastic exploration</SelectItem>
                      <SelectItem value="bayesian">Bayesian Optimization - Smart exploration</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Dataset</label>
                  <Select value={datasetType} onValueChange={(value: any) => setDatasetType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="circles">Concentric Circles</SelectItem>
                      <SelectItem value="moons">Two Moons</SelectItem>
                      <SelectItem value="blobs">Gaussian Blobs</SelectItem>
                      <SelectItem value="xor">XOR Pattern</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Number of Trials: {numTrials}</label>
                  <Slider
                    value={[numTrials]}
                    onValueChange={(value) => setNumTrials(value[0])}
                    min={5}
                    max={50}
                    step={5}
                    className="w-full"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Parameter Ranges */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Grid3X3 className="w-5 h-5" />
                  Parameter Ranges
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Learning Rate: {paramRanges.learningRate.min} - {paramRanges.learningRate.max}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      value={paramRanges.learningRate.min}
                      onChange={(e) => setParamRanges(prev => ({
                        ...prev,
                        learningRate: { ...prev.learningRate, min: parseFloat(e.target.value) }
                      }))}
                      className="px-3 py-2 border rounded-lg text-sm"
                      step="0.001"
                    />
                    <input
                      type="number"
                      value={paramRanges.learningRate.max}
                      onChange={(e) => setParamRanges(prev => ({
                        ...prev,
                        learningRate: { ...prev.learningRate, max: parseFloat(e.target.value) }
                      }))}
                      className="px-3 py-2 border rounded-lg text-sm"
                      step="0.001"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Max Iterations: {paramRanges.maxIterations.min} - {paramRanges.maxIterations.max}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      value={paramRanges.maxIterations.min}
                      onChange={(e) => setParamRanges(prev => ({
                        ...prev,
                        maxIterations: { ...prev.maxIterations, min: parseInt(e.target.value) }
                      }))}
                      className="px-3 py-2 border rounded-lg text-sm"
                      step="10"
                    />
                    <input
                      type="number"
                      value={paramRanges.maxIterations.max}
                      onChange={(e) => setParamRanges(prev => ({
                        ...prev,
                        maxIterations: { ...prev.maxIterations, max: parseInt(e.target.value) }
                      }))}
                      className="px-3 py-2 border rounded-lg text-sm"
                      step="10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Layers: {paramRanges.numLayers.min} - {paramRanges.numLayers.max}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      value={paramRanges.numLayers.min}
                      onChange={(e) => setParamRanges(prev => ({
                        ...prev,
                        numLayers: { ...prev.numLayers, min: parseInt(e.target.value) }
                      }))}
                      className="px-3 py-2 border rounded-lg text-sm"
                      min="1"
                      max="10"
                    />
                    <input
                      type="number"
                      value={paramRanges.numLayers.max}
                      onChange={(e) => setParamRanges(prev => ({
                        ...prev,
                        numLayers: { ...prev.numLayers, max: parseInt(e.target.value) }
                      }))}
                      className="px-3 py-2 border rounded-lg text-sm"
                      min="1"
                      max="10"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tuning Execution */}
        <TabsContent value="tuning" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Tuning Execution
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                {!isTuning ? (
                  <Button onClick={runTuning} className="bg-green-600 hover:bg-green-700">
                    <Play className="w-4 h-4 mr-2" />
                    Start Tuning
                  </Button>
                ) : (
                  <Button onClick={stopTuning} variant="destructive">
                    <Pause className="w-4 h-4 mr-2" />
                    Stop Tuning
                  </Button>
                )}

                <Button onClick={resetTuning} variant="outline">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset
                </Button>
              </div>

              {isTuning && (
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{Math.round(tuningProgress)}%</span>
                  </div>
                  <Progress value={tuningProgress} />

                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">
                      Trial {currentTrial} of {totalTrials}
                    </p>
                  </div>
                </div>
              )}

              {bestResult && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Best Result So Far:</strong> {(bestResult.accuracy * 100).toFixed(1)}% accuracy
                    with {bestResult.config.numQubits} qubits, {bestResult.config.numLayers} layers
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Results */}
        <TabsContent value="results" className="space-y-6">
          {results.length > 0 ? (
            <div className="space-y-6">
              {/* Best Configuration */}
              {bestResult && (
                <Card className="border-green-500/20 bg-green-500/5">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300">
                      <CheckCircle className="w-5 h-5" />
                      Best Configuration Found
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Accuracy</p>
                        <p className="text-2xl font-bold text-green-600">
                          {(bestResult.accuracy * 100).toFixed(1)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">F1 Score</p>
                        <p className="text-lg font-semibold">
                          {(bestResult.f1Score * 100).toFixed(1)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Training Time</p>
                        <p className="text-lg font-semibold">
                          {(bestResult.trainingTime / 1000).toFixed(1)}s
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Configuration</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          <Badge variant="outline">{bestResult.config.numQubits}Q</Badge>
                          <Badge variant="outline">{bestResult.config.numLayers}L</Badge>
                          <Badge variant="outline">{bestResult.config.featureMap}</Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Results Table */}
              <Card>
                <CardHeader>
                  <CardTitle>All Trial Results</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Trial</th>
                          <th className="text-left p-2">Accuracy</th>
                          <th className="text-left p-2">F1 Score</th>
                          <th className="text-left p-2">Time (s)</th>
                          <th className="text-left p-2">Config</th>
                        </tr>
                      </thead>
                      <tbody>
                        {results
                          .sort((a, b) => b.accuracy - a.accuracy)
                          .map((result, index) => (
                          <tr key={index} className="border-b">
                            <td className="p-2">{index + 1}</td>
                            <td className="p-2 font-semibold">
                              {(result.accuracy * 100).toFixed(1)}%
                            </td>
                            <td className="p-2">
                              {(result.f1Score * 100).toFixed(1)}%
                            </td>
                            <td className="p-2">
                              {(result.trainingTime / 1000).toFixed(1)}
                            </td>
                            <td className="p-2">
                              <div className="flex flex-wrap gap-1">
                                <Badge variant="outline" className="text-xs">
                                  {result.config.numQubits}Q
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {result.config.numLayers}L
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {result.config.featureMap}
                                </Badge>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <BarChart3 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Results Yet</h3>
                <p className="text-muted-foreground">
                  Run hyperparameter tuning to see optimization results and find the best configuration.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Analysis */}
        <TabsContent value="analysis" className="space-y-6">
          {results.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Parameter Importance */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Parameter Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Accuracy vs Learning Rate</h4>
                      <div className="h-32 bg-muted/20 rounded-lg flex items-center justify-center">
                        <p className="text-sm text-muted-foreground">Parameter correlation plot</p>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Accuracy vs Number of Layers</h4>
                      <div className="h-32 bg-muted/20 rounded-lg flex items-center justify-center">
                        <p className="text-sm text-muted-foreground">Parameter correlation plot</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recommendations */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {bestResult && (
                      <Alert>
                        <CheckCircle className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Optimal Configuration:</strong> Use {bestResult.config.numQubits} qubits
                          with {bestResult.config.numLayers} layers and {bestResult.config.featureMap} feature mapping
                          for best performance on {datasetType} dataset.
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="space-y-2">
                      <h4 className="font-semibold">Key Insights</h4>
                      <ul className="text-sm space-y-1 text-muted-foreground">
                        <li>• Higher accuracy generally correlates with more qubits</li>
                        <li>• Feature map choice significantly impacts performance</li>
                        <li>• Optimal layer count varies by problem complexity</li>
                        <li>• Learning rate tuning is crucial for convergence</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <TrendingUp className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Analysis Available</h3>
                <p className="text-muted-foreground">
                  Run hyperparameter tuning first to generate analysis and recommendations.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default QuantumMLHyperparameterTuning;