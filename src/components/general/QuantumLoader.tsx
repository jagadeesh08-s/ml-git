import React from 'react';

interface QuantumLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

const QuantumLoader: React.FC<QuantumLoaderProps> = ({
  size = 'md',
  text = 'Loading quantum state...',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-16 h-16',
    lg: 'w-24 h-24'
  };

  const ringSizes = {
    sm: 'w-10 h-10',
    md: 'w-20 h-20',
    lg: 'w-28 h-28'
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  return (
    <div className={`flex flex-col items-center justify-center space-y-6 ${className}`}>
      <div className="relative">
        {/* Main quantum field background */}
        <div className={`absolute inset-0 ${ringSizes[size]} rounded-full quantum-field-bg opacity-20`}></div>

        {/* Primary quantum ring */}
        <div className={`relative ${sizeClasses[size]} border-3 border-blue-400/30 border-t-blue-500 rounded-full quantum-glow-pulse`}>
          {/* Orbiting particles */}
          <div className={`absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 ${size === 'sm' ? 'w-1 h-1' : size === 'md' ? 'w-2 h-2' : 'w-3 h-3'} bg-cyan-400 rounded-full quantum-sparkle`}></div>
          <div className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 ${size === 'sm' ? 'w-1 h-1' : size === 'md' ? 'w-2 h-2' : 'w-3 h-3'} bg-purple-400 rounded-full quantum-sparkle`} style={{ animationDelay: '0.5s' }}></div>
          <div className={`absolute left-0 top-1/2 transform -translate-x-1/2 -translate-y-1/2 ${size === 'sm' ? 'w-1 h-1' : size === 'md' ? 'w-2 h-2' : 'w-3 h-3'} bg-pink-400 rounded-full quantum-sparkle`} style={{ animationDelay: '1s' }}></div>
        </div>

        {/* Secondary counter-rotating ring */}
        <div className={`absolute inset-0 ${sizeClasses[size]} border-2 border-transparent border-r-purple-400/50 rounded-full`}
             style={{
               animation: 'spin 2s linear infinite reverse',
               top: '50%',
               left: '50%',
               transform: 'translate(-50%, -50%)'
             }}></div>

        {/* Quantum core */}
        <div className={`absolute inset-1/2 transform -translate-x-1/2 -translate-y-1/2 ${size === 'sm' ? 'w-2 h-2' : size === 'md' ? 'w-3 h-3' : 'w-4 h-4'} bg-gradient-to-r from-blue-400 to-purple-400 rounded-full quantum-pulse`}></div>

        {/* Quantum ripple effect */}
        <div className={`absolute inset-0 ${sizeClasses[size]} border border-cyan-400/20 rounded-full animate-ping`}
             style={{ animationDuration: '3s' }}></div>

        {/* Energy waves */}
        <div className={`absolute inset-0 ${ringSizes[size]} rounded-full`}
             style={{
               background: 'conic-gradient(from 0deg, transparent, rgba(102, 126, 234, 0.1), transparent)',
               animation: 'spin 4s linear infinite'
             }}></div>
      </div>

      {text && (
        <div className="text-center space-y-2">
          <div className={`${textSizes[size]} font-medium quantum-text-animate`}>
            {text}
          </div>

          {/* Enhanced quantum particles */}
          <div className="flex space-x-2 justify-center">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full quantum-float-complex`}
                style={{
                  background: `hsl(${210 + i * 20}, 100%, 60%)`,
                  animationDelay: `${i * 0.15}s`,
                  animationDuration: `${2 + i * 0.3}s`
                }}
              />
            ))}
          </div>

          {/* Progress indicators */}
          <div className="flex space-x-1 justify-center mt-3">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"
                style={{ animationDelay: `${i * 0.3}s` }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default QuantumLoader;