import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, Zap } from 'lucide-react';
import {
  convertToState,
  convertStateNotation,
  validateState,
  getPresetStates,
  type QuantumState,
  type NotationType,
  type StateConversionResult
} from '@/utils/stateNotationConverter';

interface StateSelectorWidgetProps {
  numQubits: number;
  onStateChange: (state: QuantumState | null) => void;
  initialState?: QuantumState | null;
  title?: string;
  showValidation?: boolean;
  compact?: boolean;
}

export const StateSelectorWidget: React.FC<StateSelectorWidgetProps> = ({
  numQubits,
  onStateChange,
  initialState = null,
  title = "Quantum State Input",
  showValidation = true,
  compact = false
}) => {
  const [notation, setNotation] = useState<NotationType>('ket');
  const [inputValue, setInputValue] = useState('');
  const [currentState, setCurrentState] = useState<QuantumState | null>(initialState);
  const [validationResult, setValidationResult] = useState<{ valid: boolean; error?: string } | null>(null);
  const [isConverting, setIsConverting] = useState(false);

  // Update input value when notation changes
  useEffect(() => {
    if (currentState) {
      const convertedValue = convertStateNotation(currentState, notation);
      setInputValue(convertedValue);
    }
  }, [notation, currentState]);

  // Update when initial state changes
  useEffect(() => {
    setCurrentState(initialState);
    if (initialState) {
      const convertedValue = convertStateNotation(initialState, notation);
      setInputValue(convertedValue);
    }
  }, [initialState, notation]);

  const handleNotationChange = (newNotation: NotationType) => {
    setNotation(newNotation);
    setValidationResult(null);
  };

  const handleInputChange = (value: string) => {
    setInputValue(value);
    setValidationResult(null);
  };

  const handleConvert = async () => {
    if (!inputValue.trim()) {
      setValidationResult({ valid: false, error: 'Please enter a state value' });
      return;
    }

    setIsConverting(true);
    try {
      const result: StateConversionResult = convertToState(inputValue, notation, numQubits);

      if (result.success && result.state) {
        const validation = validateState(result.state);
        setValidationResult(validation);

        if (validation.valid) {
          setCurrentState(result.state);
          onStateChange(result.state);
        } else {
          setCurrentState(null);
          onStateChange(null);
        }
      } else {
        setValidationResult({ valid: false, error: result.error || 'Conversion failed' });
        setCurrentState(null);
        onStateChange(null);
      }
    } catch (error) {
      setValidationResult({ valid: false, error: 'Unexpected error during conversion' });
      setCurrentState(null);
      onStateChange(null);
    } finally {
      setIsConverting(false);
    }
  };

  const handlePresetSelect = (presetValue: string, presetNotation: NotationType) => {
    setNotation(presetNotation);
    setInputValue(presetValue);
    setValidationResult(null);
  };

  const handleClear = () => {
    setInputValue('');
    setCurrentState(null);
    setValidationResult(null);
    onStateChange(null);
  };

  const presets = getPresetStates(numQubits);

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <Select value={notation} onValueChange={handleNotationChange}>
          <SelectTrigger className="w-24">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="binary">Binary</SelectItem>
            <SelectItem value="decimal">Decimal</SelectItem>
            <SelectItem value="ket">Ket</SelectItem>
            <SelectItem value="bra">Bra</SelectItem>
            <SelectItem value="superposition">Superposition</SelectItem>
          </SelectContent>
        </Select>

        <Input
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder={`Enter ${notation} state`}
          className="flex-1"
        />

        <Button
          onClick={handleConvert}
          disabled={isConverting}
          size="sm"
          variant="outline"
        >
          {isConverting ? '...' : 'Set'}
        </Button>
      </div>
    );
  }

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Zap className="w-4 h-4" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Notation Selector */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium mb-2">Input Format</label>
            <Select value={notation} onValueChange={handleNotationChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="binary">Binary (0,1)</SelectItem>
                <SelectItem value="decimal">Decimal (0,1,2,3)</SelectItem>
                <SelectItem value="ket">Ket Notation (|0⟩, |1⟩)</SelectItem>
                <SelectItem value="bra">Bra Notation (⟨0|, ⟨1|)</SelectItem>
                <SelectItem value="superposition">Superposition (α|0⟩ + β|1⟩)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            {/* Valid Input State Selector for 1-qubit and 2-qubit gates */}
            <label className="block text-xs font-medium mb-2">Select Input State</label>
            <Select value={inputValue} onValueChange={handleInputChange}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Choose state" />
              </SelectTrigger>
              <SelectContent>
                {(numQubits === 1
                  ? ['|0⟩', '|1⟩']
                  : numQubits === 2
                  ? ['|00⟩', '|01⟩', '|10⟩', '|11⟩']
                  : []
                ).map(state => (
                  <SelectItem key={state} value={state}>{state}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <label className="block text-xs font-medium mb-2 mt-2">State Value</label>
            <Input
              value={inputValue}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder={getPlaceholder(notation, numQubits)}
              className={validationResult && !validationResult.valid ? 'border-red-500' : ''}
            />
          </div>
        </div>

        {/* Quick Select Presets */}
        <div>
          <label className="block text-xs font-medium mb-2">Quick Select</label>
          <div className="flex flex-wrap gap-2">
            {presets.slice(0, 8).map((preset, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => handlePresetSelect(preset.value, preset.notation)}
                className="text-xs"
              >
                {preset.label}
              </Button>
            ))}
            {presets.length > 8 && (
              <Button variant="ghost" size="sm" className="text-xs">
                +{presets.length - 8} more
              </Button>
            )}
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center gap-2">
          <Button
            onClick={handleConvert}
            disabled={isConverting || !inputValue.trim()}
            size="sm"
          >
            {isConverting ? 'Converting...' : 'Apply State'}
          </Button>

          <Button
            onClick={handleClear}
            variant="outline"
            size="sm"
          >
            Clear
          </Button>
        </div>

        {/* Validation Feedback */}
        {showValidation && validationResult && (
          <Alert className={validationResult.valid ? 'border-green-500/20 bg-green-500/10' : 'border-red-500/20 bg-red-500/10'}>
            {validationResult.valid ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-500" />
            )}
            <AlertDescription className={validationResult.valid ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}>
              {validationResult.valid ? 'Valid quantum state' : validationResult.error}
            </AlertDescription>
          </Alert>
        )}

        {/* Current State Display */}
        {currentState && (
          <div className="space-y-2">
            <div className="text-xs font-medium">Current State:</div>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <div className="font-medium mb-1">Amplitudes:</div>
                <div className="font-mono bg-muted/30 rounded p-2">
                  {currentState.amplitudes.map((amp, i) => (
                    <div key={i}>
                      {currentState.basis[i]}: {formatAmplitude(amp)}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div className="font-medium mb-1">Probabilities:</div>
                <div className="font-mono bg-muted/30 rounded p-2">
                  {currentState.probabilities.map((prob, i) => (
                    <div key={i}>
                      {currentState.basis[i]}: {(prob * 100).toFixed(1)}%
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Helper functions
const getPlaceholder = (notation: NotationType, numQubits: number): string => {
  switch (notation) {
    case 'binary':
      return numQubits === 1 ? '0 or 1' : `e.g., ${'0'.repeat(numQubits)}`;
    case 'decimal':
      return `0 to ${Math.pow(2, numQubits) - 1}`;
    case 'ket':
      return numQubits === 1 ? '|0⟩ or |1⟩' : `|${'0'.repeat(numQubits)}⟩`;
    case 'bra':
      return numQubits === 1 ? '⟨0| or ⟨1|' : `⟨${'0'.repeat(numQubits)}|`;
    case 'superposition':
      return '0.707|0⟩ + 0.707|1⟩';
    default:
      return 'Enter state';
  }
};

const formatAmplitude = (amp: number | { real: number; imag: number }): string => {
  if (typeof amp === 'number') {
    return amp.toFixed(3);
  }

  const real = Math.abs(amp.real) > 1e-10 ? amp.real.toFixed(3) : '';
  const imag = Math.abs(amp.imag) > 1e-10 ? amp.imag.toFixed(3) : '';

  if (!real && !imag) return '0';

  let result = '';
  if (real) result += real;
  if (imag) {
    if (result && amp.imag > 0) result += '+';
    result += imag === '1' ? 'i' : imag === '-1' ? '-i' : `${imag}i`;
  }

  return result;
};

export default StateSelectorWidget;
