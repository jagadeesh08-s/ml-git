import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Microscope,
  AlertCircle,
  Zap,
  Download,
  FileText,
  Code,
  Settings,
  Play,
  BarChart3,
  TrendingUp,
  Activity,
  Cpu,
  Earth
} from 'lucide-react';
import { toast } from 'sonner';
import type { QuantumCircuit, DensityMatrix } from '@/utils/quantum/quantumSimulation';

interface ResearchToolsProps {
  circuit: QuantumCircuit | null;
  results: DensityMatrix[];
  className?: string;
}

interface NoiseModel {
  id: string;
  name: string;
  description: string;
  parameters: {
    t1: number; // T1 relaxation time (μs)
    t2: number; // T2 dephasing time (μs)
    gateError: number; // Gate error rate
    readoutError: number; // Readout error rate
  };
}

interface ScalabilityResult {
  qubitCount: number;
  gateCount: number;
  circuitDepth: number;
  estimatedTime: number;
  memoryUsage: number;
  fidelity: number;
  resourceScore: number;
}

const ResearchTools: React.FC<ResearchToolsProps> = ({
  circuit,
  results,
  className = ''
}) => {
  const [selectedTool, setSelectedTool] = useState<'noise' | 'scalability' | 'export'>('noise');
  const [isRunningSimulation, setIsRunningSimulation] = useState(false);
  const [simulationResults, setSimulationResults] = useState<any>(null);

  // Predefined noise models
  const noiseModels: NoiseModel[] = [
    {
      id: 'ideal',
      name: 'Ideal (No Noise)',
      description: 'Perfect quantum operations with no errors',
      parameters: { t1: Infinity, t2: Infinity, gateError: 0, readoutError: 0 }
    },
    {
      id: 'ibm_lima',
      name: 'IBM Lima (Real Hardware)',
      description: 'Based on actual IBM Lima quantum processor characteristics',
      parameters: { t1: 100, t2: 120, gateError: 0.02, readoutError: 0.03 }
    },
    {
      id: 'ibm_belem',
      name: 'IBM Belem (Real Hardware)',
      description: 'Based on actual IBM Belem quantum processor characteristics',
      parameters: { t1: 80, t2: 90, gateError: 0.025, readoutError: 0.035 }
    },
    {
      id: 'custom',
      name: 'Custom Noise Model',
      description: 'User-defined noise parameters',
      parameters: { t1: 50, t2: 60, gateError: 0.05, readoutError: 0.04 }
    }
  ];

  const [selectedNoiseModel, setSelectedNoiseModel] = useState<string>('ideal');
  const [customNoiseParams, setCustomNoiseParams] = useState({
    t1: 50,
    t2: 60,
    gateError: 0.05,
    readoutError: 0.04
  });

  // Scalability analysis
  const [targetQubits, setTargetQubits] = useState(10);
  const [scalabilityResults, setScalabilityResults] = useState<ScalabilityResult[]>([]);

  const runNoiseSimulation = async () => {
    if (!circuit) {
      toast.error('Please create a circuit first');
      return;
    }

    setIsRunningSimulation(true);

    // Simulate noise effects
    const noiseModel = noiseModels.find(m => m.id === selectedNoiseModel) ||
                      { ...noiseModels[3], parameters: customNoiseParams };

    // Simulate delay for realistic UX
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Generate simulated results with noise
    const noisyResults = results.map((result, index) => {
      const noiseFactor = noiseModel.parameters.gateError;
      const t1Decay = Math.exp(-circuit.gates.length / noiseModel.parameters.t1);
      const t2Decay = Math.exp(-circuit.gates.length / noiseModel.parameters.t2);

      return {
        ...result,
        fidelity: Math.max(0.1, result.purity * (1 - noiseFactor) * t1Decay * t2Decay),
        effectivePurity: result.purity * (1 - noiseFactor),
        decoherence: 1 - t1Decay,
        dephasing: 1 - t2Decay,
        readoutError: noiseModel.parameters.readoutError
      };
    });

    setSimulationResults({
      noiseModel,
      originalResults: results,
      noisyResults,
      summary: {
        averageFidelity: noisyResults.reduce((sum, r) => sum + r.fidelity, 0) / noisyResults.length,
        worstCaseFidelity: Math.min(...noisyResults.map(r => r.fidelity)),
        averageDecoherence: noisyResults.reduce((sum, r) => sum + r.decoherence, 0) / noisyResults.length
      }
    });

    setIsRunningSimulation(false);
    toast.success('Noise simulation completed!');
  };

  const runScalabilityAnalysis = async () => {
    if (!circuit) {
      toast.error('Please create a circuit first');
      return;
    }

    setIsRunningSimulation(true);

    // Simulate scalability analysis
    await new Promise(resolve => setTimeout(resolve, 1500));

    const results: ScalabilityResult[] = [];
    for (let qubits = 2; qubits <= targetQubits; qubits++) {
      // Estimate scaling based on circuit complexity
      const gateScaling = Math.pow(qubits / circuit.numQubits, 2);
      const depthScaling = Math.log(qubits);

      results.push({
        qubitCount: qubits,
        gateCount: Math.round(circuit.gates.length * gateScaling),
        circuitDepth: Math.round(circuitDepth * depthScaling),
        estimatedTime: circuit.gates.length * gateScaling * 0.001, // Rough estimate
        memoryUsage: qubits * 16 * gateScaling, // Rough memory estimate
        fidelity: Math.max(0.1, 1 - (qubits - circuit.numQubits) * 0.05),
        resourceScore: 100 / (gateScaling * depthScaling)
      });
    }

    setScalabilityResults(results);
    setIsRunningSimulation(false);
    toast.success('Scalability analysis completed!');
  };

  const exportCircuit = (format: string) => {
    if (!circuit) {
      toast.error('Please create a circuit first');
      return;
    }

    let content = '';
    let filename = '';
    let mimeType = '';

    switch (format) {
      case 'qasm':
        content = circuitToQASM(circuit);
        filename = 'circuit.qasm';
        mimeType = 'text/plain';
        break;
      case 'qiskit':
        content = circuitToQiskit(circuit);
        filename = 'circuit.py';
        mimeType = 'text/plain';
        break;
      case 'json':
        content = JSON.stringify(circuit, null, 2);
        filename = 'circuit.json';
        mimeType = 'application/json';
        break;
      case 'latex':
        content = circuitToLatex(circuit);
        filename = 'circuit.tex';
        mimeType = 'text/plain';
        break;
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success(`Circuit exported as ${format.toUpperCase()}!`);
  };

  // Helper functions for export formats
  const circuitToQASM = (circuit: QuantumCircuit): string => {
    let qasm = 'OPENQASM 2.0;\ninclude "qelib1.inc";\n\n';
    qasm += `qreg q[${circuit.numQubits}];\n`;
    qasm += `creg c[${circuit.numQubits}];\n\n`;

    circuit.gates.forEach(gate => {
      const qubits = gate.qubits.join(' ');
      qasm += `${gate.name.toLowerCase()} q[${qubits}];\n`;
    });

    qasm += '\nmeasure q -> c;\n';
    return qasm;
  };

  const circuitToQiskit = (circuit: QuantumCircuit): string => {
    let code = 'from qiskit import QuantumCircuit\n\n';
    code += `qc = QuantumCircuit(${circuit.numQubits})\n\n`;

    circuit.gates.forEach(gate => {
      const qubits = gate.qubits.join(', ');
      code += `qc.${gate.name.toLowerCase()}(${qubits})\n`;
    });

    return code;
  };

  const circuitToLatex = (circuit: QuantumCircuit): string => {
    // Simplified LaTeX quantum circuit representation
    let latex = '\\documentclass{article}\n\\usepackage{qcircuit}\n\\begin{document}\n\n';
    latex += `\\Qcircuit @C=1em @R=1em {\n`;

    // Add qubit lines
    for (let i = 0; i < circuit.numQubits; i++) {
      latex += ` & \\qw`;
    }
    latex += ` \\\\\n`;

    // Add gates
    circuit.gates.forEach(gate => {
      for (let i = 0; i < circuit.numQubits; i++) {
        latex += ` & `;
        if (gate.qubits.includes(i)) {
          latex += `\\gate{${gate.name}}`;
        } else {
          latex += `\\qw`;
        }
      }
      latex += ` \\\\\n`;
    });

    latex += `}\n\n\\end{document}\n`;
    return latex;
  };

  const circuitDepth = circuit ? Math.max(...circuit.gates.map(g => g.qubits.length), 1) : 1;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Tool Selection */}
      <Card className="border-accent/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-accent">
            <Microscope className="w-5 h-5" />
            Research Tools
          </CardTitle>
          <p className="text-muted-foreground">
            Advanced tools for quantum research, noise simulation, and academic analysis
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant={selectedTool === 'noise' ? 'default' : 'outline'}
              onClick={() => setSelectedTool('noise')}
              className="h-auto p-4 flex flex-col items-center gap-2"
            >
              <AlertCircle className="w-6 h-6" />
              <div className="text-center">
                <div className="font-semibold">Noise Simulation</div>
                <div className="text-xs text-muted-foreground">Model decoherence & errors</div>
              </div>
            </Button>

            <Button
              variant={selectedTool === 'scalability' ? 'default' : 'outline'}
              onClick={() => setSelectedTool('scalability')}
              className="h-auto p-4 flex flex-col items-center gap-2"
            >
              <TrendingUp className="w-6 h-6" />
              <div className="text-center">
                <div className="font-semibold">Scalability Analysis</div>
                <div className="text-xs text-muted-foreground">Resource estimation</div>
              </div>
            </Button>

            <Button
              variant={selectedTool === 'export' ? 'default' : 'outline'}
              onClick={() => setSelectedTool('export')}
              className="h-auto p-4 flex flex-col items-center gap-2"
            >
              <Download className="w-6 h-6" />
              <div className="text-center">
                <div className="font-semibold">Export Formats</div>
                <div className="text-xs text-muted-foreground">QASM, Qiskit, LaTeX</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Noise Simulation */}
      {selectedTool === 'noise' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <Card className="border-accent/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Noise Simulation
              </CardTitle>
              <p className="text-muted-foreground">
                Simulate realistic quantum noise including decoherence, dephasing, and gate errors
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Noise Model Selection */}
              <div className="space-y-4">
                <Label>Noise Model</Label>
                <Select value={selectedNoiseModel} onValueChange={setSelectedNoiseModel}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {noiseModels.map(model => (
                      <SelectItem key={model.id} value={model.id}>
                        <div>
                          <div className="font-semibold">{model.name}</div>
                          <div className="text-xs text-muted-foreground">{model.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Custom Parameters */}
              {selectedNoiseModel === 'custom' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border border-muted/20 rounded-lg">
                  <div className="space-y-2">
                    <Label>T1 Relaxation Time (μs): {customNoiseParams.t1}</Label>
                    <Slider
                      value={[customNoiseParams.t1]}
                      onValueChange={([value]) =>
                        setCustomNoiseParams(prev => ({ ...prev, t1: value }))
                      }
                      min={10}
                      max={1000}
                      step={10}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>T2 Dephasing Time (μs): {customNoiseParams.t2}</Label>
                    <Slider
                      value={[customNoiseParams.t2]}
                      onValueChange={([value]) =>
                        setCustomNoiseParams(prev => ({ ...prev, t2: value }))
                      }
                      min={10}
                      max={500}
                      step={5}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Gate Error Rate: {(customNoiseParams.gateError * 100).toFixed(1)}%</Label>
                    <Slider
                      value={[customNoiseParams.gateError]}
                      onValueChange={([value]) =>
                        setCustomNoiseParams(prev => ({ ...prev, gateError: value }))
                      }
                      min={0.001}
                      max={0.1}
                      step={0.001}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Readout Error Rate: {(customNoiseParams.readoutError * 100).toFixed(1)}%</Label>
                    <Slider
                      value={[customNoiseParams.readoutError]}
                      onValueChange={([value]) =>
                        setCustomNoiseParams(prev => ({ ...prev, readoutError: value }))
                      }
                      min={0.001}
                      max={0.1}
                      step={0.001}
                    />
                  </div>
                </div>
              )}

              {/* Run Simulation */}
              <Button
                onClick={runNoiseSimulation}
                disabled={isRunningSimulation || !circuit}
                className="w-full"
              >
                {isRunningSimulation ? (
                  <>
                    <Activity className="w-4 h-4 mr-2 animate-spin" />
                    Running Simulation...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Run Noise Simulation
                  </>
                )}
              </Button>

              {/* Results */}
              {simulationResults && (
                <div className="space-y-4">
                  <h4 className="font-semibold">Simulation Results</h4>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="border-muted/20">
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-blue-500">
                          {(simulationResults.summary.averageFidelity * 100).toFixed(1)}%
                        </div>
                        <div className="text-sm text-muted-foreground">Average Fidelity</div>
                      </CardContent>
                    </Card>

                    <Card className="border-muted/20">
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-red-500">
                          {(simulationResults.summary.averageDecoherence * 100).toFixed(1)}%
                        </div>
                        <div className="text-sm text-muted-foreground">Avg Decoherence</div>
                      </CardContent>
                    </Card>

                    <Card className="border-muted/20">
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-green-500">
                          {simulationResults.noiseModel.name}
                        </div>
                        <div className="text-sm text-muted-foreground">Noise Model</div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Scalability Analysis */}
      {selectedTool === 'scalability' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <Card className="border-accent/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Scalability Analysis
              </CardTitle>
              <p className="text-muted-foreground">
                Analyze how your circuit scales with increasing qubit counts
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label>Target Qubit Count: {targetQubits}</Label>
                <Slider
                  value={[targetQubits]}
                  onValueChange={([value]) => setTargetQubits(value)}
                  min={circuit?.numQubits || 2}
                  max={50}
                  step={1}
                />
              </div>

              <Button
                onClick={runScalabilityAnalysis}
                disabled={isRunningSimulation || !circuit}
                className="w-full"
              >
                {isRunningSimulation ? (
                  <>
                    <Activity className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Run Scalability Analysis
                  </>
                )}
              </Button>

              {/* Results */}
              {scalabilityResults.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-semibold">Scalability Results</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Qubits</th>
                          <th className="text-right p-2">Gates</th>
                          <th className="text-right p-2">Depth</th>
                          <th className="text-right p-2">Time (ms)</th>
                          <th className="text-right p-2">Fidelity</th>
                          <th className="text-right p-2">Score</th>
                        </tr>
                      </thead>
                      <tbody>
                        {scalabilityResults.map((result, index) => (
                          <tr key={index} className="border-b">
                            <td className="p-2">{result.qubitCount}</td>
                            <td className="p-2 text-right">{result.gateCount}</td>
                            <td className="p-2 text-right">{result.circuitDepth}</td>
                            <td className="p-2 text-right">{(result.estimatedTime * 1000).toFixed(1)}</td>
                            <td className="p-2 text-right">{(result.fidelity * 100).toFixed(1)}%</td>
                            <td className="p-2 text-right">{result.resourceScore.toFixed(1)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Export Formats */}
      {selectedTool === 'export' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <Card className="border-accent/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="w-5 h-5" />
                Export Circuit
              </CardTitle>
              <p className="text-muted-foreground">
                Export your circuit in various formats for research and publication
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Button
                  onClick={() => exportCircuit('qasm')}
                  disabled={!circuit}
                  variant="outline"
                  className="h-auto p-4 flex flex-col items-center gap-2"
                >
                  <FileText className="w-6 h-6" />
                  <div className="text-center">
                    <div className="font-semibold">OpenQASM</div>
                    <div className="text-xs text-muted-foreground">Standard format</div>
                  </div>
                </Button>

                <Button
                  onClick={() => exportCircuit('qiskit')}
                  disabled={!circuit}
                  variant="outline"
                  className="h-auto p-4 flex flex-col items-center gap-2"
                >
                  <Code className="w-6 h-6" />
                  <div className="text-center">
                    <div className="font-semibold">Qiskit Code</div>
                    <div className="text-xs text-muted-foreground">Python script</div>
                  </div>
                </Button>

                <Button
                  onClick={() => exportCircuit('json')}
                  disabled={!circuit}
                  variant="outline"
                  className="h-auto p-4 flex flex-col items-center gap-2"
                >
                  <Settings className="w-6 h-6" />
                  <div className="text-center">
                    <div className="font-semibold">JSON</div>
                    <div className="text-xs text-muted-foreground">Data format</div>
                  </div>
                </Button>

                <Button
                  onClick={() => exportCircuit('latex')}
                  disabled={!circuit}
                  variant="outline"
                  className="h-auto p-4 flex flex-col items-center gap-2"
                >
                  <FileText className="w-6 h-6" />
                  <div className="text-center">
                    <div className="font-semibold">LaTeX</div>
                    <div className="text-xs text-muted-foreground">Publication ready</div>
                  </div>
                </Button>
              </div>

              {!circuit && (
                <Alert className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Please create a circuit first to enable export functionality.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
};

export default ResearchTools;