import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Play,
  Pause,
  RotateCcw,
  TrendingUp,
  Brain,
  Target,
  Zap,
  BarChart3,
  Settings,
  Info,
  CheckCircle,
  AlertCircle,
  Activity,
  Layers,
  Cpu,
  BookOpen,
  Lightbulb,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';

// Import VQA algorithms and optimizers
import {
  VQE,
  QAOA,
  VQC,
  QNN,
  SPSAOptimizer,
  COBYLAOptimizer,
  AdamOptimizer,
  VQA_PROBLEMS,
  generateSampleData,
  type OptimizationResult,
  type VQAProblem
} from '@/utils/vqaAlgorithms';

interface VQAPlaygroundProps {
  onCircuitLoad?: (circuit: any) => void;
}

const VQAPlayground: React.FC<VQAPlaygroundProps> = ({ onCircuitLoad }) => {
  // Algorithm selection
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<'VQE' | 'QAOA' | 'VQC' | 'QNN'>('VQE');
  const [selectedProblem, setSelectedProblem] = useState<string>('h2_molecule');
  const [selectedOptimizer, setSelectedOptimizer] = useState<'SPSA' | 'COBYLA' | 'Adam'>('SPSA');

  // Optimization parameters
  const [maxIterations, setMaxIterations] = useState(50);
  const [tolerance, setTolerance] = useState(1e-6);
  const [learningRate, setLearningRate] = useState(0.01);

  // Optimization state
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null);
  const [currentIteration, setCurrentIteration] = useState(0);
  const [progressHistory, setProgressHistory] = useState<{ iteration: number; value: number }[]>([]);

  // Circuit parameters
  const [numQubits, setNumQubits] = useState(2);
  const [numLayers, setNumLayers] = useState(2);

  // Educational content
  const [showEducational, setShowEducational] = useState(true);

  // Initialize optimizer based on selection
  const getOptimizer = useCallback(() => {
    const initialParams = new Array(numQubits * numLayers).fill(0).map(() => Math.random() * 0.1);

    switch (selectedOptimizer) {
      case 'SPSA':
        return new SPSAOptimizer();
      case 'COBYLA':
        return new COBYLAOptimizer();
      case 'Adam':
        return new AdamOptimizer(learningRate);
      default:
        return new SPSAOptimizer();
    }
  }, [selectedOptimizer, numQubits, numLayers, learningRate]);

  // Initialize VQA algorithm
  const getVQAAlgorithm = useCallback(() => {
    const problem = VQA_PROBLEMS[selectedProblem as keyof typeof VQA_PROBLEMS];

    switch (selectedAlgorithm) {
      case 'VQE':
        return new VQE(problem.hamiltonian);
      case 'QAOA':
        return new QAOA(problem.hamiltonian, problem.hamiltonian); // Simplified mixer
      case 'VQC':
        const classificationData = generateSampleData('classification', 100);
        return new VQC(classificationData, 2);
      case 'QNN':
        const regressionData = generateSampleData('regression', 100);
        return new QNN(regressionData);
      default:
        return new VQE(problem.hamiltonian);
    }
  }, [selectedAlgorithm, selectedProblem]);

  // Run optimization
  const runOptimization = async () => {
    if (isOptimizing) return;

    setIsOptimizing(true);
    setCurrentIteration(0);
    setProgressHistory([]);
    setOptimizationResult(null);

    try {
      const optimizer = getOptimizer();
      const algorithm = getVQAAlgorithm();

      // Initialize parameters
      const initialParams = new Array(numQubits * numLayers).fill(0).map(() => Math.random() * 0.1);

      // Create progress tracking wrapper
      const progressCallback = (iteration: number, value: number, params: number[]) => {
        setCurrentIteration(iteration);
        setProgressHistory(prev => [...prev, { iteration, value }]);
      };

      // Run optimization with progress tracking
      const result = optimizer.optimize(
        (params) => {
          const value = algorithm.costFunction(params);
          // Simulate progress callback
          if (Math.random() < 0.1) { // Update progress occasionally
            setTimeout(() => progressCallback(currentIteration + 1, value, params), 0);
          }
          return value;
        },
        initialParams,
        maxIterations,
        tolerance
      );

      setOptimizationResult(result);
      toast.success(`Optimization completed! Final value: ${result.optimalValue.toFixed(4)}`);

    } catch (error) {
      console.error('Optimization error:', error);
      toast.error('Optimization failed');
    } finally {
      setIsOptimizing(false);
    }
  };

  // Stop optimization
  const stopOptimization = () => {
    setIsOptimizing(false);
    toast.info('Optimization stopped');
  };

  // Reset optimization
  const resetOptimization = () => {
    setOptimizationResult(null);
    setProgressHistory([]);
    setCurrentIteration(0);
    setIsOptimizing(false);
  };

  // Load circuit to main workspace
  const loadCircuit = () => {
    if (!optimizationResult) return;

    // Create a simple circuit representation
    const circuit = {
      numQubits,
      gates: [
        // Add some basic gates based on the algorithm
        { name: 'H', qubits: [0] },
        { name: 'CNOT', qubits: [0, 1] },
        // Add parameterized gates
        ...optimizationResult.optimalParameters.slice(0, 4).map((param, i) => ({
          name: 'RY',
          qubits: [i % numQubits],
          parameters: [param]
        }))
      ]
    };

    if (onCircuitLoad) {
      onCircuitLoad(circuit);
      toast.success('Circuit loaded to workspace');
    }
  };

  // Educational content
  const getAlgorithmDescription = (algorithm: string) => {
    const descriptions = {
      VQE: {
        title: "Variational Quantum Eigensolver (VQE)",
        description: "VQE is a hybrid quantum-classical algorithm used to find the ground state energy of molecular systems. It uses a parameterized quantum circuit (ansatz) to prepare trial wavefunctions and a classical optimizer to minimize the expectation value of the Hamiltonian.",
        applications: ["Quantum chemistry", "Material science", "Drug discovery"],
        complexity: "O(n²) for n qubits"
      },
      QAOA: {
        title: "Quantum Approximate Optimization Algorithm (QAOA)",
        description: "QAOA is designed to solve combinatorial optimization problems by encoding them into quantum circuits. It alternates between applying cost Hamiltonian and mixer Hamiltonian layers to find approximate solutions to NP-hard problems.",
        applications: ["MaxCut problem", "Graph partitioning", "Traveling salesman"],
        complexity: "O(p * n) for p layers and n qubits"
      },
      VQC: {
        title: "Variational Quantum Classifier (VQC)",
        description: "VQC uses parameterized quantum circuits as machine learning models for classification tasks. The quantum circuit encodes input data and produces measurements that serve as classification predictions.",
        applications: ["Pattern recognition", "Medical diagnosis", "Financial modeling"],
        complexity: "O(n * d) for n features and d circuit depth"
      },
      QNN: {
        title: "Quantum Neural Network (QNN)",
        description: "QNNs are quantum analogs of classical neural networks, using parameterized quantum circuits to learn complex patterns and relationships in data for regression and classification tasks.",
        applications: ["Function approximation", "Time series prediction", "Image recognition"],
        complexity: "O(n²) for n parameters"
      }
    };
    return descriptions[algorithm as keyof typeof descriptions] || descriptions.VQE;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <div className="flex items-center justify-center gap-3">
          <Brain className="w-8 h-8 text-purple-500" />
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Variational Quantum Algorithms Playground
          </h1>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Explore hybrid quantum-classical algorithms that combine parameterized quantum circuits
          with classical optimization to solve complex computational problems.
        </p>
      </motion.div>

      <Tabs defaultValue="algorithm" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="algorithm" className="flex items-center gap-2">
            <Brain className="w-4 h-4" />
            Algorithm
          </TabsTrigger>
          <TabsTrigger value="optimization" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Optimization
          </TabsTrigger>
          <TabsTrigger value="visualization" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Results
          </TabsTrigger>
          <TabsTrigger value="education" className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Learn
          </TabsTrigger>
        </TabsList>

        {/* Algorithm Selection */}
        <TabsContent value="algorithm" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Algorithm Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Algorithm Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Algorithm</label>
                  <Select value={selectedAlgorithm} onValueChange={(value: any) => setSelectedAlgorithm(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="VQE">VQE - Variational Quantum Eigensolver</SelectItem>
                      <SelectItem value="QAOA">QAOA - Quantum Approximate Optimization</SelectItem>
                      <SelectItem value="VQC">VQC - Variational Quantum Classifier</SelectItem>
                      <SelectItem value="QNN">QNN - Quantum Neural Network</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Problem Instance</label>
                  <Select value={selectedProblem} onValueChange={setSelectedProblem}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(VQA_PROBLEMS).map(([key, problem]) => (
                        <SelectItem key={key} value={key}>
                          {problem.name} - {problem.type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Qubits</label>
                    <Select value={numQubits.toString()} onValueChange={(value) => setNumQubits(parseInt(value))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2">2</SelectItem>
                        <SelectItem value="3">3</SelectItem>
                        <SelectItem value="4">4</SelectItem>
                        <SelectItem value="5">5</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Layers</label>
                    <Select value={numLayers.toString()} onValueChange={(value) => setNumLayers(parseInt(value))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1</SelectItem>
                        <SelectItem value="2">2</SelectItem>
                        <SelectItem value="3">3</SelectItem>
                        <SelectItem value="4">4</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Problem Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Problem Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const problem = VQA_PROBLEMS[selectedProblem as keyof typeof VQA_PROBLEMS];
                  return (
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-semibold text-lg">{problem.name}</h3>
                        <p className="text-sm text-muted-foreground">{problem.description}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{problem.type}</Badge>
                        {problem.targetEnergy && (
                          <Badge variant="secondary">
                            Target: {problem.targetEnergy.toFixed(4)} Hartree
                          </Badge>
                        )}
                      </div>

                      <div className="text-xs text-muted-foreground">
                        <strong>Hamiltonian size:</strong> {problem.hamiltonian.length}×{problem.hamiltonian.length}
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Optimization Configuration */}
        <TabsContent value="optimization" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Optimizer Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Classical Optimizer
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Optimizer</label>
                  <Select value={selectedOptimizer} onValueChange={(value: any) => setSelectedOptimizer(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SPSA">SPSA - Simultaneous Perturbation Stochastic Approximation</SelectItem>
                      <SelectItem value="COBYLA">COBYLA - Constrained Optimization BY Linear Approximation</SelectItem>
                      <SelectItem value="Adam">Adam - Adaptive Moment Estimation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Max Iterations</label>
                    <Select value={maxIterations.toString()} onValueChange={(value) => setMaxIterations(parseInt(value))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="25">25</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                        <SelectItem value="200">200</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Tolerance</label>
                    <Select value={tolerance.toString()} onValueChange={(value) => setTolerance(parseFloat(value))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1e-3">1e-3</SelectItem>
                        <SelectItem value="1e-6">1e-6</SelectItem>
                        <SelectItem value="1e-9">1e-9</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {selectedOptimizer === 'Adam' && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Learning Rate</label>
                    <Select value={learningRate.toString()} onValueChange={(value) => setLearningRate(parseFloat(value))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0.001">0.001</SelectItem>
                        <SelectItem value="0.01">0.01</SelectItem>
                        <SelectItem value="0.1">0.1</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Control Panel */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Optimization Control
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  {!isOptimizing ? (
                    <Button
                      onClick={runOptimization}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      disabled={isOptimizing}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Start Optimization
                    </Button>
                  ) : (
                    <Button
                      onClick={stopOptimization}
                      variant="destructive"
                      className="flex-1"
                    >
                      <Pause className="w-4 h-4 mr-2" />
                      Stop
                    </Button>
                  )}

                  <Button
                    onClick={resetOptimization}
                    variant="outline"
                    disabled={isOptimizing}
                  >
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                </div>

                {isOptimizing && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Iteration</span>
                      <span>{currentIteration} / {maxIterations}</span>
                    </div>
                    <Progress value={(currentIteration / maxIterations) * 100} />
                  </div>
                )}

                {optimizationResult && (
                  <div className="space-y-2">
                    <Button
                      onClick={loadCircuit}
                      variant="outline"
                      className="w-full"
                    >
                      <Layers className="w-4 h-4 mr-2" />
                      Load Circuit to Workspace
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Results Visualization */}
        <TabsContent value="visualization" className="space-y-6">
          {optimizationResult ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Convergence Plot */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Optimization Convergence
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 bg-muted/20 rounded-lg flex items-center justify-center">
                    <div className="text-center space-y-2">
                      <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto" />
                      <p className="text-sm text-muted-foreground">
                        Convergence plot would be displayed here
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Iterations: {optimizationResult.convergenceHistory.length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Results Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    Optimization Results
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Final Value</p>
                      <p className="text-lg font-semibold">{optimizationResult.optimalValue.toFixed(6)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Iterations</p>
                      <p className="text-lg font-semibold">{optimizationResult.convergenceHistory.length}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Execution Time</p>
                      <p className="text-lg font-semibold">{(optimizationResult.executionTime / 1000).toFixed(2)}s</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Optimizer</p>
                      <p className="text-lg font-semibold">{optimizationResult.optimizerUsed}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Optimal Parameters</p>
                    <div className="bg-muted/20 p-2 rounded text-xs font-mono max-h-20 overflow-y-auto">
                      [{optimizationResult.optimalParameters.map(p => p.toFixed(4)).join(', ')}]
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="py-12">
                <div className="text-center space-y-4">
                  <BarChart3 className="w-16 h-16 text-muted-foreground mx-auto" />
                  <div>
                    <h3 className="text-lg font-semibold">No Results Yet</h3>
                    <p className="text-muted-foreground">
                      Run an optimization to see convergence plots and results.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Educational Content */}
        <TabsContent value="education" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5" />
                {getAlgorithmDescription(selectedAlgorithm).title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="prose prose-sm max-w-none">
                <p className="text-muted-foreground leading-relaxed">
                  {getAlgorithmDescription(selectedAlgorithm).description}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Applications
                  </h4>
                  <ul className="space-y-2">
                    {getAlgorithmDescription(selectedAlgorithm).applications.map((app, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                        {app}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Cpu className="w-4 h-4" />
                    Complexity
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {getAlgorithmDescription(selectedAlgorithm).complexity}
                  </p>
                </div>
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>How it works:</strong> VQA algorithms combine quantum circuits with classical optimization.
                  The quantum circuit (ansatz) is parameterized, and classical optimizers adjust these parameters
                  to minimize a cost function that encodes the problem of interest.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default VQAPlayground;