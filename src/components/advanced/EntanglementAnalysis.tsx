import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Zap, 
  Link, 
  Unlink, 
  Activity, 
  Brain, 
  AlertTriangle,
  CheckCircle,
  Info
} from 'lucide-react';
import { DensityMatrix } from '@/utils/quantumSimulation';

interface EntanglementAnalysisProps {
  densityMatrix: DensityMatrix;
  qubitIndex: number;
  totalQubits: number;
  isMultiQubit: boolean;
}

const EntanglementAnalysis: React.FC<EntanglementAnalysisProps> = ({
  densityMatrix,
  qubitIndex,
  totalQubits,
  isMultiQubit
}) => {
  const {
    concurrence = 0,
    vonNeumannEntropy = 0,
    isEntangled = false,
    witnessValue = 0,
    reducedRadius = 1,
    purity = 1
  } = densityMatrix;

  const getEntanglementLevel = (concurrence: number): string => {
    if (concurrence < 0.1) return 'None';
    if (concurrence < 0.3) return 'Weak';
    if (concurrence < 0.7) return 'Moderate';
    return 'Strong';
  };

  const getEntanglementColor = (concurrence: number): string => {
    if (concurrence < 0.1) return 'bg-gray-500';
    if (concurrence < 0.3) return 'bg-yellow-500';
    if (concurrence < 0.7) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getPurityLevel = (purity: number): string => {
    if (purity > 0.95) return 'Pure';
    if (purity > 0.8) return 'Nearly Pure';
    if (purity > 0.5) return 'Mixed';
    return 'Highly Mixed';
  };

  const getPurityColor = (purity: number): string => {
    if (purity > 0.95) return 'text-green-500';
    if (purity > 0.8) return 'text-yellow-500';
    if (purity > 0.5) return 'text-orange-500';
    return 'text-red-500';
  };

  if (!isMultiQubit) {
    return (
      <Card className="border-muted/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Unlink className="w-4 h-4" />
            Single Qubit System
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Single qubit systems cannot exhibit entanglement. 
              Entanglement requires at least 2 qubits.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          {isEntangled ? (
            <Link className="w-4 h-4 text-red-500" />
          ) : (
            <Unlink className="w-4 h-4 text-gray-500" />
          )}
          Entanglement Analysis - Qubit {qubitIndex}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Entanglement Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Entanglement Status:</span>
          <Badge 
            variant={isEntangled ? "destructive" : "secondary"}
            className="flex items-center gap-1"
          >
            {isEntangled ? (
              <>
                <Link className="w-3 h-3" />
                Entangled
              </>
            ) : (
              <>
                <Unlink className="w-3 h-3" />
                Separable
              </>
            )}
          </Badge>
        </div>

        {/* Concurrence */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Concurrence:</span>
            <span className="text-sm font-mono">{concurrence.toFixed(3)}</span>
          </div>
          <div className="space-y-1">
            <Progress 
              value={concurrence * 100} 
              className="h-2"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0</span>
              <span className={getEntanglementColor(concurrence)}>
                {getEntanglementLevel(concurrence)}
              </span>
              <span>1</span>
            </div>
          </div>
        </div>

        {/* Von Neumann Entropy */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Von Neumann Entropy:</span>
            <span className="text-sm font-mono">{vonNeumannEntropy.toFixed(3)}</span>
          </div>
          <div className="space-y-1">
            <Progress 
              value={vonNeumannEntropy * 100} 
              className="h-2"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0 (Pure)</span>
              <span>1 (Max Mixed)</span>
            </div>
          </div>
        </div>

        {/* Purity Analysis */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Purity:</span>
            <span className={`text-sm font-mono ${getPurityColor(purity)}`}>
              {purity.toFixed(3)}
            </span>
          </div>
          <div className="space-y-1">
            <Progress 
              value={purity * 100} 
              className="h-2"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0 (Mixed)</span>
              <span className={getPurityColor(purity)}>
                {getPurityLevel(purity)}
              </span>
              <span>1 (Pure)</span>
            </div>
          </div>
        </div>

        {/* Reduced Bloch Vector Radius */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Bloch Vector Radius:</span>
            <span className="text-sm font-mono">{reducedRadius.toFixed(3)}</span>
          </div>
          <div className="space-y-1">
            <Progress 
              value={reducedRadius * 100} 
              className="h-2"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0 (Center)</span>
              <span>1 (Surface)</span>
            </div>
          </div>
        </div>

        {/* Entanglement Witness */}
        <div className="p-3 bg-muted/20 rounded-lg">
          <div className="text-sm font-semibold mb-2 flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Entanglement Witness
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span>Witness Value:</span>
              <span className="font-mono">{witnessValue.toFixed(3)}</span>
            </div>
            <div className="flex justify-between">
              <span>Threshold:</span>
              <span className="font-mono">0.0</span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              {isEntangled ? (
                <CheckCircle className="w-4 h-4 text-red-500" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-gray-500" />
              )}
              <span className="text-xs">
                {isEntangled 
                  ? 'Entanglement detected (witness < 0)' 
                  : 'No entanglement detected (witness ≥ 0)'
                }
              </span>
            </div>
          </div>
        </div>

        {/* Interpretation */}
        <div className="p-3 bg-primary/10 rounded-lg">
          <div className="text-sm font-semibold mb-2 flex items-center gap-2">
            <Brain className="w-4 h-4" />
            Interpretation
          </div>
          <div className="text-xs text-muted-foreground space-y-1">
            {isEntangled ? (
              <p>
                This qubit is entangled with other qubits in the system. 
                The reduced density matrix shows mixed state characteristics 
                due to entanglement.
              </p>
            ) : (
              <p>
                This qubit is separable from the rest of the system. 
                It can be described independently without considering 
                other qubits.
              </p>
            )}
            <p>
              <strong>Concurrence:</strong> Measures entanglement strength (0 = separable, 1 = maximally entangled)
            </p>
            <p>
              <strong>Von Neumann Entropy:</strong> Measures mixedness due to entanglement (0 = pure, 1 = maximally mixed)
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EntanglementAnalysis;
