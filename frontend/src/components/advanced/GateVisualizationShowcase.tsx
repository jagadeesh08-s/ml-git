import React from 'react';
import GateVisualizationPanel from './GateVisualizationPanel';

// Example data for three gates
const visualizations = [
  {
    gateName: 'Pauli-X',
    inputKet: '|0⟩',
    gateMatrix: [[0, 1], [1, 0]],
    stepCalculations: [
      'Apply X to |0⟩: X|0⟩ = |1⟩',
      'Matrix multiplication: [[0,1],[1,0]] * [1,0] = [0,1]',
      'Result: |1⟩'
    ],
    finalStateVector: '[0, 1]',
    sphereProps: { vector: { x: 0, y: 0, z: -1 } }
  },
  {
    gateName: 'Hadamard',
    inputKet: '|0⟩',
    gateMatrix: [[1/Math.sqrt(2), 1/Math.sqrt(2)], [1/Math.sqrt(2), -1/Math.sqrt(2)]],
    stepCalculations: [
      'Apply H to |0⟩: H|0⟩ = (|0⟩ + |1⟩)/√2',
      'Matrix multiplication: [[1/√2,1/√2],[1/√2,-1/√2]] * [1,0] = [1/√2,1/√2]',
      'Result: (|0⟩ + |1⟩)/√2'
    ],
    finalStateVector: '[0.707, 0.707]',
    sphereProps: { vector: { x: 1, y: 0, z: 0 } }
  },
  {
    gateName: 'Pauli-Z',
    inputKet: '|1⟩',
    gateMatrix: [[1, 0], [0, -1]],
    stepCalculations: [
      'Apply Z to |1⟩: Z|1⟩ = -|1⟩',
      'Matrix multiplication: [[1,0],[0,-1]] * [0,1] = [0,-1]',
      'Result: -|1⟩'
    ],
    finalStateVector: '[0, -1]',
    sphereProps: { vector: { x: 0, y: 0, z: -1 } }
  }
];

const GateVisualizationShowcase: React.FC = () => {
  return (
    <div className="w-full flex flex-col gap-10 items-center py-8">
      {visualizations.map((viz, idx) => (
        <GateVisualizationPanel key={idx} {...viz} />
      ))}
    </div>
  );
};

export default GateVisualizationShowcase;
