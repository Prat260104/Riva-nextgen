import React, { useState, useRef, useEffect } from 'react';
import FaceCard from './FaceCard';
import './Showcase.css';

const Showcase = ({ teachers, onComplete, autoStart = false }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [showIntro, setShowIntro] = useState(false);
  const [showIntroFadeout, setShowIntroFadeout] = useState(false);
  const [showStartButton, setShowStartButton] = useState(!autoStart);
  const resumePositions = useRef({});
  const introVideoRef = useRef(null);
  const backgroundVideoRef = useRef(null);
  const welcomeAudioRef = useRef(null);

  // Auto-start ceremony if autoStart prop is true
  useEffect(() => {
    if (autoStart) {
      console.log('✅ Auto-starting ceremony from face recognition');
      handleStartCeremony();
    }
  }, [autoStart]);

  const handleStartCeremony = () => {
    setShowStartButton(false);
    setShowIntro(true);
    
    setTimeout(() => {
      if (introVideoRef.current) {
        introVideoRef.current.play().catch(err => {
          console.error('Video play failed:', err);
        });
        console.log('✓ Intro video playing (with audio)');
      }
    }, 100);
  };

  // Monitor intro video time for fade out effect
  useEffect(() => {
    const video = introVideoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      if (video.currentTime >= 5.5 && !showIntroFadeout) {
        setShowIntroFadeout(true);
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => video.removeEventListener('timeupdate', handleTimeUpdate);
  }, [showIntroFadeout]);

  // When intro video ends, show welcome image and play welcome audio
  const handleIntroEnded = () => {
    console.log('✓ Intro video ended');
    setShowIntro(false);
    setShowIntroFadeout(false);
    setShowWelcome(true);
    
    console.log('✓ Welcome image showing');
    
    // Play welcome audio immediately when intro ends
    if (welcomeAudioRef.current) {
      welcomeAudioRef.current.currentTime = 0;
      welcomeAudioRef.current.play().catch(err => {
        console.error('Audio play failed:', err);
      });
      console.log('✓ Welcome audio playing NOW');
    }
  };

  // When welcome audio ends, show content and START background video + AUTO START SPEECH
  const handleWelcomeAudioEnded = () => {
    console.log('✓ Welcome audio ended');
    setShowWelcome(false);
    setShowContent(true);
    
    // Auto-start the first speech after a brief delay
    setTimeout(() => {
      console.log('✓ Auto-starting first speech');
      handleStart();
    }, 1000);
  };

  // Start background video when showContent becomes true
  useEffect(() => {
    if (showContent && backgroundVideoRef.current) {
      backgroundVideoRef.current.currentTime = 0;
      backgroundVideoRef.current.play();
      console.log('✓ Background video playing behind FaceCards from 0 seconds');
    }
  }, [showContent]);

  const handleStart = () => {
    setIsPlaying(true);
    setIsSpeaking(true);
    setIsPaused(false);
    setIsComplete(false);
    resumePositions.current = {};
  };

  const handlePlayPause = () => {
    if (!isPlaying) {
      handleStart();
      return;
    }

    if (isPaused) {
      setIsPaused(false);
      setIsSpeaking(true);
      console.log('✓ Resumed from pause');
    } else if (isSpeaking) {
      setIsPaused(true);
      setIsSpeaking(false);
      console.log('✓ Paused');
    } else {
      resumePositions.current[activeIndex] = 0;
      setIsSpeaking(true);
      setIsPaused(false);
      const current = activeIndex;
      setActiveIndex(null);
      setTimeout(() => setActiveIndex(current), 50);
    }
  };

  const handleNext = () => {
    window.speechSynthesis.cancel();
    const nextIndex = activeIndex + 1;

    if (nextIndex < teachers.length) {
      setActiveIndex(nextIndex);
      setIsSpeaking(isPlaying);
      setIsPaused(false);
      resumePositions.current[nextIndex] = 0;
    } else {
      setActiveIndex(0);
      setIsPlaying(false);
      setIsSpeaking(false);
      setIsComplete(true);
    }
  };

  const handleRestart = () => {
    window.speechSynthesis.cancel();
    setActiveIndex(0);
    setIsPlaying(true);
    setIsSpeaking(true);
    setIsPaused(false);
    setIsComplete(false);
    resumePositions.current = {};
  };

  const handleSpeechStart = () => {
    setIsSpeaking(true);
    if (isPaused) setIsPaused(false);
  };

  const handleSpeechEnd = (position) => {
    if (isPaused) {
      resumePositions.current[activeIndex] = position;
    } else {
      setIsSpeaking(false);
      resumePositions.current[activeIndex] = 0;
    }
  };

  const handleCardEnded = () => {
    if (isPaused || !isPlaying) {
      return;
    }

    setIsSpeaking(false);
    const nextIndex = activeIndex + 1;

    if (nextIndex < teachers.length) {
      setTimeout(() => {
        setActiveIndex(nextIndex);
        setIsSpeaking(true);
      }, 1000);
    } else {
      setActiveIndex(0);
      setIsPlaying(false);
      setIsSpeaking(false);
      setIsComplete(true);
      
      // Transition to Q&A chatbot after 2 seconds
      setTimeout(() => {
        if (onComplete) onComplete();
      }, 2000);
    }
  };

  return (
    <div className="showcase-container">
      {/* Start Button Overlay */}
      {showStartButton && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          gap: '30px'
        }}>
          <h1 style={{
            color: '#00ffff',
            fontSize: '3rem',
            fontWeight: 'bold',
            textAlign: 'center',
            margin: 0,
            textShadow: '0 0 20px rgba(0,255,255,0.5)'
          }}>
            NextGen Supercomputing Club
          </h1>
          <p style={{
            color: '#ffffff',
            fontSize: '1.5rem',
            textAlign: 'center',
            margin: 0
          }}>
            Inauguration Ceremony
          </p>
          <button
            onClick={handleStartCeremony}
            style={{
              padding: '20px 50px',
              fontSize: '1.3rem',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '50px',
              cursor: 'pointer',
              fontWeight: 'bold',
              boxShadow: '0 10px 30px rgba(102,126,234,0.5)',
              transition: 'all 0.3s ease',
              marginTop: '20px'
            }}
            onMouseOver={(e) => {
              e.target.style.transform = 'translateY(-3px)';
              e.target.style.boxShadow = '0 15px 40px rgba(102,126,234,0.7)';
            }}
            onMouseOut={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 10px 30px rgba(102,126,234,0.5)';
            }}
          >
            🎬 Start Ceremony
          </button>
        </div>
      )}
      {/* Background video - always in DOM but only visible with showContent */}
      <video 
        ref={backgroundVideoRef}
        className="background-video"
        style={{ display: showContent ? 'block' : 'none' }}
        src="/background_3.mp4"
        loop
        muted
        playsInline
      />

      {/* Intro video - plays first WITH its own audio */}
      {showIntro && (
        <video 
          ref={introVideoRef}
          className="background-video intro-overlay"
          src="/intro.mp4"
          muted={false}
          playsInline
          onEnded={handleIntroEnded}
        />
      )}

      {/* Intro fade out overlay */}
      {showIntroFadeout && (
        <div className="intro-fadeout-overlay" />
      )}

      {/* Welcome audio - plays after intro ends */}
      <audio 
        ref={welcomeAudioRef}
        src="/welcome-audio.mp3"
        preload="auto"
        controls={false}
        onEnded={handleWelcomeAudioEnded}
      />

      {/* Welcome overlay with image - NO background video behind it */}
      {showWelcome && (
        <div className="welcome-container">
          <img 
            src="/welcome.jpg" 
            alt="Welcome" 
            className="welcome-image"
          />
        </div>
      )}

      {/* Content - Facecard WITH background video */}
      {showContent && (
        <>
          {/* Face Cards Stage */}
          <div className="card-stage">
            {teachers.map((teacher, index) => (
              <FaceCard
                key={index}
                teacher={teacher}
                teacherIndex={index}
                isActive={activeIndex === index && isPlaying && !isPaused}
                isPaused={isPaused && activeIndex === index}
                isVisible={activeIndex === index}
                resumePosition={resumePositions.current[index] || 0}
                onEnded={handleCardEnded}
                onSpeechStart={handleSpeechStart}
                onSpeechEnd={handleSpeechEnd}
              />
            ))}
          </div>

          {/* Controls */}
          <button 
            className="control-icon left-control" 
            onClick={handlePlayPause}
            title={isSpeaking && !isPaused ? 'Pause' : 'Play'}
          >
            {isSpeaking && !isPaused ? <PauseIcon /> : <PlayIcon />}
          </button>

          <button 
            className="control-icon right-control" 
            onClick={handleNext}
            title="Next"
          >
            <NextIcon />
          </button>

          {isComplete && (
            <button className="control-icon center-control" onClick={handleRestart} title="Restart">
              <RestartIcon />
            </button>
          )}
        </>
      )}
    </div>
  );
};

const PlayIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
    <path d="M8 5v14l11-7z"/>
  </svg>
);

const PauseIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
  </svg>
);

const NextIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
    <path d="M6 4l12 8-12 8V4zm13 0v16h2V4h-2z"/>
  </svg>
);

const RestartIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/>
  </svg>
);

export default Showcase;
