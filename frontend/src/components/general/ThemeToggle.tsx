import React from 'react';
import { motion } from 'framer-motion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sun, Moon, Monitor, Palette, Zap, Star, Eye, Coffee, Atom, Waves, Link, ArrowRight, Shuffle } from 'lucide-react';
import { useTheme, Theme } from '@/components/general/ThemeProvider';

export const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useTheme();

  const getIcon = (themeName: Theme) => {
    switch (themeName) {
      case 'light':
        return <Sun className="h-4 w-4" />;
      case 'dark':
        return <Moon className="h-4 w-4" />;
      case 'system':
        return <Monitor className="h-4 w-4" />;
      case 'quantum':
        return <Zap className="h-4 w-4" />;
      case 'neon':
        return <Star className="h-4 w-4" />;
      case 'minimal':
        return <Eye className="h-4 w-4" />;
      case 'cosmic':
        return <Palette className="h-4 w-4" />;
      case 'retro':
        return <Coffee className="h-4 w-4" />;
      case 'quantum-light':
        return <Atom className="h-4 w-4" />;
      case 'superposition':
        return <Shuffle className="h-4 w-4" />;
      case 'entanglement':
        return <Link className="h-4 w-4" />;
      case 'tunneling':
        return <ArrowRight className="h-4 w-4" />;
      case 'decoherence':
        return <Waves className="h-4 w-4" />;
      default:
        return <Monitor className="h-4 w-4" />;
    }
  };

  const themes: { value: Theme; label: string }[] = [
    { value: 'quantum', label: 'Quantum' },
    { value: 'quantum-light', label: 'Quantum Light' },
    { value: 'superposition', label: 'Superposition' },
    { value: 'entanglement', label: 'Entanglement' },
    { value: 'tunneling', label: 'Tunneling' },
    { value: 'decoherence', label: 'Decoherence' },
    { value: 'dark', label: 'Dark' },
    { value: 'light', label: 'Light' },
    { value: 'system', label: 'System' },
    { value: 'neon', label: 'Neon' },
    { value: 'minimal', label: 'Minimal' },
    { value: 'cosmic', label: 'Cosmic' },
    { value: 'retro', label: 'Retro' }
  ];

  return (
    <Select value={theme} onValueChange={(value: Theme) => setTheme(value)}>
      <SelectTrigger className="w-32 h-8 border border-primary/20 hover:bg-primary/10 transition-colors relative z-10">
        <div className="flex items-center gap-2">
          <motion.div
            key={theme}
            initial={{ opacity: 0, rotate: -90 }}
            animate={{ opacity: 1, rotate: 0 }}
            exit={{ opacity: 0, rotate: 90 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
          >
            {getIcon(theme)}
          </motion.div>
          <span className="text-sm truncate">
            {themes.find(t => t.value === theme)?.label || 'Theme'}
          </span>
        </div>
      </SelectTrigger>
      <SelectContent className="z-50">
        {themes.map((themeOption) => (
          <SelectItem key={themeOption.value} value={themeOption.value}>
            <div className="flex items-center gap-2">
              {getIcon(themeOption.value)}
              <span className="truncate">{themeOption.label}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default ThemeToggle;
