// Quantum-specific WebGL compute shaders for GPU-accelerated visualizations
// Implements Bloch vector calculations, state evolution, entanglement patterns, and density matrix rendering

import { ShaderProgram, WebGLComputeManager, ComputeResult } from './webglComputeShaders';

// Bloch Vector Calculation Shader
// Converts quantum state amplitudes to Bloch sphere coordinates
export const blochVectorShader: ShaderProgram = {
  vertexShader: `
    attribute vec2 a_position;
    void main() {
      gl_Position = vec4(a_position, 0.0, 1.0);
    }
  `,
  fragmentShader: `
    precision highp float;
    uniform vec2 u_amplitudes; // [real(|0⟩), real(|1⟩)]
    uniform vec2 u_phases;     // [phase(|0⟩), phase(|1⟩)]

    void main() {
      // Extract amplitudes and phases
      float a0_real = u_amplitudes.x;
      float a1_real = u_amplitudes.y;
      float phi0 = u_phases.x;
      float phi1 = u_phases.y;

      // Compute complex amplitudes
      vec2 a0 = vec2(a0_real * cos(phi0), a0_real * sin(phi0));
      vec2 a1 = vec2(a1_real * cos(phi1), a1_real * sin(phi1));

      // Normalize
      float norm = sqrt(dot(a0, a0) + dot(a1, a1));
      a0 /= norm;
      a1 /= norm;

      // Bloch vector components
      float x = 2.0 * (a0.x * a1.x + a0.y * a1.y);
      float y = 2.0 * (a0.x * a1.y - a0.y * a1.x);
      float z = dot(a0, a0) - dot(a1, a1);

      // Output Bloch vector (encoded in RGBA)
      gl_FragColor = vec4(x, y, z, 1.0);
    }
  `,
  uniforms: {}
};

// Quantum State Evolution Shader
// Simulates time evolution of quantum states under Hamiltonian
export const stateEvolutionShader: ShaderProgram = {
  vertexShader: `
    attribute vec2 a_position;
    void main() {
      gl_Position = vec4(a_position, 0.0, 1.0);
    }
  `,
  fragmentShader: `
    precision highp float;
    uniform float u_time;
    uniform vec2 u_initialState; // [theta, phi] for initial Bloch vector
    uniform vec3 u_hamiltonian;  // [Hx, Hy, Hz] magnetic field components
    uniform float u_gamma;       // gyromagnetic ratio

    // Rotation matrices for evolution
    mat3 rotationX(float angle) {
      float c = cos(angle);
      float s = sin(angle);
      return mat3(1.0, 0.0, 0.0, 0.0, c, -s, 0.0, s, c);
    }

    mat3 rotationY(float angle) {
      float c = cos(angle);
      float s = sin(angle);
      return mat3(c, 0.0, s, 0.0, 1.0, 0.0, -s, 0.0, c);
    }

    mat3 rotationZ(float angle) {
      float c = cos(angle);
      float s = sin(angle);
      return mat3(c, -s, 0.0, s, c, 0.0, 0.0, 0.0, 1.0);
    }

    void main() {
      // Initial Bloch vector
      float theta = u_initialState.x;
      float phi = u_initialState.y;
      vec3 bloch = vec3(
        sin(theta) * cos(phi),
        sin(theta) * sin(phi),
        cos(theta)
      );

      // Evolution operators (simplified magnetic field evolution)
      float omega_x = u_gamma * u_hamiltonian.x;
      float omega_y = u_gamma * u_hamiltonian.y;
      float omega_z = u_gamma * u_hamiltonian.z;

      // Apply rotations
      vec3 evolved = rotationZ(omega_z * u_time) *
                    rotationY(omega_y * u_time) *
                    rotationX(omega_x * u_time) * bloch;

      // Output evolved Bloch vector
      gl_FragColor = vec4(evolved, 1.0);
    }
  `,
  uniforms: {}
};

