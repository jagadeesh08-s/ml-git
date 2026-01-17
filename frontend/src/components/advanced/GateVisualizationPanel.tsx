import React from 'react';
import BlochSphere3D from '../core/BlochSphere';

interface GateVisualizationPanelProps {
  gateName: string;
  inputKet: string;
  gateMatrix: number[][];
  stepCalculations: string[];
  finalStateVector: string;
  sphereProps?: any;
}

const GateVisualizationPanel: React.FC<GateVisualizationPanelProps> = ({
  gateName,
  inputKet,
  gateMatrix,
  stepCalculations,
  finalStateVector,
  sphereProps = {},
}) => {
  // Convert input ket to complex vector
  const parseKetToVector = (ket: string): [number, number] => {
    const ketMap: { [key: string]: [number, number] } = {
      '|0⟩': [1, 0],
      '|1⟩': [0, 1],
      '|+⟩': [Math.SQRT1_2, Math.SQRT1_2],
      '|-⟩': [Math.SQRT1_2, -Math.SQRT1_2],
      '|+i⟩': [Math.SQRT1_2, Math.SQRT1_2], // Simplified for demo
      '|-i⟩': [Math.SQRT1_2, -Math.SQRT1_2] // Simplified for demo
    };
    return ketMap[ket] || [1, 0];
  };

  // Apply gate matrix to input state
  const applyGateToVector = (matrix: number[][], vector: [number, number]): [number, number] => {
    if (matrix.length !== 2 || matrix[0].length !== 2) return vector;
    return [
      matrix[0][0] * vector[0] + matrix[0][1] * vector[1],
      matrix[1][0] * vector[0] + matrix[1][1] * vector[1]
    ];
  };

  const inputVector = parseKetToVector(inputKet);
  const outputVector = applyGateToVector(gateMatrix, inputVector);
  
  // Convert output vector to Bloch vector
  const [a, b] = outputVector;
  const blochVector = {
    x: 2 * (a * b),
    y: 0, // For real-valued demo; complex would need full formula
    z: a * a - b * b
  };
  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col items-center gap-6 p-6 bg-black/60 rounded-xl border border-blue-900">
      {/* Bloch Sphere Visualization */}
      <div className="w-full flex items-center justify-center mb-4">
        <div className="bg-gray-900/80 border border-border/30 rounded-lg p-3 flex items-center justify-center" style={{ minHeight: 400, minWidth: 400 }}>
          <BlochSphere3D {...sphereProps} vector={blochVector} size={350} />
        </div>
      </div>
      {/* Calculations Section */}
      <div className="w-full bg-background/80 rounded-lg p-4 border border-primary/20 shadow-md">
        <h2 className="text-lg font-bold mb-2 text-blue-300">{gateName} Gate Calculation</h2>
        <div className="mb-2 text-sm text-white">
          <strong>Input State:</strong> {inputKet}
        </div>
        <div className="mb-2 text-sm text-white">
          <strong>Gate Matrix:</strong>
          <pre className="bg-black/30 p-2 rounded text-xs text-blue-200 border border-blue-800 overflow-x-auto">
            {JSON.stringify(gateMatrix, null, 2)}
          </pre>
        </div>
        <div className="mb-2 text-sm text-white">
          <strong>Step-by-Step Calculation:</strong>
          <ol className="list-decimal ml-6">
            {stepCalculations.map((step, idx) => (
              <li key={idx} className="mb-1 text-xs text-blue-100">{step}</li>
            ))}
          </ol>
        </div>
        <div className="mb-2 text-sm text-white">
          <strong>Final State Vector:</strong>
          <span className="ml-2 text-green-300 font-mono">{finalStateVector}</span>
        </div>
      </div>
    </div>
  );
};

export default GateVisualizationPanel;
