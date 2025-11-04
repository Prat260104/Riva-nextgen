import React, { useState, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import axios from 'axios';

// Avatar Component
function Avatar({ position, color, scale, isActive, label }) {
  const meshRef = useRef();
  
  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.scale.setScalar(isActive ? scale * 1.3 : scale);
    }
  }, [isActive, scale]);

  return (
    <group position={position}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial 
          color={color} 
          emissive={isActive ? color : '#000000'}
          emissiveIntensity={isActive ? 0.5 : 0}
        />
      </mesh>
      <pointLight 
        position={[0, 0, 0]} 
        intensity={isActive ? 2 : 0.5} 
        color={color}
        distance={5}
      />
    </group>
  );
}

// Dignities to recognize
const DIGNITIES = [
  { name: 'Vinayak', title: 'Technical Lead', greeting: 'Welcome Vinayak Rastogi, our Technical Lead. Thank you for your dedication to the club.' },
  { name: 'Manoj', title: 'Executive Director', greeting: 'Welcome Dr. Manoj Goel, our esteemed Executive Director. We are honored by your presence.' },
  { name: 'Rekha', title: 'HOD AI/ML', greeting: 'Welcome Dr. Rekha Kashyap, Head of AI and ML Department. Thank you for your guidance.' },
  { name: 'Gaurav', title: 'Mentor', greeting: 'Welcome Dr. Gaurav Srivastava, our respected mentor. Your expertise inspires us.' },
  { name: 'Richa', title: 'Mentor', greeting: 'Welcome Dr. Richa Singh, our valued mentor. Thank you for supporting our vision.' }
];

// Co-ordinators speeches
const COORDINATOR_SPEECHES = [
  {
    name: 'Shreya Jain',
    role: 'President',
    avatar: 'President',
    gender: 'female',
    speech: 'Good morning everyone! I am Shreya Jain, the President of the NextGen Supercomputing Club. It\'s an absolute pleasure to welcome you all here today. Our club is built on a strong vision — to empower the next generation of machine learning engineers by bridging the gap between theoretical knowledge and practical application. At NextGen Supercomputing, we believe that true learning happens when you build, experiment, and collaborate. Through our diverse set of activities — from workshops and coding challenges to research-driven projects and industry collaborations — we aim to create an environment where members can gain hands-on experience with real-world ML problems. Our mission is not just to learn machine learning but to produce production-ready ML engineers who can confidently contribute to high-impact projects in academia and industry alike. Together, we are shaping the innovators and problem-solvers of tomorrow. Thank you, and I look forward to an exciting journey ahead!'
  },
  {
    name: 'Samarth Shukla',
    role: 'Vice President',
    avatar: 'VP',
    gender: 'male',
    speech: 'Hello, I am Samarth Shukla, Vice President. We will organize workshops, hackathons, and bootcamps to provide practical experience with cutting-edge technologies like our NVIDIA DGX A100.'
  },
  {
    name: 'Ronak Goel',
    role: 'Technical Lead',
    avatar: 'Tech1',
    gender: 'male',
    speech: 'Greetings, I am Ronak Goel, Technical Lead. Our club focuses on High-Performance Computing, AI, and Quantum Simulation to prepare students for industry challenges.'
  },
  {
    name: 'Vinayak Rastogi',
    role: 'Technical Lead',
    avatar: 'Tech2',
    gender: 'male',
    speech: 'Hi everyone, I am Vinayak Rastogi, Technical Lead. Together, we will bridge the gap between academic learning and industrial innovation. Welcome to NextGen Supercomputing Club!'
  }
];

