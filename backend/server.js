// server.js - ELARA: General Purpose AI + Club Expert
const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`📝 ${req.method} ${req.url}`);
  next();
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM';
const ELEVENLABS_MODEL_ID = 'eleven_multilingual_v2';

console.log('🔑 Gemini API Key loaded:', process.env.GEMINI_API_KEY ? '✅' : '❌');
console.log('🔑 ElevenLabs API Key loaded:', ELEVENLABS_API_KEY ? '✅' : '❌');
console.log('🎙️ ElevenLabs Voice ID:', ELEVENLABS_VOICE_ID);

let conversationHistory = [];

// ===============================================
// 🎓 COMPLETE KNOWLEDGE BASE - ALL QUESTIONS & ANSWERS
// ===============================================
const CLUB_KNOWLEDGE = `
# 🧠 NextGen Supercomputing Club - Complete Knowledge Base

## 💫 Club Introduction
Welcome to the NextGen Supercomputing Club — a forward-thinking community at the forefront of High-Performance Computing (HPC), Artificial Intelligence (AI), and Quantum Computing innovation.

Our mission is to build production-ready Machine Learning engineers through hands-on experience, collaboration, and cutting-edge computational projects.

We aim to bridge the gap between academic learning and real-world AI applications, empowering students to solve industry-level challenges using advanced computing technologies.

Join us to explore GPU clusters, exascale computing, AI-driven simulations, and quantum research — and be part of the next generation of computational innovators.

## 🏷 Tagline
"Building Production Brains"

## 💡 Motto
To create production-ready ML engineers who can design, deploy, and scale real-world AI solutions.

## 🧩 About Us
- **Founded**: 2025
- **Vision**: To build a community of industry-ready innovators who can translate theoretical knowledge into real-world AI and HPC solutions. Our vision is to enable students to leverage supercomputing capabilities—like the NVIDIA DGX A100—to work on production-scale projects, drive innovation, and make a tangible impact in the tech industry.
- **Mission**: To empower students to become production-ready Machine Learning engineers through hands-on learning, real-world problem solving, and exposure to cutting-edge technologies such as High-Performance Computing (HPC), Artificial Intelligence (AI), and Quantum Computing. We aim to bridge the gap between academic knowledge and industry practices by organizing bootcamps, hackathons, workshops, and collaborative research projects.

## Focus Areas
- High-Performance Computing (HPC)
- Artificial Intelligence and Machine Learning
- Quantum Simulation and Computing
- GPU and Parallel Programming
- Cloud HPC and AI Deployment
- Model Optimization and Scalability

## Resources
- **Hardware**: NVIDIA DGX A100 Supercomputer – enabling large-scale AI training and scientific simulations
- **Software Stack**: CUDA, MPI, PyTorch, TensorFlow, OpenMPI, and other open-source HPC tools
- **Infrastructure**: Cloud HPC platforms for experimentation and learning

## 🎯 Objectives
1. Cultivate a generation of industry-ready ML engineers
2. Offer hands-on training through bootcamps, hackathons, workshops, and an annual AI Summit
3. Encourage students to develop and deploy real-world AI and HPC projects
4. Foster partnerships with research labs, industry leaders, and academic mentors
5. Promote open-source collaboration and computational research on campus

## ⚙ What We Do
The NextGen Supercomputing Club organizes diverse activities that merge learning with innovation:

- 💻 **Workshops & Bootcamps**: Focused on Python for HPC, Deep Learning, Quantum Computing, and Parallel Programming using CUDA and MPI
- ⚡ **Hackathons**: Problem-solving competitions centered around AI, HPC, and data-driven innovation
- 🧠 **NextGen AI Summit (Annual Flagship Event)**: A high-impact event featuring industry speakers, live demos, and project showcases
- 🚀 **Project Incubation**: Members can propose and develop projects under guidance when needed, using real hardware and industry frameworks
- 🎓 **Skill Development Series**: Short, practical learning sessions to upskill members in AI, HPC, and cloud deployment
- 🤝 **Collaborations**: Partnerships with startups, universities, and NVIDIA's academic programs for research and technical exposure

## 👥 Members & Team Structure
- **President** – Shreya Jain: Leads the club's direction and strategic initiatives
- **Vice President** – Samarth Shukla: Oversees operations, collaborations, and event execution
- **PR Head** – Ujjawal Tyagi: Manages public relations, outreach, and communication
- **Graphics Head** – Preeti Singh: Designs creative visuals, posters, and media content
- **Event Management Leads** – Srashti Gupta & Vidisha Goel: Handle logistics, coordination, and event planning
- **Technical Leads** – Ronak Goel & Vinayak Rastogi: Guide members through technical projects, workshops, and infrastructure setup
- **Treasurer** – Divyansh Verma: Manages finances, budgeting, and sponsorships

## 👨‍🏫 MENTORS & LEADERSHIP

### Club Mentors (3 Expert Faculty)
**Dr. Gaurav Srivastav**: AI researcher, educator, and author with 12+ years of experience. Assistant Professor at KIET Ghaziabad. Ph.D. from Sharda University (2024). Published 20+ research papers. Expertise: Generative AI, BERT-enabled learning models, data-driven educational systems.

**Dr. Richa Singh**: Assistant Professor (Research) in CSE Department at KIET, specializing in AI/ML and Data Science. Ph.D. in IT from Amity University, Lucknow. Awards: Young Research Award, Young Dronacharya Award. Infosys-certified faculty, keynote speaker, and jury member at NIFT.

**Dr. Bikki Kumar**: AI and Data Science professional at Drifko. M.Tech in Data Science from DTU, B.Tech in IT from NIT Srinagar. Expertise: LLMs, RAG systems, and workflow optimization.

### Department & College Leadership
**Dr. Rekha Kashyap**: Dean & Head of AI/ML Department. 30 years of experience. Ph.D. from JNU. Former Professor & Dean at NIET. Member of IEEE, CSI, ACM, ISTE, IAENG.

**Dr. Manoj Goel**: Executive Director of KIET. Provides visionary leadership to the entire institution.

**Dr. Adesh Kumar Pandey**: Director Academics. Oversees academic policies and curriculum across all departments.

## ⚡ Fun Facts
- The Frontier Supercomputer (USA) performs 1.1 exaFLOPS, 1,000× faster than a premium laptop
- Supercomputers helped accelerate COVID-19 vaccine research through protein simulations
- Our NVIDIA DGX A100 can train neural networks 10× faster than a standard GPU
- HPC powers breakthroughs in AI, medicine, astrophysics, and robotics
`;

