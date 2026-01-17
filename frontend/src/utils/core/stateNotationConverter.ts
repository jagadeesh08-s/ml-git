// State Notation Converter Utility
// Handles conversion between different quantum state representations

export type NotationType = 'binary' | 'decimal' | 'ket' | 'bra' | 'superposition';

export interface QuantumState {
  amplitudes: (number | { real: number; imag: number })[];
  basis: string[];
  probabilities: number[];
  notation: NotationType;
  numQubits: number;
}

export interface StateConversionResult {
  success: boolean;
  state?: QuantumState;
  error?: string;
}

// Complex number utilities
export const complex = {
  add: (a: { real: number; imag: number }, b: { real: number; imag: number }) => ({
    real: a.real + b.real,
    imag: a.imag + b.imag
  }),
  multiply: (a: { real: number; imag: number }, b: { real: number; imag: number }) => ({
    real: a.real * b.real - a.imag * b.imag,
    imag: a.real * b.imag + a.imag * b.real
  }),
  magnitude: (c: { real: number; imag: number }) => Math.sqrt(c.real * c.real + c.imag * c.imag),
  conjugate: (c: { real: number; imag: number }) => ({ real: c.real, imag: -c.imag })
};

// Parse complex number from string
export const parseComplex = (str: string): { real: number; imag: number } | null => {
  const trimmed = str.trim();

  // Handle pure real numbers
  if (!isNaN(Number(trimmed))) {
    return { real: Number(trimmed), imag: 0 };
  }

  // Handle 'i' notation (e.g., "2i", "i", "-i")
  if (trimmed === 'i') return { real: 0, imag: 1 };
  if (trimmed === '-i') return { real: 0, imag: -1 };

  const iMatch = trimmed.match(/^([+-]?\d*\.?\d*)i$/);
  if (iMatch) {
    const coeff = iMatch[1] === '' || iMatch[1] === '+' ? 1 : iMatch[1] === '-' ? -1 : Number(iMatch[1]);
    return { real: 0, imag: coeff };
  }

  // Handle complex notation (e.g., "1+2i", "3-4i", "5i+2")
  const complexMatch = trimmed.match(/^([+-]?\d*\.?\d*)([+-]\d*\.?\d*)i?$/);
  if (complexMatch) {
    let real = 0, imag = 0;
    const part1 = complexMatch[1];
    const part2 = complexMatch[2];

    if (part1 && !part1.includes('i')) {
      real = Number(part1);
    }

    if (part2) {
      if (part2.endsWith('i')) {
        imag = Number(part2.slice(0, -1));
      } else {
        imag = Number(part2);
      }
    }

    return { real, imag };
  }

  return null;
};

// Convert binary string to quantum state
export const binaryToState = (binaryStr: string): StateConversionResult => {
  try {
    const bits = binaryStr.split('').map(b => parseInt(b));
    const numQubits = bits.length;
    const totalStates = Math.pow(2, numQubits);

    const amplitudes: (number | { real: number; imag: number })[] = new Array(totalStates).fill(0);
    const basis: string[] = [];
    const probabilities: number[] = new Array(totalStates).fill(0);

    // Generate basis states
    for (let i = 0; i < totalStates; i++) {
      const binary = i.toString(2).padStart(numQubits, '0');
      basis.push(binary);
    }

    // Find the index of the input state
    const stateIndex = parseInt(binaryStr, 2);
    if (stateIndex >= totalStates) {
      return { success: false, error: 'Binary string too long for the number of qubits' };
    }

    amplitudes[stateIndex] = 1;
    probabilities[stateIndex] = 1;

    return {
      success: true,
      state: {
        amplitudes,
        basis,
        probabilities,
        notation: 'binary',
        numQubits
      }
    };
  } catch (error) {
    return { success: false, error: 'Invalid binary string' };
  }
};

// Convert decimal number to quantum state
export const decimalToState = (decimal: number, numQubits: number): StateConversionResult => {
  try {
    const totalStates = Math.pow(2, numQubits);

    if (decimal >= totalStates || decimal < 0) {
      return { success: false, error: `Decimal must be between 0 and ${totalStates - 1}` };
    }

    const amplitudes: (number | { real: number; imag: number })[] = new Array(totalStates).fill(0);
    const basis: string[] = [];
    const probabilities: number[] = new Array(totalStates).fill(0);

    // Generate basis states
    for (let i = 0; i < totalStates; i++) {
      const binary = i.toString(2).padStart(numQubits, '0');
      basis.push(binary);
    }

    amplitudes[decimal] = 1;
    probabilities[decimal] = 1;

    return {
      success: true,
      state: {
        amplitudes,
        basis,
        probabilities,
        notation: 'decimal',
        numQubits
      }
    };
  } catch (error) {
    return { success: false, error: 'Invalid decimal number' };
  }
};

