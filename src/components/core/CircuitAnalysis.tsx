import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import BlochSphere3D from './BlochSphere';
import { simulateCircuit } from '@/utils/quantum/quantumSimulation';
import { Loader2 } from 'lucide-react';
import { QuantumGate } from '@/utils/quantum/circuitOperations';

interface CircuitAnalysisProps {
    numQubits: number;
    circuitGates: Array<{
        name: string;
        qubits: number[];
        parameters?: { [key: string]: number };
    }>;
    ketStates: string[];
}

interface QubitAnalysis {
    index: number;
    blochVector: { x: number; y: number; z: number };
    purity: number;
    entropy: number;
    state: 'Pure' | 'Mixed';
}

const CircuitAnalysis: React.FC<CircuitAnalysisProps> = ({ numQubits, circuitGates, ketStates }) => {
    const [analyzedQubits, setAnalyzedQubits] = useState<QubitAnalysis[]>([]);
    const [isCalculating, setIsCalculating] = useState(false);

    useEffect(() => {
        let active = true;
        const calculate = async () => {
            setIsCalculating(true);

            try {
                const circuit = {
                    numQubits,
                    gates: circuitGates.map(g => ({
                        name: g.name,
                        qubits: g.qubits,
                        parameters: g.parameters
                    } as QuantumGate))
                };

                const result = simulateCircuit(circuit);

                if (!active) return;

                if (result.reducedStates) {
                    const analyses: QubitAnalysis[] = result.reducedStates.map((reduced, i) => ({
                        index: i,
                        blochVector: reduced.blochVector,
                        purity: reduced.purity,
                        entropy: reduced.vonNeumannEntropy || 0,
                        state: reduced.purity >= 0.99 ? 'Pure' : 'Mixed'
                    }));
                    setAnalyzedQubits(analyses);
                }

            } catch (err) {
                console.error("Simulation error in analysis:", err);
                if (active) setAnalyzedQubits([]);
            } finally {
                if (active) setIsCalculating(false);
            }
        };

        const timer = setTimeout(calculate, 300);
        return () => { active = false; clearTimeout(timer); };
    }, [numQubits, circuitGates, ketStates]);

    return (
        <Card className="border-primary/20 bg-gradient-to-br from-card/80 to-card/60">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    Multi-Qubit State Analysis
                    {isCalculating && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                    Visualizing locally reduced states. Mixed states (red arrow inside the sphere) indicate entanglement with other qubits.
                </p>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {analyzedQubits.map((qubit) => (
                        <div key={qubit.index} className="flex flex-col items-center space-y-3 p-4 bg-background/50 rounded-xl border border-border/50">
                            <div className="text-lg font-bold font-mono text-primary">Qubit {qubit.index}</div>

                            <div className="w-full aspect-square min-h-[250px] relative">
                                <BlochSphere3D
                                    vector={qubit.blochVector}
                                    purity={qubit.purity}
                                    interactive={true}
                                    showAxes={true}
                                />
                            </div>

                            <div className="w-full space-y-1 text-xs font-mono">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">State:</span>
                                    <span className={qubit.state === 'Mixed' ? 'text-yellow-400 font-bold' : 'text-green-400'}>
                                        {qubit.state}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Purity:</span>
                                    <span>{qubit.purity.toFixed(3)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Vector:</span>
                                    <span className="truncate ml-2" title={`[${qubit.blochVector.x.toFixed(2)}, ${qubit.blochVector.y.toFixed(2)}, ${qubit.blochVector.z.toFixed(2)}]`}>
                                        ({qubit.blochVector.x.toFixed(2)}, {qubit.blochVector.z.toFixed(2)})
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}

                    {analyzedQubits.length === 0 && !isCalculating && (
                        <div className="col-span-full text-center py-10 text-muted-foreground">
                            Build a circuit to see qubit states.
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default CircuitAnalysis;
