import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Play, BookOpen, Target, Code, Zap, BarChart3, Microscope, Shield, CheckCircle, Sparkles, Rocket, Brain, Lightbulb, Star, Award, SkipForward, RefreshCw, Download } from 'lucide-react';
import { useTour, Tour } from '@/contexts/TourContext';
import TourOverlay from './TourOverlay';

interface TourGuideProps {
  onStartTour?: () => void;
}

const TourGuide: React.FC<TourGuideProps> = ({ onStartTour }) => {
  const { startTour, isActive, currentTour, isTourCompleted } = useTour();

  // Define the workspace tour
  const workspaceTour: Tour = {
    id: 'workspace-intro',
    name: 'Platform Overview',
    description: 'Take a guided tour of the quantum computing platform',
    targetAudience: 'new-users',
    estimatedTime: 5,
    steps: [
      {
        id: 'welcome',
        title: '🚀 Welcome to Quantum State Visualizer!',
        description: 'Your gateway to mastering quantum computing through interactive learning and research.',
        target: '[data-tour="header-title"]',
        position: 'bottom',
        content: (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <div className="flex items-center gap-2 text-primary font-semibold">
              <Brain className="w-4 h-4" />
              <span>Learning Objectives</span>
            </div>
            <div className="grid grid-cols-1 gap-2">
              <div className="flex items-center gap-3 p-2 bg-primary/5 rounded-lg border border-primary/10">
                <Target className="w-4 h-4 text-primary flex-shrink-0" />
                <span className="text-sm">Master the quantum platform interface</span>
              </div>
              <div className="flex items-center gap-3 p-2 bg-accent/5 rounded-lg border border-accent/10">
                <Zap className="w-4 h-4 text-accent flex-shrink-0" />
                <span className="text-sm">Build and simulate quantum circuits</span>
              </div>
              <div className="flex items-center gap-3 p-2 bg-blue-500/5 rounded-lg border border-blue-500/10">
                <BarChart3 className="w-4 h-4 text-blue-500 flex-shrink-0" />
                <span className="text-sm">Explore advanced visualization tools</span>
              </div>
              <div className="flex items-center gap-3 p-2 bg-green-500/5 rounded-lg border border-green-500/10">
                <Microscope className="w-4 h-4 text-green-500 flex-shrink-0" />
                <span className="text-sm">Run quantum simulations and analysis</span>
              </div>
            </div>
            <div className="text-xs text-muted-foreground bg-muted/30 rounded-lg p-3 border">
              <Lightbulb className="w-4 h-4 inline mr-1" />
              <strong>Did you know?</strong> This platform combines visual circuit design with real quantum simulation - no quantum computer required!
            </div>
          </motion.div>
        ),
        waitTime: 4000,
      },
      {
        id: 'tabs-navigation',
        title: '🧭 Smart Navigation System',
        description: 'Discover all the powerful tools available in your quantum workspace.',
        target: '[data-tour="tabs-navigation"]',
        position: 'bottom',
        content: (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-3"
          >
            <div className="text-sm text-muted-foreground mb-3">
              Each tab opens a new dimension of quantum exploration:
            </div>
            <div className="grid grid-cols-2 gap-3">
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="flex items-center gap-3 p-3 bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl border border-primary/20"
              >
                <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center">
                  <Target className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <div className="font-semibold text-sm text-primary">Circuit Builder</div>
                  <div className="text-xs text-muted-foreground">Visual quantum design</div>
                </div>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="flex items-center gap-3 p-3 bg-gradient-to-r from-accent/10 to-accent/5 rounded-xl border border-accent/20"
              >
                <div className="w-8 h-8 bg-accent/20 rounded-lg flex items-center justify-center">
                  <Code className="w-4 h-4 text-accent" />
                </div>
                <div>
                  <div className="font-semibold text-sm text-accent">Code Editor</div>
                  <div className="text-xs text-muted-foreground">Qiskit programming</div>
                </div>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-500/10 to-blue-500/5 rounded-xl border border-blue-500/20"
              >
                <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <Zap className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <div className="font-semibold text-sm text-blue-500">Quantum Backend</div>
                  <div className="text-xs text-muted-foreground">Real quantum hardware</div>
                </div>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="flex items-center gap-3 p-3 bg-gradient-to-r from-secondary/10 to-secondary/5 rounded-xl border border-secondary/20"
              >
                <div className="w-8 h-8 bg-secondary/20 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-4 h-4 text-secondary" />
                </div>
                <div>
                  <div className="font-semibold text-sm text-secondary">Learn & Tutorials</div>
                  <div className="text-xs text-muted-foreground">Guided learning path</div>
                </div>
              </motion.div>
            </div>
            <div className="text-xs text-center text-muted-foreground bg-muted/20 rounded-lg p-2">
              💡 <strong>Pro Tip:</strong> Switch between tabs to see how visual circuits become code automatically!
            </div>
          </motion.div>
        ),
      },
      {
        id: 'sync-controls',
        title: '🔄 Smart Synchronization Engine',
        description: 'Experience the magic of seamless visual-code integration!',
        target: '[data-tour="sync-controls"]',
        position: 'bottom',
        content: (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <RefreshCw className="w-8 h-8 text-purple-500" />
              </div>
              <div className="font-semibold text-purple-600 mb-1">Real-time Sync Technology</div>
              <div className="text-sm text-muted-foreground">Visual circuits ↔ Qiskit code instantly</div>
            </div>

            <div className="space-y-3">
              <div className="text-sm font-medium text-foreground">Sync Modes:</div>
              <div className="grid grid-cols-1 gap-2">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="flex items-center gap-3 p-2 bg-gradient-to-r from-blue-500/10 to-blue-500/5 rounded-lg border border-blue-500/20"
                >
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <div>
                    <div className="text-xs font-semibold text-blue-600">Bidirectional</div>
                    <div className="text-xs text-muted-foreground">Changes flow both ways</div>
                  </div>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="flex items-center gap-3 p-2 bg-gradient-to-r from-green-500/10 to-green-500/5 rounded-lg border border-green-500/20"
                >
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <div>
                    <div className="text-xs font-semibold text-green-600">Visual → Code</div>
                    <div className="text-xs text-muted-foreground">Drag gates, see code appear</div>
                  </div>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="flex items-center gap-3 p-2 bg-gradient-to-r from-orange-500/10 to-orange-500/5 rounded-lg border border-orange-500/20"
                >
                  <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                  <div>
                    <div className="text-xs font-semibold text-orange-600">Code → Visual</div>
                    <div className="text-xs text-muted-foreground">Type code, watch circuits build</div>
                  </div>
                </motion.div>
              </div>
            </div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-xl p-3"
            >
              <div className="flex items-center gap-2 text-sm mb-2">
                <Lightbulb className="w-4 h-4 text-indigo-500" />
                <span className="font-semibold text-indigo-600">Learning Accelerator</span>
              </div>
              <div className="text-xs text-muted-foreground">
                This unique feature bridges the gap between visual thinking and code writing - perfect for quantum learning!
              </div>
            </motion.div>
          </motion.div>
        ),
      },
      {
        id: 'circuit-canvas',
        title: '🎨 Quantum Circuit Builder',
        description: 'Your creative workspace for designing quantum algorithms visually.',
        target: '[data-tour="circuit-canvas"]',
        position: 'top',
        content: (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl border border-primary/20">
              <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="font-semibold text-primary">Visual Circuit Design</div>
                <div className="text-sm text-muted-foreground">Drag quantum gates onto qubit wires</div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium text-foreground">How it works:</div>
              <div className="grid grid-cols-1 gap-2 text-xs">
                <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span>Each horizontal line represents a qubit</span>
                </div>
                <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg">
                  <div className="w-2 h-2 bg-accent rounded-full"></div>
                  <span>Drag gates from the palette to apply operations</span>
                </div>
                <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>See input/output states for each gate</span>
                </div>
              </div>
            </div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-xl p-3"
            >
              <div className="flex items-center gap-2 text-sm">
                <Lightbulb className="w-4 h-4 text-yellow-500" />
                <span className="font-semibold text-yellow-600">Try This:</span>
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                Drag an H gate onto the first qubit to create quantum superposition! Watch how |0⟩ becomes (|0⟩ + |1⟩)/√2
              </div>
            </motion.div>
          </motion.div>
        ),
        waitTime: 3000,
      },
      {
        id: 'simulation-button',
        title: '⚡ Quantum Execution Engine',
        description: 'Witness the power of quantum computation in real-time!',
        target: '[data-tour="run-simulation"]',
        position: 'top',
        content: (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-4"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Zap className="w-8 h-8 text-yellow-500" />
              </div>
              <div className="font-semibold text-yellow-600 mb-1">Lightning-Fast Simulation</div>
              <div className="text-sm text-muted-foreground">Local quantum processing at your fingertips</div>
            </div>

            <div className="space-y-3">
              <div className="text-sm font-medium text-foreground">What happens when you click:</div>
              <div className="grid grid-cols-1 gap-2">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="flex items-center gap-3 p-2 bg-gradient-to-r from-blue-500/10 to-blue-500/5 rounded-lg border border-blue-500/20"
                >
                  <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                  <div>
                    <div className="text-xs font-semibold text-blue-600">State Vector Calculation</div>
                    <div className="text-xs text-muted-foreground">Computes quantum amplitudes instantly</div>
                  </div>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="flex items-center gap-3 p-2 bg-gradient-to-r from-green-500/10 to-green-500/5 rounded-lg border border-green-500/20"
                >
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <div>
                    <div className="text-xs font-semibold text-green-600">Measurement Probabilities</div>
                    <div className="text-xs text-muted-foreground">Shows |ψ|² for each outcome</div>
                  </div>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="flex items-center gap-3 p-2 bg-gradient-to-r from-purple-500/10 to-purple-500/5 rounded-lg border border-purple-500/20"
                >
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                  <div>
                    <div className="text-xs font-semibold text-purple-600">Bloch Sphere Updates</div>
                    <div className="text-xs text-muted-foreground">Visualizes final quantum states</div>
                  </div>
                </motion.div>
              </div>
            </div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-xl p-3"
            >
              <div className="flex items-center gap-2 text-sm mb-2">
                <Rocket className="w-4 h-4 text-emerald-500" />
                <span className="font-semibold text-emerald-600">No Hardware Required</span>
              </div>
              <div className="text-xs text-muted-foreground">
                Experience quantum computing without waiting for real quantum computers - perfect for learning and experimentation!
              </div>
            </motion.div>
          </motion.div>
        ),
      },
      {
        id: 'bloch-spheres',
        title: '🌐 Bloch Sphere Magic',
        description: 'See quantum states come alive in 3D - the geometric heart of quantum computing!',
        target: '[data-tour="bloch-spheres"]',
        position: 'left',
        content: (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-4"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <BarChart3 className="w-8 h-8 text-blue-500" />
              </div>
              <div className="font-semibold text-primary mb-1">3D Quantum Visualization</div>
              <div className="text-sm text-muted-foreground">Every quantum state lives on this sphere</div>
            </div>

            <div className="space-y-3">
              <div className="text-sm font-medium text-foreground">Sphere Coordinates:</div>
              <div className="grid grid-cols-1 gap-2">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="flex items-center gap-3 p-2 bg-gradient-to-r from-blue-500/10 to-blue-500/5 rounded-lg border border-blue-500/20"
                >
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <div>
                    <div className="text-xs font-semibold text-blue-600">North Pole (0,0,1)</div>
                    <div className="text-xs text-muted-foreground">|0⟩ computational basis state</div>
                  </div>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="flex items-center gap-3 p-2 bg-gradient-to-r from-red-500/10 to-red-500/5 rounded-lg border border-red-500/20"
                >
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div>
                    <div className="text-xs font-semibold text-red-600">South Pole (0,0,-1)</div>
                    <div className="text-xs text-muted-foreground">|1⟩ computational basis state</div>
                  </div>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="flex items-center gap-3 p-2 bg-gradient-to-r from-green-500/10 to-green-500/5 rounded-lg border border-green-500/20"
                >
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <div>
                    <div className="text-xs font-semibold text-green-600">Equatorial Plane</div>
                    <div className="text-xs text-muted-foreground">Superposition states |+⟩, |-⟩, etc.</div>
                  </div>
                </motion.div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl p-3">
              <div className="flex items-center gap-2 text-sm mb-2">
                <Sparkles className="w-4 h-4 text-purple-500" />
                <span className="font-semibold text-purple-600">Quantum Insight</span>
              </div>
              <div className="text-xs text-muted-foreground">
                The Bloch sphere shows that quantum states are continuous - not just 0s and 1s, but infinite possibilities in between!
              </div>
            </div>
          </motion.div>
        ),
      },
      {
        id: 'tutorials-tab',
        title: '📚 Quantum Learning Academy',
        description: 'Master quantum computing through hands-on guided experiences!',
        target: '[data-tour="tutorials-tab"]',
        position: 'top',
        content: (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <BookOpen className="w-8 h-8 text-indigo-500" />
              </div>
              <div className="font-semibold text-indigo-600 mb-1">Structured Learning Path</div>
              <div className="text-sm text-muted-foreground">From basics to advanced quantum algorithms</div>
            </div>

            <div className="space-y-3">
              <div className="text-sm font-medium text-foreground">Learning Journey:</div>
              <div className="grid grid-cols-1 gap-2">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="flex items-center gap-3 p-2 bg-gradient-to-r from-blue-500/10 to-blue-500/5 rounded-lg border border-blue-500/20"
                >
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <div>
                    <div className="text-xs font-semibold text-blue-600">Quantum Fundamentals</div>
                    <div className="text-xs text-muted-foreground">Qubits, superposition, entanglement</div>
                  </div>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="flex items-center gap-3 p-2 bg-gradient-to-r from-green-500/10 to-green-500/5 rounded-lg border border-green-500/20"
                >
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <div>
                    <div className="text-xs font-semibold text-green-600">Bell States & EPR Pairs</div>
                    <div className="text-xs text-muted-foreground">Quantum correlations and teleportation</div>
                  </div>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="flex items-center gap-3 p-2 bg-gradient-to-r from-purple-500/10 to-purple-500/5 rounded-lg border border-purple-500/20"
                >
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                  <div>
                    <div className="text-xs font-semibold text-purple-600">Quantum Algorithms</div>
                    <div className="text-xs text-muted-foreground">Grover search, quantum Fourier transform</div>
                  </div>
                </motion.div>
              </div>
            </div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-xl p-3"
            >
              <div className="flex items-center gap-2 text-sm mb-2">
                <Award className="w-4 h-4 text-amber-500" />
                <span className="font-semibold text-amber-600">Achievement System</span>
              </div>
              <div className="text-xs text-muted-foreground">
                Complete tutorials to unlock achievements and track your quantum learning progress!
              </div>
            </motion.div>
          </motion.div>
        ),
      },
      {
        id: 'code-editor',
        title: '💻 Professional Code Environment',
        description: 'Write production-ready quantum code with intelligent features!',
        target: '[data-tour="code-tab"]',
        position: 'top',
        content: (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-4"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Code className="w-8 h-8 text-emerald-500" />
              </div>
              <div className="font-semibold text-emerald-600 mb-1">Qiskit-Powered Editor</div>
              <div className="text-sm text-muted-foreground">Industry-standard quantum programming</div>
            </div>

            <div className="space-y-3">
              <div className="text-sm font-medium text-foreground">Advanced Features:</div>
              <div className="grid grid-cols-1 gap-2">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="flex items-center gap-3 p-2 bg-gradient-to-r from-emerald-500/10 to-emerald-500/5 rounded-lg border border-emerald-500/20"
                >
                  <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                  <div>
                    <div className="text-xs font-semibold text-emerald-600">Syntax Highlighting</div>
                    <div className="text-xs text-muted-foreground">Full Qiskit syntax support</div>
                  </div>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="flex items-center gap-3 p-2 bg-gradient-to-r from-blue-500/10 to-blue-500/5 rounded-lg border border-blue-500/20"
                >
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <div>
                    <div className="text-xs font-semibold text-blue-600">Real-time Validation</div>
                    <div className="text-xs text-muted-foreground">Instant error detection and fixes</div>
                  </div>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="flex items-center gap-3 p-2 bg-gradient-to-r from-purple-500/10 to-purple-500/5 rounded-lg border border-purple-500/20"
                >
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                  <div>
                    <div className="text-xs font-semibold text-purple-600">Auto-Completion</div>
                    <div className="text-xs text-muted-foreground">Smart suggestions for quantum operations</div>
                  </div>
                </motion.div>
              </div>
            </div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-xl p-3"
            >
              <div className="flex items-center gap-2 text-sm mb-2">
                <Sparkles className="w-4 h-4 text-cyan-500" />
                <span className="font-semibold text-cyan-600">Code ↔ Visual Bridge</span>
              </div>
              <div className="text-xs text-muted-foreground">
                Write professional quantum code that automatically generates visual circuit diagrams - perfect for research and production!
              </div>
            </motion.div>
          </motion.div>
        ),
      },
      {
        id: 'export-data',
        title: '📤 Quantum Data Hub',
        description: 'Share your quantum discoveries with the world!',
        target: '[data-tour="export-button"]',
        position: 'bottom',
        content: (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-rose-500/20 to-pink-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Download className="w-8 h-8 text-rose-500" />
              </div>
              <div className="font-semibold text-rose-600 mb-1">Export & Collaboration</div>
              <div className="text-sm text-muted-foreground">Share quantum knowledge globally</div>
            </div>

            <div className="space-y-3">
              <div className="text-sm font-medium text-foreground">Export Formats:</div>
              <div className="grid grid-cols-1 gap-2">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="flex items-center gap-3 p-2 bg-gradient-to-r from-blue-500/10 to-blue-500/5 rounded-lg border border-blue-500/20"
                >
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <div>
                    <div className="text-xs font-semibold text-blue-600">JSON Data Export</div>
                    <div className="text-xs text-muted-foreground">Complete quantum state data</div>
                  </div>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="flex items-center gap-3 p-2 bg-gradient-to-r from-green-500/10 to-green-500/5 rounded-lg border border-green-500/20"
                >
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <div>
                    <div className="text-xs font-semibold text-green-600">Circuit Diagrams</div>
                    <div className="text-xs text-muted-foreground">High-resolution PNG/PDF exports</div>
                  </div>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="flex items-center gap-3 p-2 bg-gradient-to-r from-purple-500/10 to-purple-500/5 rounded-lg border border-purple-500/20"
                >
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                  <div>
                    <div className="text-xs font-semibold text-purple-600">Qiskit Code</div>
                    <div className="text-xs text-muted-foreground">Production-ready quantum programs</div>
                  </div>
                </motion.div>
              </div>
            </div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-violet-500/20 rounded-xl p-3"
            >
              <div className="flex items-center gap-2 text-sm mb-2">
                <Star className="w-4 h-4 text-violet-500" />
                <span className="font-semibold text-violet-600">Open Science</span>
              </div>
              <div className="text-xs text-muted-foreground">
                Contribute to the quantum computing community by sharing your experiments, algorithms, and discoveries!
              </div>
            </motion.div>
          </motion.div>
        ),
      },
      {
        id: 'help-assistant',
        title: '🤖 Your Quantum Companion',
        description: 'Meet your AI assistant - your guide through the quantum universe!',
        target: '[data-tour="help-button"]',
        position: 'left',
        content: (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500/20 to-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Brain className="w-8 h-8 text-green-500" />
              </div>
              <div className="font-semibold text-green-600 mb-1">AI-Powered Learning</div>
              <div className="text-sm text-muted-foreground">Intelligent assistance at your fingertips</div>
            </div>

            <div className="space-y-3">
              <div className="text-sm font-medium text-foreground">What your assistant can do:</div>
              <div className="grid grid-cols-1 gap-2">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="flex items-center gap-3 p-2 bg-gradient-to-r from-green-500/10 to-green-500/5 rounded-lg border border-green-500/20"
                >
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-xs">Explain quantum concepts in simple terms</span>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="flex items-center gap-3 p-2 bg-gradient-to-r from-blue-500/10 to-blue-500/5 rounded-lg border border-blue-500/20"
                >
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-xs">Debug your quantum circuits</span>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="flex items-center gap-3 p-2 bg-gradient-to-r from-purple-500/10 to-purple-500/5 rounded-lg border border-purple-500/20"
                >
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                  <span className="text-xs">Suggest optimizations and improvements</span>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="flex items-center gap-3 p-2 bg-gradient-to-r from-orange-500/10 to-orange-500/5 rounded-lg border border-orange-500/20"
                >
                  <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                  <span className="text-xs">Guide you through complex algorithms</span>
                </motion.div>
              </div>
            </div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-xl p-3"
            >
              <div className="flex items-center gap-2 text-sm mb-2">
                <Star className="w-4 h-4 text-indigo-500" />
                <span className="font-semibold text-indigo-600">Always Learning</span>
              </div>
              <div className="text-xs text-muted-foreground">
                Your assistant gets smarter with every question, providing increasingly personalized quantum computing guidance.
              </div>
            </motion.div>
          </motion.div>
        ),
      },
    ],
  };

  const handleStartTour = () => {
    startTour(workspaceTour);
    onStartTour?.();
  };

  if (isActive) {
    return <TourOverlay isVisible={true} onClose={() => {}} />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="space-y-8"
    >
      <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/8 via-accent/5 to-secondary/8 backdrop-blur-sm shadow-2xl overflow-hidden relative">
        {/* Animated background pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-50" />
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/10 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-accent/10 to-transparent rounded-full blur-2xl" />

        <CardHeader className="relative pb-8">
          <div className="flex items-center gap-6">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.8, delay: 0.2, type: "spring", bounce: 0.4 }}
              className="w-16 h-16 bg-gradient-to-br from-primary/20 via-accent/20 to-secondary/20 rounded-3xl flex items-center justify-center shadow-lg border border-primary/20"
            >
              <Rocket className="w-8 h-8 text-primary" />
            </motion.div>
            <div className="space-y-2">
              <CardTitle className="text-3xl bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent font-bold">
                Interactive Quantum Tour
              </CardTitle>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Embark on a journey through the fascinating world of quantum computing
              </p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Sparkles className="w-4 h-4 text-primary" />
                <span>9 interactive steps • ~5 minutes • Beginner friendly</span>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="relative space-y-8">
          {/* Tour Preview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-5"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl flex items-center justify-center">
                  <Target className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-bold text-xl text-primary">What You'll Master</h3>
              </div>
              <div className="space-y-4">
                <motion.div
                  whileHover={{ scale: 1.02, x: 5 }}
                  className="flex items-start gap-4 p-4 bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl border border-primary/20 hover:shadow-lg transition-all duration-300"
                >
                  <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <div className="font-semibold text-primary">Platform Navigation</div>
                    <div className="text-sm text-muted-foreground">Master the quantum workspace interface</div>
                  </div>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.02, x: 5 }}
                  className="flex items-start gap-4 p-4 bg-gradient-to-r from-accent/5 to-accent/10 rounded-xl border border-accent/20 hover:shadow-lg transition-all duration-300"
                >
                  <div className="w-8 h-8 bg-accent/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Zap className="w-4 h-4 text-accent" />
                  </div>
                  <div>
                    <div className="font-semibold text-accent">Circuit Building</div>
                    <div className="text-sm text-muted-foreground">Create quantum algorithms visually</div>
                  </div>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.02, x: 5 }}
                  className="flex items-start gap-4 p-4 bg-gradient-to-r from-blue-500/5 to-blue-500/10 rounded-xl border border-blue-500/20 hover:shadow-lg transition-all duration-300"
                >
                  <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <BarChart3 className="w-4 h-4 text-blue-500" />
                  </div>
                  <div>
                    <div className="font-semibold text-blue-500">Quantum Visualization</div>
                    <div className="text-sm text-muted-foreground">Explore Bloch spheres and quantum states</div>
                  </div>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.02, x: 5 }}
                  className="flex items-start gap-4 p-4 bg-gradient-to-r from-green-500/5 to-green-500/10 rounded-xl border border-green-500/20 hover:shadow-lg transition-all duration-300"
                >
                  <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Code className="w-4 h-4 text-green-500" />
                  </div>
                  <div>
                    <div className="font-semibold text-green-500">Code Integration</div>
                    <div className="text-sm text-muted-foreground">See visual circuits become Qiskit code</div>
                  </div>
                </motion.div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-5"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-accent/20 to-accent/10 rounded-xl flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-accent" />
                </div>
                <h3 className="font-bold text-xl text-accent">Tour Overview</h3>
              </div>
              <div className="space-y-4">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-500/5 to-blue-500/10 rounded-xl border border-blue-500/20"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <BookOpen className="w-4 h-4 text-blue-500" />
                    </div>
                    <span className="font-medium">Duration</span>
                  </div>
                  <Badge variant="secondary" className="bg-blue-500/20 text-blue-700 border-blue-500/30">
                    {workspaceTour.estimatedTime} minutes
                  </Badge>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-500/5 to-purple-500/10 rounded-xl border border-purple-500/20"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                      <Target className="w-4 h-4 text-purple-500" />
                    </div>
                    <span className="font-medium">Steps</span>
                  </div>
                  <Badge variant="secondary" className="bg-purple-500/20 text-purple-700 border-purple-500/30">
                    {workspaceTour.steps.length} interactive steps
                  </Badge>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-green-500/5 to-green-500/10 rounded-xl border border-green-500/20"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                      <Award className="w-4 h-4 text-green-500" />
                    </div>
                    <span className="font-medium">Difficulty</span>
                  </div>
                  <Badge variant="outline" className="text-green-600 border-green-600 bg-green-500/10">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Beginner Friendly
                  </Badge>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-500/5 to-orange-500/10 rounded-xl border border-orange-500/20"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center">
                      <Star className="w-4 h-4 text-orange-500" />
                    </div>
                    <span className="font-medium">Status</span>
                  </div>
                  {isTourCompleted(workspaceTour.id) ? (
                    <Badge className="bg-green-500/20 text-green-700 border-green-500/30">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Completed
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="border-muted-foreground/30">
                      Ready to Start
                    </Badge>
                  )}
                </motion.div>
              </div>
            </motion.div>
          </div>

          {/* Enhanced Start Tour Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex justify-center pt-6"
          >
            <motion.div
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="relative"
            >
              {/* Animated glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent rounded-2xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-300" />

              <Button
                onClick={handleStartTour}
                size="lg"
                className="relative bg-gradient-to-r from-primary via-accent to-secondary hover:from-primary/90 hover:via-accent/90 hover:to-secondary/90 shadow-2xl hover:shadow-3xl transition-all duration-500 px-10 py-5 text-lg font-bold rounded-2xl border-2 border-white/20"
              >
                <div className="flex items-center gap-3">
                  <motion.div
                    animate={{ rotate: isTourCompleted(workspaceTour.id) ? 360 : 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <Play className="w-6 h-6" />
                  </motion.div>
                  <span>
                    {isTourCompleted(workspaceTour.id) ? 'Take Tour Again' : 'Start Your Quantum Journey'}
                  </span>
                  <Sparkles className="w-5 h-5" />
                </div>
              </Button>
            </motion.div>
          </motion.div>

          {/* Enhanced Tour Tips */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-gradient-to-r from-muted/30 via-muted/20 to-muted/30 rounded-2xl p-6 border border-muted/40 backdrop-blur-sm"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-accent/20 rounded-xl flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <h4 className="font-bold text-lg text-primary">Tour Tips & Tricks</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="flex items-start gap-3 p-3 bg-background/50 rounded-xl border border-primary/10"
              >
                <div className="w-6 h-6 bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Target className="w-3 h-3 text-primary" />
                </div>
                <div className="text-sm">
                  <div className="font-semibold text-primary">Interactive Elements</div>
                  <div className="text-muted-foreground">Click highlighted areas to continue</div>
                </div>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="flex items-start gap-3 p-3 bg-background/50 rounded-xl border border-accent/10"
              >
                <div className="w-6 h-6 bg-accent/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <BarChart3 className="w-3 h-3 text-accent" />
                </div>
                <div className="text-sm">
                  <div className="font-semibold text-accent">Progress Tracking</div>
                  <div className="text-muted-foreground">Watch your completion percentage</div>
                </div>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="flex items-start gap-3 p-3 bg-background/50 rounded-xl border border-blue-500/10"
              >
                <div className="w-6 h-6 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <SkipForward className="w-3 h-3 text-blue-500" />
                </div>
                <div className="text-sm">
                  <div className="font-semibold text-blue-500">Skip Anytime</div>
                  <div className="text-muted-foreground">Exit the tour whenever you want</div>
                </div>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="flex items-start gap-3 p-3 bg-background/50 rounded-xl border border-green-500/10"
              >
                <div className="w-6 h-6 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle className="w-3 h-3 text-green-500" />
                </div>
                <div className="text-sm">
                  <div className="font-semibold text-green-500">Auto-Save Progress</div>
                  <div className="text-muted-foreground">Your progress is automatically saved</div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default TourGuide;