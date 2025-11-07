import React, { useState, useRef, useEffect } from 'react';
// FIX: Removed non-exported `LiveSession` type.
import { GoogleGenAI, LiveServerMessage, Modality, Blob } from '@google/genai';
import { encode, decode, decodeAudioData } from '../utils/audioUtils';

type SessionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

const MicIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m12 7.5v-1.5a6 6 0 0 0-6-6v-1.5a6 6 0 0 0-6 6v1.5m6 6.75v-1.5a6 6 0 0 0-6-6v-1.5a6 6 0 0 0 6-6v-1.5m0 19.5v-1.5a6 6 0 0 0 6-6v-1.5a6 6 0 0 0-6-6v-1.5a6 6 0 0 0-6 6v1.5m0 0a6 6 0 0 0 6 6v-1.5m0 0a6 6 0 0 1 6-6v-1.5m0 0a6 6 0 0 1-6-6V3" />
    </svg>
);
  

export const LiveAssistant: React.FC = () => {
    const [status, setStatus] = useState<SessionStatus>('disconnected');
    const [error, setError] = useState<string | null>(null);
    const [transcriptionHistory, setTranscriptionHistory] = useState<{ speaker: 'user' | 'model'; text: string }[]>([]);
    const currentInputTranscription = useRef('');
    const currentOutputTranscription = useRef('');
    
    // FIX: Changed type to `any` as `LiveSession` is not an exported type.
    const sessionRef = useRef<any | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

    let nextStartTime = 0;
    const sources = new Set<AudioBufferSourceNode>();
    
    const startSession = async () => {
        if (status === 'connecting' || status === 'connected') return;
        setStatus('connecting');
        setError(null);
        setTranscriptionHistory([]);

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaStreamRef.current = stream;

            if (!audioContextRef.current) {
                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            }
            if (!outputAudioContextRef.current) {
                outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            }

            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            sessionRef.current = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                callbacks: {
                    onopen: () => {
                        setStatus('connected');
                        
                        const source = audioContextRef.current!.createMediaStreamSource(stream);
                        mediaStreamSourceRef.current = source;
                        const scriptProcessor = audioContextRef.current!.createScriptProcessor(4096, 1, 1);
                        scriptProcessorRef.current = scriptProcessor;

                        scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                            const pcmBlob: Blob = {
                                data: encode(new Uint8Array(new Int16Array(inputData.map(v => v * 32768)).buffer)),
                                mimeType: 'audio/pcm;rate=16000',
                            };
                            sessionRef.current?.then((session: any) => {
                                session.sendRealtimeInput({ media: pcmBlob });
                            });
                        };
                        source.connect(scriptProcessor);
                        scriptProcessor.connect(audioContextRef.current!.destination);
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        // Handle transcription
                        if (message.serverContent?.inputTranscription) {
                            currentInputTranscription.current += message.serverContent.inputTranscription.text;
                        }
                        if (message.serverContent?.outputTranscription) {
                            currentOutputTranscription.current += message.serverContent.outputTranscription.text;
                        }
                        if (message.serverContent?.turnComplete) {
                            const fullInput = currentInputTranscription.current;
                            const fullOutput = currentOutputTranscription.current;
                            setTranscriptionHistory(prev => [
                                ...prev,
                                { speaker: 'user', text: fullInput },
                                { speaker: 'model', text: fullOutput }
                            ]);
                            currentInputTranscription.current = '';
                            currentOutputTranscription.current = '';
                        }
                        
                        // Handle audio output
                        const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData.data;
                        if (base64Audio) {
                            nextStartTime = Math.max(nextStartTime, outputAudioContextRef.current!.currentTime);
                            const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContextRef.current!, 24000, 1);
                            const source = outputAudioContextRef.current!.createBufferSource();
                            source.buffer = audioBuffer;
                            source.connect(outputAudioContextRef.current!.destination);
                            source.addEventListener('ended', () => sources.delete(source));
                            source.start(nextStartTime);
                            nextStartTime += audioBuffer.duration;
                            sources.add(source);
                        }
                         if (message.serverContent?.interrupted) {
                            for (const source of sources.values()) {
                                source.stop();
                                sources.delete(source);
                            }
                            nextStartTime = 0;
                        }
                    },
                    onclose: () => setStatus('disconnected'),
                    onerror: (e: ErrorEvent) => {
                        console.error('Live session error:', e);
                        setError('A connection error occurred.');
                        setStatus('error');
                        closeSession();
                    },
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    inputAudioTranscription: {},
                    outputAudioTranscription: {},
                    systemInstruction: 'You are a friendly and helpful tutor on the E-Learn Social platform. Keep your answers conversational and encouraging.',
                },
            });

        } catch (err) {
            console.error("Failed to start session:", err);
            setError("Could not access microphone. Please grant permission and try again.");
            setStatus('error');
        }
    };

    const closeSession = () => {
        sessionRef.current?.then((session: any) => session.close());
        sessionRef.current = null;

        mediaStreamRef.current?.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
        
        scriptProcessorRef.current?.disconnect();
        scriptProcessorRef.current = null;
        
        mediaStreamSourceRef.current?.disconnect();
        mediaStreamSourceRef.current = null;

        setStatus('disconnected');
    };
    
    useEffect(() => {
        return () => {
            closeSession();
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const statusText = {
        disconnected: 'Not Connected',
        connecting: 'Connecting...',
        connected: 'Live - You can speak now',
        error: 'Error'
    };

    return (
        <div className="h-full flex flex-col items-center">
            <h2 className="text-2xl font-bold text-red-400 mb-4">Live AI Assistant</h2>
            <p className="text-gray-400 mb-6">Have a real-time voice conversation with your AI tutor.</p>
            
            <div className="flex items-center gap-4 mb-4">
                <button
                    onClick={startSession}
                    disabled={status === 'connected' || status === 'connecting'}
                    className="bg-green-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-green-700 disabled:bg-gray-600 transition-colors"
                >
                    Start Session
                </button>
                <button
                    onClick={closeSession}
                    disabled={status === 'disconnected'}
                    className="bg-red-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-red-700 disabled:bg-gray-600 transition-colors"
                >
                    End Session
                </button>
            </div>

            <div className={`flex items-center gap-2 p-2 rounded-lg mb-4 ${
                status === 'connected' ? 'bg-green-500/20 text-green-300' : 
                status === 'connecting' ? 'bg-yellow-500/20 text-yellow-300' :
                status === 'error' ? 'bg-red-500/20 text-red-300' :
                'bg-gray-800/50 text-gray-400'
            }`}>
                <MicIcon className="w-5 h-5" />
                <span>{statusText[status]}</span>
            </div>
            
            {error && <p className="text-red-400 mb-4">{error}</p>}

            <div className="w-full flex-grow bg-black rounded-lg p-4 overflow-y-auto space-y-4">
                {transcriptionHistory.length === 0 && (
                    <p className="text-gray-500 text-center pt-8">Conversation transcript will appear here...</p>
                )}
                {transcriptionHistory.map((entry, index) => (
                    <div key={index} className={`flex ${entry.speaker === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xl p-3 rounded-lg ${entry.speaker === 'user' ? 'bg-red-600' : 'bg-gray-800'}`}>
                            <p className="font-bold capitalize text-sm mb-1 text-white">{entry.speaker}</p>
                            <p className="text-white">{entry.text}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};