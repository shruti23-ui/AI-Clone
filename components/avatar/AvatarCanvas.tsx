'use client';

import { Suspense, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Float } from '@react-three/drei';
import { motion } from 'framer-motion';
import AvatarModel from './AvatarModel';
import { useChatStore } from '@/lib/store/chatStore';

export default function AvatarCanvas() {
  const { isSpeaking, currentViseme } = useChatStore();

  return (
    <motion.div
      className="relative flex-1 w-full h-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.2 }}
    >
      {/* Speaking indicator ring */}
      {isSpeaking && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="w-64 h-64 rounded-full border border-cyan-400/20 animate-ping" style={{ animationDuration: '1.5s' }} />
          <div className="absolute w-72 h-72 rounded-full border border-purple-500/10 animate-ping" style={{ animationDuration: '2s' }} />
        </div>
      )}

      <Canvas
        camera={{ position: [0, 0.5, 2.8], fov: 45, near: 0.1, far: 100 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 1.5]}
        style={{ background: 'transparent' }}
      >
        {/* Lighting */}
        <ambientLight intensity={0.4} />
        <directionalLight
          position={[5, 5, 5]}
          intensity={1.2}
          color="#06b6d4"
          castShadow
        />
        <directionalLight
          position={[-5, 3, -5]}
          intensity={0.6}
          color="#8b5cf6"
        />
        <pointLight position={[0, 2, 2]} intensity={0.8} color="#06b6d4" />
        <pointLight position={[0, -1, 1]} intensity={0.3} color="#8b5cf6" />

        {/* HDRI environment for reflections */}
        <Environment preset="night" />

        <Suspense fallback={null}>
          <Float
            speed={2}
            rotationIntensity={0.15}
            floatIntensity={0.3}
            floatingRange={[-0.05, 0.05]}
          >
            <AvatarModel isSpeaking={isSpeaking} currentViseme={currentViseme} />
          </Float>
        </Suspense>

        {/* Smooth orbit */}
        <OrbitControls
          enablePan={false}
          enableZoom={false}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 1.8}
          minAzimuthAngle={-Math.PI / 6}
          maxAzimuthAngle={Math.PI / 6}
          autoRotate={!isSpeaking}
          autoRotateSpeed={0.5}
          dampingFactor={0.05}
          enableDamping
        />
      </Canvas>
    </motion.div>
  );
}
