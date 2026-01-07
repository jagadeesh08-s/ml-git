import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Palette,
  Code,
  BookOpen,
  BarChart3,
  TrendingUp,
  Microscope,
  Zap,
  Globe,
  Cpu,
  Sparkles,
  ArrowRight,
  CheckCircle
} from 'lucide-react';

interface FeatureShowcaseProps {
  onGetStarted?: () => void;
  onViewTutorials?: () => void;
  className?: string;
}

const FeatureShowcase: React.FC<FeatureShowcaseProps> = ({
  onGetStarted,
  onViewTutorials,
  className = ''
}) => {
  const features = [
    {
      icon: Palette,
      title: "Visual Circuit Builder",
      description: "Drag-and-drop quantum circuit construction with real-time visualization",
      color: "from-blue-500 to-cyan-500",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/20",
      features: ["Intuitive drag & drop", "Real-time preview", "Gate library", "Circuit validation"]
    },
    {
      icon: Code,
      title: "Advanced Code Editor",
      description: "Professional Qiskit/Python editor with syntax highlighting and auto-completion",
      color: "from-green-500 to-emerald-500",
      bgColor: "bg-green-500/10",
      borderColor: "border-green-500/20",
      features: ["Monaco Editor", "Qiskit syntax", "Auto-completion", "Error detection"]
    },
    {
      icon: BookOpen,
      title: "Interactive Tutorials",
      description: "Step-by-step guided learning with Bell states, teleportation, and algorithms",
      color: "from-purple-500 to-violet-500",
      bgColor: "bg-purple-500/10",
      borderColor: "border-purple-500/20",
      features: ["Bell State tutorial", "Quantum teleportation", "Grover's algorithm", "Progress tracking"]
    },
    {
      icon: BarChart3,
      title: "3D Visualization",
      description: "Advanced Bloch sphere visualization with probability distributions and animations",
      color: "from-orange-500 to-red-500",
      bgColor: "bg-orange-500/10",
      borderColor: "border-orange-500/20",
      features: ["3D Bloch spheres", "Probability charts", "Circuit animation", "Interactive controls"]
    },
    {
      icon: TrendingUp,
      title: "Performance Analytics",
      description: "Comprehensive benchmarking and performance analysis with detailed metrics",
      color: "from-pink-500 to-rose-500",
      bgColor: "bg-pink-500/10",
      borderColor: "border-pink-500/20",
      features: ["Performance scoring", "Resource analysis", "Benchmarking", "Export reports"]
    },
    {
      icon: Microscope,
      title: "Research Tools",
      description: "Professional quantum research tools with noise simulation and scalability analysis",
      color: "from-indigo-500 to-blue-600",
      bgColor: "bg-indigo-500/10",
      borderColor: "border-indigo-500/20",
      features: ["Noise simulation", "Scalability analysis", "Multiple exports", "Research formats"]
    }
  ];

  const capabilities = [
    { icon: Zap, text: "IBM Quantum Hardware Integration" },
    { icon: Globe, text: "Real-time Job Status Tracking" },
    { icon: Cpu, text: "Local Quantum Simulation" },
    { icon: Sparkles, text: "Advanced Quantum Algorithms" }
  ];

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4 px-4"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full border border-primary/20">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-xs sm:text-sm font-medium text-primary">Quantum Computing Platform</span>
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent leading-tight">
          Quantum Workspace
        </h1>

        <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
          The most comprehensive quantum circuit design, simulation, and analysis platform.
          From beginner tutorials to advanced research tools.
        </p>

        <div className="flex flex-wrap justify-center gap-2 sm:gap-4 pt-4">
          {capabilities.map((cap, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center gap-2 px-2 sm:px-3 py-1 bg-muted/30 rounded-lg border border-border/20"
            >
              <cap.icon className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
              <span className="text-xs sm:text-sm font-medium">{cap.text}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Features Grid */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {features.map((feature, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + index * 0.1 }}
          >
            <Card className={`h-full glass-card enhanced-card quantum-glow group`}>
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-12 h-12 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                    <Badge variant="secondary" className="text-xs">
                      Feature {index + 1}
                    </Badge>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </CardHeader>

              <CardContent className="pt-0">
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-foreground">Key Features:</h4>
                  <ul className="space-y-1">
                    {feature.features.map((item, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Call to Action */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0 }}
        className="text-center space-y-6 px-4"
      >
        <div className="max-w-2xl mx-auto">
          <h2 className="text-xl sm:text-2xl font-bold mb-4">
            Ready to Explore Quantum Computing?
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground mb-6">
            Start with our interactive tutorials or jump straight into circuit design.
            Whether you're a student, researcher, or quantum enthusiast, our platform
            provides everything you need to master quantum computing.
          </p>

        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-8 border-t border-border/20 px-4">
          <div className="text-center">
            <div className="text-xl sm:text-2xl font-bold text-primary">6</div>
            <div className="text-xs sm:text-sm text-muted-foreground">Feature Modules</div>
          </div>
          <div className="text-center">
            <div className="text-xl sm:text-2xl font-bold text-primary">25+</div>
            <div className="text-xs sm:text-sm text-muted-foreground">Quantum Gates</div>
          </div>
          <div className="text-center">
            <div className="text-xl sm:text-2xl font-bold text-primary">100+</div>
            <div className="text-xs sm:text-sm text-muted-foreground">Qubits Support</div>
          </div>
          <div className="text-center">
            <div className="text-xl sm:text-2xl font-bold text-primary">∞</div>
            <div className="text-xs sm:text-sm text-muted-foreground">Learning Potential</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default FeatureShowcase;