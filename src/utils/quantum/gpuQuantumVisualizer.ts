// GPU-Accelerated Quantum Visualizer
// Integrates WebGL compute shaders with Three.js for high-performance quantum state visualization

import * as THREE from 'three';
import { GPUAccelerationManager, WebGLComputeManager, PerformanceMonitor } from './webglComputeShaders';
import { QuantumComputeShaders } from './quantumShaders';

export interface QuantumState {
  amplitudes: [number, number];
  phases: [number, number];
  blochVector?: { x: number; y: number; z: number };
}

export interface EvolutionParameters {
  hamiltonian: [number, number, number];
  time: number;
  gamma: number;
}

export interface EntanglementParameters {
  strength: number;
  correlationMatrix: number[][];
}

export interface DensityMatrixData {
  matrix: number[][];
  visualizationMode: 'surface' | 'heatmap' | 'eigenvalues';
}

// GPU-Accelerated Bloch Sphere Renderer
export class GPUBlochSphereRenderer {
  private gpuManager: GPUAccelerationManager;
  private quantumShaders: QuantumComputeShaders;
  private performanceMonitor: PerformanceMonitor;
  private sphereGeometry!: THREE.SphereGeometry;
  private vectorMaterial!: THREE.ShaderMaterial;
  private stateVector!: THREE.Group;
  private textureLoader: THREE.TextureLoader;

  constructor(gpuManager: GPUAccelerationManager) {
    this.gpuManager = gpuManager;
    this.quantumShaders = new QuantumComputeShaders(gpuManager.getComputeManager());
    this.performanceMonitor = gpuManager.getPerformanceMonitor();
    this.textureLoader = new THREE.TextureLoader();

    this.initializeGeometry();
    this.initializeMaterials();
    this.createStateVector();
  }

  private initializeGeometry(): void {
    // High-resolution sphere for smooth rendering
    this.sphereGeometry = new THREE.SphereGeometry(1, 64, 32);
  }

