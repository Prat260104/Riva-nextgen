import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { motion } from 'framer-motion';
import * as THREE from 'three';
import './AvatarRing.css';

const Avatar = ({ position, name, isActive, onClick, avatarImage }) => {
  const meshRef = useRef();
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (meshRef.current) {
      // Idle floating animation
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime + position[0]) * 0.1;
      
      // Glow effect for active avatar
      if (isActive) {
        meshRef.current.scale.setScalar(1.2 + Math.sin(state.clock.elapsedTime * 2) * 0.05);
      } else {
        meshRef.current.scale.setScalar(hovered ? 1.1 : 1);
      }
    }
  });

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        onClick={onClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[0.8, 32, 32]} />
        <meshStandardMaterial
          color={isActive ? '#ffffff' : '#4a4a6a'}
          emissive={isActive ? '#ffffff' : '#1a1a3a'}
          emissiveIntensity={isActive ? 0.5 : 0.2}
          metalness={0.5}
          roughness={0.3}
          opacity={isActive ? 1 : 0.7}
          transparent
        />
      </mesh>
      
      {/* Avatar name with holographic effect */}
      <Html position={[0, -1.5, 0]} center>
        <div style={{
          background: 'rgba(0, 0, 0, 0.6)',
          padding: '6px 12px',
          borderRadius: '15px',
          border: isActive ? '1px solid #ffffff' : '1px solid rgba(255, 255, 255, 0.3)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 4px 10px rgba(0, 0, 0, 0.3)'
        }}>
          <span style={{
            color: '#ffffff',
            fontSize: '14px',
            fontFamily: 'Inter, sans-serif',
            fontWeight: '500',
            userSelect: 'none'
          }}>
            {name}
          </span>
        </div>
      </Html>

      {isActive && (
        <Html position={[0, -2.5, 0]} center>
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 1, 0.5]
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            style={{
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.3)',
              border: '2px solid #ffffff',
              boxShadow: '0 0 15px rgba(255, 255, 255, 0.5)'
            }}
          />
        </Html>
      )}
    </group>
  );
};

const AvatarRingScene = ({ activeAvatar, onAvatarSelect, avatars }) => {
  const groupRef = useRef();
  const [targetRotation, setTargetRotation] = useState(0);

  const radius = 3;
  const positions = avatars.map((_, index) => {
    const angle = (index / avatars.length) * Math.PI * 2;
    return [
      Math.sin(angle) * radius,
      0,
      Math.cos(angle) * radius
    ];
  });

  useFrame(() => {
    if (groupRef.current) {
      // Faster rotation interpolation (0.15 instead of 0.05)
      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y,
        targetRotation,
        0.15
      );
    }
  });

  useEffect(() => {
    console.log('🔄 AvatarRingScene: activeAvatar changed to', activeAvatar);
    const newRotation = -activeAvatar * (Math.PI * 2 / avatars.length);
    console.log('🎯 Setting target rotation to:', newRotation);
    setTargetRotation(newRotation);
  }, [activeAvatar, avatars.length]);

  return (
    <group ref={groupRef}>
      {avatars.map((avatar, index) => (
        <Avatar
          key={avatar.name}
          position={positions[index]}
          name={avatar.name}
          isActive={activeAvatar === index}
          onClick={() => onAvatarSelect(avatar.name, index)}
          avatarImage={avatar.image}
        />
      ))}
    </group>
  );
};

const BinaryBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const columns = Math.floor(canvas.width / 20);
    const drops = Array(columns).fill(1);

    const draw = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.font = '14px Courier New';

      for (let i = 0; i < drops.length; i++) {
        const text = Math.random() > 0.5 ? '1' : '0';
        ctx.fillText(text, i * 20, drops[i] * 20);

        if (drops[i] * 20 > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    };

    const interval = setInterval(draw, 50);
    return () => clearInterval(interval);
  }, []);

  return <canvas ref={canvasRef} className="binary-background" />;
};

const AvatarRing = () => {
  const [activeAvatar, setActiveAvatar] = useState(0);

  const avatars = [
    { name: 'Alex', image: '/avatars/alex.jpg' },
    { name: 'Sia', image: '/avatars/sia.jpg' },
    { name: 'Noah', image: '/avatars/noah.jpg' },
    { name: 'Maya', image: '/avatars/maya.jpg' }
  ];

  const onAvatarSelect = (name, index) => {
    console.log(`🎯 onAvatarSelect called: ${name}, index: ${index}`);
    console.log(`🔄 Setting activeAvatar from ${activeAvatar} to ${index}`);
    setActiveAvatar(index);
  };

  // Monitor activeAvatar changes
  useEffect(() => {
    console.log('🟢 AvatarRing: activeAvatar state updated to:', activeAvatar);
  }, [activeAvatar]);

  // Voice command listener (placeholder)
  useEffect(() => {
    const handleVoiceCommand = (event) => {
      const command = event.detail?.command?.toLowerCase();
      const avatarIndex = avatars.findIndex(avatar => 
        command?.includes(avatar.name.toLowerCase())
      );
      if (avatarIndex !== -1) {
        onAvatarSelect(avatars[avatarIndex].name, avatarIndex);
      }
    };

    window.addEventListener('voiceCommand', handleVoiceCommand);
    return () => window.removeEventListener('voiceCommand', handleVoiceCommand);
  }, []);

  return (
    <div className="avatar-ring-container">
      <BinaryBackground />
      <Canvas
        camera={{ position: [0, 2, 8], fov: 50 }}
        style={{ width: '100vw', height: '100vh', position: 'relative', zIndex: 1 }}
      >
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} />
        
        {/* Avatar Ring Scene */}
        <AvatarRingScene 
          activeAvatar={activeAvatar}
          onAvatarSelect={onAvatarSelect}
          avatars={avatars}
        />
      </Canvas>


    </div>
  );
};

export default AvatarRing;