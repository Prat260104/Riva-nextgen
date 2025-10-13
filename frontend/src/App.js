// // App.js - Start Directly in Chat Mode
// import React, { useState, useRef, useEffect, useCallback } from 'react';
// import ReactMarkdown from 'react-markdown';
// import './App.css';
// import AudioSphere from './components/AudioSphere';

// // Icon components remain the same (MicIcon, RestartIcon, etc.)
// const MicIcon = () => (
//   <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//     <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
//     <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
//     <line x1="12" y1="19" x2="12" y2="23"/>
//     <line x1="8" y1="23" x2="16" y2="23"/>
//   </svg>
// );

// const RestartIcon = () => (
//   <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//     <polyline points="23 4 23 10 17 10"/>
//     <polyline points="1 20 1 14 7 14"/>
//     <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
//   </svg>
// );

// const TestMicIcon = () => (
//   <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//     <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
//     <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
//     <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
//   </svg>
// );

// const SendIcon = () => (
//   <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//     <line x1="22" y1="2" x2="11" y2="13"/>
//     <polygon points="22 2 15 22 11 13 2 9 22 2"/>
//   </svg>
// );

// function App() {
//   const [messages, setMessages] = useState([]);
//   const [isListening, setIsListening] = useState(false);
//   const [isSpeaking, setIsSpeaking] = useState(false);
//   const [inputText, setInputText] = useState('');
//   const [error, setError] = useState(null);
//   const [interimText, setInterimText] = useState('');
//   const [audioLevel, setAudioLevel] = useState(0);
  
//   const recognitionRef = useRef(null);
//   const currentAudioRef = useRef(null);
//   const audioContextRef = useRef(null);
//   const analyserRef = useRef(null);
//   const animationFrameRef = useRef(null);
//   const leftMessagesRef = useRef(null);
//   const rightMessagesRef = useRef(null);

//   const scrollToBottom = (ref) => {
//     if (ref.current) {
//       ref.current.scrollTop = ref.current.scrollHeight;
//     }
//   };

//   useEffect(() => {
//     const assistantMessages = messages.filter(m => m.role === 'assistant');
//     const userMessages = messages.filter(m => m.role === 'user');
    
//     if (assistantMessages.length > 0) {
//       setTimeout(() => scrollToBottom(leftMessagesRef), 100);
//     }
    
//     if (userMessages.length > 0) {
//       setTimeout(() => scrollToBottom(rightMessagesRef), 100);
//     }
//   }, [messages]);

//   const visualizeAudio = useCallback(() => {
//     if (!analyserRef.current || !isSpeaking) {
//       setAudioLevel(0);
//       return;
//     }

//     const analyser = analyserRef.current;
//     const dataArray = new Uint8Array(analyser.frequencyBinCount);
    
//     const animate = () => {
//       if (!isSpeaking) {
//         setAudioLevel(0);
//         if (animationFrameRef.current) {
//           cancelAnimationFrame(animationFrameRef.current);
//         }
//         return;
//       }

//       analyser.getByteFrequencyData(dataArray);
//       const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
//       const normalizedLevel = Math.min(average / 128, 2.0);
      
//       setAudioLevel(normalizedLevel);
      
//       animationFrameRef.current = requestAnimationFrame(animate);
//     };
    
//     animate();
//   }, [isSpeaking]);

//   const handleSendMessage = useCallback(async (text) => {
//     const messageText = text || inputText;
//     if (!messageText.trim()) return;

//     const userMessage = { role: 'user', content: messageText };
//     setMessages(prev => [...prev, userMessage]);
//     setInputText('');
//     setInterimText('');

//     try {
//       const response = await fetch('http://localhost:5000/api/chat', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({ message: messageText })
//       });

//       const data = await response.json();

//       if (data.success) {
//         const assistantMessage = { role: 'assistant', content: data.response };
//         setMessages(prev => [...prev, assistantMessage]);
//         speak(data.response);
//       } else {
//         throw new Error(data.error);
//       }
//     } catch (error) {
//       console.error('❌ Backend error:', error);
//       const errorMessage = { 
//         role: 'assistant', 
//         content: 'Sorry, I encountered an error connecting to the server.' 
//       };
//       setMessages(prev => [...prev, errorMessage]);
//     }
//   }, [inputText]);

