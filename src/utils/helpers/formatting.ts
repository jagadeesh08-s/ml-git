// Formatting Helper Functions
// Utility functions for formatting quantum data for display

import type { Complex } from '../core/complex';

// Format complex number for display
export function formatComplexNumber(value: number | Complex, precision: number = 3): string {
  if (typeof value === 'number') {
    if (Number.isInteger(value)) {
      return value.toString();
    }
    return value.toFixed(precision);
  }

  const { real, imag } = value;

  // Handle special cases
  if (Math.abs(real) < 1e-10 && Math.abs(imag) < 1e-10) {
    return '0';
  }

  if (Math.abs(real) < 1e-10) {
    if (Math.abs(imag - 1) < 1e-10) return 'i';
    if (Math.abs(imag + 1) < 1e-10) return '-i';
    return `${imag.toFixed(precision)}i`;
  }

  if (Math.abs(imag) < 1e-10) {
    return real.toFixed(precision);
  }

  // Format real + imag i
  const realStr = real.toFixed(precision);
  const imagStr = Math.abs(imag) === 1 ? '' : Math.abs(imag).toFixed(precision);
  const sign = imag >= 0 ? '+' : '-';

  return `${realStr} ${sign} ${imagStr}i`;
}

// Format matrix for display
export function formatMatrix(matrix: number[][] | Complex[][], maxRows: number = 8): string {
  if (!matrix || matrix.length === 0) return '[]';

  const displayMatrix = matrix.slice(0, maxRows);
  const rows = displayMatrix.map(row =>
    row.map(cell => formatComplexNumber(cell, 2)).join('  ')
  );

  let result = '[\n';
  result += rows.map(row => `  [${row}]`).join(',\n');
  result += '\n]';

  if (matrix.length > maxRows) {
    result += `\n... (${matrix.length - maxRows} more rows)`;
  }

  return result;
}

// Format probability for display
export function formatProbability(prob: number, showPercent: boolean = false): string {
  if (showPercent) {
    return `${(prob * 100).toFixed(1)}%`;
  }
  return prob.toFixed(4);
}

// Format angle in degrees or radians
export function formatAngle(angle: number, inDegrees: boolean = false): string {
  if (inDegrees) {
    const degrees = (angle * 180) / Math.PI;
    return `${degrees.toFixed(1)}°`;
  }
  return `${angle.toFixed(3)} rad`;
}

// Format ket state for display
export function formatKetState(state: number[] | Complex[], maxLength: number = 8): string {
  if (!state || state.length === 0) return '|⟩';

  const displayState = state.slice(0, maxLength);
  const terms: string[] = [];

  for (let i = 0; i < displayState.length; i++) {
    const amplitude = displayState[i];

    // Skip very small amplitudes
    if (typeof amplitude === 'number' && Math.abs(amplitude) < 1e-6) continue;
    if (typeof amplitude === 'object' && Math.sqrt(amplitude.real ** 2 + amplitude.imag ** 2) < 1e-6) continue;

    const coeff = formatComplexNumber(amplitude, 3);
    const basis = `|${i.toString(2).padStart(Math.log2(state.length), '0')}⟩`;

    if (coeff === '1') {
      terms.push(basis);
    } else if (coeff === '-1') {
      terms.push(`-${basis}`);
    } else {
      terms.push(`${coeff}${basis}`);
    }
  }

  if (terms.length === 0) return '|0⟩';

  let result = terms.join(' + ');

  if (state.length > maxLength) {
    result += ` + ... (${state.length - maxLength} terms)`;
  }

  return result;
}

// Format time duration
export function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms.toFixed(0)}ms`;
  } else if (ms < 60000) {
    return `${(ms / 1000).toFixed(1)}s`;
  } else {
    return `${(ms / 60000).toFixed(1)}min`;
  }
}

// Format file size
export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

// Format quantum gate name with parameters
export function formatGateName(gate: any): string {
  if (!gate || !gate.name) return 'Unknown Gate';

  let name = gate.name;

  if (gate.parameters) {
    if (gate.parameters.angle !== undefined) {
      name += `(${formatAngle(gate.parameters.angle, true)})`;
    } else if (gate.parameters.phi !== undefined) {
      name += `(${formatAngle(gate.parameters.phi, true)})`;
    } else if (gate.parameters.theta !== undefined) {
      name += `(${formatAngle(gate.parameters.theta, true)})`;
    }
  }

  return name;
}

// Format qubit indices
export function formatQubitIndices(qubits: number[]): string {
  if (!qubits || qubits.length === 0) return '';
  if (qubits.length === 1) return `qubit ${qubits[0]}`;
  return `qubits ${qubits.join(', ')}`;
}