# Bloch Verse - Interactive 3D Quantum State Visualizer

A sophisticated quantum computing visualization platform that allows users to explore quantum states, quantum circuits, and quantum entanglement through interactive 3D visualizations and educational tools.

## 🚀 Project Overview

Bloch Verse is a comprehensive quantum computing educational platform that provides:

- **Interactive 3D Bloch Sphere Visualizations**: Real-time visualization of qubit states
- **Quantum Circuit Builder**: Drag-and-drop interface for building quantum circuits
- **State Vector Analysis**: Detailed analysis of quantum state properties
- **Entanglement Visualization**: Advanced tools for understanding quantum entanglement
- **Educational Tutorials**: Step-by-step quantum computing concepts
- **IBM Quantum Integration**: Connect to real quantum computers

## ✨ Key Features

### Core Functionality
- **Interactive Bloch Sphere**: 3D visualization with drag-to-rotate controls
- **Multi-qubit Support**: Visualize up to 3-qubit quantum systems
- **Real-time State Updates**: See quantum states evolve as circuits are modified
- **Advanced Visualizations**: Particle effects, quantum field backgrounds
- **Responsive Design**: Works on desktop and mobile devices

### Educational Tools
- **Step-by-step Execution**: Watch quantum circuits execute gate by gate
- **State Vector Display**: View quantum states in multiple notations
- **Probability Analysis**: Understand measurement probabilities
- **Entanglement Metrics**: Calculate concurrence and von Neumann entropy

## 🛠 Technologies Used

### Frontend Framework
- **React 18.3.1**: Modern React with hooks and concurrent features
- **TypeScript 5.8.3**: Type-safe development
- **Vite 5.4.19**: Fast build tool and development server

### 3D Graphics & Visualization
- **Three.js 0.160.1**: 3D graphics engine
- **@react-three/fiber 8.18.0**: React renderer for Three.js
- **@react-three/drei 9.122.0**: Useful helpers for React Three Fiber
- **@react-three/postprocessing 3.0.4**: Post-processing effects

### UI Components & Styling
- **Tailwind CSS 3.4.17**: Utility-first CSS framework
- **shadcn/ui**: Modern component library
- **Framer Motion 10.18.0**: Animation library
- **Lucide React 0.462.0**: Icon library

### Quantum Computing Libraries
- **Custom Quantum Simulation Engine**: Built-in matrix operations and gate implementations
- **Complex Number Support**: Full quantum state representation
- **Circuit Simulation**: Step-by-step quantum circuit execution

### Development Tools
- **ESLint 9.32.0**: Code linting
- **TypeScript ESLint 8.38.0**: TypeScript-specific linting
- **PostCSS 8.5.6**: CSS processing
- **Autoprefixer 10.4.21**: CSS vendor prefixing

## 📁 File Structure

```
bloch-verse-main/
├── src/
│   ├── components/          # React components
│   │   ├── ui/             # Reusable UI components (shadcn/ui)
│   │   ├── BlochSphere.tsx # Main 3D visualization component
│   │   ├── CircuitBuilder.tsx # Quantum circuit builder
│   │   ├── QuantumGate.tsx # Individual gate components
│   │   └── ...             # Other feature components
│   ├── utils/              # Quantum computing utilities
│   │   ├── quantumSimulation.ts # Main simulation exports
│   │   ├── gates.ts        # Quantum gate definitions
│   │   ├── matrixOperations.ts # Linear algebra operations
│   │   ├── densityMatrix.ts # Quantum state analysis
│   │   ├── circuitOperations.ts # Circuit execution logic
│   │   └── ...             # Additional utilities
│   ├── contexts/           # React contexts
│   │   └── IBMQuantumContext.tsx # IBM Quantum integration
│   ├── hooks/              # Custom React hooks
│   ├── pages/              # Page components
│   ├── services/           # API services
│   └── styles/             # Additional styles
├── backend/                # Python FastAPI backend (Node server deprecated)
├── public/                 # Static assets
└── package.json           # Dependencies and scripts
```

## 🔧 Code Architecture

### HTML Structure
- **Single Page Application**: Uses React Router for navigation
- **Responsive Layout**: Mobile-first design with Tailwind CSS
- **Semantic HTML**: Proper accessibility and SEO structure

### CSS Organization
- **Design System**: Comprehensive CSS custom properties for theming
- **Dark Theme**: Futuristic dark theme with quantum-inspired colors
- **Animation System**: Custom keyframe animations for quantum effects
- **Utility Classes**: Consistent spacing, colors, and interactions

### JavaScript Logic

#### Quantum Simulation Engine
The application includes a complete quantum simulation engine with:

- **Gate Operations**: Pauli gates, Hadamard, rotation gates, controlled gates
- **Matrix Operations**: Complex matrix multiplication, tensor products, traces
- **State Evolution**: Time evolution of quantum states
- **Entanglement Analysis**: Concurrence and entropy calculations

#### Key Functions

