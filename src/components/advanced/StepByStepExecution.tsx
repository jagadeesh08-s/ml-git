import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  StepForward, 
  StepBack, 
  X,
  Zap,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';
import BlochSphere3D from '../core/BlochSphere';
import {
  simulateCircuitStepByStep,
  type QuantumCircuit,
  type DensityMatrix,
  type StepResult
} from '@/utils/quantum/quantumCodeParser';

interface StepByStepExecutionProps {
  circuit: QuantumCircuit;
  onClose: () => void;
}

const StepByStepExecution: React.FC<StepByStepExecutionProps> = ({ circuit, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [stepResults, setStepResults] = useState<StepResult[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playSpeed, setPlaySpeed] = useState(1000); // ms
  const [isLoading, setIsLoading] = useState(false);

  // Initialize step-by-step simulation
  useEffect(() => {
    if (circuit) {
      setIsLoading(true);
      try {
        console.log('Starting step-by-step simulation for circuit:', circuit);
        const results = simulateCircuitStepByStep(circuit);
        console.log('Step-by-step simulation results:', results);
        setStepResults(results);
        setCurrentStep(0);
        toast.success(`Step-by-step simulation ready with ${results.length} steps`);
      } catch (error) {
        console.error('Step-by-step simulation error:', error);
        toast.error('Failed to initialize step-by-step simulation');
      } finally {
        setIsLoading(false);
      }
    }
  }, [circuit]);

  // Auto-play functionality
  useEffect(() => {
    if (isPlaying && currentStep < stepResults.length - 1) {
      const timer = setTimeout(() => {
        setCurrentStep(prev => prev + 1);
      }, playSpeed);
      return () => clearTimeout(timer);
    } else if (isPlaying && currentStep >= stepResults.length - 1) {
      setIsPlaying(false);
      toast.success('Step-by-step execution completed!');
    }
  }, [isPlaying, currentStep, stepResults.length, playSpeed]);

  const handlePlay = () => {
    if (currentStep >= stepResults.length - 1) {
      setCurrentStep(0);
    }
    setIsPlaying(true);
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  const handleReset = () => {
    setCurrentStep(0);
    setIsPlaying(false);
  };

  const handleNextStep = () => {
    if (currentStep < stepResults.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSpeedChange = (speed: number) => {
    setPlaySpeed(speed);
  };

  const currentResult = stepResults[currentStep];
  console.log('Current step:', currentStep, 'Current result:', currentResult);
  const progress = stepResults.length > 0 ? ((currentStep + 1) / stepResults.length) * 100 : 0;

  if (isLoading) {
    return (
      <Card className="border-accent/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-3 text-muted-foreground">Initializing step-by-step simulation...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (stepResults.length === 0) {
    return (
      <Card className="border-accent/20">
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            No steps available for this circuit
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-accent/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-accent">
            <Zap className="w-5 h-5" />
            Step-by-Step Execution
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Step {currentStep + 1} of {stepResults.length}
            </span>
            <span className="text-muted-foreground">
              {currentResult?.gateName || 'Initial State'}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Control Panel */}
        <div className="flex items-center justify-between p-4 bg-muted/20 rounded-lg">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              disabled={isPlaying}
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              Reset
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevStep}
              disabled={currentStep === 0 || isPlaying}
            >
              <StepBack className="w-4 h-4 mr-1" />
              Prev
            </Button>
            
            {isPlaying ? (
              <Button
                variant="default"
                size="sm"
                onClick={handlePause}
              >
                <Pause className="w-4 h-4 mr-1" />
                Pause
              </Button>
            ) : (
              <Button
                variant="default"
                size="sm"
                onClick={handlePlay}
                disabled={currentStep >= stepResults.length - 1}
              >
                <Play className="w-4 h-4 mr-1" />
                Play
              </Button>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextStep}
              disabled={currentStep >= stepResults.length - 1 || isPlaying}
            >
              <StepForward className="w-4 h-4 mr-1" />
              Next
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <select
              value={playSpeed}
              onChange={(e) => handleSpeedChange(Number(e.target.value))}
              className="text-sm bg-background border border-input rounded px-2 py-1"
              disabled={isPlaying}
            >
              <option value={2000}>0.5x</option>
              <option value={1000}>1x</option>
              <option value={500}>2x</option>
              <option value={250}>4x</option>
            </select>
          </div>
        </div>

        {/* Current Step Information */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-primary/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    Step {currentStep + 1}
                  </Badge>
                  {currentResult?.gateName ? (
                    <>
                      <span className="text-primary">{currentResult.gateName}</span>
                      <span className="text-muted-foreground">
                        on qubit{currentResult.qubits.length > 1 ? 's' : ''} {currentResult.qubits.join(', ')}
                      </span>
                    </>
                  ) : (
                    <span className="text-muted-foreground">Initial State</span>
                  )}
                </CardTitle>
              </CardHeader>
              
              <CardContent>
                {/* Bloch Spheres */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  {currentResult?.states.map((state, index) => (
                    <div key={index} className="space-y-3">
                      <div className="text-center">
                        <h4 className="font-semibold text-primary">Qubit {index}</h4>
                        <div className="h-80 w-full flex justify-center bg-gray-900/80 border border-border/30 rounded-lg p-3 mt-2">
                          <BlochSphere3D
                            vector={state.blochVector}
                            purity={state.purity}
                            size={380}
                            showAxes={true}
                            showGrid={true}
                            interactive={true}
                          />
                        </div>
                        
                        {/* State properties */}
                        <div className="mt-3 space-y-2 text-xs">
                          <div className="grid grid-cols-2 gap-2">
                            <div className="text-center p-2 bg-muted/20 rounded">
                              <div className="text-muted-foreground">Purity</div>
                              <div className="font-mono text-sm">{state.purity.toFixed(3)}</div>
                            </div>
                            <div className="text-center p-2 bg-muted/20 rounded">
                              <div className="text-muted-foreground">Superposition</div>
                              <div className="font-mono text-sm text-cyan-400">
                                {state.superposition?.toFixed(3) || '0.000'}
                              </div>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-1 text-xs">
                            <div className="text-center">
                              <div className="text-red-400 font-bold">X: {state.blochVector.x.toFixed(2)}</div>
                            </div>
                            <div className="text-center">
                              <div className="text-green-400 font-bold">Y: {state.blochVector.y.toFixed(2)}</div>
                            </div>
                            <div className="text-center">
                              <div className="text-blue-400 font-bold">Z: {state.blochVector.z.toFixed(2)}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Gate Information */}
                {currentResult?.gateName && (
                  <div className="mt-4 p-4 bg-muted/20 rounded-lg">
                    <h4 className="font-semibold mb-2">Gate Information</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Gate:</span>
                        <Badge variant="outline" className="ml-2">{currentResult.gateName}</Badge>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Qubits:</span>
                        <Badge variant="outline" className="ml-2">
                          {currentResult.qubits.join(', ')}
                        </Badge>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Type:</span>
                        <Badge variant="outline" className="ml-2">
                          {currentResult.qubits.length === 1 ? 'Single-qubit' : 'Two-qubit'}
                        </Badge>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Position:</span>
                        <Badge variant="outline" className="ml-2">
                          {currentStep}
                        </Badge>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Step Navigation */}
        <div className="flex items-center justify-center gap-2">
          {stepResults.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentStep(index)}
              disabled={isPlaying}
              className={`w-3 h-3 rounded-full transition-colors ${
                index === currentStep
                  ? 'bg-primary'
                  : index < currentStep
                  ? 'bg-primary/50'
                  : 'bg-muted'
              } ${isPlaying ? 'cursor-not-allowed' : 'cursor-pointer hover:bg-primary/70'}`}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default StepByStepExecution;
