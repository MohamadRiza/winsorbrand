'use client';

import { useState, useEffect, useRef } from 'react';
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
      content: 'Hello! I am your Winsor Brand Horology Concierge. How may I assist you with our timepieces today?'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [currentUtterance, setCurrentUtterance] = useState<SpeechSynthesisUtterance | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

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
      };

      rec.onerror = (event: any) => {
        // Handle specific errors silently to avoid console warnings / red screens
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
      };

      recognitionRef.current = rec;
    }
  }, []);

  // Handle Speech Output (Text-To-Speech)
  const speakText = (text: string, messageIndex: number) => {
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

    // Create new speech utterance
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Choose a high-quality English voice if available
    const voices = window.speechSynthesis.getVoices();
    const premiumVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Premium')));
    if (premiumVoice) {
      utterance.voice = premiumVoice;
    }
    
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

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
          width: 54px;
          height: 54px;
          border-radius: 50%;
          background: linear-gradient(135deg, #8b6914 0%, #1a1209 100%);
          border: 1px solid rgba(255, 255, 255, 0.15);
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          cursor: pointer;
          z-index: 9999;
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .ai-widget-trigger:hover {
          transform: scale(1.08) translateY(-3px);
          box-shadow: 0 12px 35px rgba(139, 105, 20, 0.3);
        }
        .ai-widget-trigger svg {
          transition: transform 0.4s ease;
        }
        .ai-widget-trigger.open svg {
          transform: rotate(90deg) scale(0.9);
        }

        /* ── CHAT PANEL WINDOW ── */
        .ai-chat-window {
          position: fixed;
          right: 28px;
          bottom: 28px;
          width: 380px;
          height: 580px;
          background: rgba(250, 247, 240, 0.98);
          border: 1px solid rgba(139, 105, 20, 0.15);
          border-radius: 16px;
          box-shadow: 0 16px 48px rgba(26, 18, 9, 0.16);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          z-index: 9998;
          opacity: 0;
          transform: scale(0.95) translateY(20px);
          pointer-events: none;
          transition: all 0.4s cubic-bezier(0.25, 1, 0.5, 1);
        }
        .ai-chat-window.open {
          opacity: 1;
          transform: scale(1) translateY(0);
          pointer-events: all;
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
          padding: 16px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .ai-chat-header-title {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .ai-chat-logo-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #8b6914;
          box-shadow: 0 0 10px #8b6914;
        }
        .ai-chat-header-title h4 {
          font-family: 'Jost', sans-serif;
          font-size: 13.5px;
          font-weight: 500;
          letter-spacing: 0.1em;
          margin: 0;
          text-transform: uppercase;
        }
        .ai-chat-header-title span {
          font-size: 9px;
          color: rgba(255,255,255,0.5);
          letter-spacing: 0.05em;
        }

        .ai-voice-toggle-btn {
          background: transparent;
          border: 1px solid rgba(255,255,255,0.15);
          border-radius: 4px;
          color: rgba(255,255,255,0.7);
          padding: 4px 8px;
          font-size: 9px;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .ai-voice-toggle-btn.active {
          background: rgba(139,105,20,0.15);
          border-color: #8b6914;
          color: #8b6914;
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
          border-radius: 12px;
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
          border: 1px solid rgba(26,18,9,0.06);
          border-bottom-left-radius: 2px;
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
          border-top: 1px solid rgba(26, 18, 9, 0.06);
          padding: 16px;
          background: #fff;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .ai-chat-input {
          flex: 1;
          height: 40px;
          border: 1px solid rgba(26, 18, 9, 0.1);
          border-radius: 8px;
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
            bottom: 96px;
            width: 50px;
            height: 50px;
          }
        }
      `}</style>

      {/* FLOATING TRIGGER BUTTON */}
      <button 
        className={`ai-widget-trigger ${isOpen ? 'open' : ''}`}
        onClick={() => {
          // If closing, cancel speech synthesis
          if (isOpen && currentUtterance) {
            window.speechSynthesis.cancel();
            setCurrentUtterance(null);
            setMessages(prev => prev.map(m => ({ ...m, isAudioPlaying: false })));
          }
          setIsOpen(!isOpen);
        }}
        aria-label="Open AI Assistant"
      >
        {isOpen ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275Z"/><path d="m5 3 1 2.5L8.5 6 6 7 5 9.5 4 7 1.5 6 4 5Z"/><path d="m19 17 1 2.5 2.5.5-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1Z"/></svg>
        )}
      </button>

      {/* CHAT WINDOW */}
      <div className={`ai-chat-window ${isOpen ? 'open' : ''}`}>
        
        {/* HEADER */}
        <div className="ai-chat-header">
          <div className="ai-chat-header-title">
            <div className="ai-chat-logo-dot" />
            <div>
              <h4>Winsor Concierge</h4>
              <span>AI Horology Assistant</span>
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
              🔊 Voice Auto
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

        {/* MESSAGES LIST */}
        <div className="ai-chat-messages">
          {messages.map((msg, idx) => (
            <div key={idx} className={`ai-msg-bubble ${msg.role}`}>
              {msg.content}
              {msg.role === 'assistant' && (
                <button 
                  className={`ai-msg-speak-btn ${msg.isAudioPlaying ? 'playing' : ''}`}
                  onClick={() => speakText(msg.content, idx)}
                  title="Speak Response"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
                </button>
              )}
            </div>
          ))}
          
          {loading && (
            <div className="ai-msg-bubble assistant" style={{ width: '60px' }}>
              <div className="ai-typing-loader">
                <div className="ai-typing-dot" />
                <div className="ai-typing-dot" />
                <div className="ai-typing-dot" />
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
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about Winsor watches..."
            className="ai-chat-input"
            disabled={loading}
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
