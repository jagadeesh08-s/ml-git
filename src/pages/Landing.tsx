import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Torus, Sphere, Ring, Text } from '@react-three/drei';
import * as THREE from 'three';

// 3D Torus Component for Hero Background
const HeroTorus: React.FC = () => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += 0.005;
      meshRef.current.rotation.y += 0.01;
      meshRef.current.position.y = Math.sin(state.clock.getElapsedTime() * 0.5) * 0.5;
    }
  });

  return (
    <Torus ref={meshRef} args={[2, 0.5, 16, 100]} position={[8, 2, -5]}>
      <meshStandardMaterial
        color="#7c3aed"
        transparent
        opacity={0.3}
        roughness={0.1}
        metalness={0.8}
      />
    </Torus>
  );
};

// Orbital System Component
const OrbitalSystem: React.FC = () => {
  const sphereRef = useRef<THREE.Mesh>(null);
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const iconRefs = useRef<(THREE.Mesh | null)[]>([]);
  const labelRefs = useRef<(THREE.Mesh | null)[]>([]);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();

    // Central sphere rotation and pulse
    if (sphereRef.current) {
      sphereRef.current.rotation.y = time * 0.5;
      sphereRef.current.rotation.x = Math.sin(time * 0.3) * 0.1;
      sphereRef.current.scale.setScalar(1 + Math.sin(time * 2) * 0.05);
    }

    // Orbital rings
    if (ring1Ref.current) ring1Ref.current.rotation.z = time * 0.3;
    if (ring2Ref.current) ring2Ref.current.rotation.z = time * 0.5;

    // Orbiting icons
    iconRefs.current.forEach((icon, index) => {
      if (icon) {
        const angle = (time * 0.3) + (index * Math.PI / 3);
        const radius = 4 + (index % 2) * 0.5; // Adjusted for 2 rings
        icon.position.x = Math.cos(angle) * radius;
        icon.position.z = Math.sin(angle) * radius;
        icon.position.y = Math.sin(time * 2 + index) * 0.3;
        icon.rotation.y = time * 0.5 + index;
        icon.rotation.x = Math.sin(time + index) * 0.2;
      }
    });

    // Labels
    labelRefs.current.forEach((label, index) => {
      if (label) {
        const angle = (time * 0.3) + (index * Math.PI / 3);
        const radius = 4 + (index % 2) * 0.5; // Adjusted for 2 rings
        label.position.x = Math.cos(angle) * radius;
        label.position.z = Math.sin(angle) * radius;
        label.position.y = Math.sin(time * 2 + index) * 0.3 - 0.8;
        label.lookAt(0, 0, 0);
      }
    });
  });

  const iconData = [
    { name: 'Quantum Mechanics', color: '#ff6b6b', geometry: 'sphere' },
    { name: 'State Visualization', color: '#4ecdc4', geometry: 'box' },
    { name: 'Quantum Circuits', color: '#45b7d1', geometry: 'cylinder' },
    { name: 'Entanglement', color: '#f9ca24', geometry: 'torus' },
    { name: 'Quantum Computing', color: '#6c5ce7', geometry: 'octahedron' },
    { name: 'Documentation', color: '#fd79a8', geometry: 'icosahedron' }
  ];

  return (
    <group>
      {/* Central Sphere */}
      <Sphere ref={sphereRef} args={[1.5, 32, 32]} position={[0, 0, 0]}>
        <meshStandardMaterial
          color="#7c3aed"
          transparent
          opacity={0.8}
          roughness={0.1}
          metalness={0.9}
          emissive="#3b82f6"
          emissiveIntensity={0.2}
        />
      </Sphere>

      {/* Orbital Rings - Reduced to 2 thin rings */}
      <Ring ref={ring1Ref} args={[3.8, 3.82, 64]} rotation={[Math.PI / 2, 0, 0]}>
        <meshBasicMaterial color="#7c3aed" transparent opacity={0.3} />
      </Ring>
      <Ring ref={ring2Ref} args={[4.3, 4.32, 64]} rotation={[Math.PI / 3, 0, 0]}>
        <meshBasicMaterial color="#7c3aed" transparent opacity={0.3} />
      </Ring>

      {/* Orbiting Icons */}
      {iconData.map((data, index) => (
        <group key={index}>
          <mesh
            ref={(ref) => (iconRefs.current[index] = ref)}
            position={[4, 0, 0]}
          >
            {data.geometry === 'sphere' && <sphereGeometry args={[0.3, 16, 16]} />}
            {data.geometry === 'box' && <boxGeometry args={[0.4, 0.4, 0.4]} />}
            {data.geometry === 'cylinder' && <cylinderGeometry args={[0.2, 0.2, 0.4, 16]} />}
            {data.geometry === 'torus' && <torusGeometry args={[0.25, 0.1, 8, 16]} />}
            {data.geometry === 'octahedron' && <octahedronGeometry args={[0.3]} />}
            {data.geometry === 'icosahedron' && <icosahedronGeometry args={[0.3]} />}
            <meshStandardMaterial
              color={data.color}
              emissive={data.color}
              emissiveIntensity={0.3}
              transparent
              opacity={0.9}
            />
          </mesh>
          <Text
            ref={(ref) => (labelRefs.current[index] = ref)}
            position={[4, -0.8, 0]}
            fontSize={0.15}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
          >
            {data.name}
          </Text>
        </group>
      ))}
    </group>
  );
};

