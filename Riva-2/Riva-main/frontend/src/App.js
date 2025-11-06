// // App.js - FIXED VERSION with Better AudioSphere Animation
// import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
// import ReactMarkdown from 'react-markdown';
// import './App.css';
// import AudioSphere from './components/AudioSphere';

// // ICON COMPONENTS
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

// const ContinuousIcon = () => (
//   <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//     <circle cx="12" cy="12" r="10"/>
//     <polyline points="12 6 12 12 16 14"/>
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
//   const [isTyping, setIsTyping] = useState(false);
//   const [continuousMode, setContinuousMode] = useState(false);
  
//   const recognitionRef = useRef(null);
//   const audioIntervalRef = useRef(null);
//   const leftMessagesRef = useRef(null);
//   const rightMessagesRef = useRef(null);
//   const typingIntervalRef = useRef(null);
//   const ttsInitializedRef = useRef(false);
//   const isAISpeakingRef = useRef(false);
//   const lastUserInputRef = useRef(Date.now());
//   const speechPhaseRef = useRef(0); // For audio animation

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

//   // ✨ TYPEWRITER EFFECT FUNCTION
//   const typewriterEffect = useCallback((fullText, callback) => {
//     let currentIndex = 0;
//     setIsTyping(true);

//     setMessages(prev => [...prev, { role: 'assistant', content: '', isTyping: true }]);

//     const typeNextChar = () => {
//       if (currentIndex < fullText.length) {
//         currentIndex++;

//         setMessages(prev => {
//           const newMessages = [...prev];
//           const lastIndex = newMessages.length - 1;
//           newMessages[lastIndex] = {
//             ...newMessages[lastIndex],
//             content: fullText.substring(0, currentIndex)
//           };
//           return newMessages;
//         });

//         scrollToBottom(leftMessagesRef);

//         const delay = Math.random() * 15 + 15;
//         typingIntervalRef.current = setTimeout(typeNextChar, delay);
//       } else {
//         setMessages(prev => {
//           const newMessages = [...prev];
//           const lastIndex = newMessages.length - 1;
//           newMessages[lastIndex] = {
//             ...newMessages[lastIndex],
//             isTyping: false
//           };
//           return newMessages;
//         });
//         setIsTyping(false);
//         if (callback) callback();
//       }
//     };

//     typeNextChar();
//   }, []);

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
//         typewriterEffect(data.response);
//         await speak(data.response);
//       } else {
//         throw new Error(data.error);
//       }
//     } catch (error) {
//       console.error('❌ Backend error:', error);
//       const errorMessage = 'Sorry, I encountered an error connecting to the server.';
//       typewriterEffect(errorMessage);
//     }
//   }, [inputText, typewriterEffect]);

//   useEffect(() => {
//     if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
//       const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
//       recognitionRef.current = new SpeechRecognition();
//       recognitionRef.current.continuous = false;
//       recognitionRef.current.interimResults = true;
//       recognitionRef.current.lang = 'en-US';

//       recognitionRef.current.onresult = (event) => {
//         if (isAISpeakingRef.current) {
//           console.log('🚫 Ignoring input - AI is speaking');
//           return;
//         }

//         const timeSinceLastInput = Date.now() - lastUserInputRef.current;
//         if (timeSinceLastInput < 2000) {
//           console.log('🚫 Ignoring input - too soon after AI speech');
//           return;
//         }

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
//           console.log('✅ Valid user input detected:', finalTranscript);
//           lastUserInputRef.current = Date.now();
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

//   // ✨ IMPROVED SPEAK FUNCTION with Better Audio Levels
//   const speak = async (text) => {
//     if (isSpeaking) stopSpeaking();

//     isAISpeakingRef.current = true;
//     console.log('🔴 AI SPEAKING MODE ACTIVATED');

//     if (recognitionRef.current) {
//       try {
//         recognitionRef.current.abort();
//         setIsListening(false);
//         console.log('🛑 FORCE STOPPED listening (AI speaking)');
//       } catch (err) {
//         console.log('⚠️ Could not stop recognition:', err);
//       }
//     }

