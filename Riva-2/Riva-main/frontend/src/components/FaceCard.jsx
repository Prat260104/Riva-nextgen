import React, { useRef, useEffect, useState } from 'react';
import './FaceCard.css';

const FaceCard = ({ 
  teacher, 
  isActive, 
  isPaused, 
  isVisible, 
  onEnded, 
  onSpeechStart, 
  onSpeechEnd, 
  resumePosition,
  teacherIndex
}) => {
  const [audioLevel, setAudioLevel] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [displayedText, setDisplayedText] = useState('');
  const [showTeamPhotos, setShowTeamPhotos] = useState(false);
  const utteranceRef = useRef(null);
  const animationRef = useRef(null);
  const speechPhaseRef = useRef(0);
  const photoCardRef = useRef(null);
  const textAreaRef = useRef(null);
  const teamPhotosShownRef = useRef(false);
  const speechStartTimeRef = useRef(0);
  const monitorIntervalRef = useRef(null);
  const typeIntervalRef = useRef(null);
  const currentCharIndexRef = useRef(0);

  // Control buttons blur when team modal is active
  useEffect(() => {
    if (showTeamPhotos) {
      document.body.setAttribute('data-team-modal-active', 'true');
    } else {
      document.body.removeAttribute('data-team-modal-active');
    }
  }, [showTeamPhotos]);

  // SEPARATE EFFECT: Handle pause/resume WITHOUT triggering main effect
  useEffect(() => {
    if (!isActive || !isSpeaking) return;

    if (isPaused) {
      // PAUSE: Pause both speaker and typing
      window.speechSynthesis.pause();
      if (typeIntervalRef.current) {
        clearInterval(typeIntervalRef.current);
      }
      console.log('✓ Paused at character:', currentCharIndexRef.current);
    } else {
      // RESUME: Resume both speaker and typing
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
        console.log('✓ Resumed from character:', currentCharIndexRef.current);
        
        // Resume typing
        const fullText = teacher.script;
        const typingSpeedMap = { 0: 58, 1: 58, 2: 50, 3: 58 };
        const typingSpeed = typingSpeedMap[teacherIndex] || 62;

        typeIntervalRef.current = setInterval(() => {
          if (currentCharIndexRef.current < fullText.length) {
            setDisplayedText(fullText.substring(0, currentCharIndexRef.current + 1));
            currentCharIndexRef.current++;
          } else {
            clearInterval(typeIntervalRef.current);
          }
        }, typingSpeed);
      }
    }
  }, [isPaused, isActive, isSpeaking, teacher.script, teacherIndex]);

  // Typewriter effect
  useEffect(() => {
    if (!isActive || !isSpeaking || isPaused) {
      if (typeIntervalRef.current) {
        clearInterval(typeIntervalRef.current);
      }
      return;
    }

    const fullText = teacher.script;
    const typingSpeedMap = { 0: 58, 1: 58, 2: 50, 3: 58 };
    const typingSpeed = typingSpeedMap[teacherIndex] || 62;

    typeIntervalRef.current = setInterval(() => {
      if (currentCharIndexRef.current < fullText.length) {
        setDisplayedText(fullText.substring(0, currentCharIndexRef.current + 1));
        currentCharIndexRef.current++;
      } else {
        clearInterval(typeIntervalRef.current);
      }
    }, typingSpeed);

    return () => {
      if (typeIntervalRef.current) clearInterval(typeIntervalRef.current);
    };
  }, [isActive, isSpeaking, isPaused, teacher.script, teacherIndex]);

  // Auto-scroll
  useEffect(() => {
    if (textAreaRef.current) {
      textAreaRef.current.scrollTop = textAreaRef.current.scrollHeight;
    }
  }, [displayedText]);

  const cleanTextForTTS = (text) => {
    return text.replace(/[\p{Emoji}]/gu, '');
  };

  // MAIN EFFECT: DO NOT include isPaused in dependencies
  useEffect(() => {
    if (!isActive) {
      setAudioLevel(0);
      setIsSpeaking(false);
      setDisplayedText('');
      setShowTeamPhotos(false);
      teamPhotosShownRef.current = false;
      currentCharIndexRef.current = 0;
      if (typeIntervalRef.current) clearInterval(typeIntervalRef.current);
      if (monitorIntervalRef.current) clearInterval(monitorIntervalRef.current);
      window.speechSynthesis.cancel();
      return;
    }

    // IMPORTANT: Skip if paused - don't re-initialize
    if (isPaused) {
      return;
    }

    const words = teacher.script.split(' ');
    const startPosition = resumePosition || 0;
    const remainingText = words.slice(startPosition).join(' ');

    if (!remainingText.trim()) {
      if (onEnded) onEnded();
      return;
    }

    const cleanedText = cleanTextForTTS(remainingText);
    const utterance = new SpeechSynthesisUtterance(cleanedText);
    utteranceRef.current = utterance;

    utterance.rate = 0.95;
    utterance.volume = 1.0;

    const pitchMap = { 0: 1.2, 1: 1.1, 2: 0.9, 3: 0.9 };
    utterance.pitch = pitchMap[teacherIndex] || 1.0;

    const setVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      let selectedVoice = null;

      const voiceMap = {
        1: 'Microsoft Zira - English (United States)',
        0: 'Google UK English Female',
        2: 'Microsoft Mark - English (United States)',
        3: 'Microsoft David - English (United States)'
      };

      const targetVoice = voiceMap[teacherIndex];
      if (targetVoice) {
        selectedVoice = voices.find(v => v.name === targetVoice);
      }

      if (!selectedVoice) {
        const isFemale = teacherIndex === 0 || teacherIndex === 1;
        if (isFemale) {
          selectedVoice = voices.find(v => v.name.toLowerCase().includes('female'));
        } else {
          selectedVoice = voices.find(v => v.lang === 'en-US');
        }
      }

      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
    };

    if (window.speechSynthesis.getVoices().length > 0) {
      setVoice();
    } else {
      window.speechSynthesis.onvoiceschanged = setVoice;
    }

    const simulateAudioLevel = () => {
      speechPhaseRef.current += 0.2;
      const baseLevel = 0.5 + Math.random() * 0.4;
      const wave1 = Math.sin(speechPhaseRef.current) * 0.3;
      const wave2 = Math.sin(speechPhaseRef.current * 2.5) * 0.2;
      const randomSpike = Math.random() > 0.6 ? Math.random() * 0.4 : 0;
      const targetLevel = Math.max(0.4, Math.min(1.0, baseLevel + wave1 + wave2 + randomSpike));
      
      setAudioLevel(prev => prev + (targetLevel - prev) * 0.3);
      animationRef.current = requestAnimationFrame(simulateAudioLevel);
    };

    utterance.onstart = () => {
      setIsSpeaking(true);
      currentCharIndexRef.current = 0;
      setDisplayedText('');
      setShowTeamPhotos(false);
      teamPhotosShownRef.current = false;
      speechStartTimeRef.current = Date.now();
      setAudioLevel(0.6);
      speechPhaseRef.current = 0;
      simulateAudioLevel();
      if (onSpeechStart) onSpeechStart();

      const fullScript = teacher.script;
      const teamLineText = 'Behind this vision is a dedicated team';
      const teamEndText = 'Divyansh Verma';
      const teamLineIndex = fullScript.indexOf(teamLineText);
      const teamEndIndex = fullScript.indexOf(teamEndText);

      if (teamLineIndex > 0) {
        const wordsBeforeTeamLine = fullScript.substring(0, teamLineIndex).split(' ').length;
        const expectedTimeForTeamLine = (wordsBeforeTeamLine * 0.4);
        const delayedShowTime = expectedTimeForTeamLine + 4.8;

        monitorIntervalRef.current = setInterval(() => {
          const elapsedTime = (Date.now() - speechStartTimeRef.current) / 1000;
          
          if (elapsedTime >= delayedShowTime && !teamPhotosShownRef.current) {
            setShowTeamPhotos(true);
            teamPhotosShownRef.current = true;
          }

          if (teamEndIndex > 0) {
            const wordsBeforeTeamEnd = fullScript.substring(0, teamEndIndex).split(' ').length;
            const expectedTimeForTeamEnd = (wordsBeforeTeamEnd * 0.4);
            const hideTime = expectedTimeForTeamEnd + 10.5;
            
            if (elapsedTime >= hideTime && teamPhotosShownRef.current) {
              setShowTeamPhotos(false);
              teamPhotosShownRef.current = false;
            }
          }
        }, 50);
      }
    };

    utterance.onend = () => {
      if (monitorIntervalRef.current) clearInterval(monitorIntervalRef.current);
      setIsSpeaking(false);
      setShowTeamPhotos(false);
      teamPhotosShownRef.current = false;
      
      let currentLevel = audioLevel;
      const fadeOut = setInterval(() => {
        currentLevel *= 0.7;
        setAudioLevel(currentLevel);
        if (currentLevel < 0.05) {
          clearInterval(fadeOut);
          setAudioLevel(0);
        }
      }, 50);
      
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      
      if (onSpeechEnd) onSpeechEnd(0);
      
      setTimeout(() => {
        if (onEnded) onEnded();
      }, 500);
    };

    utterance.onerror = (e) => {
      if (monitorIntervalRef.current) clearInterval(monitorIntervalRef.current);
      if (e.error === 'interrupted') {
        return;
      }
      console.error('Speech error:', e);
      setIsSpeaking(false);
      setAudioLevel(0);
    };

    window.speechSynthesis.cancel();
    setTimeout(() => {
      window.speechSynthesis.speak(utterance);
    }, 100);

    return () => {
      if (monitorIntervalRef.current) clearInterval(monitorIntervalRef.current);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive, resumePosition, teacher.script, teacherIndex]);

  const glowIntensity = 0.3 + audioLevel * 0.7;
  const ringScale1 = 1.05 + audioLevel * 0.1;
  const ringScale2 = 1.15 + audioLevel * 0.15;
  const glowOpacity = 0.3 + audioLevel * 0.4;
  const ringGlow = `0 0 ${20 + audioLevel * 40}px rgba(255, 255, 255, ${0.3 + audioLevel * 0.5})`;

  const teamMembers = [
    { name: 'Samarth Shukla', role: 'Vice President', photo: '/samarth.jpg' },
    { name: 'Ujjawal Tyagi', role: 'PR Head', photo: '/ujju 2.jpg' },
    { name: 'Preeti Singh', role: 'Graphics Head', photo: '/preeti.jpg' },
    { name: 'Srashti Gupta', role: 'Event Management Lead', photo: '/srashti.jpg' },
    { name: 'Vidisha Goel', role: 'Event Management Lead', photo: '/vidisha.jpg' },
    { name: 'Ronak Goel', role: 'Technical Lead', photo: '/ronak.jpg' },
    { name: 'Vinayak Rastogi', role: 'Technical Lead', photo: '/vinayak.jpg' },
    { name: 'Divyansh Verma', role: 'Treasurer', photo: 'divyansh.jpg' }
  ];

  return (
    <div className={`face-card-container ${isVisible ? 'visible' : 'hidden'} ${showTeamPhotos ? 'team-modal-active' : ''}`}>
      <div className="card-wrapper">
        <div 
          ref={photoCardRef}
          className="photo-card"
          style={{
            boxShadow: `${ringGlow}, 0 20px 60px rgba(0, 0, 0, 0.9)`,
            '--ring-scale-1': ringScale1,
            '--ring-scale-2': ringScale2,
          }}
        >
          <div 
            className="card-glow"
            style={{
              opacity: glowOpacity,
              transform: `scale(${1 + audioLevel * 0.2})`
            }}
          />
          
          <img 
            src={teacher.photo} 
            alt={teacher.name}
            className="photo-image"
          />
        </div>

        {teacher.name && (
          <div className="teacher-name">
            {teacher.name}
          </div>
        )}
      </div>

      <div className="text-container">
        {displayedText && (
          <div className="text-area" ref={textAreaRef}>
            <div className="chat-text">
              {displayedText.split('\n').map((line, index) => (
                <div key={index}>
                  {line}
                  {index === displayedText.split('\n').length - 1 && <span className="cursor-blink" />}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showTeamPhotos && (
        <div className="team-modal">
          <div className="team-grid">
            {teamMembers.map((member, index) => (
              <div key={index} className="team-member">
                <img src={member.photo} alt={member.name} className="team-photo" />
                <div className="team-info">
                  <h3>{member.name}</h3>
                  <p>{member.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FaceCard;


