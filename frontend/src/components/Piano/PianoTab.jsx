/**
 * PianoTab — Orchestrates note sequences per class
 * 
 * Shows NoteSequencer for each trained class.
 * When predictions are active, triggers the matching class's sequence.
 * Motor controls have been moved to the separate Motors tab.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import {
    MusicalNoteIcon,
    StopIcon,
} from '@heroicons/react/24/outline';
import { useAudioEngine } from '../../hooks/useAudioEngine.js';
import { Button } from '../ui/button.jsx';
import { Card } from '../ui/card.jsx';
import { Switch } from '../ui/switch.jsx';
import NoteSequencer from './NoteSequencer.jsx';
import './PianoTab.css';

export default function PianoTab({ classNames, topPrediction, showToast }) {
    const audio = useAudioEngine();
    const [pianoEnabled, setPianoEnabled] = useState(true);
    const [waveform, setWaveform] = useState('sine');
    const [isPlaying, setIsPlaying] = useState(false);

    // Refs to note sequencer slots for each class
    const sequencerSlotsRef = useRef({});

    // Register slots from each NoteSequencer
    const registerSlots = useCallback((className, getSlots) => {
        sequencerSlotsRef.current[className] = getSlots;
    }, []);

    // Play a sequence for a class
    const handlePlaySequence = useCallback(
        async (slots, onSlotPlay) => {
            if (isPlaying) return;
            setIsPlaying(true);
            try {
                await audio.playSequence(slots, waveform, onSlotPlay);
            } finally {
                setIsPlaying(false);
            }
        },
        [audio, waveform, isPlaying]
    );

    // Play a single test note
    const handlePlayNote = useCallback(
        (note, duration) => {
            audio.playNote(note, duration, waveform);
        },
        [audio, waveform]
    );

    // Stop all
    const handleStopAll = useCallback(() => {
        audio.stopAll();
        setIsPlaying(false);
    }, [audio]);

    // Handle prediction-triggered playback
    const lastPredRef = useRef(null);
    useEffect(() => {
        if (!pianoEnabled || !topPrediction || isPlaying) return;
        if (topPrediction.className === lastPredRef.current) return;

        lastPredRef.current = topPrediction.className;

        // Get slots for this class's sequencer
        const getSlots = sequencerSlotsRef.current[topPrediction.className];
        if (getSlots) {
            const slots = getSlots();
            handlePlaySequence(slots, null);
        }

        // Clear last prediction after a cooldown
        const timer = setTimeout(() => {
            lastPredRef.current = null;
        }, 1000);
        return () => clearTimeout(timer);
    }, [topPrediction, pianoEnabled, isPlaying, handlePlaySequence]);

    if (!classNames || classNames.length === 0) {
        return (
            <div className="piano-tab">
                <Card className="flex flex-col items-center justify-center gap-4 py-12 text-center">
                    <MusicalNoteIcon className="h-12 w-12 text-[var(--fg-muted)] opacity-40" />
                    <h2 className="text-lg font-bold">Piano Player</h2>
                    <p className="text-sm text-[var(--fg-dim)] max-w-[400px]">
                        Train at least one class in the Train tab to configure note sequences.
                    </p>
                    <p className="text-xs text-[var(--fg-muted)]">
                        Each trained class can trigger a unique musical sequence when detected.
                    </p>
                </Card>
            </div>
        );
    }

    return (
        <div className="piano-tab animate-fade-in">
            {/* Controls Bar */}
            <Card className="piano-controls">
                <div className="piano-controls-row">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <Switch
                            checked={pianoEnabled}
                            onCheckedChange={setPianoEnabled}
                        />
                        <span className="flex items-center gap-1.5 text-sm text-[var(--fg-dim)]">
                            <MusicalNoteIcon className="h-4 w-4" />
                            Auto-Play on Detection
                        </span>
                    </label>

                    <div className="piano-waveform">
                        <label className="piano-waveform-label">Waveform</label>
                        <select
                            className="piano-waveform-select"
                            value={waveform}
                            onChange={(e) => setWaveform(e.target.value)}
                        >
                            {audio.WAVEFORMS.map((w) => (
                                <option key={w} value={w}>
                                    {w.charAt(0).toUpperCase() + w.slice(1)}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="piano-actions">
                        <Button
                            variant="danger"
                            size="sm"
                            onClick={handleStopAll}
                        >
                            <StopIcon className="h-3.5 w-3.5" />
                            Stop All
                        </Button>
                    </div>
                </div>

                {topPrediction && pianoEnabled && (
                    <div className="piano-now-playing">
                        <span className="now-playing-dot" />
                        <span>Detected: <strong>{topPrediction.className}</strong></span>
                        <span className="now-playing-conf">
                            {Math.round(topPrediction.confidence * 100)}%
                        </span>
                    </div>
                )}
            </Card>

            {/* Note Sequences */}
            <div className="piano-section">
                <h3 className="piano-section-title flex items-center gap-2">
                    <MusicalNoteIcon className="h-5 w-5 text-[var(--purple)]" />
                    Note Sequences
                </h3>
                <div className="piano-section-list">
                    {classNames.map((name, i) => (
                        <NoteSequencerWithRef
                            key={`note-${name}-${i}`}
                            className={name}
                            classId={i}
                            onPlaySequence={handlePlaySequence}
                            onPlayNote={handlePlayNote}
                            notes={audio.NOTES}
                            durations={audio.DURATIONS}
                            isPlaying={isPlaying}
                            registerSlots={registerSlots}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}

/**
 * Wrapper to expose NoteSequencer's getSlots via registerSlots callback
 */
function NoteSequencerWithRef({
    className: seqClassName,
    classId,
    onPlaySequence,
    onPlayNote,
    notes,
    durations,
    isPlaying,
    registerSlots,
}) {
    const slotsRef = useRef(NoteSequencer.getDefaultSlots());

    // Re-register whenever slots might change
    useEffect(() => {
        registerSlots(seqClassName, () => slotsRef.current);
    }, [seqClassName, registerSlots]);

    const handlePlaySequence = useCallback(
        (slots, onSlotPlay) => {
            slotsRef.current = slots;
            onPlaySequence(slots, onSlotPlay);
        },
        [onPlaySequence]
    );

    return (
        <NoteSequencer
            className={seqClassName}
            classId={classId}
            onPlaySequence={handlePlaySequence}
            onPlayNote={onPlayNote}
            notes={notes}
            durations={durations}
            isPlaying={isPlaying}
        />
    );
}