//   useEffect(() => {
//     if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
//       const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
//       recognitionRef.current = new SpeechRecognition();
//       recognitionRef.current.continuous = false;
//       recognitionRef.current.interimResults = true;
//       recognitionRef.current.lang = 'en-US';

//       recognitionRef.current.onresult = (event) => {
//         let interimTranscript = '';
//         let finalTranscript = '';

//         for (let i = event.resultIndex; i < event.results.length; i++) {
//           const transcript = event.results[i][0].transcript;
          
//           if (event.results[i].isFinal) {
//             finalTranscript += transcript;
//           } else {
//             interimTranscript += transcript;
//           }
//         }

//         if (interimTranscript) {
//           setInterimText(interimTranscript);
//           setInputText(interimTranscript);
//         }

//         if (finalTranscript) {
//           setInputText(finalTranscript);
//           setInterimText('');
//           setIsListening(false);
//           setError(null);
          
//           setTimeout(() => {
//             handleSendMessage(finalTranscript);
//           }, 200);
//         }
//       };

//       recognitionRef.current.onerror = (event) => {
//         setIsListening(false);
//         setInterimText('');
        
//         if (event.error === 'no-speech') {
//           setError('No speech detected. Please speak louder.');
//         } else {
//           setError(`Speech error: ${event.error}`);
//         }
//       };

//       recognitionRef.current.onend = () => {
//         setIsListening(false);
//         setInterimText('');
//       };

//       recognitionRef.current.onstart = () => {
//         setError(null);
//         setInterimText('');
//       };
//     }
//   }, [handleSendMessage]);

//   const speak = async (text) => {
//     if (isSpeaking) stopSpeaking();

//     const cleanText = text.replace(/(\*|`|#|_|\[|\]|\(|\)|🤖|👋|🎯|⚠️)/g, '');
//     setIsSpeaking(true);

//     try {
//       const response = await fetch('http://localhost:5000/api/tts', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({ text: cleanText }),
//       });

//       if (!response.ok) throw new Error('TTS Error');

//       const audioBlob = await response.blob();
//       const audioUrl = URL.createObjectURL(audioBlob);
//       const audio = new Audio(audioUrl);

//       currentAudioRef.current = audio;

//       return new Promise((resolve) => {
//         audio.onloadedmetadata = () => {
//           try {
//             const audioContext = new (window.AudioContext || window.webkitAudioContext)();
//             const source = audioContext.createMediaElementSource(audio);
//             const analyser = audioContext.createAnalyser();
//             analyser.fftSize = 256;
//             analyser.smoothingTimeConstant = 0.8;
            
//             source.connect(analyser);
//             analyser.connect(audioContext.destination);
            
//             audioContextRef.current = audioContext;
//             analyserRef.current = analyser;
            
//             visualizeAudio();
//           } catch (err) {
//             console.warn('Visualization setup failed:', err);
//           }
//         };

//         audio.onended = () => {
//           setIsSpeaking(false);
//           setAudioLevel(0);
//           URL.revokeObjectURL(audioUrl);
//           currentAudioRef.current = null;
          
//           if (animationFrameRef.current) {
//             cancelAnimationFrame(animationFrameRef.current);
//           }
          
//           if (audioContextRef.current) {
//             audioContextRef.current.close();
//           }
          
//           resolve();
//         };

//         audio.onerror = () => {
//           setIsSpeaking(false);
//           setAudioLevel(0);
//           resolve();
//         };

//         audio.play().catch(() => {
//           setIsSpeaking(false);
//           setAudioLevel(0);
//           resolve();
//         });
//       });

//     } catch (error) {
//       setIsSpeaking(false);
//       setAudioLevel(0);
//     }
//   };

//   const stopSpeaking = () => {
//     if (currentAudioRef.current) {
//       currentAudioRef.current.pause();
//       currentAudioRef.current = null;
//     }
    
