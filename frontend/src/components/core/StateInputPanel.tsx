import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { KetState, KetStateParser, Complex } from '@/utils/quantum/ketState';
import BlochSphere3D from './BlochSphere';

// Utility function to generate computational basis states for n qubits
const generateComputationalBasisStates = (numQubits: number): Array<{ label: string; value: string; notation: 'bra-ket' }> => {
  if (numQubits === 1) {
    return [
      { label: '|0⟩', value: '|0⟩', notation: 'bra-ket' },
      { label: '|1⟩', value: '|1⟩', notation: 'bra-ket' }
    ];
  } else if (numQubits === 2) {
    return [
      { label: '|00⟩', value: '|00⟩', notation: 'bra-ket' },
      { label: '|01⟩', value: '|01⟩', notation: 'bra-ket' },
      { label: '|10⟩', value: '|10⟩', notation: 'bra-ket' },
      { label: '|11⟩', value: '|11⟩', notation: 'bra-ket' }
    ];
  } else if (numQubits === 3) {
    return [
      { label: '|000⟩', value: '|000⟩', notation: 'bra-ket' },
      { label: '|001⟩', value: '|001⟩', notation: 'bra-ket' },
      { label: '|010⟩', value: '|010⟩', notation: 'bra-ket' },
      { label: '|011⟩', value: '|011⟩', notation: 'bra-ket' },
      { label: '|100⟩', value: '|100⟩', notation: 'bra-ket' },
      { label: '|101⟩', value: '|101⟩', notation: 'bra-ket' },
      { label: '|110⟩', value: '|110⟩', notation: 'bra-ket' },
      { label: '|111⟩', value: '|111⟩', notation: 'bra-ket' }
    ];
  }
  return [];
};

interface StateInputPanelProps {
  onStateChange: (state: KetState | null) => void;
  initialState?: KetState;
  title?: string;
  showBlochPreview?: boolean;
  numQubits?: number; // Total number of qubits in circuit
  gateQubitCount?: number; // Number of qubits this specific gate operates on
}

const COMMON_STATES: { label: string; value: string; notation: 'bra-ket' | 'vector' | 'polar' }[] = [
  { label: '|0⟩', value: '|0⟩', notation: 'bra-ket' },
  { label: '|1⟩', value: '|1⟩', notation: 'bra-ket' },
  { label: '|+⟩', value: '[0.707, 0.707]', notation: 'vector' },
  { label: '|-⟩', value: '[0.707, -0.707]', notation: 'vector' },
  { label: '|+i⟩', value: '[0.707, 0.707i]', notation: 'vector' },
  { label: '|-i⟩', value: '[0.707, -0.707i]', notation: 'vector' },
];