//     let cleanText = text;
//     cleanText = cleanText.replace(/[\u{1F300}-\u{1F9FF}]/gu, '');
//     cleanText = cleanText.replace(/[\u{1F600}-\u{1F64F}]/gu, '');
//     cleanText = cleanText.replace(/[\u{1F680}-\u{1F6FF}]/gu, '');
//     cleanText = cleanText.replace(/\*\*(.+?)\*\*/g, '$1');
//     cleanText = cleanText.replace(/\*(.+?)\*/g, '$1');
//     cleanText = cleanText.replace(/^#+\s+/gm, '');
//     cleanText = cleanText.replace(/``````/g, '');
//     cleanText = cleanText.replace(/`([^`]+)`/g, '$1');
//     cleanText = cleanText.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
//     cleanText = cleanText.replace(/^[\s]*[•\-\*]\s+/gm, '');
//     cleanText = cleanText.replace(/^\d+\.\s+/gm, '');
//     cleanText = cleanText.replace(/[_~|\\<>{}[\]]/g, '');
//     cleanText = cleanText.replace(/\s+/g, ' ').trim();
    
//     if (!cleanText) {
//       console.log('⚠️ No text to speak');
//       isAISpeakingRef.current = false;
//       return;
//     }

//     console.log('🎤 Speaking:', cleanText.substring(0, 50) + '...');

//     setIsSpeaking(true);

//     try {
//       const utterance = new SpeechSynthesisUtterance(cleanText);
//       utterance.rate = 0.95;
//       utterance.pitch = 1.15;
//       utterance.volume = 1.0;
//       utterance.lang = 'en-IN';

//       const getVoices = () => {
//         return new Promise((resolve) => {
//           let voices = window.speechSynthesis.getVoices();
//           if (voices.length) {
//             resolve(voices);
//           } else {
//             window.speechSynthesis.onvoiceschanged = () => {
//               voices = window.speechSynthesis.getVoices();
//               resolve(voices);
//             };
//           }
//         });
//       };

//       const voices = await getVoices();
//       console.log('🔊 Available voices:', voices.length);
      
//       const femaleVoice = voices.find(v => 
//         v.lang.includes('en-IN') && (v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('woman'))
//       ) || voices.find(v => v.lang.includes('en-IN')) || voices.find(v => v.lang.includes('en-'));
      
//       if (femaleVoice) {
//         utterance.voice = femaleVoice;
//         console.log('🎤 Using voice:', femaleVoice.name, femaleVoice.lang);
//       }

//       // 🎨 DRAMATICALLY IMPROVED AUDIO LEVEL SIMULATION
//       const simulateAudioLevel = () => {
//         speechPhaseRef.current += 0.2; // Faster phase for more visible changes
        
//         // Create dramatic, speech-like variations
//         const baseLevel = 0.5 + Math.random() * 0.4; // 0.5 to 0.9
//         const wave1 = Math.sin(speechPhaseRef.current) * 0.3;
//         const wave2 = Math.sin(speechPhaseRef.current * 2.5) * 0.2;
//         const wave3 = Math.cos(speechPhaseRef.current * 1.3) * 0.15;
        
//         // Add random spikes to simulate consonants and emphasis
//         const randomSpike = Math.random() > 0.6 ? Math.random() * 0.4 : 0;
        
//         const targetLevel = Math.max(0.4, Math.min(1.0, baseLevel + wave1 + wave2 + wave3 + randomSpike));
        
//         // Smooth but responsive transition
//         setAudioLevel(prev => prev + (targetLevel - prev) * 0.3);
//       };

//       audioIntervalRef.current = setInterval(simulateAudioLevel, 40); // Faster updates

//       return new Promise((resolve) => {
//         utterance.onend = () => {
//           if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
          
//           // Smooth fade out
//           let currentLevel = audioLevel;
//           const fadeOut = setInterval(() => {
//             currentLevel *= 0.7;
//             setAudioLevel(currentLevel);
//             if (currentLevel < 0.05) {
//               clearInterval(fadeOut);
//               setAudioLevel(0);
//             }
//           }, 50);
          
