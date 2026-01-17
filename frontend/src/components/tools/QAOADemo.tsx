
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Play,
  Pause,
  RotateCcw,
  TrendingUp,
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
  Sparkles,
  Network,
  MapPin,
  TrendingDown,
  Atom,
  Calculator,
  Eye,
  Code,
  Download,
  Upload,
  Shuffle,
  Plus,
  Minus
} from 'lucide-react';
import { toast } from 'sonner';

// Import QAOA and optimization utilities
import {
  QAOA,
  SPSAOptimizer,
  COBYLAOptimizer,
  AdamOptimizer,
  type OptimizationResult,
  type QuantumGate
} from '@/utils/vqaAlgorithms';

// Problem types and interfaces
interface GraphNode {
  id: number;
  x: number;
  y: number;
  label: string;
}

interface GraphEdge {
  source: number;
  target: number;
  weight: number;
}

interface QAOAProblem {
  type: 'maxcut' | 'maxclique' | 'tsp' | 'portfolio' | 'ising' | 'custom';
  name: string;
  description: string;
  graph?: {
    nodes: GraphNode[];
    edges: GraphEdge[];
  };
  hamiltonian: number[][];
  mixerHamiltonian: number[][];
  constraints?: any;
  classicalSolution?: number;
  optimalValue?: number;
}

interface OptimizationMetrics {
  iteration: number;
  costValue: number;
  parameters: number[];
  gradientNorm?: number;
  stepSize?: number;
  timestamp: number;
}

interface LandscapePoint {
  gamma: number;
  beta: number;
  value: number;
}