// Convert ket notation to quantum state
export const ketToState = (ketStr: string): StateConversionResult => {
  try {
    const trimmed = ketStr.trim();

    // Handle single qubit states
    if (trimmed === '|0⟩') {
      return binaryToState('0');
    } else if (trimmed === '|1⟩') {
      return binaryToState('1');
    } else if (trimmed === '|+⟩') {
      return superpositionToState('0.707|0⟩ + 0.707|1⟩');
    } else if (trimmed === '|-⟩') {
      return superpositionToState('0.707|0⟩ - 0.707|1⟩');
    } else if (trimmed === '|i⟩') {
      return superpositionToState('0.707|0⟩ + 0.707i|1⟩');
    } else if (trimmed === '|-i⟩') {
      return superpositionToState('0.707|0⟩ - 0.707i|1⟩');
    }

    // Handle multi-qubit states like |01⟩, |10⟩, etc.
    const multiQubitMatch = trimmed.match(/^\|([01]+)⟩$/);
    if (multiQubitMatch) {
      return binaryToState(multiQubitMatch[1]);
    }

    // Handle superposition states
    if (trimmed.includes('+') || trimmed.includes('-')) {
      return superpositionToState(trimmed);
    }

    return { success: false, error: 'Unsupported ket notation' };
  } catch (error) {
    return { success: false, error: 'Invalid ket notation' };
  }
};

// Convert bra notation to quantum state (same as ket but conjugate)
export const braToState = (braStr: string): StateConversionResult => {
  const ketResult = ketToState(braStr.replace('⟨', '|').replace('|', '⟩').replace('⟩', '|'));
  if (!ketResult.success || !ketResult.state) return ketResult;

  // Conjugate amplitudes for bra
  const conjugatedAmplitudes = ketResult.state.amplitudes.map(amp => {
    if (typeof amp === 'number') return amp;
    return complex.conjugate(amp);
  });

  return {
    success: true,
    state: {
      ...ketResult.state,
      amplitudes: conjugatedAmplitudes,
      notation: 'bra'
    }
  };
};

// Convert superposition notation to quantum state
export const superpositionToState = (superpositionStr: string): StateConversionResult => {
  try {
    const trimmed = superpositionStr.trim();

    // Parse terms like "0.707|0⟩ + 0.707|1⟩"
    const terms = trimmed.split(/([+-])/).filter(term => term.trim() && !['+', '-'].includes(term.trim()));

    let amplitudes: (number | { real: number; imag: number })[] = [];
    let numQubits = 0;
    let basis: string[] = [];

    for (let i = 0; i < terms.length; i += 2) {
      const sign = i === 0 ? 1 : (terms[i - 1] === '+' ? 1 : -1);
      const term = terms[i].trim();

      // Parse coefficient and state
      const match = term.match(/^([+-]?\d*\.?\d*(?:i)?)?\|([01]+)⟩$/);
      if (!match) {
        return { success: false, error: `Invalid term: ${term}` };
      }

      const coeffStr = match[1] || '1';
      const stateStr = match[2];

      // Determine number of qubits
      if (numQubits === 0) {
        numQubits = stateStr.length;
        const totalStates = Math.pow(2, numQubits);
        amplitudes = new Array(totalStates).fill(0);
        basis = [];
        for (let j = 0; j < totalStates; j++) {
          basis.push(j.toString(2).padStart(numQubits, '0'));
        }
      } else if (stateStr.length !== numQubits) {
        return { success: false, error: 'All terms must have the same number of qubits' };
      }

      // Parse coefficient
      const coeff = parseComplex(coeffStr);
      if (!coeff) {
        return { success: false, error: `Invalid coefficient: ${coeffStr}` };
      }

      const scaledCoeff = {
        real: coeff.real * sign,
        imag: coeff.imag * sign
      };

      // Add to amplitude
      const stateIndex = parseInt(stateStr, 2);
      if (typeof amplitudes[stateIndex] === 'number') {
        amplitudes[stateIndex] = scaledCoeff;
      } else {
        const existing = amplitudes[stateIndex] as { real: number; imag: number };
        amplitudes[stateIndex] = complex.add(existing, scaledCoeff);
      }
    }

    // Calculate probabilities
    const probabilities = amplitudes.map(amp => {
      if (typeof amp === 'number') return amp * amp;
      return complex.magnitude(amp) ** 2;
    });

    return {
      success: true,
      state: {
        amplitudes,
        basis,
        probabilities,
        notation: 'superposition',
        numQubits
      }
    };
  } catch (error) {
    return { success: false, error: 'Invalid superposition notation' };
  }
};

