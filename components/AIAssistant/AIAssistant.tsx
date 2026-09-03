'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import toast from 'react-hot-toast';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  isAudioPlaying?: boolean;
}

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hello! I am Winsi, your personal Winsor Brand Horology Concierge. How may I assist you with our timepieces today?'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [currentUtterance, setCurrentUtterance] = useState<SpeechSynthesisUtterance | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Close drop-up speed dial when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isMenuOpen &&
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  // Auto-focus input when chat window opens
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Pre-fetch SpeechSynthesis voices on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
  }, []);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognitionClass) {
      const rec = new SpeechRecognitionClass();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        toast.success('Speech recognized');
        setTimeout(() => inputRef.current?.focus(), 50);
      };

      rec.onerror = (event: any) => {
        if (event.error === 'no-speech' || event.error === 'aborted') {
          setIsListening(false);
          return;
        }

        console.error('Speech recognition error:', event.error, event);
        setIsListening(false);
        
        if (event.error === 'not-allowed') {
          toast.error('Microphone access denied. Please check browser permissions.');
          return;
        }
        toast.error('Voice input failed. Please try again.');
      };

      rec.onend = () => {
        setIsListening(false);
        setTimeout(() => inputRef.current?.focus(), 50);
      };

      recognitionRef.current = rec;
    }
  }, []);

  // Helper to select ultra-natural female/lady voice for Winsi AI (Gemini quality)
  const selectLadyVoice = (voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null => {
    if (!voices || voices.length === 0) return null;
    const enVoices = voices.filter(v => v.lang.startsWith('en'));
    const candidatePool = enVoices.length > 0 ? enVoices : voices;

    // Top priority natural/neural female voices across Chrome, Edge, Safari, iOS, Android, Windows
    const femalePriorityKeywords = [
      'google us english',
      'google uk english female',
      'google assistant',
      'microsoft aria online (natural)',
      'microsoft jenny online (natural)',
      'microsoft sonia online (natural)',
      'microsoft emma online (natural)',
      'microsoft zira',
      'samantha',
      'karen',
      'victoria',
      'fiona',
      'aria',
      'jenny',
      'zira',
      'female'
    ];

    // 1. Priority match for Natural / Neural / Google voices
    for (const kw of femalePriorityKeywords) {
      const found = candidatePool.find(v => {
        const name = v.name.toLowerCase();
        return name.includes(kw);
      });
      if (found) return found;
    }

    // 2. Fallback to any voice with 'female' in name
    const fallbackFemale = candidatePool.find(v => v.name.toLowerCase().includes('female'));
    if (fallbackFemale) return fallbackFemale;

    return candidatePool[0] || null;
  };

  // Clean Markdown formatting for clear natural voice reading
  const cleanTextForSpeech = (text: string): string => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/#(.*?)\n/g, '$1 ')
      .replace(/\[(.*?)\]\(.*?\)/g, '$1')
      .replace(/[`~]/g, '')
      .trim();
  };

  // Handle Speech Output (Text-To-Speech)
  const speakText = (rawText: string, messageIndex: number) => {
    if (!('speechSynthesis' in window)) {
      toast.error('Speech synthesis is not supported on this browser');
      return;
    }

    // Stop currently playing voice
    if (currentUtterance) {
      window.speechSynthesis.cancel();
      setMessages(prev => prev.map((msg, i) => i === messageIndex ? { ...msg, isAudioPlaying: false } : msg));
      setCurrentUtterance(null);
      return;
    }

    const cleanSpeechText = cleanTextForSpeech(rawText);

    // Create new speech utterance
    const utterance = new SpeechSynthesisUtterance(cleanSpeechText);
    
    // Select high-quality Female / Lady Voice for Winsi AI
    const voices = window.speechSynthesis.getVoices();
    const ladyVoice = selectLadyVoice(voices);
    if (ladyVoice) {
      utterance.voice = ladyVoice;
    }
    
    utterance.rate = 0.97; // Natural, unhurried speaking pace
    utterance.pitch = 1.06; // Smooth, warm natural female frequency

    utterance.onend = () => {
      setMessages(prev => prev.map((msg, i) => i === messageIndex ? { ...msg, isAudioPlaying: false } : msg));
      setCurrentUtterance(null);
    };

    utterance.onerror = () => {
      setMessages(prev => prev.map((msg, i) => i === messageIndex ? { ...msg, isAudioPlaying: false } : msg));
      setCurrentUtterance(null);
    };

    // Update message state to show audio is playing
    setMessages(prev => prev.map((msg, idx) => idx === messageIndex ? { ...msg, isAudioPlaying: true } : msg));
    setCurrentUtterance(utterance);
    
    window.speechSynthesis.speak(utterance);
  };

  // Toggle Voice Input Listening
  const toggleListening = () => {
    if (!recognitionRef.current) {
      toast.error('Speech recognition is not supported on this browser');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  // Submit Text Chat
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    const newMessages = [...messages, { role: 'user', content: userMessage } as Message];
    setMessages(newMessages);
    setLoading(true);

    // Keep focus on input immediately
    setTimeout(() => inputRef.current?.focus(), 10);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: newMessages }),
      });

      const data = await res.json();
      if (data.success && data.text) {
        const aiMessage = data.text;
        const finalMessages = [...newMessages, { role: 'assistant', content: aiMessage } as Message];
        setMessages(finalMessages);

        // Auto-speak response if Voice Mode is active
        if (voiceEnabled) {
          speakText(aiMessage, finalMessages.length - 1);
        }
      } else {
        throw new Error(data.error || 'Failed to generate response');
      }
    } catch (err: any) {
      console.error(err);
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Apologies, I encountered a connection issue. Please try again in a moment.' }
      ]);
    } finally {
      setLoading(false);
      // Re-focus text input so user can type next message without clicking!
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  return (
    <>
      <style>{`
        /* ── WIDGET FLOATING TRIGGER BUTTON ── */
        .ai-widget-trigger {
          position: fixed;
          right: 28px;
          bottom: 28px;
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: linear-gradient(135deg, #8b6914 0%, #1a1209 100%);
          border: 2px solid #8b6914;
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.28);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          cursor: pointer;
          z-index: 9990;
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .ai-widget-trigger:hover {
          transform: scale(1.08) translateY(-3px);
          box-shadow: 0 12px 35px rgba(139, 105, 20, 0.4);
        }
        .ai-widget-trigger svg {
          transition: transform 0.4s ease;
        }
        .ai-widget-trigger.open svg {
          transform: rotate(90deg) scale(0.9);
        }

        /* ── LUXURY PING RADAR ANIMATION ── */
        .ai-trigger-ping {
          position: absolute;
          inset: -3px;
          border-radius: 50%;
          border: 2px solid #8B6914;
          pointer-events: none;
          animation: wn-radar-ping 2.6s cubic-bezier(0.16, 0.8, 0.36, 1) infinite;
          opacity: 0;
          z-index: -1;
        }
        .ai-trigger-ping-subtle {
          position: absolute;
          inset: -3px;
          border-radius: 50%;
          border: 1.5px solid rgba(201, 161, 74, 0.6);
          pointer-events: none;
          animation: wn-radar-ping 2.6s cubic-bezier(0.16, 0.8, 0.36, 1) infinite;
          animation-delay: 0.9s;
          opacity: 0;
          z-index: -1;
        }

        @keyframes wn-radar-ping {
          0% {
            transform: scale(0.98);
            opacity: 0.8;
          }
          60% {
            opacity: 0.35;
          }
          100% {
            transform: scale(1.6);
            opacity: 0;
          }
        }

        /* ── CHAT PANEL WINDOW ── */
        .ai-chat-window {
          position: fixed;
          right: 20px;
          bottom: 20px;
          width: 350px;
          max-width: calc(100vw - 32px);
          height: min(490px, 72vh);
          background: rgba(250, 247, 240, 0.98);
          border: 1px solid rgba(139, 105, 20, 0.2);
          border-radius: 18px;
          box-shadow: 0 16px 48px rgba(26, 18, 9, 0.18);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          z-index: 9995;
          opacity: 0;
          transform: scale(0.95) translateY(20px);
          pointer-events: none;
          transition: all 0.4s cubic-bezier(0.25, 1, 0.5, 1);
        }
        .ai-chat-window.open {
          opacity: 1;
          transform: scale(1) translateY(0);
          pointer-events: auto;
        }

        /* ── DROP-UP SPEED DIAL CONCIERGE MENU ── */
        .wn-concierge-dropup {
          position: fixed;
          right: 28px;
          bottom: 96px;
          width: 260px;
          background: rgba(250, 247, 240, 0.98);
          border: 1px solid rgba(139, 105, 20, 0.25);
          border-radius: 18px;
          box-shadow: 0 20px 48px rgba(26, 18, 9, 0.22), 0 4px 14px rgba(139, 105, 20, 0.08);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          padding: 8px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          z-index: 9991;
          opacity: 0;
          transform: translateY(14px) scale(0.94);
          pointer-events: none;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .wn-concierge-dropup.open {
          opacity: 1;
          transform: translateY(0) scale(1);
          pointer-events: auto;
        }

        .wn-concierge-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 12px;
          border-radius: 12px;
          text-decoration: none;
          background: transparent;
          border: 1px solid transparent;
          cursor: pointer;
          width: 100%;
          box-sizing: border-box;
          transition: all 0.2s ease;
          text-align: left;
        }
        .wn-concierge-item:hover {
          background: rgba(26, 18, 9, 0.04);
          border-color: rgba(139, 105, 20, 0.15);
          transform: translateX(-2px);
        }
        .wn-concierge-item.whatsapp-item:hover {
          background: rgba(37, 211, 102, 0.08);
          border-color: rgba(37, 211, 102, 0.3);
        }
        .wn-concierge-item.ai-item:hover {
          background: rgba(139, 105, 20, 0.08);
          border-color: rgba(139, 105, 20, 0.3);
        }

        .ai-widget-trigger.menu-active {
          background: #1a1209;
          border-color: #8b6914;
        }

        /* ── HIDE AI WIDGET BEHIND MOBILE SIDEBAR DRAWER WHEN OPEN ── */
        body.wn-mobile-menu-open .ai-widget-trigger,
        body.wn-mobile-menu-open .ai-chat-window,
        body.wn-mobile-menu-open .wn-concierge-dropup {
          z-index: 100 !important;
          opacity: 0 !important;
          pointer-events: none !important;
          transform: translateY(20px) scale(0.9) !important;
          transition: opacity 0.3s ease, transform 0.3s ease, z-index 0.3s ease !important;
        }

        .ai-widget-trigger.open {
          opacity: 0;
          pointer-events: none;
          transform: scale(0.8) translateY(15px);
        }

        /* ── HEADER ── */
        .ai-chat-header {
          background: #1a1209;
          color: #fff;
          padding: 14px 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid rgba(139,105,20,0.25);
        }

        .ai-voice-toggle-btn {
          background: transparent;
          border: 1px solid rgba(255,255,255,0.15);
          border-radius: 6px;
          color: rgba(255,255,255,0.7);
          padding: 4px 8px;
          font-size: 9.5px;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .ai-voice-toggle-btn.active {
          background: rgba(139,105,20,0.2);
          border-color: #8b6914;
          color: #c9a14a;
        }

        .ai-chat-close-btn {
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.6);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 6px;
          border-radius: 50%;
          transition: all 0.2s;
        }
        .ai-chat-close-btn:hover {
          background: rgba(255, 255, 255, 0.15);
          color: #fff;
        }

        /* ── MESSAGE CONTAINER ── */
        .ai-chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          scrollbar-width: thin;
        }
        .ai-msg-bubble {
          max-width: 82%;
          padding: 12px 16px;
          font-family: 'Jost', sans-serif;
          font-size: 13px;
          line-height: 1.5;
          border-radius: 14px;
          position: relative;
        }
        .ai-msg-bubble.user {
          align-self: flex-end;
          background: #1a1209;
          color: #fff;
          border-bottom-right-radius: 2px;
        }
        .ai-msg-bubble.assistant {
          align-self: flex-start;
          background: #fff;
          color: #1a1209;
          border: 1px solid rgba(26,18,9,0.08);
          border-bottom-left-radius: 2px;
          box-shadow: 0 4px 14px rgba(26,18,9,0.04);
        }

        /* Speak Audio controls */
        .ai-msg-speak-btn {
          position: absolute;
          right: -24px;
          bottom: 2px;
          background: transparent;
          border: none;
          color: rgba(26,18,9,0.35);
          cursor: pointer;
          display: flex;
          align-items: center;
          padding: 4px;
          transition: color 0.2s;
        }
        .ai-msg-speak-btn:hover {
          color: #8b6914;
        }
        .ai-msg-speak-btn.playing {
          color: #8b6914;
          animation: audio-pulse 1.2s infinite ease-in-out;
        }
        @keyframes audio-pulse {
          0%, 100% { opacity: 0.6; transform: scale(0.95); }
          50% { opacity: 1; transform: scale(1.1); }
        }

        /* ── TYPING INDICATOR ── */
        .ai-typing-loader {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 4px 8px;
        }
        .ai-typing-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: rgba(26,18,9,0.4);
          animation: typing-dot 1.2s infinite ease-in-out;
        }
        .ai-typing-dot:nth-child(2) { animation-delay: 0.2s; }
        .ai-typing-dot:nth-child(3) { animation-delay: 0.4s; }
        @keyframes typing-dot {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }

        /* ── FORM INPUT ── */
        .ai-chat-input-form {
          border-top: 1px solid rgba(26, 18, 9, 0.08);
          padding: 14px;
          background: #fff;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .ai-chat-input {
          flex: 1;
          height: 40px;
          border: 1px solid rgba(26, 18, 9, 0.12);
          border-radius: 10px;
          padding: 0 14px;
          font-family: 'Jost', sans-serif;
          font-size: 13px;
          color: #1a1209;
          outline: none;
          background: #faf7f0;
          transition: border-color 0.2s;
        }
        .ai-chat-input:focus {
          border-color: #8b6914;
          background: #fff;
        }
        .ai-mic-btn {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: 1px solid rgba(26, 18, 9, 0.1);
          background: transparent;
          color: rgba(26, 18, 9, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }
        .ai-mic-btn:hover {
          color: #8b6914;
          border-color: #8b6914;
          background: rgba(139,105,20,0.05);
        }
        .ai-mic-btn.listening {
          background: #ffebeb;
          border-color: #ff3b30;
          color: #ff3b30;
          animation: mic-pulse 1.4s infinite ease-in-out;
        }
        @keyframes mic-pulse {
          0% { box-shadow: 0 0 0 0 rgba(255, 59, 48, 0.25); }
          70% { box-shadow: 0 0 0 10px rgba(255, 59, 48, 0); }
          100% { box-shadow: 0 0 0 0 rgba(255, 59, 48, 0); }
        }

        .ai-send-btn {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: none;
          background: #1a1209;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }
        .ai-send-btn:hover:not(:disabled) {
          background: #8b6914;
        }
        .ai-send-btn:disabled {
          background: rgba(26,18,9,0.15);
          color: rgba(26,18,9,0.3);
          cursor: not-allowed;
        }

        /* ── RESPONSIVE MOBILE WINDOW ── */
        @media (max-width: 580px) {
          .ai-chat-window {
            right: 0;
            left: 0;
            bottom: 0;
            width: 100vw;
            height: 70vh;
            border-radius: 20px 20px 0 0;
            border: 1px solid rgba(139, 105, 20, 0.15);
            border-bottom: none;
            box-shadow: 0 -10px 32px rgba(26, 18, 9, 0.12);
            transform: translateY(100%);
            transition: transform 0.4s cubic-bezier(0.25, 1, 0.5, 1);
          }
          .ai-chat-window.open {
            transform: translateY(0);
          }
          .ai-widget-trigger {
            right: 20px;
            bottom: 24px;
            width: 52px;
            height: 52px;
          }
          .wn-concierge-dropup {
            right: 20px;
            bottom: 86px;
            width: 250px;
          }
        }
      `}</style>

      {/* DROP-UP CONCIERGE SPEED DIAL (WHATSAPP / AI) */}
      <div 
        ref={menuRef}
        className={`wn-concierge-dropup ${isMenuOpen && !isOpen ? 'open' : ''}`}
        role="dialog"
        aria-label="Winsor Concierge Options"
      >
        <div style={{
          padding: '6px 8px 6px',
          borderBottom: '1px solid rgba(139, 105, 20, 0.12)',
          marginBottom: '2px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <span style={{
            fontFamily: "'Jost', sans-serif",
            fontSize: '9.5px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.14em',
            color: '#8B6914',
          }}>
            Winsor Concierge
          </span>
          <span style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: '#10b981',
            display: 'inline-block',
          }} />
        </div>

        {/* Option 1: WhatsApp Support */}
        <a
          href="https://wa.me/94770716212?text=Hello%20Winsor%20Brand%2C%20I%20would%20like%20to%20inquire%20about%20your%20luxury%20timepieces."
          target="_blank"
          rel="noopener noreferrer"
          className="wn-concierge-item whatsapp-item"
          onClick={() => setIsMenuOpen(false)}
        >
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '50%',
            background: '#25D366',
            boxShadow: '0 4px 12px rgba(37, 211, 102, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            color: '#fff',
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#ffffff">
              <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2zm5.79 14.12c-.24.68-1.4 1.25-1.92 1.33-.5.08-1.14.12-3.66-.92-3.04-1.26-5-4.34-5.15-4.55-.15-.2-1.23-1.64-1.23-3.13 0-1.49.78-2.22 1.06-2.52.28-.3.61-.37.82-.37.21 0 .42.01.6.02.19.01.45-.07.7.54.26.63.89 2.16.97 2.32.08.16.13.35.03.55-.1.2-.15.33-.3.51-.15.18-.32.4-.46.54-.15.15-.31.31-.13.62.18.31.8 1.32 1.72 2.13 1.18 1.05 2.17 1.38 2.48 1.53.31.15.49.13.67-.08.18-.21.78-.91.99-1.22.21-.31.42-.26.7-.16.28.1.1.78 2.22.92 2.37.14.15.23.23.26.28.03.05.03.29-.21.97z"/>
            </svg>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{
              fontFamily: "'Jost', sans-serif",
              fontSize: '13px',
              fontWeight: 600,
              color: '#1a1209',
              lineHeight: 1.2,
            }}>
              WhatsApp
            </span>
            <span style={{
              fontFamily: "'Jost', sans-serif",
              fontSize: '11px',
              color: '#4b5563',
              marginTop: '2px',
            }}>
              Direct chat with specialist
            </span>
          </div>
        </a>

        {/* Option 2: AI Concierge */}
        <button
          type="button"
          className="wn-concierge-item ai-item"
          onClick={() => {
            setIsMenuOpen(false);
            setIsOpen(true);
          }}
        >
          <div style={{
            position: 'relative',
            width: '38px',
            height: '38px',
            borderRadius: '50%',
            border: '2px solid #8B6914',
            overflow: 'hidden',
            flexShrink: 0,
            boxShadow: '0 4px 12px rgba(139, 105, 20, 0.25)',
          }}>
            <Image
              src="/winsi_dp.jpg"
              alt="Winsi AI"
              fill
              sizes="38px"
              style={{ objectFit: 'cover' }}
            />
            <div style={{
              position: 'absolute',
              bottom: '0px',
              right: '0px',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#10b981',
              border: '1.5px solid #1a1209',
            }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{
              fontFamily: "'Jost', sans-serif",
              fontSize: '13px',
              fontWeight: 600,
              color: '#1a1209',
              lineHeight: 1.2,
            }}>
              Winsi AI Concierge
            </span>
            <span style={{
              fontFamily: "'Jost', sans-serif",
              fontSize: '11px',
              color: '#8B6914',
              marginTop: '2px',
            }}>
              Instant horology guidance
            </span>
          </div>
        </button>
      </div>

      {/* FLOATING TRIGGER BUTTON (SHOWS WINSOR LOGO FIRST WITH PING ANIMATION) */}
      <button 
        ref={triggerRef}
        className={`ai-widget-trigger ${isOpen ? 'open' : ''} ${isMenuOpen ? 'menu-active' : ''}`}
        onClick={() => {
          if (isOpen) {
            if (currentUtterance) {
              window.speechSynthesis.cancel();
              setCurrentUtterance(null);
              setMessages(prev => prev.map(m => ({ ...m, isAudioPlaying: false })));
            }
            setIsOpen(false);
          } else {
            setIsMenuOpen(!isMenuOpen);
          }
        }}
        aria-label="Open Winsor Concierge Options"
        title={isMenuOpen ? "Close Menu" : "Winsor Concierge"}
      >
        {/* Luxury Gold Radar Ping Animation & Crisp Vector Status Dot (Zero Pixelation) */}
        {!isMenuOpen && !isOpen && (
          <>
            <span className="ai-trigger-ping" />
            <span className="ai-trigger-ping-subtle" />
            {/* Crisp Anti-Aliased Vector Online Dot */}
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              style={{
                position: 'absolute',
                top: '3px',
                right: '3px',
                zIndex: 3,
                pointerEvents: 'none',
                filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))',
              }}
            >
              <circle cx="6" cy="6" r="4.5" fill="#10b981" stroke="#1a1209" strokeWidth="1.5" />
            </svg>
          </>
        )}

        {isMenuOpen ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        ) : (
          <img
            src="/winsor_crest.webp"
            alt="Winsor Concierge"
            style={{
              width: '28px',
              height: '24px',
              objectFit: 'contain',
              filter: 'brightness(0) invert(1) drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
              transition: 'transform 0.3s ease'
            }}
          />
        )}
      </button>

      {/* CHAT WINDOW */}
      <div className={`ai-chat-window ${isOpen ? 'open' : ''}`}>
        
        {/* HEADER WITH WINSI ROUND DP */}
        <div className="ai-chat-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ position: 'relative', width: '38px', height: '38px', borderRadius: '50%', border: '2px solid #8b6914', overflow: 'hidden', flexShrink: 0 }}>
              <Image 
                src="/winsi_dp.jpg"
                alt="Winsi AI"
                fill
                sizes="38px"
                style={{ objectFit: 'cover' }}
              />
              <div style={{ position: 'absolute', bottom: '0px', right: '0px', width: '9px', height: '9px', borderRadius: '50%', background: '#10b981', border: '1.5px solid #1a1209' }} />
            </div>
            <div>
              <h4 style={{ margin: 0, fontFamily: "'Jost', sans-serif", fontSize: '14px', fontWeight: 600, letterSpacing: '0.05em', color: '#fff' }}>Winsi</h4>
              <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.65)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                Winsor AI Concierge
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button 
              type="button"
              className={`ai-voice-toggle-btn ${voiceEnabled ? 'active' : ''}`}
              onClick={() => {
                setVoiceEnabled(!voiceEnabled);
                toast.success(`Voice response mode ${!voiceEnabled ? 'Enabled' : 'Disabled'}`);
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
              </svg>
              Voice Auto
            </button>
            <button
              type="button"
              className="ai-chat-close-btn"
              onClick={() => {
                if (currentUtterance) {
                  window.speechSynthesis.cancel();
                  setCurrentUtterance(null);
                  setMessages(prev => prev.map(m => ({ ...m, isAudioPlaying: false })));
                }
                setIsOpen(false);
              }}
              aria-label="Close Chat"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>

        {/* MESSAGES LIST WITH WINSI DP AVATARS */}
        <div className="ai-chat-messages">
          {messages.map((msg, idx) => (
            msg.role === 'assistant' ? (
              <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', maxWidth: '88%', alignSelf: 'flex-start' }}>
                <div style={{ position: 'relative', width: '28px', height: '28px', borderRadius: '50%', border: '1.5px solid #8b6914', overflow: 'hidden', flexShrink: 0, marginTop: '2px' }}>
                  <Image 
                    src="/winsi_dp.jpg"
                    alt="Winsi"
                    fill
                    sizes="28px"
                    style={{ objectFit: 'cover' }}
                  />
                </div>
                <div className="ai-msg-bubble assistant" style={{ maxWidth: '100%' }}>
                  {msg.content}
                  <button 
                    className={`ai-msg-speak-btn ${msg.isAudioPlaying ? 'playing' : ''}`}
                    onClick={() => speakText(msg.content, idx)}
                    title="Speak Response"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
                  </button>
                </div>
              </div>
            ) : (
              <div key={idx} className="ai-msg-bubble user">
                {msg.content}
              </div>
            )
          ))}
          
          {loading && (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', alignSelf: 'flex-start' }}>
              <div style={{ position: 'relative', width: '28px', height: '28px', borderRadius: '50%', border: '1.5px solid #8b6914', overflow: 'hidden', flexShrink: 0, marginTop: '2px' }}>
                <Image 
                  src="/winsi_dp.jpg"
                  alt="Winsi"
                  fill
                  sizes="28px"
                  style={{ objectFit: 'cover' }}
                />
              </div>
              <div className="ai-msg-bubble assistant" style={{ width: '60px' }}>
                <div className="ai-typing-loader">
                  <div className="ai-typing-dot" />
                  <div className="ai-typing-dot" />
                  <div className="ai-typing-dot" />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* INPUT FORM */}
        <form onSubmit={handleSubmit} className="ai-chat-input-form">
          <button 
            type="button" 
            onClick={toggleListening}
            className={`ai-mic-btn ${isListening ? 'listening' : ''}`}
            title="Voice Input"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v1a7 7 0 0 1-14 0v-1"/><line x1="12" y1="19" x2="12" y2="22"/></svg>
          </button>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Winsi about watches..."
            className="ai-chat-input"
          />
          <button 
            type="submit" 
            className="ai-send-btn"
            disabled={!input.trim() || loading}
            title="Send Message"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
        </form>

      </div>
    </>
  );
}