function isInaugurationRequest(message) {
  const lowerMessage = message.toLowerCase();
  const triggers = [
    'inauguration',
    'start our inauguration',
    'begin inauguration',
    'inauguration ceremony',
    'welcome speech',
    'introduction to the club',
    'tell me about the club',
    'club introduction',
    'start inauguration',
    'can we start',
    'begin the ceremony'
  ];
  
  return triggers.some(trigger => lowerMessage.includes(trigger));
}

// ===============================================
// ✅ CHAT ENDPOINT - WORKS LIKE CHATGPT
// ===============================================
app.post('/api/chat', async (req, res) => {
  console.log('📨 Chat request received');
  
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Check if inauguration is requested
    if (isInaugurationRequest(message)) {
      console.log('🎉 Inauguration trigger detected!');
      
      conversationHistory.push(
        { role: 'user', content: message },
        { role: 'assistant', content: CLUB_KNOWLEDGE }
      );

      return res.json({
        response: CLUB_KNOWLEDGE,
        success: true,
        isInauguration: true
      });
    }

    // Regular chat with Gemini - LIKE CHATGPT
    console.log('🤖 Calling Gemini API...');

    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        temperature: 0.9,
        topP: 1,
        topK: 40,
        maxOutputTokens: 2048,
      },
    });

    const chat = model.startChat({
      history: [
        {
          role: 'user',
          parts: [{ text: `You are ELARA, a female AI assistant for the NextGen Supercomputing Club at KIET Group of Institutions.

**YOUR PRIMARY ROLE:**
You are a general-purpose AI assistant (like ChatGPT) who can answer ANY question about ANY topic - science, technology, celebrities, history, current events, coding, math, entertainment, sports, etc.

**YOUR SPECIAL EXPERTISE:**
You ALSO have specialized knowledge about the NextGen Supercomputing Club. When users ask club-related questions, you can provide detailed answers using this knowledge base:

${CLUB_KNOWLEDGE}

**HOW TO RESPOND:**
- For GENERAL questions (like "Who is Salman Khan?", "What is Python?", "Explain quantum mechanics"): Answer normally using your vast general knowledge
- For CLUB questions (like "Who are the mentors?", "What does the club do?"): Use the knowledge base above
- Be friendly, conversational, and helpful
- Keep responses concise unless asked for details
- Use markdown formatting and occasional emojis
- You can discuss ANY topic - technology, entertainment, science, culture, etc.

**IMPORTANT:** Don't limit yourself to only club topics. You're a full-featured AI assistant who happens to know a lot about the NextGen Supercomputing Club!` }]
        },
        {
          role: 'model',
          parts: [{ text: 'Understood! I am ELARA, your AI assistant. I can help you with ANY question - whether it\'s about celebrities, technology, science, coding, entertainment, or anything else! I also have specialized knowledge about the NextGen Supercomputing Club at KIET, including our team, mentors, and the NVIDIA DGX A100 supercomputer. Ask me anything! 🤖✨' }]
        },
        ...conversationHistory.map(msg => ({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }]
        }))
      ]
    });

    const result = await chat.sendMessage(message);
    const assistantMessage = result.response.text();

    console.log('✅ Gemini response received');

    conversationHistory.push(
      { role: 'user', content: message },
      { role: 'assistant', content: assistantMessage }
    );

    if (conversationHistory.length > 20) {
      conversationHistory = conversationHistory.slice(-20);
    }

    res.json({
      response: assistantMessage,
      success: true,
      isInauguration: false
    });

  } catch (error) {
    console.error('❌ Gemini Error:', error.message);
    res.status(500).json({
      error: 'Failed to get response',
      details: error.message
    });
  }
});

