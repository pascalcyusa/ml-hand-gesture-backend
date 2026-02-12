/**
 * useAudioEngine — Web Audio API synthesizer
 * 
 * Replaces the PyScript main.py audio bridge.
 * Pure JavaScript — no Python dependency needed.
 */

import { useRef, useCallback } from 'react';

// ── Note → Frequency Map ──
const NOTE_FREQUENCIES = {
    'C3': 130.81, 'C#3': 138.59, 'D3': 146.83, 'D#3': 155.56, 'E3': 164.81, 'F3': 174.61,
    'F#3': 185.00, 'G3': 196.00, 'G#3': 207.65, 'A3': 220.00, 'A#3': 233.08, 'B3': 246.94,
    'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'D#4': 311.13, 'E4': 329.63, 'F4': 349.23,
    'F#4': 369.99, 'G4': 392.00, 'G#4': 415.30, 'A4': 440.00, 'A#4': 466.16, 'B4': 493.88,
    'C5': 523.25, 'C#5': 554.37, 'D5': 587.33, 'D#5': 622.25, 'E5': 659.25, 'F5': 698.46,
    'F#5': 739.99, 'G5': 783.99, 'G#5': 830.61, 'A5': 880.00, 'A#5': 932.33, 'B5': 987.77,
};

const DURATION_MAP = {
    'very short': 0.1,
    'short': 0.2,
    'medium': 0.5,
    'long': 1.0,
    'very long': 2.0,
};

const DURATIONS = Object.keys(DURATION_MAP);
const NOTES = Object.keys(NOTE_FREQUENCIES);

// Waveform types
const WAVEFORMS = ['sine', 'square', 'sawtooth', 'triangle'];

export function useAudioEngine() {
    const ctxRef = useRef(null);
    const activeOscillatorsRef = useRef([]);

    // Lazy-init AudioContext (must be after user gesture)
    const getContext = useCallback(() => {
        if (!ctxRef.current) {
            ctxRef.current = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (ctxRef.current.state === 'suspended') {
            ctxRef.current.resume();
        }
        return ctxRef.current;
    }, []);

    // Play a single note
    const playNote = useCallback((note, durationLabel, waveform = 'sine') => {
        const ctx = getContext();
        const freq = NOTE_FREQUENCIES[note];
        if (!freq) return;

        const duration = DURATION_MAP[durationLabel] || 0.5;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = waveform;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);

        // ADSR-like envelope
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 0.01);
        gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + duration * 0.3);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + duration + 0.01);

        activeOscillatorsRef.current.push(osc);
        osc.onended = () => {
            activeOscillatorsRef.current = activeOscillatorsRef.current.filter((o) => o !== osc);
        };

        return duration;
    }, [getContext]);

    // Play a sequence of notes with delays
    const playSequence = useCallback(async (slots, waveform = 'sine', onSlotPlay) => {
        for (let i = 0; i < slots.length; i++) {
            const slot = slots[i];

            if (slot.isDelay) {
                // Delay slot — just wait
                const delayMs = (DURATION_MAP[slot.duration] || 0.5) * 1000;
                await new Promise((r) => setTimeout(r, delayMs));
            } else {
                // Note slot — play and wait
                if (onSlotPlay) onSlotPlay(i);
                const duration = playNote(slot.note, slot.duration, waveform);
                await new Promise((r) => setTimeout(r, (duration || 0.5) * 1000));
            }
        }
    }, [playNote]);

    // Stop all audio
    const stopAll = useCallback(() => {
        const ctx = ctxRef.current;
        if (!ctx) return;

        // Stop all oscillators
        activeOscillatorsRef.current.forEach((osc) => {
            try { osc.stop(); } catch { /* already stopped */ }
        });
        activeOscillatorsRef.current = [];

        // Suspend and resume to kill everything
        if (ctx.state === 'running') {
            ctx.suspend().then(() => ctx.resume());
        }
    }, []);

    return {
        playNote,
        playSequence,
        stopAll,
        NOTES,
        DURATIONS,
        WAVEFORMS,
        NOTE_FREQUENCIES,
        DURATION_MAP,
    };
}
