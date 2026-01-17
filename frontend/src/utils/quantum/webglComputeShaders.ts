// WebGL Compute Shader Utilities for GPU-accelerated Quantum Visualizations
// Provides high-performance computation for Bloch vectors, state evolution, and entanglement patterns

export interface ShaderProgram {
  vertexShader: string;
  fragmentShader: string;
  uniforms: Record<string, any>;
}

export interface ComputeResult {
  data: Float32Array;
  width: number;
  height: number;
}

export class WebGLComputeManager {
  private gl: WebGLRenderingContext | null = null;
  private canvas: HTMLCanvasElement;
  private programs: Map<string, WebGLProgram> = new Map();
  private textures: Map<string, WebGLTexture> = new Map();
  private framebuffers: Map<string, WebGLFramebuffer> = new Map();

  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = 1;
    this.canvas.height = 1;
    this.canvas.style.display = 'none';
    document.body.appendChild(this.canvas);

    try {
      this.gl = this.canvas.getContext('webgl') || this.canvas.getContext('experimental-webgl') as WebGLRenderingContext;
      if (!this.gl) {
        throw new Error('WebGL not supported');
      }
    } catch (error) {
      console.warn('WebGL initialization failed:', error);
    }
  }

  isSupported(): boolean {
    return this.gl !== null;
  }

  createShader(type: number, source: string): WebGLShader | null {
    if (!this.gl) return null;

    const shader = this.gl.createShader(type);
    if (!shader) return null;

    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);

    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      console.error('Shader compilation error:', this.gl.getShaderInfoLog(shader));
      this.gl.deleteShader(shader);
      return null;
    }

    return shader;
  }

  createProgram(vertexSource: string, fragmentSource: string): WebGLProgram | null {
    if (!this.gl) return null;

    const vertexShader = this.createShader(this.gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = this.createShader(this.gl.FRAGMENT_SHADER, fragmentSource);

    if (!vertexShader || !fragmentShader) return null;

    const program = this.gl.createProgram();
    if (!program) return null;

    this.gl.attachShader(program, vertexShader);
    this.gl.attachShader(program, fragmentShader);
    this.gl.linkProgram(program);

    if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
      console.error('Program linking error:', this.gl.getProgramInfoLog(program));
      this.gl.deleteProgram(program);
      return null;
    }

    // Clean up shaders
    this.gl.deleteShader(vertexShader);
    this.gl.deleteShader(fragmentShader);

    return program;
  }

  createTexture(width: number, height: number, data?: Float32Array): WebGLTexture | null {
    if (!this.gl) return null;

    const texture = this.gl.createTexture();
    if (!texture) return null;

    this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);

    const format = this.gl.RGBA;
    const type = this.gl.FLOAT;

    if (data) {
      // Convert Float32Array to RGBA format for WebGL texture
      const rgbaData = new Float32Array(width * height * 4);
      for (let i = 0; i < data.length; i++) {
        rgbaData[i * 4] = data[i];     // R
        rgbaData[i * 4 + 1] = 0;       // G
        rgbaData[i * 4 + 2] = 0;       // B
        rgbaData[i * 4 + 3] = 1;       // A
      }
      this.gl.texImage2D(this.gl.TEXTURE_2D, 0, format, width, height, 0, format, type, rgbaData);
    } else {
      this.gl.texImage2D(this.gl.TEXTURE_2D, 0, format, width, height, 0, format, type, null);
    }

    return texture;
  }

  createFramebuffer(texture: WebGLTexture): WebGLFramebuffer | null {
    if (!this.gl) return null;

    const framebuffer = this.gl.createFramebuffer();
    if (!framebuffer) return null;

    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, framebuffer);
    this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D, texture, 0);

    if (this.gl.checkFramebufferStatus(this.gl.FRAMEBUFFER) !== this.gl.FRAMEBUFFER_COMPLETE) {
      console.error('Framebuffer not complete');
      this.gl.deleteFramebuffer(framebuffer);
      return null;
    }

    return framebuffer;
  }

  compute(programName: string, width: number, height: number, uniforms: Record<string, any> = {}): ComputeResult | null {
    if (!this.gl) return null;

    const program = this.programs.get(programName);
    if (!program) {
      console.error(`Program ${programName} not found`);
      return null;
    }

    // Create output texture and framebuffer
    const outputTexture = this.createTexture(width, height);
    const outputFramebuffer = this.createFramebuffer(outputTexture!);

    if (!outputTexture || !outputFramebuffer) return null;

    // Set up viewport
    this.gl.viewport(0, 0, width, height);
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, outputFramebuffer);

    // Use program
    this.gl.useProgram(program);

    // Set uniforms
    Object.entries(uniforms).forEach(([name, value]) => {
      const location = this.gl!.getUniformLocation(program, name);
      if (location) {
        if (typeof value === 'number') {
          this.gl!.uniform1f(location, value);
        } else if (value instanceof Float32Array && value.length === 2) {
          this.gl!.uniform2fv(location, value);
        } else if (value instanceof Float32Array && value.length === 3) {
          this.gl!.uniform3fv(location, value);
        } else if (value instanceof Float32Array && value.length === 4) {
          this.gl!.uniform4fv(location, value);
        }
      }
    });

    // Create quad vertices for full-screen rendering
    const vertices = new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
       1,  1
    ]);

    const vertexBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vertexBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, vertices, this.gl.STATIC_DRAW);

    const positionAttribute = this.gl.getAttribLocation(program, 'a_position');
    this.gl.enableVertexAttribArray(positionAttribute);
    this.gl.vertexAttribPointer(positionAttribute, 2, this.gl.FLOAT, false, 0, 0);

    // Render
    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);

    // Read back results
    const result = new Float32Array(width * height * 4);
    this.gl.readPixels(0, 0, width, height, this.gl.RGBA, this.gl.FLOAT, result);

    // Extract single channel data
    const singleChannelData = new Float32Array(width * height);
    for (let i = 0; i < width * height; i++) {
      singleChannelData[i] = result[i * 4];
    }

    // Cleanup
    this.gl.deleteBuffer(vertexBuffer);
    this.gl.deleteFramebuffer(outputFramebuffer);
    this.gl.deleteTexture(outputTexture);

    return {
      data: singleChannelData,
      width,
      height
    };
  }

  registerProgram(name: string, vertexShader: string, fragmentShader: string): boolean {
    const program = this.createProgram(vertexShader, fragmentShader);
    if (!program) return false;

    this.programs.set(name, program);
    return true;
  }

  dispose(): void {
    this.programs.forEach(program => {
      if (this.gl) this.gl.deleteProgram(program);
    });
    this.programs.clear();

    this.textures.forEach(texture => {
      if (this.gl) this.gl.deleteTexture(texture);
    });
    this.textures.clear();

    this.framebuffers.forEach(framebuffer => {
      if (this.gl) this.gl.deleteFramebuffer(framebuffer);
    });
    this.framebuffers.clear();

    if (this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
  }
}

