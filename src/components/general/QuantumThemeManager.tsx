import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Palette, Zap, Star, Eye, Coffee, Monitor, Moon, Sun } from 'lucide-react';
import ThemePreview from './ThemePreview';

import { Theme } from '@/components/general/ThemeProvider';

interface QuantumThemeManagerProps {
  currentTheme: Theme;
  onThemeChange: (theme: Theme) => void;
}

export const QuantumThemeManager: React.FC<QuantumThemeManagerProps> = ({
  currentTheme,
  onThemeChange
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const quantumThemes = [
    { value: 'quantum' as Theme, label: 'Quantum', description: 'Cyberpunk quantum theme with cyan accents', icon: Zap },
    { value: 'quantum-light' as Theme, label: 'Quantum Light', description: 'Light quantum-inspired theme with electric blues', icon: Zap },
    { value: 'superposition' as Theme, label: 'Superposition', description: 'Mixed state quantum theme with vibrant contrasts', icon: Star },
    { value: 'entanglement' as Theme, label: 'Entanglement', description: 'Connected quantum theme with deep purples', icon: Star },
    { value: 'tunneling' as Theme, label: 'Tunneling', description: 'Quantum tunneling theme with sharp cyans', icon: Zap },
    { value: 'decoherence' as Theme, label: 'Decoherence', description: 'Quantum decoherence theme with fading effects', icon: Eye }
  ];

  const classicThemes = [
    { value: 'dark' as Theme, label: 'Dark', description: 'Classic dark theme', icon: Moon },
    { value: 'light' as Theme, label: 'Light', description: 'Clean light theme', icon: Sun },
    { value: 'system' as Theme, label: 'System', description: 'Follow system preference', icon: Monitor },
    { value: 'neon' as Theme, label: 'Neon', description: 'Bright neon colors and effects', icon: Star },
    { value: 'minimal' as Theme, label: 'Minimal', description: 'Clean and minimal design', icon: Eye },
    { value: 'cosmic' as Theme, label: 'Cosmic', description: 'Space-inspired dark theme', icon: Star },
    { value: 'retro' as Theme, label: 'Retro', description: '80s retro computing style', icon: Coffee }
  ];

  const handleThemeSelect = (theme: string) => {
    onThemeChange(theme as Theme);
    setIsOpen(false);
  };

  const getCurrentThemeInfo = () => {
    const allThemes = [...quantumThemes, ...classicThemes];
    return allThemes.find(t => t.value === currentTheme) || allThemes[0];
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Palette className="h-4 w-4" />
          <span className="hidden sm:inline">Themes</span>
          <Badge variant="secondary" className="text-xs">
            {getCurrentThemeInfo().label}
          </Badge>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Quantum Theme Manager
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="quantum" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="quantum" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Quantum Themes
            </TabsTrigger>
            <TabsTrigger value="classic" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Classic Themes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="quantum" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {quantumThemes.map((theme) => (
                <ThemePreview
                  key={theme.value}
                  themeName={theme.label}
                  themeValue={theme.value}
                  isActive={currentTheme === theme.value}
                  onSelect={handleThemeSelect}
                  description={theme.description}
                />
              ))}
            </div>
            <div className="mt-6 p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Quantum Concepts
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                <div>
                  <strong>Superposition:</strong> Multiple states existing simultaneously
                </div>
                <div>
                  <strong>Entanglement:</strong> Quantum particles linked across distances
                </div>
                <div>
                  <strong>Tunneling:</strong> Particles passing through barriers
                </div>
                <div>
                  <strong>Decoherence:</strong> Loss of quantum behavior to classical
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="classic" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {classicThemes.map((theme) => (
                <ThemePreview
                  key={theme.value}
                  themeName={theme.label}
                  themeValue={theme.value}
                  isActive={currentTheme === theme.value}
                  onSelect={handleThemeSelect}
                  description={theme.description}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default QuantumThemeManager;