  private initializeMaterials(): void {
    // Custom shader material for GPU-accelerated vector rendering
    this.vectorMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0.0 },
        vector: { value: new THREE.Vector3(0, 0, 1) },
        color: { value: new THREE.Color(0x00ffff) },
        intensity: { value: 1.0 }
      },
      vertexShader: `
        uniform vec3 vector;
        uniform float time;
        varying vec3 vPosition;
        varying vec3 vNormal;

        void main() {
          vPosition = position;
          vNormal = normal;

          // Animate vector position
          vec3 animatedVector = vector;
          animatedVector.x += sin(time * 2.0) * 0.05;
          animatedVector.y += cos(time * 2.0) * 0.05;

          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 color;
        uniform float intensity;
        varying vec3 vPosition;
        varying vec3 vNormal;

        void main() {
          // Quantum-inspired lighting
          float fresnel = pow(1.0 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
          vec3 finalColor = color * (0.5 + fresnel * 0.5) * intensity;

          gl_FragColor = vec4(finalColor, 0.8);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide
    });
  }

  private createStateVector(): void {
    this.stateVector = new THREE.Group();

    // Main vector line
    const lineGeometry = new THREE.BufferGeometry();
    const linePositions = new Float32Array([
      0, 0, 0,  // origin
      0, 0, 1   // tip (will be updated)
    ]);
    lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));

    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0x00ffff,
      linewidth: 3
    });

    const vectorLine = new THREE.Line(lineGeometry, lineMaterial);
    this.stateVector.add(vectorLine);

    // Vector tip (arrow head)
    const coneGeometry = new THREE.ConeGeometry(0.03, 0.1, 8);
    const coneMaterial = new THREE.MeshBasicMaterial({ color: 0x00ffff });
    const arrowTip = new THREE.Mesh(coneGeometry, coneMaterial);
    arrowTip.position.set(0, 0, 0.95);
    this.stateVector.add(arrowTip);

    // State point on sphere surface
    const pointGeometry = new THREE.SphereGeometry(0.02, 8, 8);
    const pointMaterial = new THREE.MeshBasicMaterial({ color: 0x00ffff });
    const statePoint = new THREE.Mesh(pointGeometry, pointMaterial);
    statePoint.position.set(0, 0, 1);
    this.stateVector.add(statePoint);
  }

  // GPU-accelerated Bloch vector computation
  computeBlochVector(state: QuantumState): { x: number; y: number; z: number } | null {
    if (!this.gpuManager.isGPUEnabled()) {
      // CPU fallback
      this.performanceMonitor.startMeasurement('cpu_compute');
      const result = this.computeBlochVectorCPU(state);
      this.performanceMonitor.endMeasurement('cpu_compute');
      return result;
    }

    this.performanceMonitor.startMeasurement('gpu_compute');
    const result = this.quantumShaders.computeBlochVector(state.amplitudes, state.phases);
    this.performanceMonitor.endMeasurement('gpu_compute');

    return result;
  }

  private computeBlochVectorCPU(state: QuantumState): { x: number; y: number; z: number } {
    const [a0_real, a1_real] = state.amplitudes;
    const [phi0, phi1] = state.phases;

    // Complex amplitudes
    const a0 = { real: a0_real * Math.cos(phi0), imag: a0_real * Math.sin(phi0) };
    const a1 = { real: a1_real * Math.cos(phi1), imag: a1_real * Math.sin(phi1) };

    // Normalization
    const norm = Math.sqrt(a0.real * a0.real + a0.imag * a0.imag + a1.real * a1.real + a1.imag * a1.imag);
    const a0_norm = { real: a0.real / norm, imag: a0.imag / norm };
    const a1_norm = { real: a1.real / norm, imag: a1.imag / norm };

    // Bloch vector
    const x = 2 * (a0_norm.real * a1_norm.real + a0_norm.imag * a1_norm.imag);
    const y = 2 * (a0_norm.real * a1_norm.imag - a0_norm.imag * a1_norm.real);
    const z = (a0_norm.real * a0_norm.real + a0_norm.imag * a0_norm.imag) -
              (a1_norm.real * a1_norm.real + a1_norm.imag * a1_norm.imag);

    return { x, y, z };
  }

  // Update state vector visualization
  updateStateVector(blochVector: { x: number; y: number; z: number }, time: number = 0): void {
    // Update line geometry
    const line = this.stateVector.children[0] as THREE.Line;
    const positions = line.geometry.attributes.position.array as Float32Array;
    positions[3] = blochVector.x; // tip x
    positions[4] = blochVector.y; // tip y
    positions[5] = blochVector.z; // tip z
    line.geometry.attributes.position.needsUpdate = true;

    // Update arrow tip position
    const arrowTip = this.stateVector.children[1] as THREE.Mesh;
    const length = Math.sqrt(blochVector.x ** 2 + blochVector.y ** 2 + blochVector.z ** 2);
    if (length > 0) {
      arrowTip.position.set(
        blochVector.x * 0.9,
        blochVector.y * 0.9,
        blochVector.z * 0.9
      );

      // Orient arrow tip toward the vector direction
      arrowTip.lookAt(blochVector.x, blochVector.y, blochVector.z);
    }

    // Update state point
    const statePoint = this.stateVector.children[2] as THREE.Mesh;
    statePoint.position.set(blochVector.x, blochVector.y, blochVector.z);

    // Update shader uniforms
    this.vectorMaterial.uniforms.vector.value.copy(blochVector as THREE.Vector3);
    this.vectorMaterial.uniforms.time.value = time;
  }

  getStateVector(): THREE.Group {
    return this.stateVector;
  }

  dispose(): void {
    this.sphereGeometry.dispose();
    this.vectorMaterial.dispose();
    this.stateVector.children.forEach(child => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (child.material instanceof THREE.Material) {
          child.material.dispose();
        }
      }
    });
  }
}

// GPU-Accelerated State Evolution Renderer
export class GPUStateEvolutionRenderer {
  private gpuManager: GPUAccelerationManager;
  private quantumShaders: QuantumComputeShaders;
  private performanceMonitor: PerformanceMonitor;
  private evolutionPath!: THREE.Line;
  private currentPosition!: THREE.Mesh;

  constructor(gpuManager: GPUAccelerationManager) {
    this.gpuManager = gpuManager;
    this.quantumShaders = new QuantumComputeShaders(gpuManager.getComputeManager());
    this.performanceMonitor = gpuManager.getPerformanceMonitor();

    this.initializeEvolutionVisualization();
  }

  private initializeEvolutionVisualization(): void {
    // Evolution path line
    const pathGeometry = new THREE.BufferGeometry();
    const pathMaterial = new THREE.LineBasicMaterial({
      color: 0xff6b35,
      linewidth: 2,
      transparent: true,
      opacity: 0.7
    });
    this.evolutionPath = new THREE.Line(pathGeometry, pathMaterial);

    // Current position indicator
    const pointGeometry = new THREE.SphereGeometry(0.03, 8, 8);
    const pointMaterial = new THREE.MeshBasicMaterial({
      color: 0xff6b35,
      transparent: true,
      opacity: 0.9
    });
    this.currentPosition = new THREE.Mesh(pointGeometry, pointMaterial);
  }

  // GPU-accelerated state evolution computation
  computeEvolution(
    initialState: [number, number],
    parameters: EvolutionParameters
  ): { x: number; y: number; z: number } | null {
    if (!this.gpuManager.isGPUEnabled()) {
      this.performanceMonitor.startMeasurement('cpu_compute');
      const result = this.computeEvolutionCPU(initialState, parameters);
      this.performanceMonitor.endMeasurement('cpu_compute');
      return result;
    }

    this.performanceMonitor.startMeasurement('gpu_compute');
    const result = this.quantumShaders.computeStateEvolution(
      initialState,
      parameters.hamiltonian,
      parameters.time,
      parameters.gamma
    );
    this.performanceMonitor.endMeasurement('gpu_compute');

    return result;
  }

  private computeEvolutionCPU(
    initialState: [number, number],
    parameters: EvolutionParameters
  ): { x: number; y: number; z: number } {
    const [theta, phi] = initialState;
    const [Hx, Hy, Hz] = parameters.hamiltonian;
    const { time, gamma } = parameters;

    // Initial Bloch vector
    let x = Math.sin(theta) * Math.cos(phi);
    let y = Math.sin(theta) * Math.sin(phi);
    let z = Math.cos(theta);

    // Simplified evolution under magnetic field
    const omega_x = gamma * Hx;
    const omega_y = gamma * Hy;
    const omega_z = gamma * Hz;

    // Apply rotations (simplified - actual quantum evolution is more complex)
    const cos_omega_z = Math.cos(omega_z * time);
    const sin_omega_z = Math.sin(omega_z * time);

    const x_new = x * cos_omega_z - y * sin_omega_z;
    const y_new = x * sin_omega_z + y * cos_omega_z;
    const z_new = z; // Z rotation doesn't affect z-component in this approximation

    return { x: x_new, y: y_new, z: z_new };
  }

  // Update evolution path visualization
  updateEvolutionPath(pathPoints: Array<{ x: number; y: number; z: number }>): void {
    const positions = new Float32Array(pathPoints.length * 3);
    pathPoints.forEach((point, i) => {
      positions[i * 3] = point.x;
      positions[i * 3 + 1] = point.y;
      positions[i * 3 + 2] = point.z;
    });

    this.evolutionPath.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.evolutionPath.geometry.attributes.position.needsUpdate = true;

    // Update current position
    if (pathPoints.length > 0) {
      const current = pathPoints[pathPoints.length - 1];
      this.currentPosition.position.set(current.x, current.y, current.z);
    }
  }

  getEvolutionPath(): THREE.Line {
    return this.evolutionPath;
  }

  getCurrentPosition(): THREE.Mesh {
    return this.currentPosition;
  }

  dispose(): void {
    this.evolutionPath.geometry.dispose();
    if (this.evolutionPath.material instanceof THREE.Material) {
      this.evolutionPath.material.dispose();
    }
    this.currentPosition.geometry.dispose();
    if (this.currentPosition.material instanceof THREE.Material) {
      this.currentPosition.material.dispose();
    }
  }
}

// GPU-Accelerated Entanglement Renderer
export class GPUEntanglementRenderer {
  private gpuManager: GPUAccelerationManager;
  private quantumShaders: QuantumComputeShaders;
  private performanceMonitor: PerformanceMonitor;
  private entanglementMesh!: THREE.Mesh;
  private texture: THREE.DataTexture | null = null;

  constructor(gpuManager: GPUAccelerationManager) {
    this.gpuManager = gpuManager;
    this.quantumShaders = new QuantumComputeShaders(gpuManager.getComputeManager());
    this.performanceMonitor = gpuManager.getPerformanceMonitor();

    this.initializeEntanglementVisualization();
  }

  private initializeEntanglementVisualization(): void {
    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide
    });

    this.entanglementMesh = new THREE.Mesh(geometry, material);
  }

  // GPU-accelerated entanglement pattern computation
  computeEntanglementPattern(
    width: number,
    height: number,
    time: number,
    parameters: EntanglementParameters
  ): boolean {
    if (!this.gpuManager.isGPUEnabled()) {
      this.performanceMonitor.startMeasurement('cpu_compute');
      const success = this.computeEntanglementPatternCPU(width, height, time, parameters);
      this.performanceMonitor.endMeasurement('cpu_compute');
      return success;
    }

    this.performanceMonitor.startMeasurement('gpu_compute');
    const result = this.quantumShaders.computeEntanglementPattern(
      width,
      height,
      time,
      parameters.strength,
      parameters.correlationMatrix
    );
    this.performanceMonitor.endMeasurement('gpu_compute');

    if (result) {
      this.updateTexture(result);
      return true;
    }

    return false;
  }

  private computeEntanglementPatternCPU(
    width: number,
    height: number,
    time: number,
    parameters: EntanglementParameters
  ): boolean {
    const data = new Uint8Array(width * height * 4);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const u = x / width;
        const v = y / height;
        const posX = u * 2 - 1;
        const posY = v * 2 - 1;

        // Simple entanglement pattern
        const pattern = Math.sin(posX * 10 + time) * Math.sin(posY * 10 + time);
        const intensity = (pattern * parameters.strength + 1) * 0.5;

        const i = (y * width + x) * 4;
        data[i] = Math.floor(255 * intensity * 0.5);     // R
        data[i + 1] = Math.floor(255 * intensity * 0.7); // G
        data[i + 2] = Math.floor(255 * intensity);       // B
        data[i + 3] = Math.floor(255 * intensity * 0.8); // A
      }
    }

    this.updateTextureFromData(data, width, height);
    return true;
  }

  private updateTexture(result: any): void {
    // Convert compute result to texture data
    const data = new Uint8Array(result.width * result.height * 4);
    for (let i = 0; i < result.data.length; i++) {
      const value = Math.max(0, Math.min(1, result.data[i]));
      data[i * 4] = Math.floor(value * 255);     // R
      data[i * 4 + 1] = Math.floor(value * 255); // G
      data[i * 4 + 2] = Math.floor(value * 255); // B
      data[i * 4 + 3] = Math.floor(value * 128); // A
    }

    this.updateTextureFromData(data, result.width, result.height);
  }

  private updateTextureFromData(data: Uint8Array, width: number, height: number): void {
    if (this.texture) {
      this.texture.dispose();
    }

    this.texture = new THREE.DataTexture(data, width, height, THREE.RGBAFormat);
    this.texture.needsUpdate = true;

    (this.entanglementMesh.material as THREE.MeshBasicMaterial).map = this.texture;
    (this.entanglementMesh.material as THREE.MeshBasicMaterial).needsUpdate = true;
  }

  getEntanglementMesh(): THREE.Mesh {
    return this.entanglementMesh;
  }

  dispose(): void {
    this.entanglementMesh.geometry.dispose();
    if (this.entanglementMesh.material instanceof THREE.Material) {
      this.entanglementMesh.material.dispose();
    }
    if (this.texture) {
      this.texture.dispose();
    }
  }
}

// Main GPU Quantum Visualizer
export class GPUQuantumVisualizer {
  private gpuManager: GPUAccelerationManager;
  private blochRenderer: GPUBlochSphereRenderer;
  private evolutionRenderer: GPUStateEvolutionRenderer;
  private entanglementRenderer: GPUEntanglementRenderer;
  private scene: THREE.Scene;
  private camera: THREE.Camera;
  private renderer: THREE.WebGLRenderer;

  constructor(scene: THREE.Scene, camera: THREE.Camera, renderer: THREE.WebGLRenderer) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;

    this.gpuManager = new GPUAccelerationManager();
    this.blochRenderer = new GPUBlochSphereRenderer(this.gpuManager);
    this.evolutionRenderer = new GPUStateEvolutionRenderer(this.gpuManager);
    this.entanglementRenderer = new GPUEntanglementRenderer(this.gpuManager);

    this.initializeScene();
  }

  private initializeScene(): void {
    // Add renderers to scene
    this.scene.add(this.blochRenderer.getStateVector());
    this.scene.add(this.evolutionRenderer.getEvolutionPath());
    this.scene.add(this.evolutionRenderer.getCurrentPosition());
    this.scene.add(this.entanglementRenderer.getEntanglementMesh());
  }

  // Update quantum state visualization
  updateQuantumState(state: QuantumState, time: number = 0): void {
    const blochVector = this.blochRenderer.computeBlochVector(state);
    if (blochVector) {
      this.blochRenderer.updateStateVector(blochVector, time);
    }
  }

  // Update state evolution visualization
  updateStateEvolution(
    initialState: [number, number],
    parameters: EvolutionParameters,
    pathPoints: Array<{ x: number; y: number; z: number }>
  ): void {
    // Compute current evolution state
    const currentVector = this.evolutionRenderer.computeEvolution(initialState, parameters);
    if (currentVector) {
      // Add to path if not already present
      const lastPoint = pathPoints[pathPoints.length - 1];
      if (!lastPoint ||
          Math.abs(lastPoint.x - currentVector.x) > 0.01 ||
          Math.abs(lastPoint.y - currentVector.y) > 0.01 ||
          Math.abs(lastPoint.z - currentVector.z) > 0.01) {
        pathPoints.push(currentVector);
      }
    }

    this.evolutionRenderer.updateEvolutionPath(pathPoints);
  }

  // Update entanglement visualization
  updateEntanglement(
    width: number,
    height: number,
    time: number,
    parameters: EntanglementParameters
  ): void {
    this.entanglementRenderer.computeEntanglementPattern(width, height, time, parameters);
  }

  // Get performance metrics
  getPerformanceMetrics() {
    return this.gpuManager.getPerformanceMetrics();
  }

  // Check if GPU acceleration is available and enabled
  isGPUEnabled(): boolean {
    return this.gpuManager.isGPUEnabled();
  }

  // Toggle GPU acceleration
  setGPUEnabled(enabled: boolean): void {
    this.gpuManager.setGPUEnabled(enabled);
  }

  // Check GPU availability
  isGPUAvailable(): boolean {
    return this.gpuManager.isGPUAvailable();
  }

  dispose(): void {
    this.blochRenderer.dispose();
    this.evolutionRenderer.dispose();
    this.entanglementRenderer.dispose();
    this.gpuManager.dispose();
  }
}