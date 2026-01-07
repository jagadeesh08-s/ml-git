// Bloch Sphere Axes Guide for Quantum Gates
// Comprehensive reference for correct gate transformations

export interface BlochTransformation {
  gate: string;
  axis: 'X' | 'Y' | 'Z' | 'Arbitrary';
  angle: number; // in radians
  description: string;
  matrixForm: string;
  blochEffect: string;
  seriesComposition?: string;
  parallelComposition?: string;
}

export const BLOCH_SPHERE_GUIDE: BlochTransformation[] = [
  // Identity Gate
  {
    gate: 'I',
    axis: 'Arbitrary',
    angle: 0,
    description: 'Identity operation - no transformation',
    matrixForm: '[[1, 0], [0, 1]]',
    blochEffect: 'No change to Bloch vector',
    seriesComposition: 'I ⊗ I = I (identity)',
    parallelComposition: 'No effect on multi-qubit states'
  },

  // Pauli Gates
  {
    gate: 'X',
    axis: 'X',
    angle: Math.PI,
    description: 'Bit flip - rotates π radians around X-axis',
    matrixForm: '[[0, 1], [1, 0]]',
    blochEffect: 'Reflects through XZ-plane: (x,y,z) → (x,-y,-z)',
    seriesComposition: 'X ⊗ X = I (global phase)',
    parallelComposition: 'X₁X₂ swaps qubits in computational basis'
  },

  {
    gate: 'Y',
    axis: 'Y',
    angle: Math.PI,
    description: 'Bit and phase flip - rotates π radians around Y-axis',
    matrixForm: '[[0, -i], [i, 0]]',
    blochEffect: 'Reflects through YZ-plane: (x,y,z) → (-x,y,-z)',
    seriesComposition: 'Y ⊗ Y = I (global phase)',
    parallelComposition: 'Y₁Y₂ = -X₁X₂ (relative phase)'
  },

  {
    gate: 'Z',
    axis: 'Z',
    angle: Math.PI,
    description: 'Phase flip - rotates π radians around Z-axis',
    matrixForm: '[[1, 0], [0, -1]]',
    blochEffect: 'Reflects through XY-plane: (x,y,z) → (-x,-y,z)',
    seriesComposition: 'Z ⊗ Z = I (global phase)',
    parallelComposition: 'Z₁Z₂ adds relative phase to |11⟩'
  },

  // Hadamard Gate
  {
    gate: 'H',
    axis: 'Arbitrary',
    angle: Math.PI,
    description: 'Creates superposition - rotates π around axis in XZ-plane',
    matrixForm: '[[1/√2, 1/√2], [1/√2, -1/√2]]',
    blochEffect: 'Rotation by π around (x,z) axis: (x,y,z) → (z,y,-x)',
    seriesComposition: 'H ⊗ H creates 2-qubit superposition',
    parallelComposition: 'H₁H₂ = (1/2)∑ᵢⱼ|i⟩⟨j| ⊗ |i⟩⟨j|'
  },

  // Phase Gates
  {
    gate: 'S',
    axis: 'Z',
    angle: Math.PI / 2,
    description: 'Z-rotation by π/2 - square root of Z',
    matrixForm: '[[1, 0], [0, i]]',
    blochEffect: 'Rotates π/2 around Z-axis: (x,y,z) → (xcosθ-ysinθ, xsinθ+ycosθ, z)',
    seriesComposition: 'S ⊗ S = Z (phase gate)',
    parallelComposition: 'S₁S₂ adds π/2 phase to |11⟩'
  },

  {
    gate: 'T',
    axis: 'Z',
    angle: Math.PI / 4,
    description: 'Z-rotation by π/4 - fourth root of Z',
    matrixForm: '[[1, 0], [0, e^(iπ/4)]]',
    blochEffect: 'Rotates π/4 around Z-axis',
    seriesComposition: 'T ⊗ T = S (π/2 rotation)',
    parallelComposition: 'T₁T₂ adds π/4 phase to |11⟩'
  },

  // Rotation Gates
  {
    gate: 'RX(θ)',
    axis: 'X',
    angle: 0, // Parameterized
    description: 'X-axis rotation by arbitrary angle θ',
    matrixForm: '[[cos(θ/2), -i·sin(θ/2)], [-i·sin(θ/2), cos(θ/2)]]',
    blochEffect: 'Rotates θ around X-axis: (x,y,z) → (x, ycosθ-zsinθ, ysinθ+zcosθ)',
    seriesComposition: 'RX(θ₁)RX(θ₂) = RX(θ₁+θ₂)',
    parallelComposition: 'RX₁(θ)RX₂(θ) rotates each qubit independently'
  },

  {
    gate: 'RY(θ)',
    axis: 'Y',
    angle: 0, // Parameterized
    description: 'Y-axis rotation by arbitrary angle θ',
    matrixForm: '[[cos(θ/2), -sin(θ/2)], [sin(θ/2), cos(θ/2)]]',
    blochEffect: 'Rotates θ around Y-axis: (x,y,z) → (xcosθ+zsinθ, y, -xsinθ+zcosθ)',
    seriesComposition: 'RY(θ₁)RY(θ₂) = RY(θ₁+θ₂)',
    parallelComposition: 'RY₁(θ)RY₂(θ) rotates each qubit independently'
  },

  {
    gate: 'RZ(θ)',
    axis: 'Z',
    angle: 0, // Parameterized
    description: 'Z-axis rotation by arbitrary angle θ',
    matrixForm: '[[e^(-iθ/2), 0], [0, e^(iθ/2)]]',
    blochEffect: 'Rotates θ around Z-axis: (x,y,z) → (xcosθ-ysinθ, xsinθ+ycosθ, z)',
    seriesComposition: 'RZ(θ₁)RZ(θ₂) = RZ(θ₁+θ₂)',
    parallelComposition: 'RZ₁(θ)RZ₂(θ) rotates each qubit independently'
  },

  // Two-Qubit Gates
  {
    gate: 'CNOT',
    axis: 'Arbitrary',
    angle: Math.PI,
    description: 'Controlled-X: flips target if control is |1⟩',
    matrixForm: '4×4 matrix with controlled X operation',
    blochEffect: 'Conditional X rotation on target qubit',
    seriesComposition: 'CNOT₁₂CNOT₁₂ = I (self-inverse)',
    parallelComposition: 'Multi-control operations'
  },

  {
    gate: 'CZ',
    axis: 'Z',
    angle: Math.PI,
    description: 'Controlled-Z: adds phase if both qubits are |1⟩',
    matrixForm: '4×4 matrix with controlled Z operation',
    blochEffect: 'Conditional Z rotation on joint state',
    seriesComposition: 'CZ₁₂CZ₁₂ = I (self-inverse)',
    parallelComposition: 'Multi-control phase operations'
  }
];

