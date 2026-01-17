import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, CircuitBoard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ThemeToggle from '@/components/general/ThemeToggle';
import CompactCache from '@/components/general/CompactCache';
import { useAuth } from '@/contexts/AuthContext';

interface HeaderProps {
    // Add props if needed
}

export const Header: React.FC<HeaderProps> = () => {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();

    return (
        <>
            <motion.header
                className="relative z-50 border-b border-border/50 bg-gradient-to-r from-card/95 via-card/90 to-card/95 backdrop-blur-xl shadow-lg"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
            >
                {/* Subtle background pattern */}
                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-secondary/5 opacity-30" />

                <div className="container mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <motion.div
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <Button
                                    variant="ghost"
                                    onClick={() => navigate('/')}
                                    className="group relative overflow-hidden rounded-xl px-4 py-3 transition-all duration-300 hover:bg-primary/20 hover:shadow-lg"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-secondary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                    <Home className="w-5 h-5 mr-3 text-primary group-hover:text-primary-foreground transition-colors" />
                                    <span className="font-medium text-foreground group-hover:text-primary-foreground transition-colors">
                                        Home
                                    </span>
                                </Button>
                            </motion.div>

                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    <div className="w-12 h-12 bg-gradient-to-br from-primary/20 via-primary/10 to-accent/20 rounded-2xl flex items-center justify-center border border-primary/20 shadow-lg backdrop-blur-sm">
                                        <CircuitBoard className="w-6 h-6 text-primary" />
                                    </div>
                                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-accent rounded-full border-2 border-white dark:border-slate-800 shadow-sm" />
                                </div>
                                <div className="space-y-1">
                                    <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
                                        Quantum State Visualizer
                                    </h1>
                                    <p className="text-sm text-muted-foreground font-medium">
                                        Interactive Quantum Circuit Simulator
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">

                            {/* Cache Manager */}
                            <CompactCache />

                            {/* Theme Toggle */}
                            <ThemeToggle />

                        </div>
                    </div>
                </div>
            </motion.header>
        </>
    );
};
