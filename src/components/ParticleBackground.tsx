import { useRef, useMemo, Suspense, Component, ReactNode } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';

// Simple Error Boundary
interface ErrorBoundaryState {
  hasError: boolean;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback: ReactNode;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

function ParticleField() {
  const points = useRef<THREE.Points>(null);
  
  // Generate random particles
  const particles = useMemo(() => {
    const count = 1500;
    const positions = new Float32Array(count * 3);
    
    for (let i = 0; i < count * 3; i++) {
      positions[i] = (Math.random() - 0.5) * 50;
    }
    
    return positions;
  }, []);

  useFrame((state, delta) => {
    if (points.current) {
      points.current.rotation.x += delta * 0.08;
      points.current.rotation.y += delta * 0.12;
    }
  });

  return (
    <Points ref={points} positions={particles} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color="#29AFB1"
        size={0.08}
        sizeAttenuation={true}
        depthWrite={false}
        opacity={0.4}
        blending={THREE.AdditiveBlending}
      />
    </Points>
  );
}

function FloatingOrbs() {
  const mesh1 = useRef<THREE.Mesh>(null);
  const mesh2 = useRef<THREE.Mesh>(null);
  const mesh3 = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (mesh1.current) {
      mesh1.current.position.y = Math.sin(state.clock.elapsedTime) * 2;
      mesh1.current.rotation.x += 0.01;
      mesh1.current.rotation.y += 0.01;
    }
    if (mesh2.current) {
      mesh2.current.position.y = Math.cos(state.clock.elapsedTime * 0.8) * 1.5;
      mesh2.current.rotation.x -= 0.01;
      mesh2.current.rotation.y += 0.015;
    }
    if (mesh3.current) {
      mesh3.current.position.y = Math.sin(state.clock.elapsedTime * 1.2) * 1.8;
      mesh3.current.rotation.x += 0.015;
      mesh3.current.rotation.y -= 0.01;
    }
  });

  return (
    <>
      <mesh ref={mesh1} position={[-8, 0, -5]}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial 
          color="#29AFB1" 
          emissive="#29AFB1"
          emissiveIntensity={0.8}
          transparent
          opacity={0.25}
        />
      </mesh>
      <mesh ref={mesh2} position={[8, 0, -5]}>
        <sphereGeometry args={[0.8, 32, 32]} />
        <meshStandardMaterial 
          color="#F97316" 
          emissive="#F97316"
          emissiveIntensity={0.8}
          transparent
          opacity={0.25}
        />
      </mesh>
      <mesh ref={mesh3} position={[0, 0, -8]}>
        <sphereGeometry args={[0.6, 32, 32]} />
        <meshStandardMaterial 
          color="#1E40AF" 
          emissive="#1E40AF"
          emissiveIntensity={0.8}
          transparent
          opacity={0.25}
        />
      </mesh>
    </>
  );
}

// Fallback component when 3D fails to load
const ParticleFallback = () => (
  <div className="absolute inset-0 w-full h-full z-[1] pointer-events-none">
    {/* Animated gradient fallback */}
    <div className="absolute top-20 right-20 w-32 h-32 bg-accent/20 rounded-full blur-3xl animate-float" />
    <div className="absolute bottom-20 left-20 w-40 h-40 bg-secondary/20 rounded-full blur-3xl animate-float-delayed" />
    <div className="absolute top-1/3 left-1/3 w-24 h-24 bg-primary/15 rounded-full blur-2xl animate-pulse-slow" />
  </div>
);

const CanvasContent = () => (
  <>
    <ambientLight intensity={0.8} />
    <pointLight position={[10, 10, 10]} intensity={1.5} />
    <pointLight position={[-10, -10, 10]} intensity={1} color="#29AFB1" />
    <ParticleField />
    <FloatingOrbs />
  </>
);

const ParticleBackground = () => {
  return (
    <ErrorBoundary fallback={<ParticleFallback />}>
      <div 
        className="absolute inset-0 w-full h-full z-[1] pointer-events-none"
        style={{ 
          minHeight: '100%',
          width: '100%',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
      >
        <Suspense fallback={<ParticleFallback />}>
          <Canvas
            camera={{ position: [0, 0, 10], fov: 75 }}
            gl={{ 
              alpha: true, 
              antialias: true, 
              powerPreference: "high-performance",
              preserveDrawingBuffer: false,
            }}
            dpr={[1, 2]}
            style={{ 
              display: 'block', 
              width: '100%', 
              height: '100%',
              position: 'absolute',
              top: 0,
              left: 0,
            }}
          >
            <CanvasContent />
          </Canvas>
        </Suspense>
      </div>
    </ErrorBoundary>
  );
};

export default ParticleBackground;

