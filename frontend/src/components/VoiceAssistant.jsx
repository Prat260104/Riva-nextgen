import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';

const VoiceAssistant = ({ activeAvatar, onAudioLevel, onSpeaking }) => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [continuousMode, setContinuousMode] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [lastResponse, setLastResponse] = useState('');

  // Monitor avatar changes
  useEffect(() => {
    console.log('🎭 VoiceAssistant: activeAvatar prop changed to:', activeAvatar);
  }, [activeAvatar]);
  
  const recognitionRef = useRef(null);
  const audioIntervalRef = useRef(null);
  const isAISpeakingRef = useRef(false);
  const lastUserInputRef = useRef(Date.now());

  const handleSendMessage = useCallback(async (text) => {
    if (!text.trim()) return;

    console.log('🎭 Sending message as avatar:', activeAvatar);
    console.log('📤 Request payload:', { message: text, avatar: activeAvatar });

    try {
      const response = await fetch('http://localhost:5000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: text,
          avatar: activeAvatar 
        })
      });

      const data = await response.json();

      if (data.success) {
        setLastResponse(data.response);
        await speak(data.response);
      }
    } catch (error) {
      console.error('❌ Chat error:', error);
    }
  }, [activeAvatar]);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        if (isAISpeakingRef.current) return;
        
        const timeSinceLastInput = Date.now() - lastUserInputRef.current;
        if (timeSinceLastInput < 2000) return;

        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        if (interimTranscript) {
          setInterimText(interimTranscript);
        }

        if (finalTranscript) {
          console.log('✅ Voice input:', finalTranscript);
          console.log('🎭 Current activeAvatar:', activeAvatar);
          lastUserInputRef.current = Date.now();
          setInterimText('');
          setIsListening(false);
          
          setTimeout(() => {
            handleSendMessage(finalTranscript);
          }, 200);
        }
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
        setInterimText('');
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
        setInterimText('');
      };
    }
  }, [handleSendMessage]);

  const speak = async (text) => {
    isAISpeakingRef.current = true;
    setIsSpeaking(true);
    if (onSpeaking) onSpeaking(true);

    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
        setIsListening(false);
      } catch (err) {}
    }

    let cleanText = text.replace(/[*#`_~|\\<>{}[\]]/g, '').replace(/\s+/g, ' ').trim();

    try {
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 0.95;
      utterance.pitch = 1.15;
      utterance.lang = 'en-IN';

      const voices = window.speechSynthesis.getVoices();
      const voice = voices.find(v => v.lang.includes('en-IN')) || voices.find(v => v.lang.includes('en-'));
      if (voice) utterance.voice = voice;

      let targetLevel = 0;
      const simulateAudio = () => {
        targetLevel = Math.random() * 0.5 + 0.3;
        if (onAudioLevel) onAudioLevel(targetLevel);
      };

      audioIntervalRef.current = setInterval(simulateAudio, 50);

      return new Promise((resolve) => {
        utterance.onend = () => {
          if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
          setIsSpeaking(false);
          if (onAudioLevel) onAudioLevel(0);
          if (onSpeaking) onSpeaking(false);
          isAISpeakingRef.current = false;
          resolve();
        };

        utterance.onerror = () => {
          if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
          setIsSpeaking(false);
          if (onAudioLevel) onAudioLevel(0);
          if (onSpeaking) onSpeaking(false);
          resolve();
        };

        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
      });
    } catch (error) {
      console.error('Speech error:', error);
      if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
      setIsSpeaking(false);
      if (onAudioLevel) onAudioLevel(0);
      if (onSpeaking) onSpeaking(false);
    }
  };

  const startListening = () => {
    if (recognitionRef.current && !isListening && continuousMode) {
      try {
        setIsListening(true);
        recognitionRef.current.start();
      } catch (err) {
        setIsListening(false);
      }
    }
  };

  const toggleContinuousMode = () => {
    const newMode = !continuousMode;
    setContinuousMode(newMode);
    
    if (newMode) {
      if (recognitionRef.current && !isListening) {
        try {
          setIsListening(true);
          recognitionRef.current.start();
        } catch (err) {
          setIsListening(false);
        }
      }
    } else {
      if (recognitionRef.current && isListening) {
        recognitionRef.current.stop();
        setIsListening(false);
      }
    }
  };

  useEffect(() => {
    if (continuousMode && !isListening && !isSpeaking && !isAISpeakingRef.current) {
      const timer = setTimeout(() => {
        startListening();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [continuousMode, isListening, isSpeaking]);

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 100,
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      alignItems: 'center'
    }}>
      {activeAvatar && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            padding: '8px 20px',
            background: 'rgba(0, 0, 0, 0.6)',
            borderRadius: '20px',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            backdropFilter: 'blur(10px)',
            color: '#ffffff',
            fontFamily: 'Inter, sans-serif',
            fontSize: '13px',
            fontWeight: '600'
          }}
        >
          🤖 {activeAvatar}
        </motion.div>
      )}
      
      <div style={{
        display: 'flex',
        gap: '15px',
        alignItems: 'center'
      }}>
      <motion.button
        onClick={toggleContinuousMode}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        style={{
          padding: '15px 35px',
          background: continuousMode 
            ? 'rgba(0, 255, 0, 0.3)' 
            : 'rgba(255, 255, 255, 0.2)',
          border: '1px solid',
          borderColor: continuousMode ? '#00ff00' : '#ffffff',
          borderRadius: '30px',
          color: '#ffffff',
          fontFamily: 'Inter, sans-serif',
          fontWeight: '600',
          cursor: 'pointer',
          fontSize: '14px',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)'
        }}
      >
        {continuousMode ? '🎤 Listening...' : '🎤 Start Voice'}
      </motion.button>

      {interimText && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            padding: '10px 20px',
            background: 'rgba(0, 0, 0, 0.8)',
            borderRadius: '20px',
            color: '#00ffff',
            fontFamily: 'Inter, sans-serif',
            fontSize: '12px',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(0, 255, 255, 0.3)'
          }}
        >
          "{interimText}"
        </motion.div>
      )}

      {lastResponse && !isSpeaking && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.7 }}
          style={{
            padding: '10px 20px',
            background: 'rgba(0, 0, 0, 0.6)',
            borderRadius: '20px',
            color: '#fff',
            fontFamily: 'Inter, sans-serif',
            fontSize: '11px',
            maxWidth: '300px',
            backdropFilter: 'blur(10px)'
          }}
        >
          {lastResponse.substring(0, 100)}...
        </motion.div>
      )}
      </div>
    </div>
  );
};

export default VoiceAssistant;