export const StateInputPanel: React.FC<StateInputPanelProps> = ({
  onStateChange,
  initialState,
  title = "State Input",
  showBlochPreview = true,
  numQubits = 1,
  gateQubitCount
}) => {
  const [notation, setNotation] = useState<'bra-ket' | 'vector' | 'polar'>('bra-ket');
  const [inputValue, setInputValue] = useState('');
  const [parsedState, setParsedState] = useState<Complex[] | null>(null);
  const [isValid, setIsValid] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialState) {
      setNotation(initialState.notation);
      setInputValue(typeof initialState.value === 'string' ? initialState.value : JSON.stringify(initialState.value));
    }
  }, [initialState]);

  const parseState = (notation: 'bra-ket' | 'vector' | 'polar', value: string): Complex[] | null => {
    try {
      let parsed: Complex[] = [];
      switch (notation) {
        case 'bra-ket':
          parsed = KetStateParser.parseBraKet(value);
          break;
        case 'vector':
          parsed = KetStateParser.parseVector(value);
          break;
        case 'polar':
          parsed = KetStateParser.parsePolar(value);
          break;
      }

      if (parsed.length > 0) {
        const normalized = KetStateParser.normalize(parsed);
        if (KetStateParser.validate(normalized)) {
          return normalized;
        }
      }
    } catch (e) {
      // Parsing error
    }
    return null;
  };

  const handleNotationChange = (newNotation: 'bra-ket' | 'vector' | 'polar') => {
    setNotation(newNotation);
    setInputValue('');
    setParsedState(null);
    setIsValid(false);
    setError(null);
    onStateChange(null);
  };

  const handleInputChange = (value: string) => {
    setInputValue(value);
    const parsed = parseState(notation, value);
    setParsedState(parsed);
    setIsValid(parsed !== null);
    setError(parsed === null ? 'Invalid state format' : null);

    if (parsed) {
      const ketState: KetState = { notation, value };
      onStateChange(ketState);
    } else {
      onStateChange(null);
    }
  };

  const handlePresetSelect = (preset: typeof COMMON_STATES[0]) => {
    setNotation(preset.notation);
    setInputValue(preset.value);
    const parsed = parseState(preset.notation, preset.value);
    setParsedState(parsed);
    setIsValid(parsed !== null);
    setError(null);

    if (parsed) {
      const ketState: KetState = { notation: preset.notation, value: preset.value };
      onStateChange(ketState);
    }
  };

  const getPlaceholder = () => {
    switch (notation) {
      case 'bra-ket':
        return 'e.g., |0⟩, |1⟩, α|0⟩ + β|1⟩';
      case 'vector':
        return 'e.g., [1, 0], [0.707, 0.707]';
      case 'polar':
        return 'e.g., [{"magnitude": 1, "phase": 0}, {"magnitude": 0, "phase": 0}]';
      default:
        return '';
    }
  };

  const calculateBlochVector = (state: Complex[]): { x: number; y: number; z: number } => {
    if (state.length !== 2) return { x: 0, y: 0, z: 1 };
    const a = state[0];
    const b = state[1];
    const x = 2 * (a.re * b.re + a.im * b.im);
    const y = 2 * (a.im * b.re - a.re * b.im);
    const z = a.re * a.re + a.im * a.im - b.re * b.re - b.im * b.im;
    return { x, y, z };
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <div className="w-2 h-2 bg-accent rounded-full" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Notation Selector */}
        <div>
          <label className="block text-sm font-medium mb-2">Notation:</label>
          <Select value={notation} onValueChange={handleNotationChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bra-ket">Bra-Ket Notation</SelectItem>
              <SelectItem value="vector">Vector Form</SelectItem>
              <SelectItem value="polar">Polar Form</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* State Input Field */}
        <div>
          <label className="block text-sm font-medium mb-2">State Input:</label>
          <Input
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder={getPlaceholder()}
            className={`font-mono ${isValid ? 'border-green-500' : error ? 'border-red-500' : ''}`}
          />
          {error && (
            <Alert className="mt-2 border-red-500/20 bg-red-500/10">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <AlertDescription className="text-red-700 dark:text-red-300">
                {error}
              </AlertDescription>
            </Alert>
          )}
          {isValid && (
            <Alert className="mt-2 border-green-500/20 bg-green-500/10">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertDescription className="text-green-700 dark:text-green-300">
                Valid quantum state
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Dynamic State Presets based on qubit count */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Computational Basis States {gateQubitCount ? `(${gateQubitCount} qubit${gateQubitCount > 1 ? 's' : ''})` : ''}:
          </label>
          <div className={`grid ${gateQubitCount === 3 ? 'grid-cols-4' : 'grid-cols-2'} gap-2`}>
            {(() => {
              // For gate configuration, use gateQubitCount (number of qubits the gate operates on)
              // For initial state selection, use numQubits (total qubits in circuit)
              const qubitCount = gateQubitCount !== undefined ? gateQubitCount : numQubits;
              const basisStates = generateComputationalBasisStates(qubitCount);

              console.log('StateInputPanel Debug:', {
                gateQubitCount,
                numQubits,
                qubitCount,
                title: title || 'No title',
                basisStatesCount: basisStates.length,
                basisStates: basisStates.map(s => s.label)
              });

              return basisStates.map((preset) => (
                <Button
                  key={preset.label}
                  variant="outline"
                  size="sm"
                  onClick={() => handlePresetSelect(preset)}
                  className="text-xs"
                >
                  {preset.label}
                </Button>
              ));
            })()}
          </div>
        </div>

        {/* Bloch Sphere Preview */}
        {showBlochPreview && parsedState && (
          <div>
            <label className="block text-sm font-medium mb-2">Bloch Sphere Preview:</label>
            <div className="h-80 w-full flex justify-center bg-gray-900/80 border border-border/30 rounded-lg p-3">
              <BlochSphere3D
                vector={calculateBlochVector(parsedState)}
                size={380}
                className="w-full h-full"
              />
            </div>
          </div>
        )}

        {/* State Validator */}
        {parsedState && (
          <div className="text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Dimension:</span>
              <span className="font-mono">{parsedState.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Normalized:</span>
              <Badge variant={isValid ? "default" : "destructive"}>
                {isValid ? "Yes" : "No"}
              </Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StateInputPanel;
