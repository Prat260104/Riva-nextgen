// AudioSphere.js - SMALLER SPHERE VERSION
import React, { useRef, useEffect, useState } from 'react';

const AudioSphere = ({ audioLevel, isSpeaking }) => {
  const videoRef = useRef(null);
  const [brightness, setBrightness] = useState(1);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    // Auto-play the video when component mounts
    if (videoRef.current) {
      videoRef.current.play().catch(err => {
        console.log('Video autoplay prevented:', err);
      });
    }
  }, []);

  useEffect(() => {
    if (isSpeaking && audioLevel > 0) {
      setBrightness(1.3 + audioLevel * 0.7);
      setScale(1 + audioLevel * 0.08);
      
      // Speed up video when speaking
      if (videoRef.current) {
        videoRef.current.playbackRate = 1 + audioLevel * 0.5;
      }
    } else {
      setBrightness(1);
      setScale(1);
      
      if (videoRef.current) {
        videoRef.current.playbackRate = 1;
      }
    }
  }, [audioLevel, isSpeaking]);

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
        background: '#000000',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <div
        style={{
          width: '113%',  // CHANGED: Controls sphere size (50% = smaller, 100% = full screen)
          height: '113%', // CHANGED: Match width for perfect circle
          filter: `brightness(${brightness}) contrast(1.3)`,
          transform: `scale(${scale})`,
          transition: 'all 0.15s ease-out'
        }}
      >
        <video
          ref={videoRef}
          loop
          muted
          playsInline
          autoPlay
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain'  // CHANGED: 'contain' keeps sphere centered and visible
          }}
        >
          <source src="/sphere-animation.mp4" type="video/mp4" />
          <source src="/sphere-animation.webm" type="video/webm" />
          Your browser does not support the video tag.
        </video>
      </div>

      {/* Glow overlay */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '30%',  // CHANGED: Made glow proportional to smaller sphere
          height: '30%', // CHANGED: Match glow to sphere size
          background: 'radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%)',
          filter: `blur(${audioLevel * 30}px)`,
          pointerEvents: 'none',
          transition: 'all 0.1s ease-out',
          opacity: isSpeaking ? 0.8 : 0.3
        }}
      />
    </div>
  );
};

export default React.memo(AudioSphere);
