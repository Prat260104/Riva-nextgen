// AudioSphere.js - WORKING VERSION - No Ring + Subtle Expansion
import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

const AudioSphere = ({ audioLevel, isSpeaking }) => {
  const containerRef = useRef(null);
  const sceneDataRef = useRef(null);
  const animationIdRef = useRef(null);

  // ✨ Initialize scene ONLY ONCE
  useEffect(() => {
    if (!containerRef.current || sceneDataRef.current) return;

    console.log('🌐 AudioSphere: Initializing...');

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 4;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 1);
    containerRef.current.appendChild(renderer.domElement);

    // Main sphere
    const geometry = new THREE.IcosahedronGeometry(1.2, 6);
    const material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      wireframe: true,
      transparent: true,
      opacity: 0.85
    });
    
    const sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);

    // Store original positions
    const originalPositions = geometry.attributes.position.array.slice();

    // Inner glow
    const glowGeometry = new THREE.SphereGeometry(1.18, 32, 32);
    const glowMaterial = new THREE.ShaderMaterial({
      uniforms: {
        glowColor: { value: new THREE.Color(0xffffff) },
        intensity: { value: 0.2 }
      },
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 glowColor;
        uniform float intensity;
        varying vec3 vNormal;
        void main() {
          float brighten = pow(0.5 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.5);
          gl_FragColor = vec4(glowColor, brighten * intensity);
        }
      `,
      side: THREE.BackSide,
      transparent: true,
      blending: THREE.AdditiveBlending
    });
    
    const glowSphere = new THREE.Mesh(glowGeometry, glowMaterial);
    sphere.add(glowSphere);

    // Lighting
    const pointLight1 = new THREE.PointLight(0xffffff, 1.5, 10);
    pointLight1.position.set(3, 3, 3);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xcccccc, 0.8, 10);
    pointLight2.position.set(-3, -3, 3);
    scene.add(pointLight2);

    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    scene.add(ambientLight);

    // Store everything
    sceneDataRef.current = {
      scene,
      camera,
      renderer,
      sphere,
      geometry,
      glowMaterial,
      originalPositions,
      currentScale: 1
    };

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      console.log('🌐 AudioSphere: Cleaning up...');
      window.removeEventListener('resize', handleResize);
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      if (renderer && containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      geometry.dispose();
      material.dispose();
      glowGeometry.dispose();
      glowMaterial.dispose();
      renderer.dispose();
      sceneDataRef.current = null;
    };
  }, []);

  // ✨ ANIMATION LOOP - Subtle expansion
  useEffect(() => {
    if (!sceneDataRef.current) return;

    const data = sceneDataRef.current;
    let time = 0;

    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);
      time += 0.01;

      let targetScale = 1;

      if (isSpeaking && audioLevel > 0) {
        // 🔽 SUBTLE EXPANSION (30% max)
        targetScale = 1 + (audioLevel * 0.3);
        
        // Rotation
        const rotationSpeed = 0.005 + audioLevel * 0.015;
        data.sphere.rotation.x += rotationSpeed;
        data.sphere.rotation.y += rotationSpeed * 1.3;

        // Vertex displacement - reduced amplitude
        const positionAttribute = data.geometry.attributes.position;
        const vertex = new THREE.Vector3();

        for (let i = 0; i < positionAttribute.count; i++) {
          const i3 = i * 3;
          vertex.set(
            data.originalPositions[i3],
            data.originalPositions[i3 + 1],
            data.originalPositions[i3 + 2]
          );
          
          // Reduced wave amplitude
          const wave1 = Math.sin(time * 3 + vertex.x * 5) * audioLevel * 0.12;
          const wave2 = Math.cos(time * 2 + vertex.y * 4) * audioLevel * 0.10;
          const wave3 = Math.sin(time * 4 + vertex.z * 3) * audioLevel * 0.08;
          
          vertex.normalize();
          const distance = 1 + audioLevel * 0.25 + wave1 + wave2 + wave3;
          vertex.multiplyScalar(distance);
          
          positionAttribute.setXYZ(i, vertex.x, vertex.y, vertex.z);
        }
        positionAttribute.needsUpdate = true;

        // Glow intensity
        data.glowMaterial.uniforms.intensity.value = 0.2 + audioLevel * 0.6;

      } else {
        // IDLE BREATHING - subtle
        const breathe = Math.sin(time * 0.6) * 0.05;
        targetScale = 1 + breathe;
        
        data.sphere.rotation.x += 0.002;
        data.sphere.rotation.y += 0.003;

        const positionAttribute = data.geometry.attributes.position;
        const vertex = new THREE.Vector3();

        for (let i = 0; i < positionAttribute.count; i++) {
          const i3 = i * 3;
          vertex.set(
            data.originalPositions[i3],
            data.originalPositions[i3 + 1],
            data.originalPositions[i3 + 2]
          );
          
          const gentleWave = Math.sin(time * 0.5 + vertex.x * 2) * 0.02;
          
          vertex.normalize();
          vertex.multiplyScalar(1 + breathe + gentleWave);
          
          positionAttribute.setXYZ(i, vertex.x, vertex.y, vertex.z);
        }
        positionAttribute.needsUpdate = true;

        data.glowMaterial.uniforms.intensity.value = 0.2;
      }

      // SMOOTH SCALE TRANSITION
   data.currentScale += (targetScale - data.currentScale) * 0.35; // Smoother, more responsive

      data.sphere.scale.set(data.currentScale, data.currentScale, data.currentScale);

      data.renderer.render(data.scene, data.camera);
    };

    animate();

    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
    };
  }, [audioLevel, isSpeaking]);

  return (
    <div 
      ref={containerRef} 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
        background: '#000000',
        overflow: 'hidden'
      }}
    />
  );
};

export default React.memo(AudioSphere);

