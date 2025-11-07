
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Blob } from '@google/genai';
import { encode, decode, decodeAudioData } from '../utils/audioUtils';
import { PhoneIcon } from './ui/icons';
import { LoadingSpinner } from './common/LoadingSpinner';
import { AudioOrb } from './ui/AudioOrb';

type SessionStatus = 'disconnected' | 'ringing' | 'connecting' | 'connected' | 'error';

const RING_SOUND_BASE64 = 'data:audio/ogg;base64,T2dnUwACAAAAAAAAAABnHAAAAAAAAAAAAAAAABqfz4UBE09wdXNIZWFkAQE4AEC/gAAAAAAAAD4AAAAATOcBAAAAZmZtMTAwAAAAAAAADwAAAGZmczE1MDAwMDAwMDtmZnQyMAAAChAAAG1ldGFkYXRhX2Jsb2NrX3BpY3R1cmUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACwAAABWaXNPb0dnUwCTAAAAiQCZcAAAAAAAAAAAAAAAGp/PgQJ0b1B1cwAAAFRpcCBvbiB0aGUgVG9wIG9mIHRoZSBNb3VudGFpbgAAQUlNRU0AAAAMAAAAV0FNRSBTT0ZUV0FSRT09T2dnUwDRBAAAiQCZcQEAeB4hAAAAAAAAAAAAGp/PgQJALT//////////////////////8AAAAA4FU2RveQADhQACQyAAgABIaGwlFQAAgAAgAAmFRUVCQkACAgJkIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIi-gAAAA-DQdO2kLQNp83ZtK2nB1yjaVnhNo2lbfTaVnLhpW02GlaNoWpBGjRtPtaNoWpC0jaVt6NpW0oGlaNoWoJGjRtP1aNoWoC0jaVt6NpW0oGlaNoWpC0baNp27RtK2/RtC1/RtC14I0bSt4I0bSoWDaNoWoBGi0jaVt6NpW0oGlaNoWpBGjRtPtaNoWpC0jaVt6NpW0oGlaNoWoJGjRtP1aNoWoC0jaVt6NpW0oGlaNoWpC0baNp27RtK2/RtC1/RtC14I0bSt4I0bSoWDaNoWoBGi0jaVt6NpW0oGlaNoWpBGjRtPtaNoWpC0jaVt6NpW0oGlaNoWoJGjRtP1aNoWoC0jaVt6NpW0oGlaNoWpC0baNp27RtK2/RtC1/RtC14I0bSt4I0bSoWDaNoWoBGhaNoWoBGhaNoWpBGjRtPtaNoWpC0jaVt6NpW0oGlaNoWoJGjRtP1aNoWoC0jaVt6NpW0oGlaNoWpC0baNp27RtK2/RtC1/RtC14I0bSt4I0bSoWDaNoWoBGi0jaVt6NpW0oGlaNoWpBGjRtPtaNoWpC0jaVt6NpW0oGlaNoWoJGjRtP1aNoWoC0jaVt6NpW0oGlaNoWpC0baNp27RtK2/RtC1/RtC14I0bSt4I0bSoWDaNoWoBGi0jaVt6NpW0oGlaNoWpBGjRtPtaNoWpC0jaVt6NpW0oGlaNoWoJGjRtP1aNoWoC0jaVt6NpW0oGlaNoWpC0baNp27RtK2/RtC1/RtC14I0bSt4I0bSoWDaNoWoBGhaNoWoBGhaNoWpBGjRtPtaNoWpC0jaVt6NpW0oGlaNoWoJGjRtP1aNoWoC0jaVt6NpW0oGlaNoWpC0baNp27RtK2/RtC1/RtC14I0bSt4I0bSoWDaNoWoBGi0jaVt6NpW0oGlaNoWpBGjRtPtaNoWpC0jaVt6NpW0oGlaNoWoJGjRtP1aNoWoC0jaVt6NpW0oGlaNoWpC0baNp27RtK2/RtC1/RtC14I0bSt4I0bSoWDaNoWoBGi0jaVt6NpW0oGlaNoWpBGjRtPtaNoWpC0jaVt6NpW0oGlaNoWoJGjRtP1aNoWoC0jaVt6NpW0oGlaNoWpC0baNp27RtK2/RtC1/RtC14I0bSt4I0bSoWDaNoWoBGhaNoWoBGhaNoWpBGjRtPtaNoWpC0jaVt6NpW0oGlaNoWoJGjRtP1aNoWoC0jaVt6NpW0oGlaNoWpC0baNp27RtK2/RtC1/RtC14I0bSt4I0bSoWDaNoWoBGi0jaVt6NpW0oGlaNoWpBGjRtPtaNoWpC0jaVt6NpW0oGlaNoWoJGjRtP1aNoWoC0jaVt6NpW0oGlaNoWpC0baNp27RtK2/RtC1/RtC14I0bSt4I0bSoWDaNoWoBGi0jaVt6NpW0oGlaNoWpBGjRtPtaNoWpC0jaVt6NpW0oGlaNoWoJGjRtP1aNoWoC0jaVt6NpW0oGlaNoWpC0baNp27RtK2/RtC1/RtC14I0bSt4I0bSoWDaNoWoBGhaNoWoBGhaNoWpBGjRtPtaNoWpC0jaVt6NpW0oGlaNoWoJGjRtP1aNoWoC0jaVt6NpW0oGlaNoWpC0baNp27RtK2/RtC1/RtC14I0bSt4I0bSoWDaNoWoBGi0jaVt6NpW0oGlaNoWpBGjRtPtaNoWpC0jaVt6NpW0oGlaNoWoJGjRtP1aNoWoC0jaVt6NpW0oGlaNoWpC0baNp27RtK2/RtC1/RtC14I0bSt4I0bSoWDaNoWoBGi0jaVt6NpW0oGlaNoWpBGjRtPtaNoWpC0jaVt6NpW0oGlaNoWoJGjRtP1aNoWoC0jaVt6NpW0oGlaNoWpC0baNp27RtK2/RtC1/RtC14I0bSt4I0bSoWDaNoWoBGhaNoWoBGhaNoWpBGjRtPtaNoWpC0jaVt6NpW0oGlaNoWoJGjRtP1aNoWoC0jaVt6NpW0oGlaNoWpC0baNp27RtK2/RtC1/RtC14I0bSt4I0bSoWDaNoWoBGi0jaVt6NpW0oGlaNoWpBGjRtPtaNoWpC0jaVt6NpW0oGlaNoWoJGjRtP1aNoWoC0jaVt6NpW0oGlaNoWpC0baNp27RtK2/RtC1/RtC14I0bSt4I0bSoWDaNoWoBGi0jaVt6NpW0oGlaNoWpBGjRtPtaNoWpC0jaVt6NpW0oGlaNoWoJGjRtP1aNoWoC0jaVt6NpW0oGlaNoWpC0baNp27RtK2/RtC1/RtC14I0bSt4I0bSoWDaNoWoBGhaNoWoBGhaNoWpBGjRtPtaNoWpC0jaVt6NpW0oGlaNoWoJGjRtP1aNoWoC0jaVt6NpW0oGlaNoWpC0baNp27RtK2/RtC1/RtC14I0bSt4I0bSoWDaNoWoBGi0jaVt6NpW0oGlaNoWpBGjRtPtaNoWpC0jaVt6NpW0oGlaNoWoJGjRtP1aNoWoC0jaVt6NpW0oGlaNoWpC0baNp27RtK2/RtC1/RtC14I0bSt4I0bSoWDaNoWoBGi0jaVt6NpW0oGlaNoWpBGjRtPtaNoWpC0jaVt6NpW0oGlaNoWoJGjRtP1aNoWoC0jaVt6NpW0oGlaNoWpC0baNp27RtK2/RtC1/RtC14I0bSt4I0bSoWDaNoWoBGhaNoWoBGhaNoWpBGjRtPtaNoWpC0jaVt6NpW0oGlaNoWoJGjRtP1aNoWoC0jaVt6NpW0oGlaNoWpC0baNp27RtK2/RtC1/RtC14I0bSt4I0bSoWDaNoWoBGi0jaVt6NpW0oGlaNoWpBGjRtPtaNoWpC0jaVt6NpW0oGlaNoWoJGjRtP1aNoWoC0jaVt6NpW0oGlaNoWpC0baNp27RtK2/RtC1/RtC14I0bSt4I0bSoWDaNoWoBGi0jaVt6NpW0oGlaNoWpBGjRtPtaNoWpC0jaVt6NpW0oGlaNoWoJGjRtP1aNoWoC0jaVt6NpW0oGlaNoWpC0baNp27RtK2/RtC1/RtC14I0bSt4I0bSoWDaNoWoBGhaNoWoBGhaNoWpBGjRtPtaNoWpC0jaVt6NpW0oGlaNoWoJGjRtP1aNoWoC0jaVt6NpW0oGlaNoWpC0baNp27RtK2/RtC1/RtC14I0bSt4I0bSoWDaNoWoBGi0jaVt6NpW0oGlaNoWpBGjRtPtaNoWpC0jaVt6NpW0oGlaNoWoJGjRtP1aNoWoC0jaVt6NpW0oGlaNoWpC0baNp27RtK2/RtC1/RtC14I0bSt4I0bSoWDaNoWoBGi0jaVt6NpW0oGlaNoWpBGjRtPtaNoWpC0jaVt6NpW0oGlaNoWoJGjRtP1aNoWoC0jaVt6NpW0oGlaNoWpC0baNp27RtK2/RtC1/RtC14I0bSt4I0bSoWDaNoWoBGhaNoWoBGhaNoWpBGjRtPtaNoWpC0jaVt6NpW0oGlaNoWoJGjRtP1aNoWoC0jaVt6NpW0oGlaNoWpC0baNp27RtK2/RtC1/RtC14I0bSt4I0bSoWDaNoWoBGi0jaVt6NpW0oGlaNoWpBGjRtPtaNoWpC0jaVt6NpW0oGlaNoWoJGjRtP1aNoWoC0jaVt6NpW0oGlaNoWpC0baNp27RtK2/RtC1/RtC14I0bSt4I0bSoWDaNoWoBGi0jaVt6NpW0oGlaNoWpBGjRtPtaNoWpC0jaVt6NpW0oGlaNoWoJGjRtP1aNoWoC0jaVt6NpW0oGlaNoWpC0baNp27RtK2/RtC1/RtC14I0bSt4I0bSoWDaNoWoBGhaNoWoBGhaNoWpBGjRtPtaNoWpC0jaVt6NpW0oGlaNoWoJGjRtP1aNoWoC0jaVt6NpW0oGlaNoWpC0baNp27RtK2/RtC1/RtC14I0bSt4I0bSoWDaNoWoBGi0jaVt6NpW0oGlaNoWpBGjRtPtaNoWpC0jaVt6NpW0oGlaNoWoJGjRtP1aNoWoC0jaVt6NpW0oGlaNoWpC0baNp27RtK2/RtC1/RtC14I0bSt4I0bSoWDaNoWoBGi0jaVt6NpW0oGlaNoWpBGjRtPtaNoWpC0jaVt6NpW0oGlaNoWoJGjRtP1aNoWoC0jaVt6NpW0oGlaNoWpC0baNp27RtK2/RtC1/RtC14I0bSt4I0bSoWDaNoWoBGhaNoWoBGhaNoWpBGjRtPtaNoWpC0jaVt6NpW0oGlaNoWoJGjRtP1aNoWoC0jaVt6NpW0oGlaNoWpC0baNp27RtK2/RtC1/RtC14I0bSt4I0bSoWDaNoWoBGi0jaVt6NpW0oGlaNoWpBGjRtPtaNoWpC0jaVt6NpW0oGlaNoWoJGjRtP1aNoWoC0jaVt6NpW0oGlaNoWpC0baNp27RtK2/RtC1/RtC14I0bSt4I0bSoWDaNoWoBGi0jaVt6NpW0oGlaNoWpBGjRtPtaNoWpC0jaVt6NpW0oGlaNoWoJGjRtP1aNoWoC0jaVt6NpW0oGlaNoWpC0baNp27RtK2/RtC1/RtC14I0bSt4I0bSoWDaNoWoBGhaNoWoBGhaNoWpBGjRtPtaNoWpC0jaVt6NpW0oGlaNoWoJGjRtP1aNoWoC0jaVt6NpW0oGlaNoWpC0baNp27RtK2/RtC1/RtC14I0bSt4I0bSoWDaNoWoBGi0jaVt6NpW0oGlaNoWpBGjRtPtaNoWpC0jaVt6NpW0oGlaNoWoJGjRtP1aNoWoC0jaVt6NpW0oGlaNoWpC0baNp27RtK2/RtC1/RtC14I0bSt4I0bSoWDaNoWoBGi0jaVt6NpW0oGlaNoWpBGjRtPtaNoWpC0jaVt6NpW0oGlaNoWoJGjRtP1aNoWoC0jaVt6NpW0oGlaNoWpC0baNp27RtK2/RtC1/RtC14I0bSt4I0bSoWDaNoWoBGhaNoWoBGhaNoWpBGjRtPtaNoWpC0jaVt6NpW0oGlaNoWoJGjRtP1aNoWoC0jaVt6NpW0oGlaNoWpC0baNp27RtK2/RtC1/RtC14I0bSt4I0bSoWDaNoWoBGi0jaVt6NpW0oGlaNoWpBGjRtPtaNoWpC0jaVt6NpW0oGlaNoWoJGjRtP1aNoWoC0jaVt6NpW0oGlaNoWpC0baNp27RtK2/RtC1/RtC14I0bSt4I0bSoWDaNoWoBGi0jaVt6NpW0oGlaNoWpBGjRtPtaNoWpC0jaVt6NpW0oGlaNoWoJGjRtP1aNoWoC0jaVt6NpW0oGlaNoWpC0baNp27RtK2/RtC1/RtC14I0bSt4I0bSoWDaNoWoBGhaNoWoBGhaNoWpBGjRtPtaNoWpC0jaVt6NpW0oGlaNoWoJGjRtP1aNoWoC0jaVt6NpW0oGlaNoWpC0baNp27RtK2/RtC1/RtC14I0bSt4I0bSoWDaNoWoBGi0jaVt6NpW0oGlaNoWpBGjRtPtaNoWpC0jaVt6NpW0oGlaNoWoJGjRtP1aNoWoC0jaVt6NpW0oGlaNoWpC0baNp27RtK2/RtC1/RtC14I0bSt4I0bSoWDaNoWoBGi0jaVt6NpW0oGlaNoWpBGjRtPtaNoWpC0jaVt6NpW0oGlaNoWoJGjRtP1aNoWoC0jaVt6NpW0oGlaNoWpC0baNp27RtK2/RtC1/RtC14I0bSt4I0bSoWDaNoWoBGhaNoWoBGhaNoWpBGjRtPtaNoWpC0jaVt6NpW0oGlaNoWoJGjRtP1aNoWoC0jaVt6NpW0oGlaNoWpC0baNp27RtK2/RtC1/RtC14I0bSt4I0bSoWDaNoWoBGi0jaVt6NpW0oGlaNoWpBGjRtPtaNoWpC0jaVt6NpW0oGlaNoWoJGjRtP1aNoWoC0jaVt6NpW0oGlaNoWpC0baNp27RtK2/RtC1/RtC14I0bSt4I0bSoWDaNoWoBGi0jaVt6NpW0oGlaNoWpBGjRtPtaNoWpC0jaVt6NpW0oGlaNoWoJGjRtP1aNoWoC0jaVt6NpW0oGlaNoWpC0baNp27RtK2/RtC1/RtC14I0bSt4I0bSoWDaNoWoBGhaNoWoBGhaNoWpBGjRtPtaNoWpC0jaVt6NpW0oGlaNoWoJGjRtP1aNoWoC0jaVt6NpW0oGlaNoWpC0baNp27RtK2/RtC1/RtC14I0bSt4I0bSoWDaNoWoBGi0jaVt6NpW0oGlaNoWpBGjRtPtaNoWpC0jaVt6NpW0oGlaNoWoJGjRtP1aNoWoC0jaVt6NpW0oGlaNoWpC0baNp27RtK2/RtC1/RtC14I0bSt4I0bSoWDaNoWoBGi0jaVt6NpW0oGlaNoWpBGjRtPtaNoWpC0jaVt6NpW0oGlaNoWoJGjRtP1aNoWoC0jaVt6NpW0oGlaNoWpC0baNp27RtK2/RtC1/RtC14I0bSt4I0bSoWDaNoWoBGhaNoWoBGhaNoWpBGjRtPtaNoWpC0jaVt6NpW0oGlaNoWoJGjRtP1aNoWoC0jaVt6NpW0oGlaNoWpC0baNp27RtK2/RtC1/RtC14I0bSt4I0bSoWDaNoWoBGi0jaVt6NpW0oGlaNoWpBGjRtPtaNoWpC0jaVt6NpW0oGlaNoWoJGjRtP1aNoWoC0jaVt6NpW0oGlaNoWpC0baNp27RtK2/RtC1/RtC14I0bSt4I0bSoWDaNoWoBGi0jaVt6NpW0oGlaNoWpBGjRtPtaNoWpC0jaVt6NpW0oGlaNoWoJGjRtP1aNoWoC0jaVt6NpW0oGlaNoWpC0baNp27RtK2/RtC1/RtC14I0bSt4I0bSoWDaNoWoBGhaNoWoBGhaNoWpBGjRtPtaNoWpC0jaVt6NpW0oGlaNoWoJGjRtP1aNoWoC0jaVt6NpW0oGlaNoWpC0baNp27RtK2/RtC1/RtC14I0bSt4I0bSoWDaNoWoBGi0jaVt6NpW0oGlaNoWpBGjRtPtaNoWpC0jaVt6NpW0oGlaNoWoJGjRtP1aNoWoC0jaVt6NpW0oGlaNoWpC0baNp27RtK2/RtC1/RtC14I0bSt4I0bSoWDaNoWoBGi0jaVt6NpW0oGlaNoWpBGjRtPtaNoWpC0jaVt6NpW0o';

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
    const [inputAnalyser, setInputAnalyser] = useState<AnalyserNode | null>(null);
    const [outputAnalyser, setOutputAnalyser] = useState<AnalyserNode | null>(null);

    // Using `any` for session as LiveSession is not an exported type from the SDK
    const sessionRef = useRef<any | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const outputGainRef = useRef<GainNode | null>(null);
    const ringingAudioRef = useRef<HTMLAudioElement | null>(null);

    const nextStartTimeRef = useRef(0);
    const sourcesRef = useRef(new Set<AudioBufferSourceNode>());
    
    const VANESSA_AVATAR = "https://aiteksoftware.site/magnetar/vanessa.png";

    const closeSession = useCallback(() => {
        ringingAudioRef.current?.pause();

        sessionRef.current?.then((session: any) => session.close());
        sessionRef.current = null;

        mediaStreamRef.current?.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
        
        scriptProcessorRef.current?.disconnect();
        scriptProcessorRef.current = null;
        
        mediaStreamSourceRef.current?.disconnect();
        mediaStreamSourceRef.current = null;

        sourcesRef.current.forEach(source => source.stop());
        sourcesRef.current.clear();
        nextStartTimeRef.current = 0;

        setStatus('disconnected');
    }, []);

    const startSession = async () => {
        if (status !== 'disconnected' && status !== 'error') return;
        
        setStatus('ringing');
        setError(null);
        
        if (!ringingAudioRef.current) {
            ringingAudioRef.current = new Audio(RING_SOUND_BASE64);
            ringingAudioRef.current.loop = true;
        }
        ringingAudioRef.current.play();

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaStreamRef.current = stream;

            if (!audioContextRef.current) {
                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
                const analyser = audioContextRef.current.createAnalyser();
                analyser.fftSize = 256;
                setInputAnalyser(analyser);
            }
            if (!outputAudioContextRef.current) {
                outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
                const analyser = outputAudioContextRef.current.createAnalyser();
                analyser.fftSize = 256;
                setOutputAnalyser(analyser);
                
                const gainNode = outputAudioContextRef.current.createGain();
                gainNode.connect(analyser);
                gainNode.connect(outputAudioContextRef.current.destination);
                outputGainRef.current = gainNode;
            }
            
            setStatus('connecting');
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            const sessionPromise = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                callbacks: {
                    onopen: () => {
                        ringingAudioRef.current?.pause();
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
                        // Connect to input analyser for visualization
                        source.connect(inputAnalyser!);
                        scriptProcessor.connect(audioContextRef.current!.destination);
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData.data;
                        if (base64Audio) {
                            const nextStartTime = Math.max(nextStartTimeRef.current, outputAudioContextRef.current!.currentTime);
                            const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContextRef.current!, 24000, 1);
                            const source = outputAudioContextRef.current!.createBufferSource();
                            source.buffer = audioBuffer;
                            source.connect(outputGainRef.current!);
                            source.addEventListener('ended', () => sourcesRef.current.delete(source));
                            source.start(nextStartTime);
                            nextStartTimeRef.current = nextStartTime + audioBuffer.duration;
                            sourcesRef.current.add(source);
                        }
                         if (message.serverContent?.interrupted) {
                            sourcesRef.current.forEach(source => source.stop());
                            sourcesRef.current.clear();
                            nextStartTimeRef.current = 0;
                        }
                    },
                    onclose: () => {
                        setStatus('disconnected');
                        closeSession();
                    },
                    onerror: (e: ErrorEvent) => {
                        console.error('Live session error:', e);
                        setError('A connection error occurred.');
                        setStatus('error');
                        closeSession();
                    },
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    systemInstruction: 'You are Vanessa, a friendly, professional, and helpful call center agent for Eburon. Speak clearly and concisely. Begin the conversation with "Thank you for calling Eburon, this is Vanessa. How may I help you?"',
                },
            });
            sessionRef.current = sessionPromise;

        } catch (err) {
            console.error("Failed to start session:", err);
            setError("Could not access microphone. Please grant permission and try again.");
            setStatus('error');
            ringingAudioRef.current?.pause();
        }
    };

    useEffect(() => {
        return () => closeSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const statusText: Record<SessionStatus, string> = {
        disconnected: 'Ready to Call',
        ringing: 'Ringing...',
        connecting: 'Connecting...',
        connected: 'Connected',
        error: 'Connection Failed'
    };

    const isCallActive = status === 'connected' || status === 'connecting' || status === 'ringing';

    return (
        <div className="h-full flex flex-col items-center justify-center p-4">
            <h2 className="text-2xl font-bold text-white mb-2">Eburon Call Center</h2>
            <p className="text-gray-400 mb-8">Speak with our AI Agent, Vanessa.</p>
            
            <AudioOrb 
                inputAnalyser={inputAnalyser}
                outputAnalyser={outputAnalyser}
                avatarUrl={VANESSA_AVATAR}
                status={status}
            />

            <p className="text-white text-lg font-semibold my-6 h-6">{statusText[status]}</p>
            
            {error && <p className="text-amber-400 mb-4">{error}</p>}
            
            {isCallActive ? (
                <button
                    onClick={closeSession}
                    className="w-20 h-20 bg-amber-600 rounded-full flex items-center justify-center text-white shadow-lg transform transition-transform hover:scale-105"
                >
                    <PhoneIcon className="w-8 h-8 rotate-[135deg]" />
                </button>
            ) : (
                <button
                    onClick={startSession}
                    className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center text-white shadow-lg transform transition-transform hover:scale-105"
                >
                    <PhoneIcon className="w-8 h-8" />
                </button>
            )}

            <p className="text-gray-500 text-sm mt-8">{ isCallActive ? 'Tap to hang up' : 'Tap to call' }</p>
        </div>
    );
};