// Entanglement Pattern Rendering Shader
// Visualizes quantum correlations and entanglement patterns
export const entanglementShader: ShaderProgram = {
  vertexShader: `
    attribute vec2 a_position;
    varying vec2 v_uv;
    void main() {
      v_uv = a_position * 0.5 + 0.5;
      gl_Position = vec4(a_position, 0.0, 1.0);
    }
  `,
  fragmentShader: `
    precision highp float;
    varying vec2 v_uv;
    uniform float u_time;
    uniform float u_entanglementStrength;
    uniform vec2 u_correlationMatrix[4]; // 2x2 correlation matrix

    // Complex number operations
    vec2 mul(vec2 a, vec2 b) {
      return vec2(a.x * b.x - a.y * b.y, a.x * b.y + a.y * b.x);
    }

    float abs2(vec2 z) {
      return dot(z, z);
    }

    void main() {
      vec2 pos = v_uv * 2.0 - 1.0;

      // Create entangled state visualization
      // Bell state: (|00⟩ + |11⟩)/√2
      vec2 psi00 = vec2(1.0/sqrt(2.0), 0.0);
      vec2 psi11 = vec2(1.0/sqrt(2.0), 0.0);

      // Apply correlations
      float correlation = u_correlationMatrix[0].x * pos.x * pos.x +
                         u_correlationMatrix[1].x * pos.x * pos.y +
                         u_correlationMatrix[2].x * pos.y * pos.x +
                         u_correlationMatrix[3].x * pos.y * pos.y;

      // Entanglement pattern
      float pattern = sin(pos.x * 10.0 + u_time) * sin(pos.y * 10.0 + u_time);
      pattern *= u_entanglementStrength;

      // Probability density
      float density = abs2(psi00) + abs2(psi11) + correlation + pattern;

      // Color based on entanglement strength
      vec3 color = mix(
        vec3(0.2, 0.4, 0.8), // Low entanglement
        vec3(0.8, 0.2, 0.4), // High entanglement
        density * 0.5 + 0.5
      );

      gl_FragColor = vec4(color, density * 0.3);
    }
  `,
  uniforms: {}
};

// Density Matrix Visualization Shader
// Renders density matrix as a 3D surface or heatmap
export const densityMatrixShader: ShaderProgram = {
  vertexShader: `
    attribute vec2 a_position;
    varying vec2 v_uv;
    void main() {
      v_uv = a_position * 0.5 + 0.5;
      gl_Position = vec4(a_position, 0.0, 1.0);
    }
  `,
  fragmentShader: `
    precision highp float;
    varying vec2 v_uv;
    uniform mat4 u_densityMatrix; // 4x4 density matrix for 2-qubit system
    uniform float u_time;
    uniform int u_visualizationMode; // 0: surface, 1: heatmap, 2: eigenvalues

    // Matrix operations
    float trace(mat4 m) {
      return m[0][0] + m[1][1] + m[2][2] + m[3][3];
    }

    vec4 eigenvalues(mat4 m) {
      // Simplified eigenvalue calculation for 2x2 blocks
      // This is an approximation for visualization purposes
      float a = m[0][0];
      float b = m[0][1];
      float c = m[1][0];
      float d = m[1][1];

      float trace = a + d;
      float det = a * d - b * c;
      float discriminant = trace * trace - 4.0 * det;

      if (discriminant >= 0.0) {
        float sqrtD = sqrt(discriminant);
        float lambda1 = (trace + sqrtD) * 0.5;
        float lambda2 = (trace - sqrtD) * 0.5;
        return vec4(lambda1, lambda2, 0.0, 0.0);
      } else {
        return vec4(0.0, 0.0, 0.0, 0.0);
      }
    }

    void main() {
      vec2 pos = v_uv * 2.0 - 1.0;

      if (u_visualizationMode == 0) {
        // Surface plot
        float height = 0.0;

        // Sample density matrix elements
        height += u_densityMatrix[0][0] * (1.0 - pos.x) * (1.0 - pos.y);
        height += u_densityMatrix[0][1] * (1.0 - pos.x) * pos.y;
        height += u_densityMatrix[1][0] * pos.x * (1.0 - pos.y);
        height += u_densityMatrix[1][1] * pos.x * pos.y;

        // Add some animation
        height += sin(pos.x * 5.0 + u_time) * sin(pos.y * 5.0 + u_time) * 0.1;

        vec3 color = vec3(height * 0.5 + 0.5);
        gl_FragColor = vec4(color, 1.0);

      } else if (u_visualizationMode == 1) {
        // Heatmap
        float intensity = 0.0;

        // Matrix element at position
        int i = int(pos.x * 2.0);
        int j = int(pos.y * 2.0);

        if (i == 0 && j == 0) intensity = u_densityMatrix[0][0];
        else if (i == 0 && j == 1) intensity = u_densityMatrix[0][1];
        else if (i == 1 && j == 0) intensity = u_densityMatrix[1][0];
        else if (i == 1 && j == 1) intensity = u_densityMatrix[1][1];

        vec3 color = mix(vec3(0.0, 0.0, 1.0), vec3(1.0, 0.0, 0.0), intensity);
        gl_FragColor = vec4(color, 1.0);

      } else {
        // Eigenvalue visualization
        vec4 eigenvals = eigenvalues(u_densityMatrix);

        float dist1 = length(pos - vec2(-0.5, 0.5));
        float dist2 = length(pos - vec2(0.5, -0.5));

        float value = exp(-dist1 * 10.0) * eigenvals.x +
                     exp(-dist2 * 10.0) * eigenvals.y;

        vec3 color = vec3(value);
        gl_FragColor = vec4(color, 1.0);
      }
    }
  `,
  uniforms: {}
};

