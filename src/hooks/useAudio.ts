'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type SoundEffect = 'lock-on' | 'spin-up' | 'confirm';

interface AudioBuffers {
  'lock-on': AudioBuffer | null;
  'spin-up': AudioBuffer | null;
  'confirm': AudioBuffer | null;
}

// Singleton audio context (shared across hooks)
let audioContext: AudioContext | null = null;
let audioBuffers: AudioBuffers = {
  'lock-on': null,
  'spin-up': null,
  'confirm': null,
};
let isLoaded = false;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
}

/**
 * Generate a synthetic sci-fi beep sound
 */
function generateBeep(ctx: AudioContext, frequency: number, duration: number, type: OscillatorType = 'sine'): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const length = sampleRate * duration;
  const buffer = ctx.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < length; i++) {
    const t = i / sampleRate;
    const envelope = Math.exp(-t * 8) * Math.min(t * 50, 1); // Fast attack, exponential decay
    const wave = Math.sin(2 * Math.PI * frequency * t);
    data[i] = wave * envelope * 0.3;
  }

  return buffer;
}

/**
 * Generate a lock-on chirp sound (rising frequency beep)
 */
function generateLockOn(ctx: AudioContext): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const duration = 0.15;
  const length = sampleRate * duration;
  const buffer = ctx.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < length; i++) {
    const t = i / sampleRate;
    const progress = t / duration;
    // Rising frequency from 800Hz to 1600Hz
    const frequency = 800 + (progress * 800);
    const envelope = Math.exp(-t * 6) * Math.min(t * 100, 1);
    const wave = Math.sin(2 * Math.PI * frequency * t);
    // Add a second harmonic for richness
    const harmonic = Math.sin(2 * Math.PI * frequency * 2 * t) * 0.3;
    data[i] = (wave + harmonic) * envelope * 0.25;
  }

  return buffer;
}

/**
 * Generate a spin-up whir sound (mechanical hum)
 */
function generateSpinUp(ctx: AudioContext): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const duration = 0.25;
  const length = sampleRate * duration;
  const buffer = ctx.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < length; i++) {
    const t = i / sampleRate;
    const progress = t / duration;
    // Rising frequency from 100Hz to 400Hz
    const frequency = 100 + (progress * progress * 300);
    const envelope = Math.sin(progress * Math.PI) * 0.5; // Fade in and out
    // Mix of frequencies for mechanical sound
    const wave = Math.sin(2 * Math.PI * frequency * t) * 0.5
               + Math.sin(2 * Math.PI * frequency * 1.5 * t) * 0.3
               + Math.sin(2 * Math.PI * frequency * 2 * t) * 0.2;
    // Add some noise for texture
    const noise = (Math.random() * 2 - 1) * 0.1;
    data[i] = (wave + noise) * envelope * 0.2;
  }

  return buffer;
}

/**
 * Generate a confirmation ping sound
 */
function generateConfirm(ctx: AudioContext): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const duration = 0.12;
  const length = sampleRate * duration;
  const buffer = ctx.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < length; i++) {
    const t = i / sampleRate;
    const frequency = 1200;
    const envelope = Math.exp(-t * 12) * Math.min(t * 200, 1);
    // Pure tone with slight detune for shimmer
    const wave = Math.sin(2 * Math.PI * frequency * t)
               + Math.sin(2 * Math.PI * (frequency * 1.01) * t) * 0.5;
    data[i] = wave * envelope * 0.2;
  }

  return buffer;
}

/**
 * Initialize audio buffers
 */
async function initAudioBuffers(): Promise<void> {
  if (isLoaded) return;

  try {
    const ctx = getAudioContext();

    // Resume context if suspended (browser autoplay policy)
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    // Generate synthetic sounds
    audioBuffers['lock-on'] = generateLockOn(ctx);
    audioBuffers['spin-up'] = generateSpinUp(ctx);
    audioBuffers['confirm'] = generateConfirm(ctx);

    isLoaded = true;
  } catch (error) {
    console.warn('Failed to initialize audio:', error);
  }
}

/**
 * Hook for playing JARVIS-style sound effects
 */
export function useAudio() {
  const [isMuted, setIsMuted] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const initAttempted = useRef(false);

  // Initialize audio on first user interaction
  useEffect(() => {
    if (initAttempted.current) return;
    initAttempted.current = true;

    const handleInteraction = async () => {
      await initAudioBuffers();
      setIsReady(true);
      // Remove listeners after first interaction
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
    };

    // Audio context needs user interaction to start
    window.addEventListener('click', handleInteraction);
    window.addEventListener('keydown', handleInteraction);

    return () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
    };
  }, []);

  const play = useCallback((effect: SoundEffect, volume: number = 0.3) => {
    if (isMuted || !isLoaded) return;

    const buffer = audioBuffers[effect];
    if (!buffer) return;

    try {
      const ctx = getAudioContext();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const source = ctx.createBufferSource();
      const gainNode = ctx.createGain();

      source.buffer = buffer;
      gainNode.gain.value = volume;

      source.connect(gainNode);
      gainNode.connect(ctx.destination);

      source.start();
    } catch (error) {
      console.warn('Failed to play sound:', error);
    }
  }, [isMuted]);

  const playAcquisitionSequence = useCallback(() => {
    if (isMuted || !isLoaded) return;

    // Lock-on immediately
    play('lock-on', 0.3);

    // Spin-up after 100ms
    setTimeout(() => play('spin-up', 0.2), 100);

    // Confirm after 350ms
    setTimeout(() => play('confirm', 0.3), 350);
  }, [isMuted, play]);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);

  return {
    play,
    playAcquisitionSequence,
    isMuted,
    toggleMute,
    isReady,
  };
}
