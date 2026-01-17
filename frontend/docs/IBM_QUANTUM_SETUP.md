# IBM Quantum Integration Setup Guide

This guide will help you set up the IBM Quantum integration for your Bloch-Verse Quantum State Visualizer.

## 🚀 Quick Start

### 1. Install All Dependencies

```bash
# Install frontend and backend dependencies
npm run full:install

# Or install manually:
npm install
cd backend && npm install
cd backend && pip install -r requirements.txt
```

### 2. Start the Application

```bash
# Start both frontend and backend together
npm run full:dev

# Or start separately:
# Terminal 1: Frontend
npm run dev

# Terminal 2: Backend
npm run backend:dev
```

### 3. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/health

## 🔑 IBM Quantum Setup

### 1. Get IBM Quantum API Token

1. Go to [IBM Quantum Experience](https://quantum-computing.ibm.com/)
2. Sign up or log in to your account
3. Navigate to Account Settings
4. Copy your API token

### 2. Configure Environment (Optional)

Create a `.env` file in the backend directory:

```env
PORT=3001
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

## 🎯 Features Implemented

### ✅ Authentication System
- **Login Page**: Enter IBM Quantum API token
- **Backend Selection**: Choose from available simulators and hardware
- **Initial State Selection**: Pick from canonical kets (ket0-ket6) or define custom states
- **Session Management**: Secure token storage and authentication state

### ✅ Backend Integration
- **Node.js/Express API**: RESTful API for quantum circuit execution
- **Python/Qiskit Integration**: Handles actual quantum circuit execution
- **IBM Quantum API**: Direct integration with IBM Quantum services
- **Error Handling**: Comprehensive error handling and user feedback

### ✅ Circuit Execution
- **Dual Mode**: Run circuits locally or on IBM Quantum
- **Real-time Switching**: Toggle between local and IBM execution
- **Backend Selection**: Choose from available IBM Quantum backends
- **Progress Tracking**: Real-time execution status and progress

### ✅ Custom Initial States
- **Canonical Kets**: Predefined quantum states (|0⟩, |1⟩, |+⟩, |−⟩, |+i⟩, |−i⟩)
- **Custom States**: User-defined |ψ⟩ = α|0⟩ + β|1⟩ with normalization
- **State Validation**: Ensures proper normalization of custom states
- **Visual Preview**: Real-time preview of selected initial state

### ✅ Enhanced Visualization
- **Dual Results Display**: Show both local and IBM Quantum results
- **Execution Details**: Display backend information, execution time, job IDs
- **Method Indicators**: Clear indication of execution method (local vs IBM)
- **Bloch Sphere Updates**: Real-time visualization updates for both modes

## 🔧 Available Backends

### Simulators
- **IBM QASM Simulator** (32 qubits) - Default choice
- **Statevector Simulator** (24 qubits) - For statevector calculations
- **Matrix Product State Simulator** (100 qubits) - For large circuits

### Hardware (Requires IBM Quantum Account)
- **IBM Lima** (5 qubits)
- **IBM Belem** (5 qubits) 
- **IBM Quito** (5 qubits)

## 🎮 How to Use

### 1. Start the Application
```bash
npm run full:dev
```

### 2. Connect to IBM Quantum
1. Click "Connect to IBM Quantum" on the landing page
2. Enter your IBM Quantum API token
3. Select your preferred backend
4. Choose initial quantum state (ket0-ket6 or custom)
5. Click "Connect to IBM Quantum"

### 3. Build and Execute Circuits
1. Use the visual circuit builder or code editor
2. Select execution method (Local or IBM Quantum)
3. Choose backend if using IBM Quantum
4. Click "Run on IBM Quantum" or "Compute Reduced States"
5. View results with enhanced visualization

### 4. Compare Results
- Results show execution method and backend information
- Bloch sphere visualizations update in real-time
- Execution details include timing and job information

## 🐛 Troubleshooting

### Backend Connection Issues
```bash
# Check if backend is running
curl http://localhost:3001/health

# Check backend logs
cd backend && npm run dev
```

### Python/Qiskit Issues
```bash
# Reinstall Python dependencies
cd backend && pip install -r requirements.txt

# Check Python version (requires 3.8+)
python --version
```

### IBM Quantum Authentication
- Verify your API token is correct
- Check if your IBM Quantum account is active
- Ensure you have access to the selected backend

### Frontend Issues
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

## 📁 Project Structure

```
bloch-verse-main/
├── src/
│   ├── pages/
│   │   ├── Auth.tsx              # IBM Quantum authentication
│   │   ├── Landing.tsx           # Updated landing page
│   │   └── Workspace.tsx         # Enhanced workspace with IBM integration
│   ├── contexts/
│   │   └── IBMQuantumContext.tsx # IBM Quantum state management
│   ├── services/
│   │   └── quantumAPI.ts         # API service for IBM Quantum
│   └── components/               # Existing components
├── backend/
│   ├── server.js                 # Express API server
│   ├── quantum_executor.py       # Python/Qiskit execution
│   ├── package.json              # Backend dependencies
│   └── requirements.txt          # Python dependencies
└── package.json                  # Updated with new scripts
```

## 🎉 Success!

Your quantum simulator now supports:
- ✅ IBM Quantum hardware and simulators
- ✅ Custom initial quantum states
- ✅ Real-time circuit execution
- ✅ Enhanced visualization
- ✅ Dual-mode operation (local + IBM)

Enjoy exploring quantum computing with both local simulation and real IBM Quantum hardware! 🚀
