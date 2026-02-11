/**
 * PianoTab — Orchestrates note sequences & motor controls per class
 * 
 * Ported from: js/piano-player.js
 * 
 * Shows NoteSequencer and MotorSequencer for each trained class.
 * When predictions are active, triggers the matching class's sequence.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useAudioEngine } from '../../hooks/useAudioEngine.js';
import NoteSequencer from './NoteSequencer.jsx';
import MotorSequencer from './MotorSequencer.jsx';
import './PianoTab.css';

export default function PianoTab({ classNames, topPrediction, showToast }) {
    const audio = useAudioEngine();
    const [pianoEnabled, setPianoEnabled] = useState(true);
    const [motorEnabled, setMotorEnabled] = useState(false);
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
                <div className="piano-empty">
                    <span className="piano-empty-icon">🎹</span>
                    <h2>Piano Player</h2>
                    <p>Train at least one class in the Train tab to configure note sequences.</p>
                    <p className="piano-empty-hint">
                        Each trained class can trigger a unique musical sequence when detected.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="piano-tab animate-fade-in">
            {/* Controls Bar */}
            <div className="piano-controls card">
                <div className="piano-controls-row">
                    <div className="piano-toggles">
                        <label className="toggle-switch">
                            <input
                                type="checkbox"
                                checked={pianoEnabled}
                                onChange={(e) => setPianoEnabled(e.target.checked)}
                            />
                            <span className="toggle-slider" />
                            <span className="toggle-label">🎵 Notes</span>
                        </label>

                        <label className="toggle-switch">
                            <input
                                type="checkbox"
                                checked={motorEnabled}
                                onChange={(e) => setMotorEnabled(e.target.checked)}
                            />
                            <span className="toggle-slider" />
                            <span className="toggle-label">⚙️ Motors</span>
                        </label>
                    </div>

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
                        <button
                            className="btn btn-danger btn-sm"
                            onClick={handleStopAll}
                        >
                            ⏹ Stop All
                        </button>
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
            </div>

            {/* Note Sequences Section */}
            <div className="piano-section">
                <h3 className="piano-section-title">🎵 Note Sequences</h3>
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

            {/* Motor Sequences Section */}
            {motorEnabled && (
                <div className="piano-section animate-fade-in">
                    <h3 className="piano-section-title">⚙️ Motor Controls</h3>
                    <div className="piano-section-list">
                        {classNames.map((name, i) => (
                            <MotorSequencer
                                key={`motor-${name}-${i}`}
                                className={name}
                                classId={i}
                            />
                        ))}
                    </div>
                </div>
            )}
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
