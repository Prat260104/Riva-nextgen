import React, { useEffect, useState } from 'react';
import AvatarRing from './AvatarRing';
import FaceRecognition from './FaceRecognition';
import VoiceAssistant from './VoiceAssistant';
import './AvatarRing.css';

const AvatarDemo = () => {
  const [selectedAvatar, setSelectedAvatar] = useState('Alex'); // Default to Alex
  const [audioLevel, setAudioLevel] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const handleFaceRecognized = (name, confidence) => {
    console.log('🎯 handleFaceRecognized called!');
    console.log(`👤 Face recognized: ${name} (${(confidence * 100).toFixed(1)}%)`);
    
    // Map recognized names to avatars
    const avatarMap = {
      'Prateek': 'Alex',
      'Vinayak': 'Noah',
      'Shreya': 'Sia'
    };
    
    const avatarName = avatarMap[name] || name;
    console.log(`🎭 Mapped to avatar: ${avatarName}`);
    console.log(`🔄 Updating selectedAvatar state to: ${avatarName}`);
    setSelectedAvatar(avatarName);
    
    // Trigger avatar selection
    const event = new CustomEvent('voiceCommand', {
      detail: { command: avatarName }
    });
    console.log('📢 Dispatching voiceCommand event:', avatarName);
    window.dispatchEvent(event);
    console.log('✅ Event dispatched successfully');
  };



  return (
    <div className="avatar-demo">
      <FaceRecognition onRecognized={handleFaceRecognized} />
      <AvatarRing audioLevel={audioLevel} isSpeaking={isSpeaking} />
      <VoiceAssistant 
        activeAvatar={selectedAvatar}
        onAudioLevel={setAudioLevel}
        onSpeaking={setIsSpeaking}
      />
      

    </div>
  );
};

export default AvatarDemo;