// ===============================================
// ✅ TTS ENDPOINT (for later with ElevenLabs)
// ===============================================
app.post('/api/tts', async (req, res) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'Text is required' });
  }

  if (!ELEVENLABS_API_KEY) {
    return res.status(500).json({ error: 'ElevenLabs API key not configured' });
  }

  try {
    console.log('🎤 Generating speech with ElevenLabs...');
    
    let cleanText = text;
    
    // Remove emojis
    cleanText = cleanText.replace(/[\u{1F300}-\u{1F9FF}]/gu, '');
    cleanText = cleanText.replace(/[\u{2600}-\u{26FF}]/gu, '');
    cleanText = cleanText.replace(/[\u{2700}-\u{27BF}]/gu, '');
    
    // Remove markdown
    cleanText = cleanText.replace(/\*\*(.+?)\*\*/g, '$1');
    cleanText = cleanText.replace(/\*(.+?)\*/g, '$1');
    cleanText = cleanText.replace(/^#+\s+/gm, '');
    cleanText = cleanText.replace(/``````/g, '');
    cleanText = cleanText.replace(/`([^`]+)`/g, '$1');
    cleanText = cleanText.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
    cleanText = cleanText.replace(/^[\s]*[•\-\*]\s+/gm, '');
    cleanText = cleanText.replace(/\s+/g, ' ').trim();
    
    const response = await axios({
      method: 'POST',
      url: `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`,
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY
      },
      data: {
        text: cleanText,
        model_id: ELEVENLABS_MODEL_ID,
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.0,
          use_speaker_boost: true
        }
      },
      responseType: 'arraybuffer'
    });

    console.log('✅ Audio generated successfully');

    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': response.data.length
    });
    res.send(Buffer.from(response.data));

  } catch (error) {
    console.error('❌ ElevenLabs Error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to generate speech' });
  }
});

app.post('/api/clear', (req, res) => {
  console.log('🗑️ Clearing conversation');
  conversationHistory = [];
  res.json({ success: true });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'ELARA - General Purpose AI + Club Expert',
    features: {
      generalChat: true,
      clubKnowledge: true,
      inaugurationTrigger: true,
      voiceSupport: true
    }
  });
});

app.listen(PORT, () => {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🚀 ELARA AI Server Running!`);
  console.log(`${'='.repeat(60)}`);
  console.log(`📍 Server: http://localhost:${PORT}`);
  console.log(`🤖 AI: Gemini 2.0 Flash (General Purpose)`);
  console.log(`🎓 Club Knowledge: Loaded ✅`);
  console.log(`🌍 Can answer ANY general question ✅`);

  console.log(`${'='.repeat(60)}\n`);
});
