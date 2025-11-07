import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { Chat } from '@google/genai';
import { createChat, textToSpeech } from '../services/geminiService';
import type { ChatMessage } from '../types';
import { LoadingSpinner } from './common/LoadingSpinner';
import { decode, decodeAudioData } from '../utils/audioUtils';

const systemInstruction = "You are a helpful AI assistant for the E-Learn Social platform. Be friendly, concise, and helpful.";

const SpeakerIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
  </svg>
);

export const Chatbot: React.FC = () => {
  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: 'Hello! How can I help you today on E-Learn Social?' }
  ]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  
  useEffect(() => {
    setChat(createChat(systemInstruction));
    if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
  }, []);

  useEffect(() => {
    chatContainerRef.current?.scrollTo(0, chatContainerRef.current.scrollHeight);
  }, [messages]);
  
  const handlePlayAudio = useCallback(async (text: string) => {
    if (playingAudio === text) return;
    setPlayingAudio(text);
    try {
        const base64Audio = await textToSpeech(text);
        const audioBuffer = await decodeAudioData(
            decode(base64Audio),
            audioContextRef.current!,
            24000,
            1,
        );
        const source = audioContextRef.current!.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContextRef.current!.destination);
        source.start();
        source.onended = () => setPlayingAudio(null);
    } catch (error) {
        console.error("Error playing audio:", error);
        setPlayingAudio(null);
        alert("Failed to generate or play audio.");
    }
}, [playingAudio]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || !chat || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', text: userInput };
    setMessages(prev => [...prev, userMessage]);
    setUserInput('');
    setIsLoading(true);

    try {
      const stream = await chat.sendMessageStream({ message: userInput });
      let newModelMessage = '';
      setMessages(prev => [...prev, { role: 'model', text: '' }]);

      for await (const chunk of stream) {
        newModelMessage += chunk.text;
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = { role: 'model', text: newModelMessage };
          return newMessages;
        });
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages(prev => [...prev, { role: 'model', text: 'Sorry, something went wrong.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <h2 className="text-2xl font-bold text-red-400 mb-4">AI Chat Assistant</h2>
      <div ref={chatContainerRef} className="flex-grow bg-black rounded-lg p-4 overflow-y-auto mb-4 space-y-4">
        {messages.map((msg, index) => (
          <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xl p-3 rounded-lg flex items-start gap-2 ${msg.role === 'user' ? 'bg-red-700' : 'bg-gray-800'}`}>
              <p className="whitespace-pre-wrap text-white">{msg.text}</p>
              {msg.role === 'model' && msg.text && (
                 <button onClick={() => handlePlayAudio(msg.text)} disabled={!!playingAudio} className="text-red-300 hover:text-white disabled:opacity-50 transition-colors">
                    {playingAudio === msg.text ? <LoadingSpinner text="" /> : <SpeakerIcon className="w-5 h-5" />}
                 </button>
              )}
            </div>
          </div>
        ))}
        {isLoading && messages[messages.length - 1].role === 'user' && (
           <div className="flex justify-start">
             <div className="max-w-lg p-3 rounded-lg bg-gray-800">
               <LoadingSpinner text="Thinking..." />
             </div>
           </div>
        )}
      </div>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="Ask me anything..."
          className="flex-grow bg-gray-800 text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-red-500"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !userInput.trim()}
          className="bg-red-600 text-white font-bold py-3 px-5 rounded-lg hover:bg-red-700 disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors"
        >
          Send
        </button>
      </form>
    </div>
  );
};