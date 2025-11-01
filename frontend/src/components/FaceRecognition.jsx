import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const FaceRecognition = ({ onRecognized, useLiteMode = true }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isActive, setIsActive] = useState(false);
  const [recognizedName, setRecognizedName] = useState(null);
  const [status, setStatus] = useState('idle');
  const [liteMode, setLiteMode] = useState(useLiteMode);
  const [sessionLocked, setSessionLocked] = useState(false);
  const [lockedPerson, setLockedPerson] = useState(null);
  const intervalRef = useRef(null);
  const sessionTimeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      stopCamera();
      if (sessionTimeoutRef.current) {
        clearTimeout(sessionTimeoutRef.current);
      }
    };
  }, []);

  const unlockSession = () => {
    console.log('🔓 Session unlocked');
    setSessionLocked(false);
    setLockedPerson(null);
  };

  const lockSession = (name) => {
    console.log('🔒 Session locked for:', name);
    setSessionLocked(true);
    setLockedPerson(name);
    
    // Auto-unlock after 45 seconds of inactivity
    if (sessionTimeoutRef.current) {
      clearTimeout(sessionTimeoutRef.current);
    }
    sessionTimeoutRef.current = setTimeout(() => {
      console.log('⏰ Session timeout - unlocking');
      unlockSession();
    }, 45000); // 45 seconds
  };

  const startCamera = async () => {
    console.log('📷 Starting camera...');
    
    // First set active to render video element
    setIsActive(true);
    setStatus('scanning');
    
    // Wait for next tick to ensure video element is rendered
    await new Promise(resolve => setTimeout(resolve, 100));
    
    try {
      console.log('📷 Requesting camera permission...');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480 } 
      });
      console.log('✅ Camera permission granted');
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        console.log('🎥 Camera active, starting recognition...');
        
        // Wait for video to be ready
        videoRef.current.onloadedmetadata = () => {
          console.log('✅ Video metadata loaded');
          startRecognition();
        };
      } else {
        console.error('❌ Video ref is still null');
        setIsActive(false);
        setStatus('error');
      }
    } catch (error) {
      console.error('❌ Camera error:', error);
      console.error('❌ Error name:', error.name);
      console.error('❌ Error message:', error.message);
      setIsActive(false);
      setStatus('error');
      alert('Camera access denied! Please allow camera permission.');
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setIsActive(false);
    setStatus('idle');
  };

  const captureFrame = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (!video || !canvas) return null;

    const ctx = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);
    
    return canvas.toDataURL('image/jpeg', 0.8);
  };

  const startRecognition = () => {
    console.log('🔄 Starting recognition loop...');
    intervalRef.current = setInterval(async () => {
      console.log('📸 Capturing frame...');
      const imageData = captureFrame();
      if (!imageData) {
        console.log('⚠️ No image data captured');
        return;
      }
      console.log('✅ Frame captured, size:', imageData.length);

      try {
        console.log('📤 Sending image to backend...');
        const response = await fetch('http://localhost:5000/api/recognize-face', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: imageData, useLite: liteMode })
        });

        console.log('📥 Response status:', response.status);
        const result = await response.json();
        console.log('📦 Recognition result:', result);
        
        if (result.success && result.name) {
          // Check if session is locked
          if (sessionLocked) {
            if (result.name === lockedPerson) {
              console.log('✅ Same person detected:', result.name);
              // Refresh session timeout
              lockSession(result.name);
              
              // Trigger avatar selection to bring back to correct position
              if (onRecognized) {
                console.log('🔄 Re-triggering avatar for locked session:', result.name);
                onRecognized(result.name, result.confidence);
              }
              
              // Show name briefly
              setRecognizedName(result.name);
              setTimeout(() => {
                setRecognizedName(null);
              }, 1000);
            } else {
              console.log('🚫 Session locked for', lockedPerson, '- ignoring', result.name);
              return; // Ignore other people during active session
            }
          } else {
            // No active session - recognize and lock
            console.log('✅ Face recognized successfully:', result.name);
            setRecognizedName(result.name);
            setStatus('scanning');
            
            // Lock session for this person
            lockSession(result.name);
            
            if (onRecognized) {
              console.log('📢 Calling onRecognized callback with:', result.name, result.confidence);
              onRecognized(result.name, result.confidence);
            } else {
              console.log('⚠️ onRecognized callback is not defined!');
            }
            
            // Show name for 2 seconds then clear (but keep camera active)
            setTimeout(() => {
              setRecognizedName(null);
            }, 2000);
          }
        } else {
          console.log('❌ Recognition failed or no face detected:', result.message);
        }
      } catch (error) {
        console.error('❌ Recognition error:', error);
        console.error('❌ Error details:', error.message);
        setStatus('error');
      }
    }, 2000);
  };

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 100,
      background: 'rgba(0, 0, 0, 0.8)',
      borderRadius: '20px',
      padding: '20px',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h3 style={{ 
          color: '#ffffff', 
          margin: 0,
          fontFamily: 'Inter, sans-serif',
          fontSize: '16px'
        }}>
          Face Recognition
        </h3>
        <div style={{ 
          fontSize: '10px', 
          color: liteMode ? '#00ff00' : '#ffaa00',
          fontFamily: 'Inter, sans-serif',
          fontWeight: '600'
        }}>
          {liteMode ? '⚡ LITE' : '🔥 FULL'}
        </div>
      </div>

      {!isActive ? (
        <motion.button
          onClick={() => {
            console.log('🖱️ Start Recognition button clicked');
            startCamera();
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          style={{
            padding: '10px 20px',
            background: 'linear-gradient(135deg, #00ffff, #0088ff)',
            border: 'none',
            borderRadius: '25px',
            color: '#000',
            fontFamily: 'Inter, sans-serif',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          Start Recognition
        </motion.button>
      ) : (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{
              width: '320px',
              height: '240px',
              borderRadius: '10px',
              display: 'block',
              marginBottom: '10px'
            }}
          />
          
          <canvas ref={canvasRef} style={{ display: 'none' }} />
          
          <div style={{
            textAlign: 'center',
            color: '#fff',
            fontFamily: 'Inter, sans-serif',
            marginTop: '10px'
          }}>
            {sessionLocked && (
              <div style={{
                fontSize: '11px',
                color: '#ffa500',
                marginBottom: '8px',
                padding: '4px 8px',
                background: 'rgba(255, 165, 0, 0.1)',
                borderRadius: '8px',
                border: '1px solid rgba(255, 165, 0, 0.3)'
              }}>
                🔒 Session: {lockedPerson}
              </div>
            )}
            
            {status === 'scanning' && !recognizedName && (
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                style={{ color: '#00ffff' }}
              >
                {sessionLocked ? 'Active...' : 'Scanning...'}
              </motion.div>
            )}
            
            {recognizedName && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                style={{ 
                  color: '#00ff00',
                  fontSize: '18px',
                  fontWeight: '600'
                }}
              >
                Welcome, {recognizedName}!
              </motion.div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
            {sessionLocked && (
              <motion.button
                onClick={unlockSession}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{
                  padding: '8px 16px',
                  background: 'rgba(255, 165, 0, 0.3)',
                  border: '1px solid rgba(255, 165, 0, 0.5)',
                  borderRadius: '20px',
                  color: '#fff',
                  fontFamily: 'Inter, sans-serif',
                  cursor: 'pointer',
                  flex: 1,
                  fontSize: '12px'
                }}
              >
                🔓 Unlock
              </motion.button>
            )}
            <motion.button
              onClick={stopCamera}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{
                padding: '8px 16px',
                background: 'rgba(255, 0, 0, 0.3)',
                border: '1px solid rgba(255, 0, 0, 0.5)',
                borderRadius: '20px',
                color: '#fff',
                fontFamily: 'Inter, sans-serif',
                cursor: 'pointer',
                flex: 1
              }}
            >
              Stop
            </motion.button>
          </div>
        </>
      )}
    </div>
  );
};

export default FaceRecognition;