//     if (animationFrameRef.current) {
//       cancelAnimationFrame(animationFrameRef.current);
//     }
    
//     if (audioContextRef.current) {
//       audioContextRef.current.close();
//     }
    
//     setIsSpeaking(false);
//     setAudioLevel(0);
//   };

//   const startListening = () => {
//     if (recognitionRef.current && !isListening) {
//       try {
//         setIsListening(true);
//         setError(null);
//         recognitionRef.current.start();
//       } catch (err) {
//         setIsListening(false);
//       }
//     }
//   };

//   const stopListening = () => {
//     if (recognitionRef.current && isListening) {
//       recognitionRef.current.stop();
//       setIsListening(false);
//     }
//   };

//   const clearConversation = async () => {
//     setMessages([]);
//     setError(null);
//     stopSpeaking();
    
//     try {
//       await fetch('http://localhost:5000/api/clear', { method: 'POST' });
//     } catch (error) {
//       console.error('Error clearing:', error);
//     }
//   };

//   const testMicrophone = async () => {
//     try {
//       setError(null);
      
//       const stream = await navigator.mediaDevices.getUserMedia({ 
//         audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } 
//       });
      
//       const audioContext = new (window.AudioContext || window.webkitAudioContext)();
//       const source = audioContext.createMediaStreamSource(stream);
//       const analyser = audioContext.createAnalyser();
//       analyser.fftSize = 256;
//       source.connect(analyser);
      
//       const dataArray = new Uint8Array(analyser.frequencyBinCount);
//       let maxLevel = 0;
//       let checkCount = 0;
      
//       const checkLevel = () => {
//         analyser.getByteFrequencyData(dataArray);
//         const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
//         maxLevel = Math.max(maxLevel, average);
//         checkCount++;
        
//         setAudioLevel(average / 128);
        
//         if (checkCount >= 30) {
//           stream.getTracks().forEach(track => track.stop());
//           audioContext.close();
//           setAudioLevel(0);
          
//           if (maxLevel > 10) {
//             alert(`✅ Microphone working! Level: ${Math.round(maxLevel)}`);
//           } else {
//             alert(`⚠️ Low microphone level: ${Math.round(maxLevel)}`);
//           }
//         } else {
//           setTimeout(checkLevel, 100);
//         }
//       };
      
//       alert('Testing microphone...\n\nSpeak now for 3 seconds!');
//       checkLevel();
      
//     } catch (err) {
//       alert('Microphone test failed!');
//       setError('Microphone test failed');
//     }
//   };

//   const userMessages = messages.filter(m => m.role === 'user');
//   const assistantMessages = messages.filter(m => m.role === 'assistant');

//   return (
//     <div className="app-container">
//       <div className="audiosphere-background">
//         <AudioSphere audioLevel={audioLevel} isSpeaking={isSpeaking} />
//       </div>

//       {error && <div className="error-banner">⚠️ {error}</div>}
//       {interimText && <div className="interim-banner">Listening: "{interimText}"</div>}

//       {/* Left Panel - AI Messages */}
//       <div className="left-panel">
//         <div className="panel-header">
//           <h3>ELARA</h3>
//         </div>
//         <div className="messages-container" ref={leftMessagesRef}>
//           {assistantMessages.length === 0 && (
//             <div className="empty-state">
//               <p>Hello! I'm ELARA.</p>
//               <p className="empty-hint">Ask me anything about NextGen Supercomputing Club!</p>
//             </div>
//           )}
//           {assistantMessages.map((msg, idx) => (
//             <div key={idx} className="message-bubble ai-message">
//               <ReactMarkdown>{msg.content}</ReactMarkdown>
//             </div>
//           ))}
//         </div>
//       </div>

//       {/* Right Panel - User Messages */}
//       <div className="right-panel">
//         <div className="panel-header">
//           <h3>YOU</h3>
//         </div>
//         <div className="messages-container" ref={rightMessagesRef}>
//           {userMessages.map((msg, idx) => (
//             <div key={idx} className="message-bubble user-message">
//               {msg.content}
//             </div>
//           ))}
//         </div>
//       </div>

