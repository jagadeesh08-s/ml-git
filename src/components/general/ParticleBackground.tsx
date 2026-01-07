import React, { useEffect, useRef } from 'react';

const ParticleBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Enhanced particle system with quantum properties
    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      opacity: number;
      color: string;
      baseOpacity: number;
      phase: number;
      amplitude: number;
      frequency: number;
      entanglement: number | null;
    }> = [];

    const colors = [
      'rgba(102, 126, 234, 0.8)', // Primary quantum blue
      'rgba(118, 75, 162, 0.7)',  // Secondary purple
      'rgba(240, 147, 251, 0.6)', // Accent pink
      'rgba(245, 87, 108, 0.5)',  // Error red
      'rgba(78, 205, 196, 0.7)'   // Success cyan
    ];

    // Create enhanced particles with quantum properties
    for (let i = 0; i < 80; i++) {
      const baseOpacity = Math.random() * 0.4 + 0.1;
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8,
        size: Math.random() * 4 + 1,
        opacity: baseOpacity,
        baseOpacity,
        color: colors[Math.floor(Math.random() * colors.length)],
        phase: Math.random() * Math.PI * 2,
        amplitude: Math.random() * 20 + 10,
        frequency: Math.random() * 0.02 + 0.01,
        entanglement: Math.random() > 0.7 ? Math.floor(Math.random() * 80) : null
      });
    }

    const animate = (time: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((particle, index) => {
        // Quantum oscillation effect
        particle.phase += particle.frequency;
        const oscillation = Math.sin(particle.phase) * particle.amplitude;

        // Update position with quantum effects
        particle.x += particle.vx + Math.sin(time * 0.001 + particle.phase) * 0.3;
        particle.y += particle.vy + Math.cos(time * 0.001 + particle.phase) * 0.3;

        // Quantum opacity pulsing
        particle.opacity = particle.baseOpacity + Math.sin(time * 0.002 + particle.phase) * 0.3;

        // Wrap around edges with quantum tunneling effect
        if (particle.x < 0) particle.x = canvas.width;
        if (particle.x > canvas.width) particle.x = 0;
        if (particle.y < 0) particle.y = canvas.height;
        if (particle.y > canvas.height) particle.y = 0;

        // Draw enhanced particle with glow effect
        ctx.save();
        ctx.globalAlpha = particle.opacity;

        // Outer glow
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size + 3, 0, Math.PI * 2);
        ctx.fillStyle = particle.color.replace('0.8', '0.2').replace('0.7', '0.2').replace('0.6', '0.2').replace('0.5', '0.2');
        ctx.fill();

        // Inner particle
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = particle.color;
        ctx.fill();

        // Quantum sparkle effect
        if (Math.random() > 0.95) {
          ctx.beginPath();
          ctx.arc(particle.x + oscillation * 0.1, particle.y + oscillation * 0.1, particle.size * 0.5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${particle.opacity * 2})`;
          ctx.fill();
        }

        ctx.restore();

        // Enhanced connections with quantum entanglement
        particles.slice(index + 1).forEach((otherParticle, otherIndex) => {
          const dx = particle.x - otherParticle.x;
          const dy = particle.y - otherParticle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 120) {
            // Quantum entanglement connection
            if (particle.entanglement === index || otherParticle.entanglement === index) {
              ctx.save();
              ctx.globalAlpha = (1 - distance / 120) * 0.8;

              // Create quantum connection effect
              const gradient = ctx.createLinearGradient(particle.x, particle.y, otherParticle.x, otherParticle.y);
              gradient.addColorStop(0, particle.color);
              gradient.addColorStop(1, otherParticle.color);

              ctx.beginPath();
              ctx.moveTo(particle.x, particle.y);
              ctx.lineTo(otherParticle.x, otherParticle.y);
              ctx.strokeStyle = gradient;
              ctx.lineWidth = 2;
              ctx.stroke();

              // Add quantum field effect
              ctx.beginPath();
              ctx.arc(particle.x, particle.y, distance * 0.1, 0, Math.PI * 2);
              ctx.arc(otherParticle.x, otherParticle.y, distance * 0.1, 0, Math.PI * 2);
              ctx.fillStyle = `rgba(102, 126, 234, ${(1 - distance / 120) * 0.1})`;
              ctx.fill();

              ctx.restore();
            } else if (distance < 80) {
              // Regular quantum connection
              ctx.save();
              ctx.globalAlpha = (1 - distance / 80) * 0.3;

              ctx.beginPath();
              ctx.moveTo(particle.x, particle.y);
              ctx.lineTo(otherParticle.x, otherParticle.y);
              ctx.strokeStyle = particle.color;
              ctx.lineWidth = 0.8;
              ctx.stroke();

              ctx.restore();
            }
          }
        });
      });

      requestAnimationFrame(animate);
    };

    animate(0);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 w-full h-full pointer-events-none z-0 opacity-30"
    />
  );
};

export default ParticleBackground;