// Typing Animation Component
function TypingAnimation({ text, speechDuration, isActive, onTypingComplete }) {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  // Reset when text changes or becomes inactive
  useEffect(() => {
    if (!isActive) {
      setDisplayedText('');
      setCurrentIndex(0);
      return;
    }

    // Reset when text changes
    setDisplayedText('');
    setCurrentIndex(0);
  }, [text, isActive]);

  // Calculate typing speed based on speech duration and text length
  const calculateTypingSpeed = () => {
    const averageReadingSpeed = 180; // words per minute
    const wordCount = text.split(' ').length;
    const estimatedReadingTime = (wordCount / averageReadingSpeed) * 60 * 1000; // in ms
    
    // Use the longer duration between speech and reading time
    const targetDuration = Math.max(speechDuration, estimatedReadingTime);
    
    // Calculate delay per character to match target duration
    return Math.max(20, Math.min(100, Math.floor(targetDuration / text.length)));
  };

  const typingSpeed = calculateTypingSpeed();

  useEffect(() => {
    if (!isActive || currentIndex >= text.length) {
      if (currentIndex >= text.length) {
        onTypingComplete?.();
      }
      return;
    }

    const timer = setTimeout(() => {
      setDisplayedText(prev => prev + text[currentIndex]);
      setCurrentIndex(prev => prev + 1);
    }, typingSpeed);

    return () => clearTimeout(timer);
  }, [currentIndex, text, typingSpeed, isActive, onTypingComplete]);

  return (
    <div style={{
      minHeight: '120px',
      maxHeight: '200px',
      overflowY: 'auto',
      textAlign: 'left',
      lineHeight: '1.6',
      padding: '10px'
    }}>
      <p style={{ 
        color: 'rgba(255,255,255,0.9)', 
        fontSize: '0.95rem', 
        margin: 0,
        whiteSpace: 'pre-wrap',
        wordWrap: 'break-word'
      }}>
        {displayedText}
        {isActive && currentIndex < text.length && (
          <span style={{
            animation: 'blink 1s infinite',
            marginLeft: '2px',
            fontWeight: 'bold'
          }}>|</span>
        )}
      </p>
    </div>
  );
}

