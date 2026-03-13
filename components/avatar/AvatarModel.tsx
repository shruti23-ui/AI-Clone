'use client';

import { useRef, useEffect, useState, Suspense } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { VISEME_MAP } from './LipSync';

interface AvatarModelProps {
  isSpeaking: boolean;
  currentViseme: string | null;
}

// Fallback procedural avatar — renders when no GLB is present
function ProceduralAvatar({ isSpeaking, currentViseme }: AvatarModelProps) {
  const headRef = useRef<THREE.Group>(null);
  const jawRef = useRef<THREE.Mesh>(null);
  const leftEyeRef = useRef<THREE.Mesh>(null);
  const rightEyeRef = useRef<THREE.Mesh>(null);
  const blinkTimerRef = useRef(0);
  const blinkStateRef = useRef(false);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;

    if (headRef.current) {
      headRef.current.rotation.y = Math.sin(t * 0.3) * 0.04;
      headRef.current.rotation.x = Math.sin(t * 0.2) * 0.015;
    }

    if (jawRef.current) {
      const target = isSpeaking ? -0.26 - Math.abs(Math.sin(t * 8)) * 0.06 : -0.22;
      jawRef.current.position.y += (target - jawRef.current.position.y) * 0.25;
    }

    blinkTimerRef.current += delta;
    if (blinkTimerRef.current > 3 + Math.random() * 2.5) {
      blinkTimerRef.current = 0;
      blinkStateRef.current = true;
    }

    const eyeTargetY = blinkStateRef.current ? 0.05 : 1;
    [leftEyeRef, rightEyeRef].forEach((ref) => {
      if (ref.current) {
        ref.current.scale.y += (eyeTargetY - ref.current.scale.y) * 0.25;
        if (blinkStateRef.current && ref.current.scale.y < 0.1) {
          blinkStateRef.current = false;
        }
      }
    });
  });

  return (
    <group position={[0, -0.1, 0]}>
      <mesh position={[0, -0.55, 0]}>
        <cylinderGeometry args={[0.11, 0.13, 0.28, 16]} />
        <meshPhysicalMaterial color="#c8956c" roughness={0.65} />
      </mesh>

      <group ref={headRef}>
        <mesh>
          <sphereGeometry args={[0.36, 32, 32]} />
          <meshPhysicalMaterial color="#c8956c" roughness={0.6} clearcoat={0.15} />
        </mesh>

        <mesh position={[0, 0.18, -0.04]} scale={[1, 0.7, 1]}>
          <sphereGeometry args={[0.38, 32, 32, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
          <meshStandardMaterial color="#0f0603" roughness={0.9} />
        </mesh>

        <mesh position={[-0.28, -0.08, -0.06]}>
          <sphereGeometry args={[0.16, 16, 16]} />
          <meshStandardMaterial color="#0f0603" roughness={0.9} />
        </mesh>
        <mesh position={[0.28, -0.08, -0.06]}>
          <sphereGeometry args={[0.16, 16, 16]} />
          <meshStandardMaterial color="#0f0603" roughness={0.9} />
        </mesh>

        <mesh position={[-0.125, 0.115, 0.335]} rotation={[0, 0.15, 0]}>
          <boxGeometry args={[0.08, 0.012, 0.01]} />
          <meshStandardMaterial color="#1a0800" />
        </mesh>
        <mesh position={[0.125, 0.115, 0.335]} rotation={[0, -0.15, 0]}>
          <boxGeometry args={[0.08, 0.012, 0.01]} />
          <meshStandardMaterial color="#1a0800" />
        </mesh>

        <mesh position={[-0.125, 0.068, 0.338]}>
          <sphereGeometry args={[0.052, 16, 16]} />
          <meshStandardMaterial color="white" />
        </mesh>
        <mesh ref={leftEyeRef} position={[-0.125, 0.068, 0.382]}>
          <sphereGeometry args={[0.032, 16, 16]} />
          <meshPhysicalMaterial color="#0d0500" roughness={0.1} />
        </mesh>

        <mesh position={[0.125, 0.068, 0.338]}>
          <sphereGeometry args={[0.052, 16, 16]} />
          <meshStandardMaterial color="white" />
        </mesh>
        <mesh ref={rightEyeRef} position={[0.125, 0.068, 0.382]}>
          <sphereGeometry args={[0.032, 16, 16]} />
          <meshPhysicalMaterial color="#0d0500" roughness={0.1} />
        </mesh>

        <mesh position={[0, -0.015, 0.365]}>
          <sphereGeometry args={[0.038, 8, 8]} />
          <meshStandardMaterial color="#b5805a" roughness={0.7} />
        </mesh>

        <mesh position={[0, -0.118, 0.352]}>
          <boxGeometry args={[0.11, 0.025, 0.025]} />
          <meshPhysicalMaterial color="#b56070" roughness={0.4} />
        </mesh>
      </group>

      <mesh ref={jawRef} position={[0, -0.22, 0.04]}>
        <boxGeometry args={[0.26, 0.09, 0.26]} />
        <meshPhysicalMaterial color="#c0856a" roughness={0.65} />
      </mesh>

      <mesh position={[0, -0.9, -0.08]}>
        <sphereGeometry args={[0.44, 32, 24, 0, Math.PI * 2, 0, Math.PI / 2.1]} />
        <meshPhysicalMaterial color="#1e293b" roughness={0.7} />
      </mesh>

      <mesh position={[0, -1.35, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.55, 0.007, 8, 80]} />
        <meshBasicMaterial color="#06b6d4" transparent opacity={0.45} />
      </mesh>
      <mesh position={[0, -1.35, 0]} rotation={[Math.PI / 2, 0.5, 0]}>
        <torusGeometry args={[0.65, 0.004, 8, 80]} />
        <meshBasicMaterial color="#8b5cf6" transparent opacity={0.2} />
      </mesh>

      <pointLight position={[0, -1, 0.5]} color="#06b6d4" intensity={0.4} distance={2} />
    </group>
  );
}

// GLB inner renderer (only rendered when GLB exists)
function GLBAvatarInner({ isSpeaking, currentViseme }: AvatarModelProps) {
  const { scene } = useGLTF('/avatar/avatar.glb') as any;
  const groupRef = useRef<THREE.Group>(null);
  const morphMeshRef = useRef<THREE.SkinnedMesh | null>(null);

  useEffect(() => {
    scene.traverse((child: THREE.Object3D) => {
      const mesh = child as THREE.SkinnedMesh;
      if (mesh.isMesh && mesh.morphTargetDictionary) {
        morphMeshRef.current = mesh;
      }
    });
  }, [scene]);

  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.04;

    const mesh = morphMeshRef.current;
    if (!mesh?.morphTargetInfluences || !mesh?.morphTargetDictionary) return;

    for (let i = 0; i < mesh.morphTargetInfluences.length; i++) {
      mesh.morphTargetInfluences[i] = (mesh.morphTargetInfluences[i] || 0) * 0.7;
    }

    if (currentViseme && isSpeaking) {
      const morphNames = VISEME_MAP[currentViseme] || [];
      for (const name of morphNames) {
        const idx = mesh.morphTargetDictionary[name];
        if (idx !== undefined) {
          mesh.morphTargetInfluences[idx] = Math.min(1, (mesh.morphTargetInfluences[idx] || 0) + 0.8);
        }
      }
    }
  });

  return (
    <group ref={groupRef} position={[0, -0.9, 0]}>
      <primitive object={scene} />
    </group>
  );
}

// GLB wrapper that falls back to procedural on load failure
function GLBWithFallback({ isSpeaking, currentViseme, onError }: AvatarModelProps & { onError: () => void }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    fetch('/avatar/avatar.glb', { method: 'HEAD' })
      .then((r) => { if (!r.ok) { setFailed(true); onError(); } })
      .catch(() => { setFailed(true); onError(); });
  }, [onError]);

  if (failed) return <ProceduralAvatar isSpeaking={isSpeaking} currentViseme={currentViseme} />;
  return <GLBAvatarInner isSpeaking={isSpeaking} currentViseme={currentViseme} />;
}

export default function AvatarModel({ isSpeaking, currentViseme }: AvatarModelProps) {
  const [useGLB, setUseGLB] = useState(true);

  if (!useGLB) {
    return <ProceduralAvatar isSpeaking={isSpeaking} currentViseme={currentViseme} />;
  }

  return (
    <Suspense fallback={<ProceduralAvatar isSpeaking={isSpeaking} currentViseme={currentViseme} />}>
      <GLBWithFallback
        isSpeaking={isSpeaking}
        currentViseme={currentViseme}
        onError={() => setUseGLB(false)}
      />
    </Suspense>
  );
}

useGLTF.preload('/avatar/avatar.glb');