//       {/* Center Controls */}
//       <div className="center-controls">
//         <button 
//           className={`control-btn mic-btn ${isListening ? 'listening' : ''}`}
//           onClick={isListening ? stopListening : startListening}
//           disabled={isSpeaking}
//           title="Voice Input"
//         >
//           <MicIcon />
//         </button>
        
//         <button 
//           className="control-btn restart-btn"
//           onClick={clearConversation}
//           title="Restart"
//         >
//           <RestartIcon />
//         </button>
        
//         <button 
//           className="control-btn test-btn"
//           onClick={testMicrophone}
//           title="Test Microphone"
//         >
//           <TestMicIcon />
//         </button>
//       </div>

//       {/* Input Box */}
//       <div className="horizontal-input-container">
//         <textarea
//           value={inputText}
//           onChange={(e) => setInputText(e.target.value)}
//           onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
//           placeholder={isListening ? "Listening..." : "Type your message..."}
//           disabled={isSpeaking}
//           rows={1}
//         />
//         <button 
//           onClick={() => handleSendMessage()}
//           disabled={!inputText.trim() || isListening || isSpeaking}
//           className="send-btn-horizontal"
//         >
//           <SendIcon />
//         </button>
//       </div>
//     </div>
//   );
// }

// export default App;



// App.js - FINAL WORKING VERSION with Smooth AudioSphere
import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import './App.css';
import AudioSphere from './components/AudioSphere';

// ICON COMPONENTS
const MicIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
    <line x1="12" y1="19" x2="12" y2="23"/>
    <line x1="8" y1="23" x2="16" y2="23"/>
  </svg>
);

const RestartIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10"/>
    <polyline points="1 20 1 14 7 14"/>
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
  </svg>
);

const TestMicIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
  </svg>
);

const SendIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"/>
    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
);

