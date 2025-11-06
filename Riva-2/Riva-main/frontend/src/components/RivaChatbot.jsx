import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import AudioSphere from './AudioSphere';
import './RivaChatbot.css';

const RestartIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10"/>
    <polyline points="1 20 1 14 7 14"/>
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
  </svg>
);

const ContinuousIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>
);

const MicIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
    <line x1="12" y1="19" x2="12" y2="23"/>
    <line x1="8" y1="23" x2="16" y2="23"/>
  </svg>
);

const SendIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"/>
    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
);

function RivaChatbot() {
  const [messages, setMessages] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [inputText, setInputText] = useState('');
  const [error, setError] = useState(null);
  const [interimText, setInterimText] = useState('');
  const [audioLevel, setAudioLevel] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [continuousMode, setContinuousMode] = useState(false);
  const [autoStarted, setAutoStarted] = useState(false);
  
  const recognitionRef = useRef(null);
  const audioIntervalRef = useRef(null);
  const leftMessagesRef = useRef(null);
  const rightMessagesRef = useRef(null);
  const typingIntervalRef = useRef(null);
  const ttsInitializedRef = useRef(false);
  const isAISpeakingRef = useRef(false);
  const lastUserInputRef = useRef(Date.now());
  const speechPhaseRef = useRef(0);

  const scrollToBottom = (ref) => {
    if (ref.current) {
      ref.current.scrollTop = ref.current.scrollHeight;
    }
  };

  // Auto-start continuous mode when component mounts
  useEffect(() => {
    if (!autoStarted && recognitionRef.current) {
      const timer = setTimeout(() => {
        if (!ttsInitializedRef.current) {
          const utterance = new SpeechSynthesisUtterance('');
          window.speechSynthesis.speak(utterance);
          ttsInitializedRef.current = true;
        }
        
        setContinuousMode(true);
        setAutoStarted(true);
        
        setTimeout(() => {
          if (recognitionRef.current && !isListening) {
            try {
              setIsListening(true);
              setError(null);
              recognitionRef.current.start();
              console.log('✅ Auto-started continuous mode');
            } catch (err) {
              setIsListening(false);
            }
          }
        }, 500);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [autoStarted, isListening]);

  useEffect(() => {
    const assistantMessages = messages.filter(m => m.role === 'assistant');
    const userMessages = messages.filter(m => m.role === 'user');
    
    if (assistantMessages.length > 0) {
      setTimeout(() => scrollToBottom(leftMessagesRef), 100);
    }
    
    if (userMessages.length > 0) {
      setTimeout(() => scrollToBottom(rightMessagesRef), 100);
    }
  }, [messages]);

  const typewriterEffect = useCallback((fullText, callback) => {
    let currentIndex = 0;
    setIsTyping(true);

    setMessages(prev => [...prev, { role: 'assistant', content: '', isTyping: true }]);

    const typeNextChar = () => {
      if (currentIndex < fullText.length) {
        currentIndex++;

        setMessages(prev => {
          const newMessages = [...prev];
          const lastIndex = newMessages.length - 1;
          newMessages[lastIndex] = {
            ...newMessages[lastIndex],
            content: fullText.substring(0, currentIndex)
          };
          return newMessages;
        });

        scrollToBottom(leftMessagesRef);

        const delay = Math.random() * 15 + 15;
        typingIntervalRef.current = setTimeout(typeNextChar, delay);
      } else {
        setMessages(prev => {
          const newMessages = [...prev];
          const lastIndex = newMessages.length - 1;
          newMessages[lastIndex] = {
            ...newMessages[lastIndex],
            isTyping: false
          };
          return newMessages;
        });
        setIsTyping(false);
        if (callback) callback();
      }
    };

    typeNextChar();
  }, []);

  const handleSendMessage = useCallback(async (text) => {
    const messageText = text || inputText;
    if (!messageText.trim()) return;

    const userMessage = { role: 'user', content: messageText };
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setInterimText('');

    try {
      const response = await fetch('http://localhost:5001/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: messageText })
      });

      const data = await response.json();

      if (data.success) {
        typewriterEffect(data.response);
        await speak(data.response);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('❌ Backend error:', error);
      const errorMessage = 'Sorry, I encountered an error connecting to the server.';
      typewriterEffect(errorMessage);
    }
  }, [inputText, typewriterEffect]);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        if (isAISpeakingRef.current) {
          console.log('🚫 Ignoring input - AI is speaking');
          return;
        }

        const timeSinceLastInput = Date.now() - lastUserInputRef.current;
        if (timeSinceLastInput < 2000) {
          console.log('🚫 Ignoring input - too soon after AI speech');
          return;
        }

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
          setInputText(interimTranscript);
        }

        if (finalTranscript) {
          console.log('✅ Valid user input detected:', finalTranscript);
          lastUserInputRef.current = Date.now();
          setInputText(finalTranscript);
          setInterimText('');
          setIsListening(false);
          setError(null);
          
          setTimeout(() => {
            handleSendMessage(finalTranscript);
          }, 200);
        }
      };

      recognitionRef.current.onerror = (event) => {
        setIsListening(false);
        setInterimText('');
        
        if (event.error !== 'aborted' && event.error !== 'no-speech') {
          setError(`Speech error: ${event.error}`);
        }
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
        setInterimText('');
      };

      recognitionRef.current.onstart = () => {
        setError(null);
        setInterimText('');
      };
    }
  }, [handleSendMessage]);

  const speak = async (text) => {
    if (isSpeaking) stopSpeaking();

    isAISpeakingRef.current = true;

    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
        setIsListening(false);
      } catch (err) {}
    }

    let cleanText = text.replace(/[\u{1F300}-\u{1F9FF}]/gu, '');
    cleanText = cleanText.replace(/\*\*(.+?)\*\*/g, '$1');
    cleanText = cleanText.replace(/\*(.+?)\*/g, '$1');
    cleanText = cleanText.replace(/^#+\s+/gm, '');
    cleanText = cleanText.replace(/`([^`]+)`/g, '$1');
    cleanText = cleanText.replace(/\s+/g, ' ').trim();
    
    if (!cleanText) {
      isAISpeakingRef.current = false;
      return;
    }

    setIsSpeaking(true);

    try {
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 0.95;
      utterance.pitch = 1.15;
      utterance.volume = 1.0;
      utterance.lang = 'en-US';

      const getVoices = () => {
        return new Promise((resolve) => {
          let voices = window.speechSynthesis.getVoices();
          if (voices.length) {
            resolve(voices);
          } else {
            window.speechSynthesis.onvoiceschanged = () => {
              voices = window.speechSynthesis.getVoices();
              resolve(voices);
            };
          }
        });
      };

      const voices = await getVoices();
      
      let femaleVoice = voices.find(v => 
        v.lang.includes('en-US') && 
        (v.name.toLowerCase().includes('female') || 
         v.name.toLowerCase().includes('zira'))
      );
      
      if (femaleVoice) {
        utterance.voice = femaleVoice;
      }

      const simulateAudioLevel = () => {
        speechPhaseRef.current += 0.2;
        
        const baseLevel = 0.5 + Math.random() * 0.4;
        const wave1 = Math.sin(speechPhaseRef.current) * 0.3;
        const wave2 = Math.sin(speechPhaseRef.current * 2.5) * 0.2;
        const randomSpike = Math.random() > 0.6 ? Math.random() * 0.4 : 0;
        
        const targetLevel = Math.max(0.4, Math.min(1.0, baseLevel + wave1 + wave2 + randomSpike));
        
        setAudioLevel(prev => prev + (targetLevel - prev) * 0.3);
      };

      audioIntervalRef.current = setInterval(simulateAudioLevel, 40);

      return new Promise((resolve) => {
        utterance.onend = () => {
          if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
          
          let currentLevel = audioLevel;
          const fadeOut = setInterval(() => {
            currentLevel *= 0.7;
            setAudioLevel(currentLevel);
            if (currentLevel < 0.05) {
              clearInterval(fadeOut);
              setAudioLevel(0);
            }
          }, 50);
          
          setIsSpeaking(false);
          isAISpeakingRef.current = false;
          console.log('🟢 AI SPEAKING MODE DEACTIVATED');
          
          resolve();
        };

        utterance.onerror = (e) => {
          if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
          setIsSpeaking(false);
          setAudioLevel(0);
          isAISpeakingRef.current = false;
          resolve();
        };

        utterance.onstart = () => {
          setAudioLevel(0.6);
          speechPhaseRef.current = 0;
        };

        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
      });

    } catch (error) {
      if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
      setIsSpeaking(false);
      setAudioLevel(0);
      isAISpeakingRef.current = false;
    }
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
    setIsSpeaking(false);
    setAudioLevel(0);
  };

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening && continuousMode) {
      try {
        setIsListening(true);
        setError(null);
        recognitionRef.current.start();
        console.log('🎤 Auto-restarted listening');
      } catch (err) {
        setIsListening(false);
      }
    }
  }, [isListening, continuousMode]);

  const toggleContinuousMode = () => {
    if (!ttsInitializedRef.current) {
      const utterance = new SpeechSynthesisUtterance('');
      window.speechSynthesis.speak(utterance);
      ttsInitializedRef.current = true;
      console.log('✅ TTS initialized');
    }
    
    const newMode = !continuousMode;
    setContinuousMode(newMode);
    
    if (newMode) {
      if (recognitionRef.current && !isListening) {
        try {
          setIsListening(true);
          setError(null);
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
    if (continuousMode && !isListening && !isSpeaking && !isTyping && !isAISpeakingRef.current) {
      const timer = setTimeout(() => {
        console.log('⏰ Restarting listening after delay');
        startListening();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [continuousMode, isListening, isSpeaking, isTyping, startListening]);

  const clearConversation = async () => {
    if (!ttsInitializedRef.current) {
      const utterance = new SpeechSynthesisUtterance('');
      window.speechSynthesis.speak(utterance);
      ttsInitializedRef.current = true;
    }
    
    setMessages([]);
    setError(null);
    stopSpeaking();
    
    if (typingIntervalRef.current) {
      clearTimeout(typingIntervalRef.current);
    }
    setIsTyping(false);
    
    try {
      await fetch('http://localhost:5001/api/clear', { method: 'POST' });
    } catch (error) {}
  };

  const userMessages = useMemo(() => messages.filter(m => m.role === 'user'), [messages]);
  const assistantMessages = useMemo(() => messages.filter(m => m.role === 'assistant'), [messages]);

  const audioSphereComponent = useMemo(() => (
    <AudioSphere audioLevel={audioLevel} isSpeaking={isSpeaking} />
  ), [audioLevel, isSpeaking]);

  return (
    <div className="app-container">
      <div className="audiosphere-background">
        {audioSphereComponent}
      </div>

      {error && <div className="error-banner">⚠️ {error}</div>}
      {interimText && <div className="interim-banner">Listening: "{interimText}"</div>}
      {continuousMode && <div className="continuous-banner">🔄 Continuous Mode Active</div>}

      <div className="left-panel">
        <div className="panel-header">
          <h3>RIVA</h3>
        </div>
        <div className="messages-container" ref={leftMessagesRef}>
          {assistantMessages.map((msg, idx) => (
            <div key={idx} className="message-bubble ai-message">
              <ReactMarkdown>{msg.content}</ReactMarkdown>
              {msg.isTyping && <span className="typing-cursor">▌</span>}
            </div>
          ))}
        </div>
      </div>

      <div className="right-panel">
        <div className="panel-header">
          <h3>YOU</h3>
        </div>
        <div className="messages-container" ref={rightMessagesRef}>
          {userMessages.map((msg, idx) => (
            <div key={idx} className="message-bubble user-message">
              {msg.content}
            </div>
          ))}
        </div>
      </div>

      <div className="center-controls">
        <button 
          className={`control-btn continuous-btn ${continuousMode ? 'active' : ''}`}
          onClick={toggleContinuousMode}
          disabled={isSpeaking || isTyping}
          title="Continuous Mode"
        >
          <ContinuousIcon />
        </button>
        
        <button 
          className="control-btn restart-btn"
          onClick={clearConversation}
          title="Restart"
        >
          <RestartIcon />
        </button>
      </div>

      <div className="horizontal-input-container">
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
          placeholder={isListening ? "Listening..." : "Type your message..."}
          disabled={isSpeaking || isTyping}
          rows={1}
        />
        <button 
          onClick={() => handleSendMessage()}
          disabled={!inputText.trim() || isListening || isSpeaking || isTyping}
          className="send-btn-horizontal"
        >
          <SendIcon />
        </button>
      </div>
    </div>
  );
}

export default RivaChatbot;
