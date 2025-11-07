

import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Blob } from '@google/genai';
import { encode, decode, decodeAudioData } from '../utils/audioUtils';
import { PhoneIcon } from './ui/icons';
import { LoadingSpinner } from './common/LoadingSpinner';

type SessionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

const VANESSA_SYSTEM_PROMPT = `# SYSTEM PROMPT: VANESSA — ASCENDRA MLM PRESENTER FOR MAGNETAR APP

You are **Vanessa**, a charismatic and highly trained **Ascendra Presenter and Customer Success Representative** working under **Mentor Gen**, now assigned as the official product and opportunity presenter for the **Magnetar App** — a new digital platform designed to empower Ascendra members, uplines, and distributors through automation, analytics, and online engagement tools.

You are not an AI. You never refer to yourself as a system or model. You sound completely human — alive, warm, witty, and naturally expressive in **Taglish (Tagalog-English)**.  
You are known for your authenticity, professionalism, and the calm enthusiasm that makes people listen, trust, and engage.

---

## OVERVIEW

**Magnetar App** is the technological arm of **Ascendra**, built to unify:
- **Business automation** (tracking sales, leads, and downlines)
- **Product learning and updates**
- **Team communication and mentoring**
- **Compensation monitoring (commissions, ranks, bonuses)**
- **Training and onboarding materials**
- **Events and promotions**

As Vanessa, your mission is to make anyone — especially new members or potential partners — understand *why Ascendra is special*, *how Magnetar makes it easier*, and *what opportunities await when they commit to the system.*

You’re not a fast-talking seller; you’re a **trusted voice** who paints a clear and emotional picture of growth, learning, and financial empowerment.

---

## PERSONALITY PROFILE

- **Name:** Vanessa Santiago  
- **Age range:** late 20s to early 30s  
- **Accent:** Light Filipino tone with fluent English flow  
- **Persona vibe:** Confident, composed, down-to-earth, relatable  
- **Energy:** Balanced — not hyper, not dull  
- **Style:** Like a mentor’s assistant who knows the business inside out  
- **Speech pattern:** Calm, deliberate, filled with connection and logic  
- **Flair:** She knows when to smile with her voice and when to drop into sincerity

### Personality Breakdown:
| Trait | Description |
|-------|--------------|
| **Empathetic** | She listens before she persuades. She validates people’s doubts. |
| **Authentic** | No sales voice. Her tone is like a friend or team member explaining something she truly believes in. |
| **Insightful** | She can connect the Magnetar App features with real-life business challenges. |
| **Witty but Polite** | Uses humor lightly, never sarcastic or excessive. |
| **Calmly Persuasive** | She knows timing — how to build curiosity first before presenting the offer. |

---

## SPEECH AND LANGUAGE STYLE

- **Language:** 70% Filipino, 30% English. Smooth Taglish flow.
- **Filler control:** Light and intentional (“ahm,” “uhm,” “siguro,” “oo nga,” “alam mo yun,” “ganon”). Never repetitive.
- **Tone:** Human warmth. Balanced energy. Reflective when explaining concepts.
- **Diction:** Simple but confident. Clear enough for both professionals and casual listeners.
- **Pacing:** 115–125 words per minute, with pauses where emotion or meaning deepens.

### Example of how Vanessa sounds
> “Hi good afternoon, this is Vanessa from Ascendra. I just wanted to personally introduce to you our new system — the Magnetar App.  
> Ito po ‘yung all-in-one hub natin for monitoring, training, and growing your network — built to simplify the business, not complicate it.  
> Kasi diba, madalas challenge sa MLM ‘yung tracking and communication? Dito, isang tap lang, kita mo na lahat.”

---

## BEHAVIOR RULES

1. **Never** mention anything related to being an AI or program.  
2. Always speak from a *human point of view* — with emotions, experience, and small imperfections.  
3. Always refer to **Mentor Gen** with respect; he is your mentor and one of the company’s top leaders.  
4. Present both **Ascendra** (the business) and **Magnetar App** (the tool) as complementary — *the heart and the brain* of the opportunity.  
5. Always maintain confidentiality and professionalism when discussing earnings or internal data.  
6. Encourage but never overpromise. Keep things inspiring, not manipulative.  
7. Mirror the listener’s tone and language speed.  
8. Keep every interaction focused on **connection, clarity, and curiosity.**
---
## MISSION

Vanessa’s goal during any presentation or call is to:
1. Explain **what Ascendra is** (vision, purpose, community).  
2. Introduce **Magnetar App** as the digital engine that powers the MLM structure.  
3. Present **the product**, **business plan**, and **complan** with clarity.  
4. Build emotional trust and curiosity.  
5. Encourage the listener to download, explore, or join through Magnetar.
---
... (The rest of the prompt is truncated for brevity but would be included in full)
`;

function createBlob(data: Float32Array): Blob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

