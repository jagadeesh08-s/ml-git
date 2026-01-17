import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BLOCH_SPHERE_GUIDE, SERIES_COMPOSITION_RULES, PARALLEL_COMPOSITION_RULES, GATE_SEQUENCES, getGateInfo, calculateSequenceEffect, BlochTransformation } from '../utils/blochSphereGuide';

const BlochSphereGuide: React.FC = () => {
  const [selectedGate, setSelectedGate] = useState<string>('X');
  const [sequenceMode, setSequenceMode] = useState<'series' | 'parallel'>('series');
  const [selectedSequence, setSelectedSequence] = useState<string[]>(['H', 'Z', 'H']);

  const gateInfo = getGateInfo(selectedGate);
  const sequenceEffect = calculateSequenceEffect(selectedSequence);

  const renderBlochSphere = (gate: string, highlightAxis?: string): JSX.Element | null => {
    const info: BlochTransformation | undefined = getGateInfo(gate);
    if (!info) return null;

    return (
      <div className="relative w-48 h-48 mx-auto">
        {/* Bloch Sphere */}
        <svg viewBox="0 0 200 200" className="w-full h-full">
          {/* Sphere outline */}
          <circle
            cx="100"
            cy="100"
            r="80"
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="2"
            opacity="0.3"
          />

          {/* Coordinate axes */}
          <line x1="100" y1="20" x2="100" y2="180" stroke="hsl(var(--primary))" strokeWidth="2" />
          <line x1="20" y1="100" x2="180" y2="100" stroke="hsl(var(--primary))" strokeWidth="2" />

          {/* Axis labels */}
          <text x="100" y="15" textAnchor="middle" fill="hsl(var(--primary))" fontSize="12">Z</text>
          <text x="185" y="105" fill="hsl(var(--primary))" fontSize="12">X</text>
          <text x="10" y="105" fill="hsl(var(--primary))" fontSize="12">Y</text>

          {/* Highlight rotation axis */}
          {highlightAxis && (
            <circle
              cx="100"
              cy="100"
              r="85"
              fill="none"
              stroke={`hsl(var(--${highlightAxis === 'X' ? 'accent' : highlightAxis === 'Y' ? 'secondary' : 'electric'}))`}
              strokeWidth="3"
              strokeDasharray="5,5"
              opacity="0.7"
              className="animate-pulse"
            />
          )}

          {/* State vectors for common states */}
          <circle cx="100" cy="20" r="3" fill="hsl(var(--primary))" /> {/* |0⟩ */}
          <circle cx="100" cy="180" r="3" fill="hsl(var(--primary))" /> {/* |1⟩ */}
          <circle cx="180" cy="100" r="3" fill="hsl(var(--accent))" /> {/* |+⟩ */}
          <circle cx="20" cy="100" r="3" fill="hsl(var(--secondary))" /> {/* |+i⟩ */}
        </svg>

        {/* Gate info overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="glass-card-primary p-3 rounded-lg text-center">
            <div className="text-gradient-bold text-lg font-bold">{gate}</div>
            <div className="text-white/80 text-sm">{info.axis}-axis</div>
            <div className="text-white/60 text-xs">{(info.angle * 180 / Math.PI).toFixed(0)}°</div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-gray-950 to-slate-950 p-8">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <h1 className="text-5xl font-black text-gradient-electric">
            Bloch Sphere Axes Guide
          </h1>
          <p className="text-xl text-white/80 max-w-3xl mx-auto">
            Complete reference for quantum gate transformations on the Bloch sphere
          </p>
        </motion.div>

        {/* Single Gate Reference */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card-primary p-8 rounded-3xl"
        >
          <h2 className="text-3xl font-bold text-gradient-neon mb-6">Single Gate Transformations</h2>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
            {BLOCH_SPHERE_GUIDE.map((gate: BlochTransformation) => (
              <motion.button
                key={gate.gate}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedGate(gate.gate)}
                className={`p-4 rounded-xl transition-all duration-300 ${
                  selectedGate === gate.gate
                    ? 'glass-card-electric animate-neon-pulse'
                    : 'glass-card-primary hover-electric-lift'
                }`}
              >
                <div className="text-center">
                  <div className="text-2xl font-bold text-gradient-bold">{gate.gate}</div>
                  <div className="text-sm text-white/70">{gate.axis}</div>
                  <div className="text-xs text-white/50">{(gate.angle * 180 / Math.PI).toFixed(0)}°</div>
                </div>
              </motion.button>
            ))}
          </div>

          {gateInfo && (
            <motion.div
              key={selectedGate}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="grid md:grid-cols-2 gap-8"
            >
              <div>
                <h3 className="text-2xl font-bold text-gradient-electric mb-4">
                  {gateInfo.gate} Gate Details
                </h3>
                <div className="space-y-3 text-white/90">
                  <p><strong>Axis:</strong> {gateInfo.axis}</p>
                  <p><strong>Angle:</strong> {(gateInfo.angle * 180 / Math.PI).toFixed(1)}° ({gateInfo.angle.toFixed(3)} rad)</p>
                  <p><strong>Description:</strong> {gateInfo.description}</p>
                  <p><strong>Matrix:</strong> <code className="bg-black/30 px-2 py-1 rounded">{gateInfo.matrixForm}</code></p>
                  <p><strong>Bloch Effect:</strong> {gateInfo.blochEffect}</p>
                </div>
              </div>

              <div>
                {renderBlochSphere(selectedGate, gateInfo.axis)}
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Gate Sequences */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card-electric p-8 rounded-3xl"
        >
          <h2 className="text-3xl font-bold text-gradient-neon mb-6">Gate Sequences</h2>

          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setSequenceMode('series')}
              className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                sequenceMode === 'series'
                  ? 'glass-card-primary animate-neon-pulse'
                  : 'glass-card-electric hover-electric-lift'
              }`}
            >
              Series Composition
            </button>
            <button
              onClick={() => setSequenceMode('parallel')}
              className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                sequenceMode === 'parallel'
                  ? 'glass-card-primary animate-neon-pulse'
                  : 'glass-card-electric hover-electric-lift'
              }`}
            >
              Parallel Composition
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-bold text-white mb-4">
                {sequenceMode === 'series' ? 'Series Rules' : 'Parallel Rules'}
              </h3>
              <div className="space-y-2">
                {Object.entries(sequenceMode === 'series' ? SERIES_COMPOSITION_RULES : PARALLEL_COMPOSITION_RULES)
                  .slice(0, 8)
                  .map(([sequence, result]: [string, string]) => (
                    <div key={sequence} className="flex justify-between items-center p-3 glass-card-primary rounded-lg">
                      <code className="text-white/90">{sequence}</code>
                      <span className="text-gradient-electric font-semibold">→</span>
                      <span className="text-white/80">{result}</span>
                    </div>
                  ))}
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold text-white mb-4">Common Sequences</h3>
              <div className="space-y-3">
                {Object.entries(GATE_SEQUENCES).map(([sequence, info]: [string, { description: string; effect: string; blochTransform: string }]) => (
                  <motion.div
                    key={sequence}
                    whileHover={{ scale: 1.02 }}
                    className="p-4 glass-card-primary rounded-lg hover-electric-lift"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <code className="text-gradient-bold font-bold">{sequence}</code>
                      <span className="text-white/60">→</span>
                      <span className="text-gradient-electric">{info.effect}</span>
                    </div>
                    <p className="text-white/70 text-sm">{info.description}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Interactive Sequence Builder */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="glass-card-primary p-8 rounded-3xl"
        >
          <h2 className="text-3xl font-bold text-gradient-electric mb-6">Interactive Sequence Builder</h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xl font-bold text-white mb-4">Build Sequence</h3>
              <div className="space-y-3">
                {['H', 'X', 'Y', 'Z', 'S', 'T', 'RX', 'RY', 'RZ'].map((gate) => (
                  <motion.button
                    key={gate}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedSequence([...selectedSequence, gate])}
                    className="w-full p-3 glass-card-electric rounded-lg hover-neon-glow transition-all"
                  >
                    {gate}
                  </motion.button>
                ))}
              </div>
              <button
                onClick={() => setSelectedSequence([])}
                className="w-full mt-4 p-3 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-all"
              >
                Clear
              </button>
            </div>

            <div>
              <h3 className="text-xl font-bold text-white mb-4">Current Sequence</h3>
              <div className="min-h-32 p-4 glass-card-electric rounded-lg">
                <div className="flex flex-wrap gap-2">
                    {selectedSequence.map((gate: string, index: number) => (
                      <motion.span
                        key={index}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="px-3 py-1 bg-gradient-electric rounded-full text-white font-bold"
                      >
                        {gate}
                      </motion.span>
                    ))}
                  </div>
                {selectedSequence.length === 0 && (
                  <p className="text-white/50 text-center mt-8">Add gates to build sequence</p>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold text-white mb-4">Combined Effect</h3>
              <div className="p-4 glass-card-primary rounded-lg min-h-32">
                <p className="text-gradient-neon font-semibold">
                  {sequenceEffect}
                </p>
                {selectedSequence.length > 0 && (
                  <div className="mt-4 text-sm text-white/70">
                    <p><strong>Sequence:</strong> {selectedSequence.join(' → ')}</p>
                    <p><strong>Type:</strong> {sequenceMode === 'series' ? 'Series' : 'Parallel'}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
};

export default BlochSphereGuide;