//           setIsSpeaking(false);
//           isAISpeakingRef.current = false;
//           console.log('🟢 AI SPEAKING MODE DEACTIVATED');
          
//           resolve();
//         };

//         utterance.onerror = (e) => {
//           console.error('❌ TTS Error:', e);
//           if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
//           setIsSpeaking(false);
//           setAudioLevel(0);
//           isAISpeakingRef.current = false;
//           resolve();
//         };

//         utterance.onstart = () => {
//           console.log('✅ Speech started');
//           setAudioLevel(0.6); // Start with visible pulse
//           speechPhaseRef.current = 0; // Reset phase
//         };

//         window.speechSynthesis.cancel();
//         window.speechSynthesis.speak(utterance);
//       });

//     } catch (error) {
//       console.error('Speech error:', error);
//       if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
//       setIsSpeaking(false);
//       setAudioLevel(0);
//       isAISpeakingRef.current = false;
//     }
//   };

//   const stopSpeaking = () => {
//     window.speechSynthesis.cancel();
//     if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
//     setIsSpeaking(false);
//     setAudioLevel(0);
//   };

//   const startListening = useCallback(() => {
//     if (recognitionRef.current && !isListening && continuousMode) {
//       try {
//         setIsListening(true);
//         setError(null);
//         recognitionRef.current.start();
//       } catch (err) {
//         setIsListening(false);
//       }
//     }
//   }, [isListening, continuousMode]);

//   const toggleContinuousMode = () => {
//     if (!ttsInitializedRef.current) {
//       const utterance = new SpeechSynthesisUtterance('');
//       window.speechSynthesis.speak(utterance);
//       ttsInitializedRef.current = true;
//       console.log('✅ TTS initialized');
//     }
    
//     const newMode = !continuousMode;
//     setContinuousMode(newMode);
    
//     if (newMode) {
//       if (recognitionRef.current && !isListening) {
//         try {
//           setIsListening(true);
//           setError(null);
//           recognitionRef.current.start();
//         } catch (err) {
//           setIsListening(false);
//         }
//       }
//     } else {
//       if (recognitionRef.current && isListening) {
//         recognitionRef.current.stop();
//         setIsListening(false);
//       }
//     }
//   };

//   useEffect(() => {
//     if (continuousMode && !isListening && !isSpeaking && !isTyping && !isAISpeakingRef.current) {
//       const timer = setTimeout(() => {
//         console.log('⏰ Restarting listening after delay');
//         startListening();
//       }, 2000);
//       return () => clearTimeout(timer);
//     }
//   }, [continuousMode, isListening, isSpeaking, isTyping, startListening]);

//   const clearConversation = async () => {
//     if (!ttsInitializedRef.current) {
//       const utterance = new SpeechSynthesisUtterance('');
//       window.speechSynthesis.speak(utterance);
//       ttsInitializedRef.current = true;
//       console.log('✅ TTS initialized');
//     }
    
//     setMessages([]);
//     setError(null);
//     stopSpeaking();
    
//     if (typingIntervalRef.current) {
//       clearTimeout(typingIntervalRef.current);
//     }
//     setIsTyping(false);
    
//     try {
//       await fetch('http://localhost:5000/api/clear', { method: 'POST' });
//     } catch (error) {
//       console.error('Error clearing:', error);
//     }
//   };

//   const testMicrophone = async () => {
//     if (!ttsInitializedRef.current) {
//       const utterance = new SpeechSynthesisUtterance('');
//       window.speechSynthesis.speak(utterance);
//       ttsInitializedRef.current = true;
//       console.log('✅ TTS initialized');
//     }
    
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

//   const userMessages = useMemo(() => messages.filter(m => m.role === 'user'), [messages]);
//   const assistantMessages = useMemo(() => messages.filter(m => m.role === 'assistant'), [messages]);

//   // Memoize AudioSphere to prevent re-initialization
//   const audioSphereComponent = useMemo(() => (
//     <AudioSphere audioLevel={audioLevel} isSpeaking={isSpeaking} />
//   ), [audioLevel, isSpeaking]);

//   return (
//     <div className="app-container">
//       <div className="audiosphere-background">
//         {audioSphereComponent}
//       </div>