**Quantum Gates** (`utils/gates.ts`):
```typescript
// Pauli gates
export const PAULI = {
  I: [[1, 0], [0, 1]],
  X: [[0, 1], [1, 0]],
  Y: [[0, -1], [1, 0]],
  Z: [[1, 0], [0, -1]]
};

// Rotation gates
export const RX = (angle: number) => [
  [Math.cos(angle / 2), -Math.sin(angle / 2)],
  [Math.sin(angle / 2), Math.cos(angle / 2)]
];
```

**Matrix Operations** (`utils/matrixOperations.ts`):
```typescript
// Matrix multiplication with safety checks
export const matrixMultiply = (A: number[][], B: number[][]): number[][] => {
  // Comprehensive error handling and NaN protection
  // ... implementation
};

// Tensor product for multi-qubit operations
export const tensorProduct = (A: number[][], B: number[][]): number[][];
```

**Circuit Simulation** (`utils/circuitOperations.ts`):
```typescript
// Apply quantum gates to states
export const applyGate = (state: number[][], gate: QuantumGate, numQubits: number): number[][];

// Full circuit simulation
export const simulateCircuit = (circuit: QuantumCircuit, initialState?: number[][] | string);
```

## 📦 Dependencies

### Core Dependencies
- **React Ecosystem**: React, React DOM, React Router
- **3D Graphics**: Three.js, React Three Fiber, React Three Drei
- **State Management**: React Query for server state
- **Forms**: React Hook Form with Zod validation
- **Styling**: Tailwind CSS with custom design system

### Development Dependencies
- **Build Tools**: Vite, TypeScript, ESLint
- **Code Quality**: TypeScript ESLint, Prettier configuration
- **Development Server**: Hot reload and fast refresh

## 🚀 Setup & Usage Instructions

### Prerequisites
- **Node.js 18+**: For running the development server
- **npm or yarn**: Package manager
- **Modern Browser**: Chrome, Firefox, Safari, or Edge (for 3D graphics)

### Installation

1. **Clone the repository**:
```bash
git clone <repository-url>
cd bloch-verse-main
```

2. **Install dependencies**:
```bash
npm install
```

3. **Install backend dependencies** (Python FastAPI backend):
```bash
npm run backend:install    # pip install -r backend/requirements.txt
```

4. **Start development server**:
```bash
npm run dev
```

5. **Start backend (FastAPI, port 3003)** in a separate terminal:
```bash
npm run backend:dev
```

6. **Open browser**: Navigate to `http://localhost:8081` (or the Vite port shown in the terminal)

### Available Scripts

```bash
# Development
npm run dev              # Start development server
npm run backend:dev      # Start Python FastAPI backend (uvicorn, :3003)
npm run full:dev         # Start both frontend and backend

# Building
npm run build           # Build for production
npm run build:dev       # Build for development
npm run preview         # Preview production build

# Code Quality
npm run lint           # Run ESLint

# Backend
npm run backend:install # Install Python backend deps (pip -r requirements.txt)
npm run backend:start   # Start backend in production mode (uvicorn)
```

## 🌐 How the Code Works

### Application Flow

1. **Initialization**: App component sets up providers (Theme, Query Client, IBM Quantum)
2. **Routing**: React Router handles navigation between pages
3. **State Management**: React Query manages server state and caching
4. **3D Rendering**: React Three Fiber renders the Bloch sphere and visualizations

### User Interaction Flow

1. **Landing Page**: Introduction and feature showcase
2. **Authentication**: Optional IBM Quantum account linking
3. **Workspace**: Main application interface
   - Circuit Builder: Drag gates to build circuits
   - Bloch Sphere: Visualize quantum states in 3D
   - State Analysis: View probabilities and entanglement measures
   - Step Execution: Watch circuits execute step by step

### Data Flow

1. **Circuit Definition**: User builds circuit using drag-and-drop interface
2. **Gate Application**: Each gate is applied to the quantum state matrix
3. **State Update**: Bloch vector is calculated from the density matrix
4. **Visualization Update**: 3D sphere updates to show new quantum state
5. **Analysis Display**: Entanglement and other metrics are calculated and displayed

## 🔍 Key Functions Documentation

### Quantum Gate Application
```typescript
applyGate(state: number[][], gate: QuantumGate, numQubits: number): number[][]
```
Applies a quantum gate to a quantum state using matrix multiplication.

**Parameters**:
- `state`: Current quantum state as density matrix
- `gate`: Gate definition with name, qubits, and parameters
- `numQubits`: Total number of qubits in the system

**Returns**: New quantum state after gate application

### Bloch Vector Calculation
```typescript
calculateBlochVector(densityMatrix: number[][]): { x: number; y: number; z: number }
```
Converts a 2x2 density matrix to Bloch sphere coordinates.

**Parameters**:
- `densityMatrix`: 2x2 density matrix for a single qubit

**Returns**: Bloch vector with x, y, z components

### Circuit Simulation
```typescript
simulateCircuit(circuit: QuantumCircuit, initialState?: number[][] | string)
```
Simulates the execution of a complete quantum circuit.

**Parameters**:
- `circuit`: Circuit definition with gates and qubit count
- `initialState`: Optional initial state (defaults to |0⟩)

