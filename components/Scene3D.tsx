import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Float, Environment, Stars, Cloud } from '@react-three/drei';
import * as THREE from 'three';
import { SceneObjectState, LessonData } from '../types';

// Augment JSX.IntrinsicElements to include R3F elements
declare global {
  namespace JSX {
    interface IntrinsicElements {
      mesh: any;
      boxGeometry: any;
      sphereGeometry: any;
      cylinderGeometry: any;
      coneGeometry: any;
      torusGeometry: any;
      icosahedronGeometry: any;
      meshStandardMaterial: any;
      group: any;
      color: any;
      ambientLight: any;
      pointLight: any;
      planeGeometry: any;
      shadowMaterial: any;
    }
  }
}

// --- Sub-components for Scene ---

const ShapeMesh: React.FC<{ type: string; color: string; opacity: number }> = ({ type, color, opacity }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  // Create material with opacity
  const material = useMemo(() => (
    <meshStandardMaterial
      color={color}
      roughness={0.3}
      metalness={0.1}
      transparent={true}
      opacity={opacity}
    />
  ), [color, opacity]);

  // If opacity is effectively 0, don't render geometry to save resources (optional, but keep simple for now)
  // We keep it to allow fading in.

  switch (type) {
    case 'box': return <mesh ref={meshRef}><boxGeometry />{material}</mesh>;
    case 'sphere': return <mesh ref={meshRef}><sphereGeometry args={[0.7, 32, 32]} />{material}</mesh>;
    case 'cylinder': return <mesh ref={meshRef}><cylinderGeometry args={[0.7, 0.7, 1, 32]} />{material}</mesh>;
    case 'cone': return <mesh ref={meshRef}><coneGeometry args={[0.7, 1.2, 32]} />{material}</mesh>;
    case 'torus': return <mesh ref={meshRef}><torusGeometry args={[0.6, 0.2, 16, 32]} />{material}</mesh>;
    case 'icosahedron': return <mesh ref={meshRef}><icosahedronGeometry args={[0.8]} />{material}</mesh>;
    default: return <mesh ref={meshRef}><boxGeometry />{material}</mesh>;
  }
};

interface AnimatedObjectProps {
  targetState: SceneObjectState;
}

const AnimatedObject: React.FC<AnimatedObjectProps> = ({ targetState }) => {
  const groupRef = useRef<THREE.Group>(null);

  // We use refs to store current interpolated values to avoid React rerenders on every frame
  // However, for simplicity in this prompt context, we will simply lerp the THREE objects directly in useFrame.

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    const g = groupRef.current;
    const lerpFactor = 5 * delta; // Adjust speed of transition

    // Position
    g.position.lerp(new THREE.Vector3(...targetState.position), lerpFactor);

    // Scale
    g.scale.lerp(new THREE.Vector3(...targetState.scale), lerpFactor);

    // Rotation (Quaternion interpolation is better, but Euler lerp is okay for small simple rotations)
    // We'll manually lerp Euler values for simplicity
    g.rotation.x = THREE.MathUtils.lerp(g.rotation.x, targetState.rotation[0], lerpFactor);
    g.rotation.y = THREE.MathUtils.lerp(g.rotation.y, targetState.rotation[1], lerpFactor);
    g.rotation.z = THREE.MathUtils.lerp(g.rotation.z, targetState.rotation[2], lerpFactor);
  });

  return (
    <group ref={groupRef}>
      {/* We pass specific props down. Note: Color and Opacity changes on material might require re-render or custom interpolation 
          For now, React updates will handle color/opacity changes which is "good enough" for step transitions 
          Move/Scale/Rotate are handled by useFrame for smoothness.
      */}
      <Float speed={1} rotationIntensity={0.2} floatIntensity={0.2} enabled={targetState.opacity > 0.1}>
        <ShapeMesh type={targetState.shape} color={targetState.color} opacity={targetState.opacity} />
      </Float>

      {targetState.label && targetState.opacity > 0.5 && (
        <Text
          position={[0, 1.5, 0]}
          fontSize={0.5}
          color="black"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.05}
          outlineColor="white"
        >
          {targetState.label}
        </Text>
      )}
    </group>
  );
};

const Background = ({ theme }: { theme: string }) => {
  switch (theme) {
    case 'space': return <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />;
    case 'forest': return <Environment preset="park" background blur={0.6} />;
    case 'sunset': return <Environment preset="sunset" background blur={0.6} />;
    case 'sky':
    default:
      return <><Cloud opacity={0.5} speed={0.4} /><Environment preset="city" /></>;
  }
}

// --- Main Scene Component ---

interface Scene3DProps {
  currentObjectStates: SceneObjectState[];
  theme: string;
}

const Scene3D: React.FC<Scene3DProps> = ({ currentObjectStates, theme }) => {
  return (
    <Canvas shadows camera={{ position: [0, 4, 14], fov: 50 }}>
      <color attach="background" args={[theme === 'space' ? '#0f172a' : '#f0f9ff']} />
      <Background theme={theme} />

      <ambientLight intensity={0.8} />
      <pointLight position={[10, 10, 10]} intensity={1} castShadow />

      <group position={[0, 1, 0]}>
        {/* Floor */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
          <planeGeometry args={[100, 100]} />
          <shadowMaterial transparent opacity={0.1} />
        </mesh>

        {currentObjectStates.map((obj) => (
          <AnimatedObject key={obj.id} targetState={obj} />
        ))}
      </group>

      <OrbitControls
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI / 2.2}
        minDistance={5}
        maxDistance={25}
        enablePan={false}
      />
    </Canvas>
  );
};

export default Scene3D;