//       {error && <div className="error-banner">⚠️ {error}</div>}
//       {interimText && <div className="interim-banner">Listening: "{interimText}"</div>}
//       {continuousMode && <div className="continuous-banner">🔄 Continuous Mode Active</div>}

//       <div className="left-panel">
//         <div className="panel-header">
//           <h3>RIVA</h3>
//         </div>
//         <div className="messages-container" ref={leftMessagesRef}>
//           {assistantMessages.length === 0 && (
//             <div className="empty-state">
//               {/* Empty state placeholder */}
//             </div>
//           )}
//           {assistantMessages.map((msg, idx) => (
//             <div key={idx} className="message-bubble ai-message">
//               <ReactMarkdown>{msg.content}</ReactMarkdown>
//               {msg.isTyping && <span className="typing-cursor">▌</span>}
//             </div>
//           ))}
//         </div>
//       </div>

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

//       <div className="center-controls">
//         <button 
//           className={`control-btn continuous-btn ${continuousMode ? 'active' : ''}`}
//           onClick={toggleContinuousMode}
//           disabled={isSpeaking || isTyping}
//           title="Continuous Mode"
//         >
//           <ContinuousIcon />
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

//       <div className="horizontal-input-container">
//         <textarea
//           value={inputText}
//           onChange={(e) => setInputText(e.target.value)}
//           onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
//           placeholder={isListening ? "Listening..." : "Type your message..."}
//           disabled={isSpeaking || isTyping}
//           rows={1}
//         />
//         <button 
//           onClick={() => handleSendMessage()}
//           disabled={!inputText.trim() || isListening || isSpeaking || isTyping}
//           className="send-btn-horizontal"
//         >
//           <SendIcon />
//         </button>
//       </div>
//     </div>
//   );
// }

// export default App;
// App.js - MODIFIED VERSION with Mic Button (No Continuous Mode)
// App.js - COMPLETE VERSION with FIXED FEMALE VOICE
import React, { useState } from 'react';
import Showcase from './components/Showcase';
import RivaChatbot from './components/RivaChatbot';
import FaceRecognition from './components/FaceRecognition';
import './App.css';

