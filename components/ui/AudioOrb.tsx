import React, { useRef, useEffect } from 'react';

interface AudioOrbProps {
  inputAnalyser: AnalyserNode | null;
  outputAnalyser: AnalyserNode | null;
  avatarUrl: string;
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
}

export const AudioOrb: React.FC<AudioOrbProps> = ({ inputAnalyser, outputAnalyser, avatarUrl, status }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const avatarImageRef = useRef<HTMLImageElement | null>(null);
  // FIX: Initialize useRef with null and update the type to be nullable to fix the TypeScript error.
  const animationFrameId = useRef<number | null>(null);

  useEffect(() => {
    // FIX: Replaced `new Image()` with `document.createElement('img')` to resolve "Expected 1 arguments, but got 0" error.
    const image = document.createElement('img');
    image.crossOrigin = 'anonymous';
    image.src = avatarUrl;
    image.onload = () => {
      avatarImageRef.current = image;
    };
  }, [avatarUrl]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;
      const baseRadius = width / 4;

      ctx.clearRect(0, 0, width, height);

      let inputVolume = 0;
      if (inputAnalyser) {
        const dataArray = new Uint8Array(inputAnalyser.frequencyBinCount);
        inputAnalyser.getByteFrequencyData(dataArray);
        inputVolume = dataArray.reduce((a, b) => a + b, 0) / dataArray.length / 128.0;
      }
      
      let outputVolume = 0;
      if (outputAnalyser) {
        const dataArray = new Uint8Array(outputAnalyser.frequencyBinCount);
        outputAnalyser.getByteFrequencyData(dataArray);
        outputVolume = dataArray.reduce((a, b) => a + b, 0) / dataArray.length / 128.0;
      }

      // Outer ring (Vanessa's voice) - Cyan/Blue
      const outputRadius = baseRadius + (outputVolume * baseRadius * 0.5);
      ctx.beginPath();
      ctx.arc(centerX, centerY, outputRadius, 0, 2 * Math.PI);
      const outputGlow = ctx.createRadialGradient(centerX, centerY, baseRadius, centerX, centerY, outputRadius + 15);
      outputGlow.addColorStop(0, `rgba(34, 211, 238, ${outputVolume * 0.7})`); // cyan-400
      outputGlow.addColorStop(1, `rgba(34, 211, 238, 0)`);
      ctx.fillStyle = outputGlow;
      ctx.fill();

      // Inner orb (User's voice) - Amber
      const inputRadius = baseRadius + (inputVolume * baseRadius * 0.2);
      ctx.beginPath();
      ctx.arc(centerX, centerY, inputRadius, 0, 2 * Math.PI);
      const inputGlow = ctx.createRadialGradient(centerX, centerY, baseRadius * 0.8, centerX, centerY, inputRadius + 10);
      inputGlow.addColorStop(0, `rgba(251, 191, 36, ${inputVolume * 0.8})`); // amber-400
      inputGlow.addColorStop(1, `rgba(251, 191, 36, 0)`);
      ctx.fillStyle = inputGlow;
      ctx.fill();

      // Base orb circle
      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius, 0, 2 * Math.PI);
      ctx.fillStyle = '#1f2937'; // gray-800
      ctx.fill();
      
      // Avatar image
      if (avatarImageRef.current && avatarImageRef.current.complete) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(centerX, centerY, baseRadius, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(avatarImageRef.current, centerX - baseRadius, centerY - baseRadius, baseRadius * 2, baseRadius * 2);
        ctx.restore();
      }
      
      // Border
      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius, 0, 2 * Math.PI);
      ctx.strokeStyle = '#374151'; // gray-700
      ctx.lineWidth = 2;
      ctx.stroke();

      animationFrameId.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [inputAnalyser, outputAnalyser, status]);

  return <canvas ref={canvasRef} width="300" height="300" className="w-48 h-48 md:w-56 md:h-56" />;
};