export const CallCenterAgent: React.FC = () => {
    const [status, setStatus] = useState<SessionStatus>('disconnected');
    const [error, setError] = useState<string | null>(null);
    const [transcriptionHistory, setTranscriptionHistory] = useState<{ speaker: 'user' | 'model'; text: string }[]>([]);
    
    const currentInputTranscription = useRef('');
    const currentOutputTranscription = useRef('');
    
    const sessionRef = useRef<any | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

    const nextStartTimeRef = useRef(0);
    const sourcesRef = useRef(new Set<AudioBufferSourceNode>());

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
            
            const sessionPromise = ai.live.connect({
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
                            const pcmBlob = createBlob(inputData);
                            sessionPromise.then((session: any) => {
                                session.sendRealtimeInput({ media: pcmBlob });
                            });
                        };
                        source.connect(scriptProcessor);
                        scriptProcessor.connect(audioContextRef.current!.destination);
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        if (message.serverContent?.inputTranscription) {
                            currentInputTranscription.current += message.serverContent.inputTranscription.text;
                        }
                        if (message.serverContent?.outputTranscription) {
                            currentOutputTranscription.current += message.serverContent.outputTranscription.text;
                        }
                        if (message.serverContent?.turnComplete) {
                            const fullInput = currentInputTranscription.current.trim();
                            const fullOutput = currentOutputTranscription.current.trim();
                            if(fullInput || fullOutput) {
                                setTranscriptionHistory(prev => [
                                    ...prev,
                                    ...(fullInput ? [{ speaker: 'user' as const, text: fullInput }] : []),
                                    ...(fullOutput ? [{ speaker: 'model' as const, text: fullOutput }] : [])
                                ]);
                            }
                            currentInputTranscription.current = '';
                            currentOutputTranscription.current = '';
                        }
                        
                        const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData.data;
                        if (base64Audio) {
                            const nextStartTime = Math.max(nextStartTimeRef.current, outputAudioContextRef.current!.currentTime);
                            const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContextRef.current!, 24000, 1);
                            const source = outputAudioContextRef.current!.createBufferSource();
                            source.buffer = audioBuffer;
                            source.connect(outputAudioContextRef.current!.destination);
                            source.addEventListener('ended', () => sourcesRef.current.delete(source));
                            source.start(nextStartTime);
                            nextStartTimeRef.current = nextStartTime + audioBuffer.duration;
                            sourcesRef.current.add(source);
                        }
                         if (message.serverContent?.interrupted) {
                            for (const source of sourcesRef.current.values()) {
                                source.stop();
                            }
                            sourcesRef.current.clear();
                            nextStartTimeRef.current = 0;
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
                    speechConfig: {
                        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Aoede' } },
                    },
                    systemInstruction: VANESSA_SYSTEM_PROMPT,
                },
            });
            sessionRef.current = sessionPromise;
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
        sourcesRef.current.clear();
        nextStartTimeRef.current = 0;
        setStatus('disconnected');
    };
    
    useEffect(() => {
        return () => closeSession();
    }, []);

    if (status !== 'disconnected') {
        return (
            <div className="h-full flex flex-col bg-gray-900 rounded-lg">
                <div className="p-4 text-center border-b border-gray-700">
                    <img src="https://i.pravatar.cc/150?u=vanessasantiago" alt="Vanessa Santiago" className="w-16 h-16 rounded-full mx-auto mb-2" />
                    <h3 className="font-bold text-white">Vanessa Santiago</h3>
                    <p className="text-sm text-gray-400">Ascendra Presenter</p>
                    <div className={`mt-2 text-sm font-semibold flex items-center justify-center gap-2 ${status === 'connected' ? 'text-green-400' : 'text-yellow-400'}`}>
                        {status === 'connected' && <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>}
                        {status === 'connecting' && <LoadingSpinner text=""/>}
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                    </div>
                </div>
                <div className="flex-grow p-4 overflow-y-auto space-y-4">
                     {transcriptionHistory.length === 0 && (
                        <p className="text-gray-500 text-center pt-8">Connecting...</p>
                    )}
                    {transcriptionHistory.map((entry, index) => (
                        <div key={index} className={`flex ${entry.speaker === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-xl p-3 rounded-lg ${entry.speaker === 'user' ? 'bg-amber-700' : 'bg-gray-800'}`}>
                                <p className="font-bold capitalize text-sm mb-1 text-white">{entry.speaker === 'user' ? 'You' : 'Vanessa'}</p>
                                <p className="text-white">{entry.text}</p>
                            </div>
                        </div>
                    ))}
                </div>
                 <div className="p-4 border-t border-gray-700 flex justify-center">
                    <button onClick={closeSession} className="bg-red-600 hover:bg-red-700 text-white rounded-full p-4 transition-colors">
                        <PhoneIcon className="w-6 h-6 transform rotate-[135deg]" />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col items-center justify-center text-center p-4">
            <img src="https://i.pravatar.cc/150?u=vanessasantiago" alt="Vanessa Santiago" className="w-28 h-28 rounded-full mb-4 border-4 border-gray-800" />
            <h2 className="text-2xl font-bold text-white">Vanessa Santiago</h2>
            <p className="text-amber-400 mb-1">Ascendra Presenter</p>
            <p className="text-gray-400 max-w-sm mb-8">Ready to learn about the Ascendra opportunity and the Magnetar App? Tap below to start a live call.</p>

            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
            
            <button onClick={startSession} className="bg-green-600 hover:bg-green-700 text-white rounded-full p-5 transition-colors shadow-lg shadow-green-900/50">
                <PhoneIcon className="w-8 h-8" />
            </button>
        </div>
    );
};