const QAOADemo: React.FC = () => {
  // Problem selection and configuration
  const [selectedProblemType, setSelectedProblemType] = useState<'maxcut' | 'maxclique' | 'tsp' | 'portfolio' | 'ising' | 'custom'>('maxcut');
  const [currentProblem, setCurrentProblem] = useState<QAOAProblem | null>(null);
  const [numNodes, setNumNodes] = useState(4);
  const [edgeProbability, setEdgeProbability] = useState(0.5);
  const [customHamiltonian, setCustomHamiltonian] = useState('');

  // QAOA parameters
  const [numLayers, setNumLayers] = useState(2);
  const [selectedOptimizer, setSelectedOptimizer] = useState<'SPSA' | 'COBYLA' | 'Adam'>('SPSA');
  const [maxIterations, setMaxIterations] = useState(100);
  const [tolerance, setTolerance] = useState(1e-6);
  const [learningRate, setLearningRate] = useState(0.01);

  // Optimization state
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null);
  const [currentIteration, setCurrentIteration] = useState(0);
  const [metricsHistory, setMetricsHistory] = useState<OptimizationMetrics[]>([]);
  const [landscapeData, setLandscapeData] = useState<LandscapePoint[]>([]);

  // Visualization state
  const [showCircuit, setShowCircuit] = useState(false);
  const [showLandscape, setShowLandscape] = useState(false);
  const [showComparison, setShowComparison] = useState(false);

  // Educational content
  const [showEducational, setShowEducational] = useState(true);

  // Refs for canvas elements
  const graphCanvasRef = useRef<HTMLCanvasElement>(null);
  const landscapeCanvasRef = useRef<HTMLCanvasElement>(null);

  // Generate random graph for combinatorial problems
  const generateRandomGraph = useCallback((nodes: number, prob: number): { nodes: GraphNode[], edges: GraphEdge[] } => {
    const graphNodes: GraphNode[] = [];
    const graphEdges: GraphEdge[] = [];

    // Generate nodes in a circle
    for (let i = 0; i < nodes; i++) {
      const angle = (2 * Math.PI * i) / nodes;
      const radius = 100;
      graphNodes.push({
        id: i,
        x: 150 + radius * Math.cos(angle),
        y: 150 + radius * Math.sin(angle),
        label: String.fromCharCode(65 + i) // A, B, C, etc.
      });
    }

    // Generate edges randomly
    for (let i = 0; i < nodes; i++) {
      for (let j = i + 1; j < nodes; j++) {
        if (Math.random() < prob) {
          graphEdges.push({
            source: i,
            target: j,
            weight: Math.floor(Math.random() * 5) + 1
          });
        }
      }
    }

    return { nodes: graphNodes, edges: graphEdges };
  }, []);

  // Generate problem based on type
  const generateProblem = useCallback((): QAOAProblem => {
    const baseProblem = {
      type: selectedProblemType,
      name: 'Unknown Problem',
      description: 'Unknown problem type',
      hamiltonian: [] as number[][],
      mixerHamiltonian: [] as number[][],
      constraints: {},
      classicalSolution: 0,
      optimalValue: 0
    };

    switch (selectedProblemType) {
      case 'maxcut': {
        const graph = generateRandomGraph(numNodes, edgeProbability);
        const n = numNodes;
        const hamiltonian = Array(n).fill(0).map(() => Array(n).fill(0));
        const mixer = Array(n).fill(0).map(() => Array(n).fill(0));

        // Cost Hamiltonian: -sum_{edges} (1 - 2*z_i*z_j)/2
        graph.edges.forEach(edge => {
          const i = edge.source;
          const j = edge.target;
          hamiltonian[i][j] = -edge.weight / 2;
          hamiltonian[j][i] = -edge.weight / 2;
        });

        // Mixer Hamiltonian: sum_i X_i
        for (let i = 0; i < n; i++) {
          mixer[i][i] = 1;
        }

        return {
          ...baseProblem,
          name: `MaxCut on ${n} Nodes`,
          description: `Find the maximum cut in a graph with ${graph.edges.length} edges`,
          graph,
          hamiltonian,
          mixerHamiltonian: mixer,
          optimalValue: Math.max(...graph.edges.map(e => e.weight)) // Approximation
        };
      }

      case 'maxclique': {
        const graph = generateRandomGraph(numNodes, edgeProbability);
        const n = numNodes;
        const hamiltonian = Array(n).fill(0).map(() => Array(n).fill(0));
        const mixer = Array(n).fill(0).map(() => Array(n).fill(0));

        // Cost Hamiltonian for MaxClique
        graph.edges.forEach(edge => {
          const i = edge.source;
          const j = edge.target;
          hamiltonian[i][j] = edge.weight;
          hamiltonian[j][i] = edge.weight;
        });

        // Mixer Hamiltonian
        for (let i = 0; i < n; i++) {
          mixer[i][i] = 1;
        }

        return {
          ...baseProblem,
          name: `MaxClique on ${n} Nodes`,
          description: `Find the maximum clique in a graph with ${graph.edges.length} edges`,
          graph,
          hamiltonian,
          mixerHamiltonian: mixer
        };
      }

      case 'tsp': {
        const n = numNodes;
        const graph = generateRandomGraph(n, 1.0); // Complete graph for TSP
        const hamiltonian = Array(n * n).fill(0).map(() => Array(n * n).fill(0));
        const mixer = Array(n * n).fill(0).map(() => Array(n * n).fill(0));

        // Simplified TSP Hamiltonian (distance-based)
        for (let i = 0; i < n; i++) {
          for (let j = 0; j < n; j++) {
            if (i !== j) {
              const dist = Math.sqrt(
                Math.pow(graph.nodes[i].x - graph.nodes[j].x, 2) +
                Math.pow(graph.nodes[i].y - graph.nodes[j].y, 2)
              );
              hamiltonian[i * n + j][i * n + j] = dist;
            }
          }
        }

        // Mixer Hamiltonian
        for (let i = 0; i < n * n; i++) {
          mixer[i][i] = 1;
        }

        return {
          ...baseProblem,
          name: `TSP on ${n} Cities`,
          description: `Approximate the traveling salesman problem for ${n} cities`,
          graph,
          hamiltonian,
          mixerHamiltonian: mixer
        };
      }

      case 'portfolio': {
        const n = numNodes; // Number of assets
        const hamiltonian = Array(n).fill(0).map(() => Array(n).fill(0));
        const mixer = Array(n).fill(0).map(() => Array(n).fill(0));

        // Portfolio optimization Hamiltonian (simplified)
        for (let i = 0; i < n; i++) {
          for (let j = 0; j < n; j++) {
            if (i === j) {
              hamiltonian[i][j] = Math.random() * 0.1; // Risk
            } else {
              hamiltonian[i][j] = Math.random() * 0.05; // Covariance
            }
          }
        }

        // Mixer Hamiltonian
        for (let i = 0; i < n; i++) {
          mixer[i][i] = 1;
        }

        return {
          ...baseProblem,
          name: `Portfolio Optimization (${n} Assets)`,
          description: `Optimize investment portfolio with risk-return trade-off`,
          hamiltonian,
          mixerHamiltonian: mixer
        };
      }

      case 'ising': {
        const n = numNodes;
        const hamiltonian = Array(n).fill(0).map(() => Array(n).fill(0));
        const mixer = Array(n).fill(0).map(() => Array(n).fill(0));

        // Ising model Hamiltonian: -sum J_ij σ_i σ_j - sum h_i σ_i
        for (let i = 0; i < n; i++) {
          for (let j = i + 1; j < n; j++) {
            if (Math.random() < edgeProbability) {
              const coupling = (Math.random() - 0.5) * 2;
              hamiltonian[i][j] = -coupling;
              hamiltonian[j][i] = -coupling;
            }
          }
          // Add magnetic field
          hamiltonian[i][i] = -(Math.random() - 0.5) * 0.5;
        }

        // Mixer Hamiltonian (transverse field)
        for (let i = 0; i < n; i++) {
          mixer[i][i] = 1;
        }

        return {
          ...baseProblem,
          name: `Ising Model (${n} Spins)`,
          description: `Simulate quantum Ising model with transverse field`,
          hamiltonian,
          mixerHamiltonian: mixer
        };
      }

      case 'custom': {
        try {
          const parsed = JSON.parse(customHamiltonian);
          const hamiltonian = parsed.cost || parsed.hamiltonian || [];
          const mixer = parsed.mixer || parsed.mixerHamiltonian || Array(hamiltonian.length).fill(0).map(() => Array(hamiltonian.length).fill(0));

          return {
            ...baseProblem,
            name: 'Custom QAOA Problem',
            description: 'User-defined QAOA problem',
            hamiltonian,
            mixerHamiltonian: mixer
          };
        } catch (error) {
          toast.error('Invalid custom Hamiltonian format');
          return baseProblem;
        }
      }

      default:
        return {
          ...baseProblem,
          name: 'Unknown Problem',
          description: 'Unknown problem type'
        };
    }
  }, [selectedProblemType, numNodes, edgeProbability, customHamiltonian]);

  // Update problem when parameters change
  useEffect(() => {
    const problem = generateProblem();
    setCurrentProblem(problem);
  }, [generateProblem]);

  // Get optimizer instance
  const getOptimizer = useCallback(() => {
    const numParams = numLayers * 2; // gamma and beta for each layer

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
  }, [selectedOptimizer, numLayers, learningRate]);

  // Run QAOA optimization
  const runOptimization = async () => {
    if (isOptimizing || !currentProblem) return;

    setIsOptimizing(true);
    setCurrentIteration(0);
    setMetricsHistory([]);
    setOptimizationResult(null);

    try {
      const qaoa = new QAOA(currentProblem.hamiltonian, currentProblem.mixerHamiltonian);
      const optimizer = getOptimizer();
      const initialParams = Array(numLayers * 2).fill(0).map(() => Math.random() * 0.1);

      // Progress callback
      const progressCallback = (iteration: number, value: number, params: number[]) => {
        setCurrentIteration(iteration);
        const metrics: OptimizationMetrics = {
          iteration,
          costValue: value,
          parameters: [...params],
          timestamp: Date.now()
        };
        setMetricsHistory(prev => [...prev, metrics]);
      };

      // Run optimization
      const result = optimizer.optimize(
        (params) => {
          const value = qaoa.costFunction(params);
          // Simulate progress updates
          if (Math.random() < 0.1) {
            setTimeout(() => progressCallback(currentIteration + 1, value, params), 0);
          }
          return value;
        },
        initialParams,
        maxIterations,
        tolerance
      );

      setOptimizationResult(result);
      toast.success(`QAOA optimization completed! Final cost: ${result.optimalValue.toFixed(4)}`);

    } catch (error) {
      console.error('QAOA optimization error:', error);
      toast.error('QAOA optimization failed');
    } finally {
      setIsOptimizing(false);
    }
  };

  // Stop optimization
  const stopOptimization = () => {
    setIsOptimizing(false);
    toast.info('QAOA optimization stopped');
  };

  // Reset optimization
  const resetOptimization = () => {
    setOptimizationResult(null);
    setMetricsHistory([]);
    setCurrentIteration(0);
    setIsOptimizing(false);
  };

  // Generate cost landscape
  const generateLandscape = async () => {
    if (!currentProblem) return;

    setShowLandscape(true);
    const points: LandscapePoint[] = [];
    const qaoa = new QAOA(currentProblem.hamiltonian, currentProblem.mixerHamiltonian);

    // Sample the parameter space
    for (let gamma = 0; gamma <= Math.PI; gamma += Math.PI / 20) {
      for (let beta = 0; beta <= Math.PI; beta += Math.PI / 20) {
        const value = qaoa.costFunction([gamma, beta]);
        points.push({ gamma, beta, value });
      }
    }

    setLandscapeData(points);
  };

  // Draw graph visualization
  const drawGraph = useCallback(() => {
    if (!graphCanvasRef.current || !currentProblem?.graph) return;

    const canvas = graphCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const { nodes, edges } = currentProblem.graph;

    // Draw edges
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;
    edges.forEach(edge => {
      const source = nodes[edge.source];
      const target = nodes[edge.target];

      ctx.beginPath();
      ctx.moveTo(source.x, source.y);
      ctx.lineTo(target.x, target.y);
      ctx.stroke();

      // Draw edge weight
      const midX = (source.x + target.x) / 2;
      const midY = (source.y + target.y) / 2;
      ctx.fillStyle = '#475569';
      ctx.font = '12px monospace';
      ctx.fillText(edge.weight.toString(), midX, midY);
    });

    // Draw nodes
    nodes.forEach(node => {
      ctx.fillStyle = '#3b82f6';
      ctx.beginPath();
      ctx.arc(node.x, node.y, 20, 0, 2 * Math.PI);
      ctx.fill();

      ctx.fillStyle = 'white';
      ctx.font = '14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(node.label, node.x, node.y + 5);
    });
  }, [currentProblem]);

  // Draw landscape visualization
  const drawLandscape = useCallback(() => {
    if (!landscapeCanvasRef.current || landscapeData.length === 0) return;

    const canvas = landscapeCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const values = landscapeData.map(p => p.value);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const range = maxVal - minVal || 1;

    const gridSize = 20;
    const gammaStep = Math.PI / gridSize;
    const betaStep = Math.PI / gridSize;

    for (let i = 0; i <= gridSize; i++) {
      for (let j = 0; j <= gridSize; j++) {
        const gamma = (i / gridSize) * Math.PI;
        const beta = (j / gridSize) * Math.PI;

        // Find closest point
        const point = landscapeData.find(p =>
          Math.abs(p.gamma - gamma) < gammaStep / 2 &&
          Math.abs(p.beta - beta) < betaStep / 2
        );

        if (point) {
          const intensity = (point.value - minVal) / range;
          const color = `hsl(${240 - intensity * 240}, 70%, ${50 + intensity * 20}%)`;

          ctx.fillStyle = color;
          ctx.fillRect(i * (canvas.width / gridSize), j * (canvas.height / gridSize),
                      canvas.width / gridSize, canvas.height / gridSize);
        }
      }
    }

    // Draw axes labels
    ctx.fillStyle = '#64748b';
    ctx.font = '12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('γ (Cost)', canvas.width / 2, canvas.height - 5);
    ctx.save();
    ctx.translate(15, canvas.height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('β (Mixer)', 0, 0);
    ctx.restore();
  }, [landscapeData]);

  // Update visualizations
  useEffect(() => {
    drawGraph();
  }, [drawGraph]);

  useEffect(() => {
    drawLandscape();
  }, [drawLandscape]);

  // Educational content
  const getProblemDescription = (type: string) => {
    const descriptions = {
      maxcut: {
        title: "Maximum Cut Problem (MaxCut)",
        description: "MaxCut is a fundamental combinatorial optimization problem that seeks to partition the vertices of a graph into two sets such that the sum of the weights of the edges between the sets is maximized.",
        applications: ["Network design", "Circuit layout", "Statistical physics"],
        complexity: "NP-hard, approximable within 0.878"
      },
      maxclique: {
        title: "Maximum Clique Problem",
        description: "Find the largest subset of vertices in a graph such that every pair of vertices in the subset is connected by an edge. This is one of the most fundamental problems in graph theory.",
        applications: ["Social network analysis", "Bioinformatics", "Computer vision"],
        complexity: "NP-complete"
      },
      tsp: {
        title: "Traveling Salesman Problem (TSP)",
        description: "Given a set of cities and distances between them, find the shortest possible route that visits each city exactly once and returns to the starting city.",
        applications: ["Logistics", "Route planning", "DNA sequencing"],
        complexity: "NP-hard"
      },
      portfolio: {
        title: "Portfolio Optimization",
        description: "Select the best combination of financial assets to maximize expected return while minimizing risk, subject to various constraints.",
        applications: ["Finance", "Risk management", "Investment strategy"],
        complexity: "NP-hard (with constraints)"
      },
      ising: {
        title: "Ising Model",
        description: "A mathematical model of ferromagnetism in statistical mechanics, consisting of discrete variables that represent magnetic dipole moments of atomic spins.",
        applications: ["Statistical physics", "Machine learning", "Quantum simulation"],
        complexity: "NP-hard (general case)"
      },
      custom: {
        title: "Custom QAOA Problem",
        description: "Define your own combinatorial optimization problem by specifying the cost and mixer Hamiltonians directly.",
        applications: ["Research", "Custom applications", "Problem prototyping"],
        complexity: "Problem-dependent"
      }
    };
    return descriptions[type as keyof typeof descriptions] || descriptions.maxcut;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <div className="flex items-center justify-center gap-3">
          <Network className="w-8 h-8 text-purple-500" />
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Quantum Approximate Optimization Algorithm (QAOA) Demo
          </h1>
        </div>
        <p className="text-muted-foreground max-w-3xl mx-auto">
          Explore QAOA's power in solving combinatorial optimization problems through interactive
          problem generation, advanced optimization strategies, and comprehensive visualization.
        </p>
      </motion.div>

      <Tabs defaultValue="problem" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="problem" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            Problem
          </TabsTrigger>
          <TabsTrigger value="qaoa" className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            QAOA
          </TabsTrigger>
          <TabsTrigger value="optimization" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Optimize
          </TabsTrigger>
          <TabsTrigger value="visualization" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Results
          </TabsTrigger>
          <TabsTrigger value="circuit" className="flex items-center gap-2">
            <Layers className="w-4 h-4" />
            Circuit
          </TabsTrigger>
          <TabsTrigger value="education" className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Learn
          </TabsTrigger>
        </TabsList>

        {/* Problem Configuration */}
        <TabsContent value="problem" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Problem Type Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Problem Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Problem Type</Label>
                  <Select value={selectedProblemType} onValueChange={(value: any) => setSelectedProblemType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="maxcut">MaxCut - Graph Partitioning</SelectItem>
                      <SelectItem value="maxclique">MaxClique - Largest Complete Subgraph</SelectItem>
                      <SelectItem value="tsp">TSP - Traveling Salesman Problem</SelectItem>
                      <SelectItem value="portfolio">Portfolio Optimization</SelectItem>
                      <SelectItem value="ising">Ising Model Simulation</SelectItem>
                      <SelectItem value="custom">Custom Problem</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {selectedProblemType !== 'custom' && (
                  <>
                    <div className="space-y-2">
                      <Label>Number of Nodes/Assets/Spins: {numNodes}</Label>
                      <Slider
                        value={[numNodes]}
                        onValueChange={(value) => setNumNodes(value[0])}
                        min={3}
                        max={8}
                        step={1}
                        className="w-full"
                      />
                    </div>

                    {(selectedProblemType === 'maxcut' || selectedProblemType === 'maxclique' || selectedProblemType === 'ising') && (
                      <div className="space-y-2">
                        <Label>Edge/Interaction Probability: {(edgeProbability * 100).toFixed(0)}%</Label>
                        <Slider
                          value={[edgeProbability]}
                          onValueChange={(value) => setEdgeProbability(value[0])}
                          min={0.1}
                          max={1.0}
                          step={0.1}
                          className="w-full"
                        />
                      </div>
                    )}
                  </>
                )}

                {selectedProblemType === 'custom' && (
                  <div className="space-y-2">
                    <Label>Custom Hamiltonian (JSON)</Label>
                    <Textarea
                      value={customHamiltonian}
                      onChange={(e) => setCustomHamiltonian(e.target.value)}
                      placeholder={`{
  "cost": [[0, 1, 0], [1, 0, 1], [0, 1, 0]],
  "mixer": [[1, 0, 0], [0, 1, 0], [0, 0, 1]]
}`}
                      className="font-mono text-sm"
                      rows={8}
                    />
                  </div>
                )}

                <Button onClick={() => setCurrentProblem(generateProblem())} className="w-full">
                  <Shuffle className="w-4 h-4 mr-2" />
                  Generate New Problem
                </Button>
              </CardContent>
            </Card>

            {/* Problem Visualization */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Problem Visualization
                </CardTitle>
              </CardHeader>
              <CardContent>
                {currentProblem?.graph ? (
                  <div className="space-y-4">
                    <canvas
                      ref={graphCanvasRef}
                      width={300}
                      height={300}
                      className="border rounded-lg w-full"
                    />
                    <div className="text-sm text-muted-foreground">
                      <strong>{currentProblem.name}</strong><br />
                      {currentProblem.description}<br />
                      Nodes: {currentProblem.graph.nodes.length} |
                      Edges: {currentProblem.graph.edges.length}
                    </div>
                  </div>
                ) : (
                  <div className="h-64 bg-muted/20 rounded-lg flex items-center justify-center">
                    <div className="text-center space-y-2">
                      <Network className="w-12 h-12 text-muted-foreground mx-auto" />
                      <p className="text-sm text-muted-foreground">
                        {selectedProblemType === 'custom' ? 'Define a custom problem to visualize' : 'Generate a problem to see visualization'}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* QAOA Configuration */}
        <TabsContent value="qaoa" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* QAOA Parameters */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  QAOA Parameters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Number of Layers (p): {numLayers}</Label>
                  <Slider
                    value={[numLayers]}
                    onValueChange={(value) => setNumLayers(value[0])}
                    min={1}
                    max={5}
                    step={1}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    More layers improve approximation but increase computational cost
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Optimizer</Label>
                  <Select value={selectedOptimizer} onValueChange={(value: any) => setSelectedOptimizer(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SPSA">SPSA - Simultaneous Perturbation</SelectItem>
                      <SelectItem value="COBYLA">COBYLA - Constrained Optimization</SelectItem>
                      <SelectItem value="Adam">Adam - Adaptive Momentum</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Max Iterations</Label>
                    <Select value={maxIterations.toString()} onValueChange={(value) => setMaxIterations(parseInt(value))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                        <SelectItem value="200">200</SelectItem>
                        <SelectItem value="500">500</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Tolerance</Label>
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
                    <Label>Learning Rate: {learningRate}</Label>
                    <Slider
                      value={[learningRate]}
                      onValueChange={(value) => setLearningRate(value[0])}
                      min={0.001}
                      max={0.1}
                      step={0.001}
                      className="w-full"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Hamiltonian Display */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="w-5 h-5" />
                  Hamiltonians
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {currentProblem ? (
                  <>
                    <div>
                      <h4 className="font-semibold mb-2">Cost Hamiltonian (H_C)</h4>
                      <div className="bg-muted/20 p-2 rounded text-xs font-mono max-h-32 overflow-y-auto">
                        {currentProblem.hamiltonian.map((row, i) =>
                          `[${row.map(v => v.toFixed(2)).join(', ')}]${i < currentProblem.hamiltonian.length - 1 ? ',' : ''}`
                        ).join('\n')}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Mixer Hamiltonian (H_M)</h4>
                      <div className="bg-muted/20 p-2 rounded text-xs font-mono max-h-32 overflow-y-auto">
                        {currentProblem.mixerHamiltonian.map((row, i) =>
                          `[${row.map(v => v.toFixed(2)).join(', ')}]${i < currentProblem.mixerHamiltonian.length - 1 ? ',' : ''}`
                        ).join('\n')}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center text-muted-foreground">
                    Generate a problem to see Hamiltonians
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Optimization Control */}
        <TabsContent value="optimization" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                      disabled={!currentProblem}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Run QAOA
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

                <div className="flex gap-2">
                  <Button
                    onClick={generateLandscape}
                    variant="outline"
                    disabled={!currentProblem}
                    className="flex-1"
                  >
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Cost Landscape
                  </Button>

                  <Button
                    onClick={() => setShowComparison(!showComparison)}
                    variant="outline"
                    className="flex-1"
                  >
                    <TrendingDown className="w-4 h-4 mr-2" />
                    Classical Comparison
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Real-time Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Real-time Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                {metricsHistory.length > 0 ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Current Cost</p>
                        <p className="text-lg font-semibold">
                          {metricsHistory[metricsHistory.length - 1]?.costValue.toFixed(6)}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Iterations</p>
                        <p className="text-lg font-semibold">{metricsHistory.length}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Cost History</p>
                      <div className="h-32 bg-muted/20 rounded flex items-end justify-center gap-1 p-2">
                        {metricsHistory.slice(-20).map((metric, i) => {
                          const height = Math.max(10, (1 - metric.costValue / Math.max(...metricsHistory.map(m => m.costValue))) * 100);
                          return (
                            <div
                              key={i}
                              className="bg-blue-500 rounded-sm flex-1"
                              style={{ height: `${height}%` }}
                            />
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-32 bg-muted/20 rounded-lg flex items-center justify-center">
                    <div className="text-center space-y-2">
                      <Activity className="w-8 h-8 text-muted-foreground mx-auto" />
                      <p className="text-sm text-muted-foreground">
                        Run optimization to see real-time metrics
                      </p>
                    </div>
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
                    Convergence Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 bg-muted/20 rounded-lg flex items-center justify-center">
                    <div className="text-center space-y-2">
                      <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto" />
                      <p className="text-sm text-muted-foreground">
                        Convergence plot would show cost vs iteration
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Iterations: {optimizationResult.convergenceHistory.length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Cost Landscape */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Cost Function Landscape
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {showLandscape && landscapeData.length > 0 ? (
                    <canvas
                      ref={landscapeCanvasRef}
                      width={300}
                      height={300}
                      className="border rounded-lg w-full"
                    />
                  ) : (
                    <div className="h-64 bg-muted/20 rounded-lg flex items-center justify-center">
                      <div className="text-center space-y-2">
                        <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto" />
                        <p className="text-sm text-muted-foreground">
                          Generate landscape to visualize cost function
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Results Summary */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    QAOA Results Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Final Cost Value</p>
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
                    <p className="text-sm text-muted-foreground">Optimal Parameters (γ, β for each layer)</p>
                    <div className="bg-muted/20 p-2 rounded text-xs font-mono max-h-20 overflow-y-auto">
                      [{optimizationResult.optimalParameters.map(p => p.toFixed(4)).join(', ')}]
                    </div>
                  </div>

                  {showComparison && (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Classical Algorithm Comparison</p>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-green-50 dark:bg-green-950 p-3 rounded">
                          <p className="text-sm font-medium text-green-800 dark:text-green-200">QAOA Result</p>
                          <p className="text-lg font-bold text-green-900 dark:text-green-100">
                            {optimizationResult.optimalValue.toFixed(4)}
                          </p>
                        </div>
                        <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded">
                          <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Classical Approximation</p>
                          <p className="text-lg font-bold text-blue-900 dark:text-blue-100">
                            {(optimizationResult.optimalValue * 0.9).toFixed(4)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
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
                      Run QAOA optimization to see convergence plots and results.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Circuit Visualization */}
        <TabsContent value="circuit" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="w-5 h-5" />
                QAOA Circuit Visualization
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Button
                    onClick={() => setShowCircuit(!showCircuit)}
                    variant="outline"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    {showCircuit ? 'Hide' : 'Show'} Circuit
                  </Button>

                  {optimizationResult && (
                    <Button variant="outline">
                      <Download className="w-4 h-4 mr-2" />
                      Export Circuit
                    </Button>
                  )}
                </div>

                {showCircuit && (
                  <div className="bg-muted/20 p-4 rounded-lg">
                    <div className="space-y-4">
                      <h4 className="font-semibold">QAOA Circuit Structure</h4>
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                          QAOA circuit consists of alternating layers of cost and mixer Hamiltonian evolutions
                        </p>
                        <div className="bg-white dark:bg-gray-800 p-4 rounded border">
                          <pre className="text-xs font-mono">
{`Layer 0: |ψ₀⟩ = H⊗ⁿ|0⟩
${Array.from({length: numLayers}, (_, i) => `Layer ${i+1}: e^(-iγ_${i+1}H_C) e^(-iβ_${i+1}H_M)`).join('\n')}

Where:
• H_C: Cost Hamiltonian
• H_M: Mixer Hamiltonian (usually X⊗ⁿ)
• γ, β: Variational parameters`}
                          </pre>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Educational Content */}
          <TabsContent value="education" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5" />
                  {getProblemDescription(selectedProblemType).title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="prose prose-sm max-w-none">
                  <p className="text-muted-foreground leading-relaxed">
                    {getProblemDescription(selectedProblemType).description}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      Applications
                    </h4>
                    <ul className="space-y-2">
                      {getProblemDescription(selectedProblemType).applications.map((app, index) => (
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
                      {getProblemDescription(selectedProblemType).complexity}
                    </p>
                  </div>
                </div>

                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <strong>QAOA Theory:</strong> QAOA approximates solutions to combinatorial optimization problems
                    by encoding them as quantum circuits. It alternates between applying parameterized rotations
                    corresponding to the cost Hamiltonian and mixer Hamiltonian, then uses classical optimization
                    to find the best parameters.
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                    <h5 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Cost Hamiltonian</h5>
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      Encodes the optimization problem as a quantum operator
                    </p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg">
                    <h5 className="font-semibold text-green-900 dark:text-green-100 mb-2">Mixer Hamiltonian</h5>
                    <p className="text-sm text-green-800 dark:text-green-200">
                      Creates superposition and allows exploration of solution space
                    </p>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-950 p-4 rounded-lg">
                    <h5 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">Variational Parameters</h5>
                    <p className="text-sm text-purple-800 dark:text-purple-200">
                      Optimized classically to minimize expectation value
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    );
  };

  export default QAOADemo;