function App() {
  const [messages, setMessages] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [inputText, setInputText] = useState('');
  const [error, setError] = useState(null);
  const [interimText, setInterimText] = useState('');
  const [audioLevel, setAudioLevel] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  
  const recognitionRef = useRef(null);
  const audioIntervalRef = useRef(null);
  const leftMessagesRef = useRef(null);
  const rightMessagesRef = useRef(null);
  const typingIntervalRef = useRef(null);
  const lastAudioUpdateRef = useRef(0);

  const scrollToBottom = (ref) => {
    if (ref.current) {
      ref.current.scrollTop = ref.current.scrollHeight;
    }
  };

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

  // ✨ TYPEWRITER EFFECT FUNCTION
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
      const response = await fetch('http://localhost:5000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: messageText })
      });

      const data = await response.json();

      if (data.success) {
        speak(data.response);
        typewriterEffect(data.response);
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
        
        if (event.error === 'no-speech') {
          setError('No speech detected. Please speak louder.');
        } else {
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

    let cleanText = text;
    
    cleanText = cleanText.replace(/[\u{1F300}-\u{1F9FF}]/gu, '');
    cleanText = cleanText.replace(/[\u{1F600}-\u{1F64F}]/gu, '');
    cleanText = cleanText.replace(/[\u{1F680}-\u{1F6FF}]/gu, '');
    cleanText = cleanText.replace(/[\u{1F700}-\u{1F77F}]/gu, '');
    cleanText = cleanText.replace(/[\u{1F780}-\u{1F7FF}]/gu, '');
    cleanText = cleanText.replace(/[\u{1F800}-\u{1F8FF}]/gu, '');
    cleanText = cleanText.replace(/[\u{1F900}-\u{1F9FF}]/gu, '');
    cleanText = cleanText.replace(/[\u{1FA00}-\u{1FA6F}]/gu, '');
    cleanText = cleanText.replace(/[\u{1FA70}-\u{1FAFF}]/gu, '');
    cleanText = cleanText.replace(/[\u{2600}-\u{26FF}]/gu, '');
    cleanText = cleanText.replace(/[\u{2700}-\u{27BF}]/gu, '');
    cleanText = cleanText.replace(/[\u{FE00}-\u{FE0F}]/gu, '');
    cleanText = cleanText.replace(/[\u{1F000}-\u{1F02F}]/gu, '');
    cleanText = cleanText.replace(/[\u{1F0A0}-\u{1F0FF}]/gu, '');
    cleanText = cleanText.replace(/[\u{1F100}-\u{1F64F}]/gu, '');
    
    cleanText = cleanText.replace(/\*\*(.+?)\*\*/g, '$1');
    cleanText = cleanText.replace(/\*(.+?)\*/g, '$1');
    cleanText = cleanText.replace(/^#+\s+/gm, '');
    cleanText = cleanText.replace(/``````/g, '');
    cleanText = cleanText.replace(/`([^`]+)`/g, '$1');
    cleanText = cleanText.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
    cleanText = cleanText.replace(/^[\s]*[•\-\*]\s+/gm, '');
    cleanText = cleanText.replace(/^\d+\.\s+/gm, '');
    cleanText = cleanText.replace(/[_~|\\<>{}[\]]/g, '');
    cleanText = cleanText.replace(/\s+/g, ' ').trim();
    
    if (!cleanText) {
      console.log('⚠️ No text to speak after cleaning');
      return;
    }

    setIsSpeaking(true);

    try {
      console.log('🎤 Using Browser Web Speech API (Female Voice Only)...');
      
      const utterance = new SpeechSynthesisUtterance(cleanText);
      
      utterance.rate = 0.95;
      utterance.pitch = 1.15;
      utterance.volume = 1.0;
      
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
      
      let selectedVoice = null;
      
      selectedVoice = voices.find(voice => 
        voice.lang.includes('en-IN') && 
        (voice.name.toLowerCase().includes('female') || voice.name.toLowerCase().includes('woman'))
      );
      
      if (!selectedVoice) {
        selectedVoice = voices.find(voice => 
          voice.lang.includes('en-') && 
          (voice.name.toLowerCase().includes('female') || 
           voice.name.toLowerCase().includes('woman') ||
           voice.name.toLowerCase().includes('samantha') ||
           voice.name.toLowerCase().includes('victoria') ||
           voice.name.toLowerCase().includes('karen') ||
           voice.name.toLowerCase().includes('zira'))
        );
      }
      
      if (!selectedVoice) {
        selectedVoice = voices.find(voice => 
          voice.lang.includes('en-US') && 
          voice.name.toLowerCase().includes('female')
        );
      }
      
      if (!selectedVoice) {
        selectedVoice = voices.find(voice => 
          voice.name.toLowerCase().includes('female')
        );
      }
      
      if (!selectedVoice) {
        const femaleNames = ['samantha', 'victoria', 'karen', 'zira', 'susan', 'fiona'];
        selectedVoice = voices.find(voice => 
          femaleNames.some(name => voice.name.toLowerCase().includes(name))
        );
      }
      
      if (selectedVoice) {
        utterance.voice = selectedVoice;
        console.log('🎤 Using FEMALE voice:', selectedVoice.name, '(', selectedVoice.lang, ')');
      } else {
        console.log('⚠️ No female voice found, using default');
        utterance.pitch = 1.3;
      }

      // ✨ ULTRA-SMOOTH AUDIO LEVEL SIMULATION
      let targetAudioLevel = 0;

      const simulateAudioLevel = () => {
        const now = Date.now();
        
        // Generate new target every 100ms
        if (now - lastAudioUpdateRef.current >= 100) {
          lastAudioUpdateRef.current = now;
          const baseLevel = Math.random() * 0.5 + 0.3;
          const variation = Math.sin(now / 200) * 0.15;
          targetAudioLevel = Math.max(0.2, Math.min(1, baseLevel + variation));
        }
        
        // Smoothly interpolate to target (updates every frame)
        setAudioLevel(prev => {
          const diff = targetAudioLevel - prev;
          return prev + diff * 0.15; // Smooth easing
        });
      };

      audioIntervalRef.current = setInterval(simulateAudioLevel, 50); // 20 FPS = smooth

      return new Promise((resolve) => {
        utterance.onend = () => {
          if (audioIntervalRef.current) {
            clearInterval(audioIntervalRef.current);
          }
          setIsSpeaking(false);
          setAudioLevel(0);
          console.log('✅ Speech completed');
          resolve();
        };

        utterance.onerror = (event) => {
          console.error('❌ Speech error:', event.error);
          if (audioIntervalRef.current) {
            clearInterval(audioIntervalRef.current);
          }
          setIsSpeaking(false);
          setAudioLevel(0);
          resolve();
        };

        window.speechSynthesis.speak(utterance);
      });

    } catch (error) {
      console.error('Speech error:', error);
      if (audioIntervalRef.current) {
        clearInterval(audioIntervalRef.current);
      }
      setIsSpeaking(false);
      setAudioLevel(0);
    }
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    if (audioIntervalRef.current) {
      clearInterval(audioIntervalRef.current);
    }
    setIsSpeaking(false);
    setAudioLevel(0);
  };

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      try {
        setIsListening(true);
        setError(null);
        recognitionRef.current.start();
      } catch (err) {
        setIsListening(false);
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const clearConversation = async () => {
    setMessages([]);
    setError(null);
    stopSpeaking();
    
    if (typingIntervalRef.current) {
      clearTimeout(typingIntervalRef.current);
    }
    setIsTyping(false);
    
    try {
      await fetch('http://localhost:5000/api/clear', { method: 'POST' });
    } catch (error) {
      console.error('Error clearing:', error);
    }
  };

  const testMicrophone = async () => {
    try {
      setError(null);
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } 
      });
      
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      let maxLevel = 0;
      let checkCount = 0;
      
      const checkLevel = () => {
        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        maxLevel = Math.max(maxLevel, average);
        checkCount++;
        
        setAudioLevel(average / 128);
        
        if (checkCount >= 30) {
          stream.getTracks().forEach(track => track.stop());
          audioContext.close();
          setAudioLevel(0);
          
          if (maxLevel > 10) {
            alert(`✅ Microphone working! Level: ${Math.round(maxLevel)}`);
          } else {
            alert(`⚠️ Low microphone level: ${Math.round(maxLevel)}`);
          }
        } else {
          setTimeout(checkLevel, 100);
        }
      };
      
      alert('Testing microphone...\n\nSpeak now for 3 seconds!');
      checkLevel();
      
    } catch (err) {
      alert('Microphone test failed!');
      setError('Microphone test failed');
    }
  };

  const userMessages = messages.filter(m => m.role === 'user');
  const assistantMessages = messages.filter(m => m.role === 'assistant');

  return (
    <div className="app-container">
      <div className="audiosphere-background">
        <AudioSphere audioLevel={audioLevel} isSpeaking={isSpeaking} />
      </div>

      {error && <div className="error-banner">⚠️ {error}</div>}
      {interimText && <div className="interim-banner">Listening: "{interimText}"</div>}

      <div className="left-panel">
        <div className="panel-header">
          <h3>ELARA</h3>
        </div>
        <div className="messages-container" ref={leftMessagesRef}>
          {assistantMessages.length === 0 && (
            <div className="empty-state">
              {/* <p>Hello! I'm ELARA.</p>
              <p className="empty-hint">Ask me anything about NextGen Supercomputing Club!</p> */}
            </div>
          )}
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
          className={`control-btn mic-btn ${isListening ? 'listening' : ''}`}
          onClick={isListening ? stopListening : startListening}
          disabled={isSpeaking || isTyping}
          title="Voice Input"
        >
          <MicIcon />
        </button>
        
        <button 
          className="control-btn restart-btn"
          onClick={clearConversation}
          title="Restart"
        >
          <RestartIcon />
        </button>
        
        <button 
          className="control-btn test-btn"
          onClick={testMicrophone}
          title="Test Microphone"
        >
          <TestMicIcon />
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

export default App;