**Returns**: Simulation results including state vector, probabilities, and reduced states

## 🚪 Quantum Gate Output Reference

Use this reference table to verify the outputs of the quantum simulator. These outputs assume standard basis states as inputs.

### Single Qubit Gates
| Gate | Symbol | Description | Input \|0⟩ Output | Input \|1⟩ Output | Note |
|------|--------|-------------|-------------------|-------------------|------|
| **I** | I | Identity | \|0⟩ | \|1⟩ | No change to state |
| **X** | X | Pauli-X (NOT) | \|1⟩ | \|0⟩ | Bit flip |
| **Y** | Y | Pauli-Y | i\|1⟩ | -i\|0⟩ | Bit and Phase flip |
| **Z** | Z | Pauli-Z | \|0⟩ | -\|1⟩ | Phase flip |
| **H** | H | Hadamard | \|+⟩ = (\|0⟩+\|1⟩)/√2 | \|-⟩ = (\|0⟩-\|1⟩)/√2 | Creates superposition |
| **S** | S | Phase (S) | \|0⟩ | i\|1⟩ | Z-rotation by 90° (π/2) |
| **T** | T | T Gate | \|0⟩ | e^(iπ/4)\|1⟩ | Z-rotation by 45° (π/4) |
| **RX** | Rx | Rotation-X | cos(θ/2)\|0⟩ - i⋅sin(θ/2)\|1⟩ | cos(θ/2)\|1⟩ - i⋅sin(θ/2)\|0⟩ | Default angle π/2 |
| **RY** | Ry | Rotation-Y | cos(θ/2)\|0⟩ + sin(θ/2)\|1⟩ | cos(θ/2)\|1⟩ - sin(θ/2)\|0⟩ | Default angle π/2 |
| **RZ** | Rz | Rotation-Z | e^(-iθ/2)\|0⟩ | e^(iθ/2)\|1⟩ | Default angle π/2 |
| **SX** | √X | Sqrt-X | (1+i)\|0⟩ + (1-i)\|1⟩ / 2 | ... | Used in modern hardware |

### Multi-Qubit Gates
| Gate | Symbol | Name | Effect |
|------|--------|------|--------|
| **CNOT** | ⊕ | Controlled-NOT | Flips target qubit **iff** control is \|1⟩ |
| **CZ** | ●Z | Controlled-Z | Adds -1 phase **iff** both qubits are \|1⟩ |
| **SWAP** | ⤫ | Swap | Exchanges the states of two qubits |
| **CY** | ●Y | Controlled-Y | Applies Y gate to target **iff** control is \|1⟩ |
| **CH** | ●H | Controlled-H | Applies H gate to target **iff** control is \|1⟩ |
| **CCNOT** | ⊕⊕ | Toffoli | Flips target **iff** both controls are \|1⟩ |
| **FREDKIN**| ⤫● | CSWAP | Swaps two targets **iff** control is \|1⟩ |

## 🔗 Dependencies

### External Libraries
- **IBM Quantum Runtime**: For executing circuits on real quantum computers
- **Quantum API Services**: Backend services for quantum computations
- **Monaco Editor**: For code editing functionality

### Internal Dependencies
All quantum simulation utilities are built-in and don't require external quantum computing libraries.

## ⚠️ Known Issues & Limitations

### Current Limitations
- **Complex Numbers**: Uses real matrix approximations for some gates
- **Noise Simulation**: No quantum noise modeling
- **Large Circuits**: Performance degrades with very large quantum circuits
- **Mobile Performance**: 3D graphics may be slow on older mobile devices

### Browser Compatibility
- **WebGL Required**: Modern browser with WebGL support needed for 3D graphics
- **Hardware Acceleration**: Best performance with GPU acceleration
- **Memory Usage**: Large circuits may require significant RAM

## 🚀 Future Improvements

### Planned Enhancements
- **Complex Number Support**: Full complex number implementation for gates
- **Noise Modeling**: Add quantum noise and decoherence simulation
- **Performance Optimization**: Improve rendering performance for large circuits
- **Additional Gates**: More quantum gates and algorithms
- **Educational Modules**: More interactive tutorials and examples
- **Export Features**: Save circuits and states as images or files

### Technical Improvements
- **Code Splitting**: Reduce bundle size with dynamic imports
- **Caching**: Implement better state caching for performance
- **Testing**: Add comprehensive unit and integration tests
- **Documentation**: Expand API documentation and examples

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

### Code Style
- Use TypeScript for all new code
- Follow the existing component structure
- Add proper error handling
- Include comments for complex quantum operations

## 📄 License

This project is developed for educational purposes in quantum computing visualization and simulation.

## 🙏 Acknowledgments

- **IBM Quantum**: For providing access to real quantum computers
- **Three.js Community**: For excellent 3D graphics tools
- **React Community**: For the amazing ecosystem of tools and libraries
- **Quantum Computing Community**: For advancing this fascinating field

---

**Bloch Verse** - Explore the beauty of quantum mechanics through interactive visualization! 🌌⚛️