// Performance monitoring utilities
export class PerformanceMonitor {
  private measurements: Map<string, number[]> = new Map();
  private startTimes: Map<string, number> = new Map();

  startMeasurement(name: string): void {
    this.startTimes.set(name, performance.now());
  }

  endMeasurement(name: string): number {
    const startTime = this.startTimes.get(name);
    if (!startTime) return 0;

    const duration = performance.now() - startTime;
    this.startTimes.delete(name);

    if (!this.measurements.has(name)) {
      this.measurements.set(name, []);
    }
    this.measurements.get(name)!.push(duration);

    return duration;
  }

  getAverageTime(name: string): number {
    const times = this.measurements.get(name);
    if (!times || times.length === 0) return 0;

    return times.reduce((sum, time) => sum + time, 0) / times.length;
  }

  getLastTime(name: string): number {
    const times = this.measurements.get(name);
    return times && times.length > 0 ? times[times.length - 1] : 0;
  }

  reset(): void {
    this.measurements.clear();
    this.startTimes.clear();
  }
}

// GPU Acceleration Manager with fallback support
export class GPUAccelerationManager {
  private computeManager: WebGLComputeManager;
  private performanceMonitor: PerformanceMonitor;
  private useGPU: boolean = true;
  private gpuSupported: boolean = false;

  constructor() {
    this.computeManager = new WebGLComputeManager();
    this.performanceMonitor = new PerformanceMonitor();
    this.gpuSupported = this.computeManager.isSupported();
    this.useGPU = this.gpuSupported;
  }

  isGPUAvailable(): boolean {
    return this.gpuSupported;
  }

  setGPUEnabled(enabled: boolean): void {
    this.useGPU = enabled && this.gpuSupported;
  }

  isGPUEnabled(): boolean {
    return this.useGPU;
  }

  getPerformanceMetrics(): { gpuTime: number; cpuTime: number; speedup: number } {
    const gpuTime = this.performanceMonitor.getAverageTime('gpu_compute');
    const cpuTime = this.performanceMonitor.getAverageTime('cpu_compute');

    return {
      gpuTime,
      cpuTime,
      speedup: cpuTime > 0 ? cpuTime / gpuTime : 0
    };
  }

  dispose(): void {
    this.computeManager.dispose();
    this.performanceMonitor.reset();
  }

  // Getters for internal components (used by quantum visualization classes)
  getComputeManager(): WebGLComputeManager {
    return this.computeManager;
  }

  getPerformanceMonitor(): PerformanceMonitor {
    return this.performanceMonitor;
  }
}