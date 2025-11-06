import React, { useState, useEffect, useRef } from 'react';
import './FaceRecognition.css';

const FaceRecognition = ({ onComplete }) => {
  console.log('🎯 FaceRecognition component mounted');
  const [isActive, setIsActive] = useState(false);
  const [recognizedPeople, setRecognizedPeople] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [timeLeft, setTimeLeft] = useState(15);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const intervalRef = useRef(null);
  const timeoutRef = useRef(null);
  const greetedPeople = useRef(new Set());

  const DIGNITARIES = {
    "Gaurav": "Dr. Gaurav Srivastava, our esteemed mentor",
    "Richa": "Dr. Richa Singh, our respected mentor", 
    "Rekha": "Dr. Rekha Kashyap, Head of Department",
    "Manoj": "Dr. Manoj Goel, our Director",
    "Adesh": "Dr. Adesh Kumar Pandey, Director Academics",
    "Rajeev": "Dr. Rajeev, our respected faculty",
    "Abhinav": "Dr. Abhinav juneja, our respected attendee",
    "Vinayak": "Vinayak Rastogi, Technical Lead and Developer of RIVA"
  };

  useEffect(() => {
    if (isActive) {
      startCamera();
      startRecognitionLoop();
      startCountdown();
    }
    return () => {
      cleanup();
    };
  }, [isActive]);

  const startCamera = async () => {
    try {
      setCameraError(false);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (error) {
      console.error('Camera access failed:', error);
      setCameraError(true);
      setCurrentMessage('❌ Camera access failed. Please allow camera permissions and refresh the page.');
    }
  };

  const startRecognitionLoop = () => {
    intervalRef.current = setInterval(() => {
      if (!isProcessing) {
        captureAndRecognize();
      }
    }, 2000);
  };

  const startCountdown = () => {
    const countdown = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(countdown);
          proceedToSpeeches();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    timeoutRef.current = countdown;
  };

  const captureAndRecognize = async () => {
    if (!videoRef.current || !canvasRef.current || cameraError) return;

    setIsProcessing(true);
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    const imageData = canvas.toDataURL('image/jpeg', 0.8);

    try {
      const response = await fetch('/api/recognize-dignitary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageData })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.name && DIGNITARIES[result.name]) {
          handleRecognition(result.name, result.confidence);
        }
      }
    } catch (error) {
      console.error('Recognition failed:', error);
    }

    setIsProcessing(false);
  };

  const handleRecognition = async (name, confidence) => {
    if (greetedPeople.current.has(name)) {
      return;
    }

    greetedPeople.current.add(name);
    const formalName = DIGNITARIES[name];

    setCurrentMessage(`🎯 Recognized ${formalName.split(',')[0]} (${confidence}% confidence)`);

    try {
      const response = await fetch('/api/greet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dignitary: formalName })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const newPerson = {
            name: formalName,
            greeting: data.greeting,
            time: new Date().toLocaleTimeString(),
            confidence: confidence
          };
          
          setRecognizedPeople(prev => [...prev, newPerson]);
          setCurrentMessage(`🎤 Greeting ${formalName.split(',')[0]}...`);
          
          const utterance = new SpeechSynthesisUtterance(data.greeting);
          utterance.rate = 0.85;
          utterance.pitch = 1.1;
          utterance.volume = 1.0;
          utterance.lang = 'en-IN';
          
          const voices = window.speechSynthesis.getVoices();
          const preferredVoice = voices.find(v => 
            v.lang.includes('en-IN') || v.lang.includes('en-US')
          );
          if (preferredVoice) {
            utterance.voice = preferredVoice;
          }
          
          utterance.onstart = () => {
            setCurrentMessage(`🔊 Speaking to ${formalName.split(',')[0]}...`);
          };
          
          utterance.onend = () => {
            setCurrentMessage(`✅ Successfully greeted ${formalName.split(',')[0]}!`);
          };
          
          window.speechSynthesis.speak(utterance);
        }
      }
    } catch (error) {
      console.error('Greeting failed:', error);
      setCurrentMessage(`❌ Failed to greet ${formalName.split(',')[0]}`);
    }
  };

  const proceedToSpeeches = () => {
    cleanup();
    setCurrentMessage('🎤 Proceeding to AI speeches...');
    setTimeout(() => {
      onComplete();
    }, 2000);
  };

  const cleanup = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (timeoutRef.current) clearInterval(timeoutRef.current);
    
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
    }
    
    window.speechSynthesis.cancel();
  };

  const skipRecognition = () => {
    proceedToSpeeches();
  };

  const retryCamera = () => {
    setCameraError(false);
    startCamera();
  };

  return (
    <div className="face-recognition-container dark-theme">
      {!isActive ? (
        <div className="recognition-start">
          <div className="start-card">
            <div className="logo-section">
              <div className="logo">🤖</div>
              <h1>RIVA AI Assistant</h1>
            </div>
            <h2>Dignitary Recognition System</h2>
            <p className="description">
              Ready to greet our esteemed dignitaries before the AI speeches begin. 
              The system will automatically recognize and welcome distinguished guests.
            </p>
            
            <div className="feature-list">
              <div className="feature-item">
                <span className="feature-icon">🎯</span>
                <span>Automatic face recognition</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">🎤</span>
                <span>Personalized AI greetings</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">⏱️</span>
                <span>15-second automatic proceed</span>
              </div>
            </div>

            <button 
              className="start-recognition-btn"
              onClick={() => setIsActive(true)}
            >
              <span className="btn-icon">🚀</span>
              Start Recognition System
            </button>
            
            <div className="security-note">
              <span className="lock-icon">🔒</span>
              Your camera feed is processed locally and not stored
            </div>
          </div>
        </div>
      ) : (
        <div className="recognition-active">
          <div className="recognition-header">
            <div className="header-left">
              <h2>
                <span className="header-icon">🎯</span>
                RIVA Dignitary Recognition
              </h2>
              <div className="status-badge">
                {isProcessing ? 'Processing...' : 'Monitoring'}
              </div>
            </div>
            <div className="header-right">
              <div className={`countdown ${timeLeft <= 5 ? 'warning' : ''}`}>
                <span className="countdown-icon">⏰</span>
                {timeLeft}s
              </div>
              <button 
                className="skip-btn-outline"
                onClick={skipRecognition}
              >
                Skip to Speeches
              </button>
            </div>
          </div>

          <div className="recognition-content">
            <div className="camera-section">
              <div className="camera-container">
                {cameraError ? (
                  <div className="camera-error">
                    <div className="error-icon">📷</div>
                    <h3>Camera Unavailable</h3>
                    <p>Please allow camera permissions to continue</p>
                    <button className="retry-btn" onClick={retryCamera}>
                      Retry Camera
                    </button>
                  </div>
                ) : (
                  <>
                    <video 
                      ref={videoRef} 
                      autoPlay 
                      muted 
                      playsInline
                      className="camera-feed"
                    />
                    <canvas 
                      ref={canvasRef} 
                      style={{ display: 'none' }}
                    />
                    <div className="camera-overlay">
                      <div className="scan-animation">
                        <div className="scan-line"></div>
                      </div>
                      <div className="overlay-text">
                        <div className="pulse-dot"></div>
                        Looking for dignitaries...
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="recognition-info">
              <div className="info-card current-status">
                <h3>📊 Current Status</h3>
                <div className={`status-message ${currentMessage.includes('❌') ? 'error' : ''}`}>
                  {currentMessage || '🔄 Monitoring for dignitaries...'}
                </div>
                {isProcessing && (
                  <div className="processing-indicator">
                    <div className="processing-spinner"></div>
                    Processing image...
                  </div>
                )}
              </div>

              <div className="info-card recognized-list">
                <div className="card-header">
                  <h3>✅ Greeted Dignitaries</h3>
                  <span className="count-badge">{recognizedPeople.length}</span>
                </div>
                <div className="dignitary-list">
                  {recognizedPeople.length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-icon">👋</div>
                      <p>No dignitaries greeted yet</p>
                      <small>Looking for familiar faces...</small>
                    </div>
                  ) : (
                    recognizedPeople.map((person, index) => (
                      <div key={index} className="dignitary-item">
                        <div className="dignitary-avatar">
                          {person.name.split(' ')[1]?.[0] || person.name[0]}
                        </div>
                        <div className="dignitary-details">
                          <div className="dignitary-name">{person.name.split(',')[0]}</div>
                          <div className="dignitary-meta">
                            <span className="dignitary-time">{person.time}</span>
                            {person.confidence && (
                              <span className="confidence-badge">{person.confidence}%</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="info-card monitoring-info">
                <h3>👥 Monitoring For</h3>
                <div className="dignitary-grid">
                  {Object.entries(DIGNITARIES).map(([key, name]) => (
                    <div 
                      key={key} 
                      className={`dignitary-badge ${greetedPeople.current.has(key) ? 'greeted' : 'pending'}`}
                    >
                      <span className="badge-icon">
                        {greetedPeople.current.has(key) ? '✅' : '👤'}
                      </span>
                      {name.split(',')[0]}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="recognition-footer">
            <div className="footer-stats">
              <div className="stat">
                <span className="stat-value">{recognizedPeople.length}</span>
                <span className="stat-label">Greeted</span>
              </div>
              <div className="stat">
                <span className="stat-value">
                  {Object.keys(DIGNITARIES).length - recognizedPeople.length}
                </span>
                <span className="stat-label">Remaining</span>
              </div>
              <div className="stat">
                <span className="stat-value">{timeLeft}s</span>
                <span className="stat-label">Time Left</span>
              </div>
            </div>
            <button 
              className="skip-btn-primary"
              onClick={skipRecognition}
            >
              <span className="btn-icon">🚀</span>
              Start AI Speeches Now
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FaceRecognition;