// Quantum Visualization Compute Class
export class QuantumComputeShaders {
  private manager: WebGLComputeManager;

  constructor(manager: WebGLComputeManager) {
    this.manager = manager;
    this.initializeShaders();
  }

  private initializeShaders(): void {
    // Register all quantum shaders
    this.manager.registerProgram('blochVector', blochVectorShader.vertexShader, blochVectorShader.fragmentShader);
    this.manager.registerProgram('stateEvolution', stateEvolutionShader.vertexShader, stateEvolutionShader.fragmentShader);
    this.manager.registerProgram('entanglement', entanglementShader.vertexShader, entanglementShader.fragmentShader);
    this.manager.registerProgram('densityMatrix', densityMatrixShader.vertexShader, densityMatrixShader.fragmentShader);
  }

  // Compute Bloch vector from quantum state amplitudes
  computeBlochVector(amplitudes: [number, number], phases: [number, number]): { x: number; y: number; z: number } | null {
    const result = this.manager.compute('blochVector', 1, 1, {
      u_amplitudes: new Float32Array(amplitudes),
      u_phases: new Float32Array(phases)
    });

    if (!result) return null;

    return {
      x: result.data[0],
      y: result.data[1],
      z: result.data[2]
    };
  }

  // Compute state evolution over time
  computeStateEvolution(
    initialState: [number, number], // [theta, phi]
    hamiltonian: [number, number, number], // [Hx, Hy, Hz]
    time: number,
    gamma: number = 1.0
  ): { x: number; y: number; z: number } | null {
    const result = this.manager.compute('stateEvolution', 1, 1, {
      u_time: time,
      u_initialState: new Float32Array(initialState),
      u_hamiltonian: new Float32Array(hamiltonian),
      u_gamma: gamma
    });

    if (!result) return null;

    return {
      x: result.data[0],
      y: result.data[1],
      z: result.data[2]
    };
  }

  // Compute entanglement pattern texture
  computeEntanglementPattern(
    width: number,
    height: number,
    time: number,
    entanglementStrength: number,
    correlationMatrix: number[][]
  ): ComputeResult | null {
    // Flatten correlation matrix
    const flatMatrix = correlationMatrix.flat();

    return this.manager.compute('entanglement', width, height, {
      u_time: time,
      u_entanglementStrength: entanglementStrength,
      u_correlationMatrix: new Float32Array(flatMatrix)
    });
  }

  // Compute density matrix visualization
  computeDensityMatrixVisualization(
    width: number,
    height: number,
    densityMatrix: number[][],
    time: number,
    mode: number = 0 // 0: surface, 1: heatmap, 2: eigenvalues
  ): ComputeResult | null {
    // Convert 2D array to flat array for 4x4 matrix
    const flatMatrix = new Array(16).fill(0);
    for (let i = 0; i < Math.min(4, densityMatrix.length); i++) {
      for (let j = 0; j < Math.min(4, densityMatrix[i].length); j++) {
        flatMatrix[i * 4 + j] = densityMatrix[i][j];
      }
    }

    return this.manager.compute('densityMatrix', width, height, {
      u_densityMatrix: flatMatrix,
      u_time: time,
      u_visualizationMode: mode
    });
  }
}