export default function InaugurationMode({ onClose, onComplete, onEnableContinuousMode }) {
  const [phase, setPhase] = useState('waiting');
  const [recognizedDignities, setRecognizedDignities] = useState([]);
  const [currentDignity, setCurrentDignity] = useState(null);
  const [currentSpeaker, setCurrentSpeaker] = useState(0);
  const [activeSpeaker, setActiveSpeaker] = useState('');
  const [message, setMessage] = useState('Waiting for dignities to arrive...');
  const [speechDuration, setSpeechDuration] = useState(0);
  const [isTypingActive, setIsTypingActive] = useState(false);
  const [currentSpeechText, setCurrentSpeechText] = useState('');
  const synthRef = useRef(window.speechSynthesis);
  const videoRef = useRef(null);
  const recognitionTimerRef = useRef(null);
  const speechStartTimeRef = useRef(0);
  const recognizedNamesRef = useRef([]);
  const lastRecognitionTimeRef = useRef(Date.now());

  const avatars = [
    { name: 'President', position: [0, 2, 0], color: '#ff6b6b', label: 'President' },
    { name: 'VP', position: [-3, 0, 0], color: '#4ecdc4', label: 'Vice President' },
    { name: 'Tech1', position: [3, 0, 0], color: '#ffe66d', label: 'Technical Lead 1' },
    { name: 'Tech2', position: [0, -2, 0], color: '#a8e6cf', label: 'Technical Lead 2' }
  ];

  const speak = (text, gender = 'female') => {
    return new Promise((resolve) => {
      synthRef.current.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.volume = 1.0;
      
      const voices = synthRef.current.getVoices();
      
      if (gender === 'female') {
        utterance.pitch = 1.1;
        const femaleVoice = voices.find(v => 
          v.name.includes('Female') || 
          v.name.includes('Samantha') || 
          v.name.includes('Victoria') ||
          v.name.includes('Google UK English Female')
        );
        if (femaleVoice) utterance.voice = femaleVoice;
      } else {
        utterance.pitch = 0.9;
        const maleVoice = voices.find(v => 
          v.name.includes('Male') || 
          v.name.includes('Daniel') || 
          v.name.includes('Google UK English Male')
        );
        if (maleVoice) utterance.voice = maleVoice;
      }

      // Calculate estimated speech duration
      const wordCount = text.split(' ').length;
      const wordsPerMinute = 150; // Average speaking rate
      const estimatedDuration = (wordCount / wordsPerMinute) * 60 * 1000;
      setSpeechDuration(estimatedDuration);

      speechStartTimeRef.current = Date.now();

      utterance.onend = () => {
        const actualDuration = Date.now() - speechStartTimeRef.current;
        setSpeechDuration(actualDuration); // Update with actual duration for better sync
        resolve();
      };

      synthRef.current.speak(utterance);
    });
  };

  const recognizeFace = async () => {
    if (!videoRef.current) return null;
    
    try {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0);
      const imageData = canvas.toDataURL('image/jpeg');

      const response = await axios.post('http://localhost:5000/api/recognize-face', {
        image: imageData
      });

      if (response.data.success && response.data.name && response.data.confidence > 0.5) {
        return response.data.name;
      }
    } catch (error) {
      console.error('Face recognition error:', error);
    }
    return null;
  };

  const startInauguration = async () => {
    setPhase('dignities');
    setMessage('Please stand in front of camera for recognition');
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Camera error:', error);
      setMessage('Camera access denied. Skipping to speeches...');
      setTimeout(() => startSpeeches(), 2000);
      return;
    }

    recognitionTimerRef.current = setInterval(async () => {
      const name = await recognizeFace();
      
      // Check if 20 seconds passed without recognition
      if (Date.now() - lastRecognitionTimeRef.current > 20000) {
        clearInterval(recognitionTimerRef.current);
        setMessage('No dignities detected. Proceeding to speeches...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        startSpeeches();
        return;
      }
      
      if (name) {
        const dignity = DIGNITIES.find(d => d.name.toLowerCase() === name.toLowerCase());
        
        if (dignity && !recognizedNamesRef.current.includes(name)) {
          lastRecognitionTimeRef.current = Date.now();
          recognizedNamesRef.current.push(name);
          setRecognizedDignities(prev => [...prev, name]);
          setCurrentDignity(dignity);
          setMessage(`Recognized: ${dignity.title}`);
          await speak(dignity.greeting);
          
          await new Promise(resolve => setTimeout(resolve, 3000));
          setCurrentDignity(null);
          setMessage('Waiting for next dignity...');
          
          if (recognizedNamesRef.current.length >= DIGNITIES.length) {
            clearInterval(recognitionTimerRef.current);
            startSpeeches();
          }
        }
      }
    }, 2000);

    setTimeout(() => {
      if (phase === 'dignities') {
        clearInterval(recognitionTimerRef.current);
        startSpeeches();
      }
    }, 180000);
  };

  const startSpeeches = async () => {
    setPhase('speeches');
    setMessage('Co-ordinators Introduction');
    
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }

    for (let i = 0; i < COORDINATOR_SPEECHES.length; i++) {
      const coordinator = COORDINATOR_SPEECHES[i];
      
      // Clear previous speech and stop typing
      setIsTypingActive(false);
      setCurrentSpeechText('');
      
      // Set new speaker info
      setCurrentSpeaker(i);
      setActiveSpeaker(coordinator.avatar);
      setMessage(`${coordinator.name} - ${coordinator.role}`);
      setCurrentSpeechText(coordinator.speech);
      
      // Start typing animation
      setIsTypingActive(true);
      
      // Start speech
      await speak(coordinator.speech, coordinator.gender);
      
      // Stop typing animation after speech
      setIsTypingActive(false);
      
      // Brief pause before next speaker
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Clear everything after all speeches
    setActiveSpeaker('');
    setIsTypingActive(false);
    setCurrentSpeechText('');
    transitionToQA();
  };

  const transitionToQA = async () => {
    setPhase('transition');
    setMessage('Transitioning to Q&A Session...');
    await speak('Thank you everyone. We now open the floor for questions and answers.');
    
    setTimeout(() => {
      setPhase('complete');
      // Enable continuous listening mode automatically
      if (onEnableContinuousMode) {
        onEnableContinuousMode();
      }
      if (onComplete) onComplete();
    }, 2000);
  };

  const handleTypingComplete = () => {
    console.log('Typing animation completed');
  };

  useEffect(() => {
    return () => {
      synthRef.current.cancel();
      if (recognitionTimerRef.current) {
        clearInterval(recognitionTimerRef.current);
      }
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  if (phase === 'complete') {
    return null;
  }

  return (
    <>
      <style>{`
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.5); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes glow {
          0%, 100% { box-shadow: 0 0 20px rgba(0,255,255,0.5); }
          50% { box-shadow: 0 0 40px rgba(0,255,255,0.8); }
        }
        @keyframes slideInFromTop {
          from { opacity: 0; transform: translateY(-50px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
        
        /* Responsive text styles */
        .main-title {
          font-size: clamp(2rem, 4vw, 3.5rem);
          line-height: 1.1;
        }
        
        .subtitle {
          font-size: clamp(1rem, 2vw, 1.5rem);
        }
        
        .status-title {
          font-size: clamp(1.2rem, 2.5vw, 1.8rem);
        }
        
        .message-text {
          font-size: clamp(1rem, 1.8vw, 1.3rem);
        }
      `}</style>
      
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)',
        zIndex: 9999,
        overflow: 'hidden',
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
      }}>
        
        {/* Animated Background Elements */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: `
            radial-gradient(circle at 20% 80%, rgba(0, 255, 255, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(255, 107, 107, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 40% 40%, rgba(78, 205, 196, 0.05) 0%, transparent 50%)
          `,
          pointerEvents: 'none'
        }} />
        
        {/* Floating Particles */}
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              width: `${Math.random() * 6 + 2}px`,
              height: `${Math.random() * 6 + 2}px`,
              background: `rgba(0, 255, 255, ${Math.random() * 0.3 + 0.1})`,
              borderRadius: '50%',
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animation: `float ${Math.random() * 10 + 10}s infinite ease-in-out`,
              animationDelay: `${Math.random() * 5}s`
            }}
          />
        ))}

        {/* Header Section - FIXED */}
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          textAlign: 'center',
          color: 'white',
          animation: 'slideInFromTop 1s ease-out',
          width: '90%',
          maxWidth: '1000px',
          padding: '0 20px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '15px',
            marginBottom: '8px',
            flexWrap: 'wrap'
          }}>
            <div style={{
              fontSize: 'clamp(2rem, 5vw, 3rem)',
              animation: 'float 3s ease-in-out infinite'
            }}>🚀</div>
            <h1 className="main-title" style={{ 
              margin: 0,
              background: 'linear-gradient(135deg, #00ffff 0%, #ff6b6b 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 0 30px rgba(0,255,255,0.3)',
              fontWeight: '800',
              letterSpacing: '0.5px',
              textAlign: 'center'
            }}>
              NextGen Supercomputing Club
            </h1>
          </div>
          <br />
          <p className="subtitle" style={{ 
            margin: '5px 0 0 0', 
            color: '#a8e6cf',
            fontWeight: '300',
            letterSpacing: '1px',
            textAlign: 'center'
          }}>
            INAUGURATION CEREMONY
          </p>
        </div>

        {/* Main Content Area */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '90%',
          maxWidth: '1200px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '30px',
          marginTop: '20px'
        }}>
          
          {/* Camera Feed for Recognition */}
          {phase === 'dignities' && (
            <div style={{
              position: 'relative',
              animation: 'fadeInUp 0.8s ease-out'
            }}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{
                  width: 'min(640px, 90vw)',
                  height: 'min(480px, 67.5vw)',
                  borderRadius: '20px',
                  border: '3px solid #00ffff',
                  boxShadow: '0 0 50px rgba(0,255,255,0.4)',
                  animation: 'glow 2s ease-in-out infinite'
                }}
              />
              <div style={{
                position: 'absolute',
                top: '15px',
                left: '15px',
                background: 'rgba(0,0,0,0.7)',
                color: '#00ffff',
                padding: '8px 16px',
                borderRadius: '20px',
                fontSize: '14px',
                fontWeight: '600',
                border: '1px solid #00ffff'
              }}>
                🎥 Live Recognition
              </div>
            </div>
          )}

          {/* Speaker Avatar for Speeches */}
          {phase === 'speeches' && (
            <div style={{ 
              position: 'relative',
              animation: 'scaleIn 0.8s ease-out'
            }}>
              <div style={{
                width: 'min(280px, 60vw)',
                height: 'min(280px, 60vw)',
                borderRadius: '50%',
                border: `8px solid ${avatars.find(a => a.name === activeSpeaker)?.color || '#00ffff'}`,
                boxShadow: `0 0 60px ${avatars.find(a => a.name === activeSpeaker)?.color || '#00ffff'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 'min(120px, 25vw)',
                background: `linear-gradient(135deg, ${avatars.find(a => a.name === activeSpeaker)?.color || '#00ffff'}20, rgba(0,0,0,0.3))`,
                position: 'relative',
                overflow: 'hidden'
              }}>
                {COORDINATOR_SPEECHES[currentSpeaker]?.gender === 'female' ? '👩' : '👨'}
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: '50%',
                  background: `conic-gradient(from 0deg, transparent, ${avatars.find(a => a.name === activeSpeaker)?.color || '#00ffff'}40, transparent)`,
                  animation: 'spin 4s linear infinite'
                }} />
              </div>
            </div>
          )}

          {/* Status Panel */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(0, 255, 255, 0.3)',
            borderRadius: '25px',
            padding: '25px 30px',
            maxWidth: '800px',
            width: '100%',
            textAlign: 'center',
            animation: 'fadeInUp 0.8s ease-out 0.2s both',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Main Message */}
            <p className="message-text" style={{ 
              color: 'white', 
              margin: '0 0 15px 0', 
              lineHeight: '1.5',
              fontWeight: '400'
            }}>
              {message}
            </p>

            {/* Additional Information */}
            {currentDignity && (
              <div style={{
                background: 'linear-gradient(135deg, rgba(0,255,0,0.1), rgba(0,200,0,0.05))',
                border: '1px solid #00ff00',
                borderRadius: '12px',
                padding: '12px',
                margin: '12px 0'
              }}>
                <p style={{ color: '#00ff00', margin: 0, fontSize: '1rem', fontWeight: '600' }}>
                  ✅ {currentDignity.title} Recognized!
                </p>
              </div>
            )}

            {/* Dynamic Typing Animation for Speeches */}
            {phase === 'speeches' && currentSpeechText && (
              <div style={{
                marginTop: '20px',
                padding: '15px',
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '12px',
                borderLeft: '4px solid #ff6b6b',
                minHeight: '150px'
              }}>
                <TypingAnimation 
                  text={currentSpeechText}
                  speechDuration={speechDuration}
                  isActive={isTypingActive}
                  onTypingComplete={handleTypingComplete}
                />
              </div>
            )}
          </div>
        </div>

        {/* Control Buttons */}
        <div style={{
          position: 'absolute',
          bottom: '30px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: '15px',
          pointerEvents: 'auto',
          animation: 'fadeInUp 0.8s ease-out 0.4s both',
          flexWrap: 'wrap',
          justifyContent: 'center',
          width: '90%',
          maxWidth: '500px'
        }}>
          {phase === 'waiting' && (
            <button
              onClick={startInauguration}
              style={{
                padding: '15px 35px',
                fontSize: '1.1rem',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '50px',
                cursor: 'pointer',
                fontWeight: 'bold',
                boxShadow: '0 8px 25px rgba(102,126,234,0.4)',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                flexShrink: 0
              }}
              onMouseOver={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 12px 30px rgba(102,126,234,0.6)';
              }}
              onMouseOut={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 8px 25px rgba(102,126,234,0.4)';
              }}>
              🎬 Start Inauguration
            </button>
          )}
          
          {phase === 'dignities' && (
            <button
              onClick={startSpeeches}
              style={{
                padding: '12px 25px',
                fontSize: '1rem',
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '50px',
                cursor: 'pointer',
                fontWeight: 'bold',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                flexShrink: 0
              }}
              onMouseOver={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 8px 20px rgba(245,87,108,0.4)';
              }}
              onMouseOut={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = 'none';
              }}>
              ⏭️ Skip to Speeches
            </button>
          )}
          
          <button
            onClick={onClose}
            style={{
              padding: '12px 25px',
              fontSize: '1rem',
              background: 'rgba(255,255,255,0.1)',
              color: 'white',
              border: '2px solid rgba(255,255,255,0.3)',
              borderRadius: '50px',
              cursor: 'pointer',
              fontWeight: 'bold',
              backdropFilter: 'blur(10px)',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              flexShrink: 0
            }}
            onMouseOver={(e) => {
              e.target.style.background = 'rgba(255,255,255,0.2)';
              e.target.style.transform = 'translateY(-2px)';
            }}
            onMouseOut={(e) => {
              e.target.style.background = 'rgba(255,255,255,0.1)';
              e.target.style.transform = 'translateY(0)';
            }}>
            ✕ Close Ceremony
          </button>
        </div>

        {/* Footer */}
        <div style={{
          position: 'absolute',
          bottom: '10px',
          left: '50%',
          transform: 'translateX(-50%)',
          color: 'rgba(255,255,255,0.5)',
          fontSize: '0.8rem',
          textAlign: 'center',
          width: '90%',
          padding: '0 20px'
        }}>
          NextGen Supercomputing Club © 2024 - Building the Future of Computing
        </div>
      </div>
    </>
  );
}