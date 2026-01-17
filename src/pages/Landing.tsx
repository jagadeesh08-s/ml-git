
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import AnimatedParticleBackground from '@/components/general/AnimatedParticleBackground';
import { ArrowRight, Box, Cpu, Activity, Share2, Layers } from 'lucide-react';
import { motion } from 'framer-motion';

const Landing = () => {
    const navigate = useNavigate();

    return (
        <div className="relative min-h-screen w-full overflow-hidden text-white bg-black selection:bg-cyan-500/30">
            {/* Background */}
            <div className="absolute inset-0 z-0">
                <AnimatedParticleBackground />
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black/90 pointer-events-none" />
            </div>

            {/* Navigation / Header */}
            <header className="relative z-10 flex items-center justify-between px-6 py-6 md:px-12">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
                        <Box className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-400">
                        BlochVerse
                    </span>
                </div>
                <div className="flex gap-4">
                    <Button
                        variant="ghost"
                        className="text-gray-300 hover:text-white hover:bg-white/10"
                        onClick={() => window.open('https://github.com/your-repo', '_blank')}
                    >
                        GitHub
                    </Button>
                </div>
            </header>

            {/* Main Content */}
            <main className="relative z-10 container mx-auto px-6 pt-12 md:pt-24 pb-20">

                {/* Hero Section */}
                <div className="max-w-4xl mx-auto text-center space-y-8 mb-24">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-tight">
                            Visualize the <br />
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 animate-gradient-x">
                                Quantum Realm
                            </span>
                        </h1>
                    </motion.div>

                    <motion.p
                        className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3, duration: 0.8 }}
                    >
                        An interactive 3D playground for quantum computing. Build circuits,
                        visualize Bloch spheres, and simulate quantum states in real-time.
                    </motion.p>

                    <motion.div
                        className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5, duration: 0.8 }}
                    >
                        <Button
                            size="lg"
                            className="h-14 px-8 text-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 border-none shadow-[0_0_20px_rgba(6,182,212,0.5)] transition-all hover:scale-105"
                            onClick={() => navigate('/workspace')}
                        >
                            Enter Workspace
                            <ArrowRight className="ml-2 w-5 h-5" />
                        </Button>
                        <Button
                            size="lg"
                            variant="outline"
                            className="h-14 px-8 text-lg border-white/20 hover:bg-white/10 backdrop-blur-sm"
                            onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                        >
                            Explore Features
                        </Button>
                    </motion.div>
                </div>

                {/* Features Grid */}
                <div id="features" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                    <FeatureCard
                        icon={<Box className="w-8 h-8 text-cyan-400" />}
                        title="3D Bloch Sphere"
                        description="Interactive 3D visualization of single-qubit states with real-time rotation and phase representation."
                    />
                    <FeatureCard
                        icon={<Cpu className="w-8 h-8 text-purple-400" />}
                        title="Circuit Builder"
                        description="Drag-and-drop interface to build quantum circuits. Apply gates and see their immediate effect."
                    />
                    <FeatureCard
                        icon={<Activity className="w-8 h-8 text-green-400" />}
                        title="Live Simulation"
                        description="Run high-fidelity quantum simulations directly in your browser with zero latency."
                    />
                    <FeatureCard
                        icon={<Layers className="w-8 h-8 text-yellow-400" />}
                        title="Multi-Qubit Support"
                        description="Visualize entanglement and complex states with density metrics and state vectors."
                    />
                    <FeatureCard
                        icon={<Share2 className="w-8 h-8 text-pink-400" />}
                        title="Export & Share"
                        description="Export your circuits to QASM or share visualizations as high-quality images."
                    />
                    <FeatureCard
                        icon={<div className="text-2xl">🤖</div>}
                        title="AI Assistant"
                        description="Built-in AI guide to help you understand quantum gates and debug your circuits interactively."
                    />
                </div>
            </main>

            {/* Footer */}
            <footer className="relative z-10 text-center py-12 text-gray-500 text-sm">
                <p>© {new Date().getFullYear()} Quantum State Visualizer. Built for the future.</p>
            </footer>
        </div>
    );
};

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
    <Card className="bg-black/40 border-white/10 backdrop-blur-md hover:bg-white/5 transition-all duration-300 hover:border-white/20 group">
        <CardContent className="p-6 space-y-4">
            <div className="p-3 w-fit rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors">
                {icon}
            </div>
            <h3 className="text-xl font-semibold text-white group-hover:text-cyan-400 transition-colors">{title}</h3>
            <p className="text-gray-400 leading-relaxed">
                {description}
            </p>
        </CardContent>
    </Card>
);

export default Landing;