// Series Composition Rules
export const SERIES_COMPOSITION_RULES = {
  // Pauli gates
  'XX': 'I (identity with global phase)',
  'YY': 'I (identity with global phase)',
  'ZZ': 'I (identity with global phase)',
  'XY': 'iZ (90° Z rotation)',
  'YX': '-iZ (270° Z rotation)',
  'XZ': '-iY (270° Y rotation)',
  'ZX': 'iY (90° Y rotation)',
  'YZ': 'iX (90° X rotation)',
  'ZY': '-iX (270° X rotation)',

  // Hadamard compositions
  'HH': 'I (identity)',
  'HX': 'HZ (Hadamard then X)',
  'XH': 'ZH (X then Hadamard)',

  // Rotation compositions
  'RX(θ₁)RX(θ₂)': 'RX(θ₁+θ₂)',
  'RY(θ₁)RY(θ₂)': 'RY(θ₁+θ₂)',
  'RZ(θ₁)RZ(θ₂)': 'RZ(θ₁+θ₂)',

  // Mixed rotations
  'RX(π/2)RY(π/2)': 'Arbitrary rotation',
  'RY(π/2)RZ(π/2)': 'Arbitrary rotation'
};

// Parallel Composition Rules (Tensor Products)
export const PARALLEL_COMPOSITION_RULES = {
  // Single qubit operations
  'X₁X₂': 'Flips both qubits',
  'Y₁Y₂': 'Flips both with relative phase',
  'Z₁Z₂': 'Adds phase to |11⟩ state',
  'H₁H₂': 'Creates 2-qubit superposition',

  // Controlled operations
  'CNOT₁₂': 'Control qubit 1, target qubit 2',
  'CNOT₂₁': 'Control qubit 2, target qubit 1',

  // Entangling operations
  'CNOT₁₂H₁': 'Creates Bell state |Φ⁺⟩',
  'CNOT₁₂X₁': 'Creates Bell state |Ψ⁺⟩'
};

// Bloch Sphere Coordinate System
export const BLOCH_COORDINATES = {
  northPole: { x: 0, y: 0, z: 1 },  // |0⟩ state
  southPole: { x: 0, y: 0, z: -1 }, // |1⟩ state
  xAxis: { x: 1, y: 0, z: 0 },      // |+⟩ state
  yAxis: { x: 0, y: 1, z: 0 },      // |+i⟩ state
  xyPlane: { x: 1/Math.sqrt(2), y: 1/Math.sqrt(2), z: 0 }, // Equal superposition in XY
  equatorial: { x: 1/Math.sqrt(2), y: 0, z: 1/Math.sqrt(2) } // |0⟩ + |1⟩ superposition
};

// Common Gate Sequences and Their Effects
export const GATE_SEQUENCES = {
  'HZH': {
    description: 'Hadamard-Z-Hadamard sequence',
    effect: 'X → X, Y → -Y, Z → -Z (π rotation around X-axis)',
    blochTransform: '180° rotation around X-axis'
  },

  'HYH': {
    description: 'Hadamard-Y-Hadamard sequence',
    effect: '|0⟩ → |1⟩, |1⟩ → |0⟩ (equivalent to Z gate)',
    blochTransform: '180° rotation around Y-axis'
  },

  'XZX': {
    description: 'X-Z-X sequence',
    effect: 'Equivalent to -iY rotation',
    blochTransform: '270° rotation around Y-axis'
  },

  'RXRX': {
    description: 'Two RX rotations',
    effect: 'RX(θ₁)RX(θ₂) = RX(θ₁+θ₂)',
    blochTransform: 'Combined X-axis rotation'
  }
};

// Function to get gate information
export const getGateInfo = (gateName: string): BlochTransformation | undefined => {
  return BLOCH_SPHERE_GUIDE.find(gate => gate.gate === gateName);
};

// Function to calculate combined effect of gate sequence
export const calculateSequenceEffect = (gates: string[]): string => {
  if (gates.length === 0) return 'Identity';

  // Simple composition rules
  if (gates.length === 2) {
    const sequence = gates.join('');
    return SERIES_COMPOSITION_RULES[sequence as keyof typeof SERIES_COMPOSITION_RULES] || 'Complex composition';
  }

  if (gates.length === 3 && gates.join('') === 'HZH') {
    return 'X-axis π rotation (X→X, Y→-Y, Z→-Z)';
  }

  if (gates.length === 3 && gates.join('') === 'HYH') {
    return 'Y-axis π rotation (equivalent to Z gate)';
  }

  return 'Multi-gate sequence - requires matrix multiplication';
};

// Export for use in components
export default BLOCH_SPHERE_GUIDE;