const App = () => {
  const [showFaceRecognition, setShowFaceRecognition] = useState(true);
  const [showShowcase, setShowShowcase] = useState(false);
  const [showChatbot, setShowChatbot] = useState(false);

  const handleFaceRecognitionComplete = () => {
    console.log('✅ Face recognition completed, transitioning to showcase');
    setShowFaceRecognition(false);
    setTimeout(() => {
      setShowShowcase(true);
    }, 500);
  };

  const handleShowcaseComplete = () => {
    console.log('✅ Showcase completed, transitioning to Q&A chatbot');
    setShowShowcase(false);
    setTimeout(() => {
      setShowChatbot(true);
    }, 500);
  };

  const teachers = [
    {
      name: 'Shreya Jain',
      topic: 'Clubs & Activities',
      photo: '/butki.jpg',
      color: '#ffffff',
      script: `A very good morning to one and all present here!

Respected Director, Director Academics, Director CRPC, Dean CSE (A I & AIML), esteemed faculty members, and my fellow innovators —

I am Shreya Jain, President of the NextGen Supercomputing Club, and it gives me immense pleasure to welcome you all to this moment of pride and innovation. 🌟

💡 The NextGen Supercomputing Club stands as a symbol of progress — a space where technology, creativity, and research come together.
Our vision is to empower students to become industry-ready AI engineers capable of developing real-world, production-level solutions. 🚀

🔭 Guided by our motto, ‘Building Production Brains,’ this club marks a new beginning in hands-on AI learning and innovation.

At the heart of our initiative lies one of the most powerful computing systems on campus — the NVIDIA DGX A100 Supercomputer, a platform designed to accelerate breakthroughs in Artificial Intelligence, Machine Learning, and High-Performance Computing. ⚙️💻

👥 Behind this vision is a dedicated team of passionate members —
Samarth Shukla (Vice President),
Ujjawal Tyagi (PR Head),
Preeti Singh (Graphics Head),
Srashti Gupta and Vidisha Goel (Event Management Leads),
Ronak Goel and Vinayak Rastogi (Technical Leads), and
Divyansh Verma (Treasurer). 🎯

Together, we work under the valuable guidance of our Dean, Dr. Rekha Kashyap, and with the mentorship of Dr. Richa Singh, Dr. Gaurav Srivastav, Mr. Bikki Kumar, and Dr. Rajeev Singh, supported by our respected seniors Aayushker Singh and Swatantra Agarwal. 🙌🎓

💫 To share more about the powerhouse that drives this journey of innovation, I would now like to invite Dr. Richa Singh ma’am to enlighten us further. 🌹`
    },
    {
      name: 'Dr. Richa Singh',
      topic: 'College Projects',
      photo: '/richa madam.jpg',
      color: '#ffffff',
      script: `The NVIDIA DGX A100 Supercomputer is not just a technological advancement — it’s a foundation for innovation and learning. 🌟
It provides our students and faculty with access to one of the most powerful AI infrastructures in academia. 🧠

With 8 NVIDIA Tensor Core GPUs, 1 TB system memory, and an AI performance of 5 PetaFLOPS, this system enables us to train massive deep learning models, process complex datasets, and simulate scientific environments with remarkable efficiency. ⚡

Through this facility, we are not only enhancing computational capability but also nurturing research, innovation, and collaboration.
Our students are exploring advanced domains like Generative AI, Computer Vision, and Data Analytics, developing the skills and mindset needed for the future. 📊

🎓 To share how our students are leveraging this system through live projects and collaborations, I now invite Rajeev Sir. ✨`
    },
    {
      name: 'Dr. Rajeev Singh',
      topic: 'Department Objectives',
      photo: '/rajeev sir.jpg',
      color: '#ffffff',
      script: `The NextGen Supercomputing Club is a remarkable initiative that unites innovation, mentorship, and exploration — a true reflection of how collaboration fuels progress. 🤝💡

🚀 Moving forward, the club will focus on integrating High-Performance Computing, Quantum Simulation, and Artificial Intelligence into research and development activities.
We also aim to establish collaborations with industries, research labs, and academic institutions to bridge learning with real-world impact. 🔬

Each initiative here is a step toward creating a community that doesn’t just learn technology — but uses it to lead, innovate, and inspire. 💻✨

With the passion of our students and the collective guidance of all mentors, I am confident that the NextGen Supercomputing Club will continue to achieve new milestones and set higher standards in AI research and innovation. 🎯🏆`
    },
    {
      name: 'Dr. Gaurav Srivastav',
      topic: 'ETD & Training',
      photo: '/gaurav sir.jpg',
      color: '#ffffff',
      script: `The NextGen Supercomputing Club is a living example of how learning becomes impactful when combined with real-world applications. 🌍✨
Our students are engaged in diverse projects, integrating AI with innovation to create meaningful outcomes. 🤖💭

A few notable ones include:

🔹 A Resume Recommender System in collaboration with Opinium.AI, aligning student profiles with ideal job roles. 

🔹 A Real-Time Image-to-Avatar Swapping System with Epsilon Pvt. Ltd., applying deep learning to bring human–machine creativity together. 

🔹 A High-Performance Computing Framework with MetaUp Space, exploring large-scale parallel processing for faster and smarter computation. 

🔹 An Exploration and Extension of the RoboCasa Simulation Framework with AI Shala Technologies, aimed at intelligent robotic learning. 

Beyond these collaborations, our students have also initiated their own innovative ideas in Generative AI, Computer Vision, and Speech Recognition, turning classroom concepts into practical, production-level projects. 💻🎯

Every experiment, every line of code, and every project here brings us closer to our vision — “Building Production Brains.” 💫`
    }
  ];

return (
  <>
    {showFaceRecognition && (
      <FaceRecognition onComplete={handleFaceRecognitionComplete} />
    )}
    {showShowcase && (
      <Showcase teachers={teachers} onComplete={handleShowcaseComplete} autoStart={true} />
    )}
    {showChatbot && (
      <RivaChatbot />
    )}
  </>
);

};

export default App;