const Landing: React.FC = () => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [email, setEmail] = useState('');

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Email submitted:', email);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#1a1a2e] to-[#0a0a0f] overflow-x-hidden relative">
      {/* Starfield Background */}
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 200 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      {/* Nebula Background */}
      <div className="absolute inset-0">
        <div className="absolute w-full h-full bg-gradient-radial from-purple-900/20 via-transparent to-transparent opacity-50" />
        <div className="absolute w-full h-full bg-gradient-radial from-blue-900/20 via-transparent to-transparent opacity-30" />
      </div>

      {/* HERO SECTION */}
      <section className="relative min-h-screen flex items-center justify-center px-4 py-20">
        {/* 3D Canvas Background */}
        <div className="hidden md:block absolute top-0 right-0 w-1/2 h-full">
          <Canvas camera={{ position: [0, 0, 10], fov: 50 }}>
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} intensity={1} />
            <HeroTorus />
            <OrbitControls enableZoom={false} enablePan={false} enableRotate={false} />
          </Canvas>
        </div>

        <div className={`relative z-10 text-center max-w-6xl mx-auto transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          {/* Title */}
          <div className="space-y-4 mb-8">
            <h1 className="text-6xl md:text-8xl lg:text-9xl font-bold text-white tracking-wider drop-shadow-2xl"
              style={{
                textShadow: '0 0 20px #3b82f6, 0 0 40px #3b82f680',
                letterSpacing: '0.05em'
              }}>
              QUANTUM STATE
            </h1>
            <h1 className="text-6xl md:text-8xl lg:text-9xl font-bold bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6] bg-clip-text text-transparent tracking-wider drop-shadow-2xl"
              style={{
                letterSpacing: '0.05em'
              }}>
              VISUALIZER
            </h1>
          </div>

          {/* Subtitle */}
          <div className="space-y-4 mb-12">
            <p className="text-xl md:text-2xl text-gray-300 font-light tracking-wide">
              Professional Quantum Computing Platform
            </p>
            <p className="text-lg text-gray-400 tracking-wider">
              AQVH 2025
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-20">
            <button
              onClick={() => navigate('/workspace')}
              className="group relative px-8 py-4 bg-primary hover:bg-primary/90 rounded-lg text-white font-semibold text-lg shadow-lg transition-all duration-200 transform hover:scale-105 hover:shadow-xl"
            >
              <span className="relative z-10 flex items-center gap-3">
                <span className="text-2xl transition-transform duration-300 group-hover:translate-x-1">🚀</span>
                <span>Explore Platform</span>
              </span>
            </button>

            <button
              onClick={() => navigate('/workspace?tutorials=true')}
              className="group relative px-8 py-4 bg-transparent border-2 border-border/50 hover:border-border rounded-lg text-white font-semibold text-lg transition-all duration-200 transform hover:scale-105 backdrop-blur-sm hover:bg-accent/10"
            >
              <span className="relative z-10 flex items-center gap-3">
                <span className="text-2xl transition-transform duration-300 group-hover:translate-x-1">📚</span>
                <span>Start Learning</span>
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="group bg-[#1a1a2e] backdrop-blur-md border border-[#7c3aed40] rounded-xl p-8 hover:border-[#7c3aed60] transition-all duration-300 transform hover:-translate-y-2 hover:shadow-2xl"
              style={{ boxShadow: '0 0 30px rgba(124, 58, 237, 0.1)' }}>
              <div className="w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center mb-6 mx-auto">
                <span className="text-3xl">⚡</span>
              </div>
              <h3 className="text-white text-2xl font-bold mb-4 text-center">Real-time Visualization</h3>
              <p className="text-[#9ca3af] text-center leading-relaxed">
                Interactive quantum state visualization with live updates and dynamic rendering
              </p>
            </div>

            {/* Card 2 */}
            <div className="group bg-[#1a1a2e] backdrop-blur-md border border-[#7c3aed40] rounded-xl p-8 hover:border-[#7c3aed60] transition-all duration-300 transform hover:-translate-y-2 hover:shadow-2xl"
              style={{ boxShadow: '0 0 30px rgba(124, 58, 237, 0.1)' }}>
              <div className="w-16 h-16 bg-cyan-400 rounded-full flex items-center justify-center mb-6 mx-auto">
                <span className="text-3xl">⚛️</span>
              </div>
              <h3 className="text-white text-2xl font-bold mb-4 text-center">Advanced Simulation</h3>
              <p className="text-[#9ca3af] text-center leading-relaxed">
                Multi-qubit quantum circuit simulation with high-precision state calculations
              </p>
            </div>

            {/* Card 3 */}
            <div className="group bg-[#1a1a2e] backdrop-blur-md border border-[#7c3aed40] rounded-xl p-8 hover:border-[#7c3aed60] transition-all duration-300 transform hover:-translate-y-2 hover:shadow-2xl"
              style={{ boxShadow: '0 0 30px rgba(124, 58, 237, 0.1)' }}>
              <div className="w-16 h-16 bg-purple-400 rounded-full flex items-center justify-center mb-6 mx-auto">
                <span className="text-3xl">🎓</span>
              </div>
              <h3 className="text-white text-2xl font-bold mb-4 text-center">Learn & Explore</h3>
              <p className="text-[#9ca3af] text-center leading-relaxed">
                Comprehensive quantum computing tutorials and interactive learning paths
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ADDITIONAL FEATURES SECTION */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Card 4 */}
            <div className="group bg-[#1a1a2e] backdrop-blur-md border border-green-500/30 rounded-xl p-10 hover:border-green-500/50 transition-all duration-300 transform hover:-translate-y-2 hover:shadow-2xl"
              style={{ boxShadow: '0 0 30px rgba(34, 197, 94, 0.1)' }}>
              <div className="w-20 h-20 bg-green-400 rounded-full flex items-center justify-center mb-8 mx-auto">
                <span className="text-4xl">🔐</span>
              </div>
              <h3 className="text-white text-3xl font-bold mb-6 text-center">Quantum Cryptography</h3>
              <p className="text-[#9ca3af] text-center leading-relaxed text-lg">
                Implement quantum key distribution protocols and secure communication algorithms
              </p>
            </div>

            {/* Card 5 */}
            <div className="group bg-[#1a1a2e] backdrop-blur-md border border-orange-500/30 rounded-xl p-10 hover:border-orange-500/50 transition-all duration-300 transform hover:-translate-y-2 hover:shadow-2xl"
              style={{ boxShadow: '0 0 30px rgba(249, 115, 22, 0.1)' }}>
              <div className="w-20 h-20 bg-orange-400 rounded-full flex items-center justify-center mb-8 mx-auto">
                <span className="text-4xl">{"</>"}</span>
              </div>
              <h3 className="text-white text-3xl font-bold mb-6 text-center">Quantum Algorithms</h3>
              <p className="text-[#9ca3af] text-center leading-relaxed text-lg">
                Explore Grover's, Shor's, VQE, QAOA and other cutting-edge quantum algorithms
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3D ORBITAL SYSTEM SECTION */}
      <section className="py-32 px-4 relative">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-8 bg-gradient-to-r from-[#7c3aed] to-[#6366f1] bg-clip-text text-transparent">
            Quantum Computing Universe
          </h2>
          <p className="text-xl text-[#9ca3af] mb-16 max-w-3xl mx-auto">
            Immerse yourself in the fascinating world of quantum mechanics through interactive 3D visualizations
          </p>
        </div>

        <div className="h-[600px] w-full">
          <Canvas camera={{ position: [0, 0, 15], fov: 50 }}>
            <ambientLight intensity={0.4} />
            <pointLight position={[10, 10, 10]} intensity={1} />
            <directionalLight position={[-10, -10, -5]} intensity={0.5} />
            <OrbitalSystem />
            <OrbitControls enableZoom={false} enablePan={false} />
          </Canvas>
        </div>
      </section>

      {/* EMAIL SIGNUP SECTION */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-8 bg-gradient-to-r from-[#7c3aed] to-[#6366f1] bg-clip-text text-transparent">
            Let's Explore the Quantum Universe
          </h2>

          <form onSubmit={handleEmailSubmit} className="max-w-2xl mx-auto mt-12">
            <div className="flex flex-col sm:flex-row gap-0">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="flex-1 px-6 py-4 bg-[#1a1a2e] border-2 border-[#7c3aed50] rounded-l-full text-white placeholder-[#9ca3af] focus:border-[#7c3aed] focus:outline-none transition-all duration-300"
                required
              />
              <button
                type="submit"
                className="px-8 py-4 bg-[#7c3aed] hover:bg-[#6d28d9] rounded-r-full text-white font-semibold transition-all duration-300 transform hover:scale-105 flex items-center gap-2"
                style={{ boxShadow: '0 0 20px #7c3aed60' }}
              >
                Get Started
                <span className="text-xl">✨</span>
              </button>
            </div>
          </form>

          <div className="mt-8">
            <a href="#" className="text-[#9ca3af] hover:text-[#7c3aed] transition-colors duration-300 flex items-center justify-center gap-2">
              <span>Join our community</span>
              <span className="animate-bounce">💬</span>
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#0a0a0f] border-t border-[#ffffff20] py-16 px-4 relative">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {/* Column 1 */}
            <div>
              <h3 className="text-white font-bold text-xl mb-4">Quantum State Visualizer</h3>
              <p className="text-[#9ca3af] text-sm leading-relaxed mb-6">
                The world's most advanced quantum computing visualization platform
              </p>
              <div className="flex gap-4">
                <a href="#" className="text-[#9ca3af] hover:text-[#7c3aed] transition-colors duration-300 text-2xl">🐦</a>
                <a href="#" className="text-[#9ca3af] hover:text-[#7c3aed] transition-colors duration-300 text-2xl">💼</a>
                <a href="#" className="text-[#9ca3af] hover:text-[#7c3aed] transition-colors duration-300 text-2xl">💻</a>
              </div>
            </div>

            {/* Column 2 */}
            <div>
              <h4 className="text-white font-semibold mb-4 uppercase text-sm tracking-wider">Resources</h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-[#9ca3af] hover:text-[#7c3aed] transition-colors duration-300">Quantum Algorithms</a></li>
                <li><a href="#" className="text-[#9ca3af] hover:text-[#7c3aed] transition-colors duration-300">Cryptography Tools</a></li>
                <li><a href="#" className="text-[#9ca3af] hover:text-[#7c3aed] transition-colors duration-300">Visualization Lab</a></li>
                <li><a href="#" className="text-[#9ca3af] hover:text-[#7c3aed] transition-colors duration-300">Documentation</a></li>
                <li><a href="#" className="text-[#9ca3af] hover:text-[#7c3aed] transition-colors duration-300">API Reference</a></li>
              </ul>
            </div>

            {/* Column 3 */}
            <div>
              <h4 className="text-white font-semibold mb-4 uppercase text-sm tracking-wider">Support</h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-[#9ca3af] hover:text-[#7c3aed] transition-colors duration-300">Help Center</a></li>
                <li><a href="#" className="text-[#9ca3af] hover:text-[#7c3aed] transition-colors duration-300">Community Forum</a></li>
                <li><a href="#" className="text-[#9ca3af] hover:text-[#7c3aed] transition-colors duration-300">Security</a></li>
                <li><a href="#" className="text-[#9ca3af] hover:text-[#7c3aed] transition-colors duration-300">Contact Us</a></li>
                <li><a href="#" className="text-[#9ca3af] hover:text-[#7c3aed] transition-colors duration-300">Privacy Policy</a></li>
                <li><a href="#" className="text-[#9ca3af] hover:text-[#7c3aed] transition-colors duration-300">Terms of Use</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-[#ffffff20] mt-12 pt-8 text-center">
            <p className="text-[#9ca3af] text-sm">© 2025, All rights reserved by Quantum State Visualizer</p>
          </div>

          {/* Watermark */}
          <div className="absolute bottom-4 left-4 text-[#ffffff05] text-8xl font-bold pointer-events-none select-none">
            QUANTUM
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        .animate-gradient {
          background-size: 200% auto;
          animation: gradient 3s ease infinite;
        }

        .bg-gradient-radial {
          background: radial-gradient(circle, var(--tw-gradient-stops));
        }
      `}</style>
    </div>
  );
};

export default Landing;