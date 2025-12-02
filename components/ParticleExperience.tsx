import React, { useMemo, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { HandGestureState } from '../types';

interface ParticleExperienceProps {
  targetPoints: number[];
  color: string;
  gestureState: HandGestureState;
}

const ParticleSystem: React.FC<ParticleExperienceProps> = ({ targetPoints, color, gestureState }) => {
  const pointsRef = useRef<THREE.Points>(null);
  
  // Create geometry buffers
  const { positions, currentPositions, targetPositions, randoms } = useMemo(() => {
    const count = targetPoints.length / 3;
    const positions = new Float32Array(count * 3);
    const currentPositions = new Float32Array(count * 3);
    const targetPositions = new Float32Array(count * 3);
    const randoms = new Float32Array(count); // For individual particle variation

    for (let i = 0; i < count; i++) {
      const ix = i * 3;
      
      // Initialize current at center
      currentPositions[ix] = (Math.random() - 0.5) * 10;
      currentPositions[ix + 1] = (Math.random() - 0.5) * 10;
      currentPositions[ix + 2] = (Math.random() - 0.5) * 10;

      // Initial target
      targetPositions[ix] = targetPoints[ix];
      targetPositions[ix + 1] = targetPoints[ix + 1];
      targetPositions[ix + 2] = targetPoints[ix + 2];

      randoms[i] = Math.random();
    }
    
    return { positions, currentPositions, targetPositions, randoms };
  }, [targetPoints]); // Re-calc when targetPoints change

  // Update target buffers when prop changes
  useEffect(() => {
    const count = targetPoints.length / 3;
    for(let i = 0; i < count * 3; i++) {
      targetPositions[i] = targetPoints[i];
    }
  }, [targetPoints, targetPositions]);

  useFrame((state) => {
    if (!pointsRef.current) return;
    
    const time = state.clock.getElapsedTime();
    const geometry = pointsRef.current.geometry;
    const posAttr = geometry.attributes.position as THREE.BufferAttribute;
    
    const count = posAttr.count;
    
    // Dynamic physics based on gestures
    // Separation drives the "Scale" or "Expansion"
    const expansionFactor = gestureState.isPresent ? gestureState.separation : 1.0;
    
    // Tension drives the "Jitter" or "Chaos"
    const chaosFactor = gestureState.isPresent ? gestureState.tension * 0.5 : 0.05;

    // Lerp speed
    const speed = 0.05;

    for (let i = 0; i < count; i++) {
      const ix = i * 3;
      
      // Target Coordinates (Base shape)
      const tx = targetPositions[ix] * expansionFactor;
      const ty = targetPositions[ix + 1] * expansionFactor;
      const tz = targetPositions[ix + 2] * expansionFactor;

      // Add "Life" (Sine wave movement)
      const r = randoms[i];
      const movement = Math.sin(time * 2 + r * 10) * chaosFactor;

      // Interpolate current to target
      currentPositions[ix] += (tx + movement - currentPositions[ix]) * speed;
      currentPositions[ix + 1] += (ty + movement - currentPositions[ix + 1]) * speed;
      currentPositions[ix + 2] += (tz + movement - currentPositions[ix + 2]) * speed;

      // Update Buffer
      posAttr.setXYZ(i, currentPositions[ix], currentPositions[ix + 1], currentPositions[ix + 2]);
    }

    posAttr.needsUpdate = true;
    
    // Rotate entire system slowly
    pointsRef.current.rotation.y += 0.001;
    if (gestureState.tension > 0.5) {
        pointsRef.current.rotation.y += 0.02; // Spin faster when tense
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.15}
        color={color}
        transparent
        opacity={0.8}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

export const Experience: React.FC<ParticleExperienceProps> = (props) => {
  return (
    <div className="w-full h-full relative">
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 0, 15]} />
        <OrbitControls enableZoom={false} enablePan={false} />
        <ambientLight intensity={0.5} />
        <ParticleSystem {...props} />
        <fog attach="fog" args={['#050505', 10, 25]} />
      </Canvas>
    </div>
  );
};