// Convert quantum state to different notation
export const convertStateNotation = (state: QuantumState, targetNotation: NotationType): string => {
  switch (targetNotation) {
    case 'binary':
      const maxProbIndex = state.probabilities.indexOf(Math.max(...state.probabilities));
      return state.basis[maxProbIndex];

    case 'decimal':
      const maxProbIndexDec = state.probabilities.indexOf(Math.max(...state.probabilities));
      return maxProbIndexDec.toString();

    case 'ket':
      return formatAsKet(state);

    case 'bra':
      return formatAsBra(state);

    case 'superposition':
      return formatAsSuperposition(state);

    default:
      return formatAsKet(state);
  }
};

// Format state as ket notation
const formatAsKet = (state: QuantumState): string => {
  const nonZeroTerms: string[] = [];

  for (let i = 0; i < state.amplitudes.length; i++) {
    const amp = state.amplitudes[i];
    if (typeof amp === 'number') {
      if (Math.abs(amp) > 1e-10) {
        const coeff = formatComplex({ real: amp, imag: 0 });
        nonZeroTerms.push(`${coeff}|${state.basis[i]}⟩`);
      }
    } else {
      if (complex.magnitude(amp) > 1e-10) {
        const coeff = formatComplex(amp);
        nonZeroTerms.push(`${coeff}|${state.basis[i]}⟩`);
      }
    }
  }

  return nonZeroTerms.join(' + ').replace(' + -', ' - ');
};

// Format state as bra notation
const formatAsBra = (state: QuantumState): string => {
  return formatAsKet(state).replace(/\|/g, '⟨').replace(/⟩/g, '|');
};

// Format state as superposition
const formatAsSuperposition = (state: QuantumState): string => {
  return formatAsKet(state);
};

// Format complex number
const formatComplex = (c: { real: number; imag: number }): string => {
  const real = Math.abs(c.real) > 1e-10 ? c.real.toFixed(3) : '';
  const imag = Math.abs(c.imag) > 1e-10 ? c.imag.toFixed(3) : '';

  if (!real && !imag) return '0';

  let result = '';

  if (real) {
    result += real;
  }

  if (imag) {
    if (result && c.imag > 0) result += '+';
    if (imag === '1') {
      result += 'i';
    } else if (imag === '-1') {
      result += '-i';
    } else {
      result += `${imag}i`;
    }
  }

  return result;
};

// Main conversion function
export const convertToState = (input: string, notation: NotationType, numQubits?: number): StateConversionResult => {
  switch (notation) {
    case 'binary':
      return binaryToState(input);
    case 'decimal':
      if (!numQubits) return { success: false, error: 'Number of qubits required for decimal conversion' };
      return decimalToState(parseInt(input), numQubits);
    case 'ket':
      return ketToState(input);
    case 'bra':
      return braToState(input);
    case 'superposition':
      return superpositionToState(input);
    default:
      return { success: false, error: 'Unsupported notation type' };
  }
};

// Validate quantum state (normalization, etc.)
export const validateState = (state: QuantumState): { valid: boolean; error?: string } => {
  // Check normalization
  const totalProb = state.probabilities.reduce((sum, prob) => sum + prob, 0);
  if (Math.abs(totalProb - 1) > 1e-10) {
    return { valid: false, error: `State not normalized. Total probability: ${totalProb.toFixed(6)}` };
  }

  // Check dimensions
  const expectedLength = Math.pow(2, state.numQubits);
  if (state.amplitudes.length !== expectedLength) {
    return { valid: false, error: `Wrong number of amplitudes. Expected ${expectedLength}, got ${state.amplitudes.length}` };
  }

  return { valid: true };
};

// Get common preset states
export const getPresetStates = (numQubits: number = 1) => {
  const presets: { label: string; value: string; notation: NotationType }[] = [];

  if (numQubits === 1) {
    presets.push(
      { label: '|0⟩', value: '|0⟩', notation: 'ket' },
      { label: '|1⟩', value: '|1⟩', notation: 'ket' },
      { label: '|+⟩', value: '|+⟩', notation: 'ket' },
      { label: '|-⟩', value: '|-⟩', notation: 'ket' },
      { label: '|i⟩', value: '|i⟩', notation: 'ket' },
      { label: '|-i⟩', value: '|-i⟩', notation: 'ket' }
    );
  } else {
    // Multi-qubit presets
    const totalStates = Math.pow(2, numQubits);
    for (let i = 0; i < totalStates; i++) {
      const binary = i.toString(2).padStart(numQubits, '0');
      presets.push({
        label: `|${binary}⟩`,
        value: `|${binary}⟩`,
        notation: 'ket'
      });
    }
  }

  return presets;
};
