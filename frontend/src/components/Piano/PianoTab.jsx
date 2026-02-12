import { useState, useCallback, useRef, useEffect } from 'react';
import {
    MusicalNoteIcon,
    StopIcon,
    CloudArrowUpIcon,
    CloudArrowDownIcon,
} from '@heroicons/react/24/outline';
import { useAudioEngine } from '../../hooks/useAudioEngine.js';
import { useStorageManager } from '../../hooks/useStorageManager.js';
import { useAuth } from '../../hooks/useAuth.js';
import { Button } from '../ui/button.jsx';
import { Card } from '../ui/card.jsx';
import { Input } from '../ui/input.jsx';
import NoteSequencer from './NoteSequencer.jsx';
import WebcamPanel from '../Training/WebcamPanel.jsx';
import PredictionBars from '../Training/PredictionBars.jsx';
import './PianoTab.css';

export default function PianoTab({ classNames, topPrediction, showToast, hand, prediction }) {
    const audio = useAudioEngine();
    const storage = useStorageManager();
    const { user } = useAuth();

    // Default settings (simplified UI)
    const [pianoEnabled] = useState(true);
    const [waveform] = useState('sine');
    const [isPlaying, setIsPlaying] = useState(false);

    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [showLoadDialog, setShowLoadDialog] = useState(false);
    const [saveName, setSaveName] = useState('');
    const [savedSequences, setSavedSequences] = useState([]);

    // Refs to note sequencer slots for each class
    const sequencerSlotsRef = useRef({});

    // Register slots from each NoteSequencer
    const registerSlots = useCallback((className, getSlots) => {
        sequencerSlotsRef.current[className] = getSlots;
    }, []);

    const [sequencerData, setSequencerData] = useState({}); // { className: slots[] }

    // Start camera when tab mounts
    const handleVideoReady = useCallback((video, canvas) => {
        hand.start(video, canvas);
    }, [hand]);

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

        const timer = setTimeout(() => {
            lastPredRef.current = null;
        }, 1000);
        return () => clearTimeout(timer);
    }, [topPrediction, pianoEnabled, isPlaying, handlePlaySequence]);

    // ── Persistence Handlers ──

    const handleSave = async () => {
        if (!saveName.trim()) return showToast('Enter a name', 'warning');

        // Gather all current slots
        const currentData = {};
        classNames.forEach(name => {
            if (sequencerSlotsRef.current[name]) {
                currentData[name] = sequencerSlotsRef.current[name]();
            }
        });

        const success = await storage.savePianoSequence(saveName, currentData, true); // Active by default
        if (success) {
            showToast('Sequence saved!', 'success');
            setShowSaveDialog(false);
        } else {
            showToast('Failed to save', 'error');
        }
    };

    const handleLoadList = async () => {
        const list = await storage.getPianoSequences();
        setSavedSequences(list);
        setShowLoadDialog(true);
    };

    const handleLoad = (sequence) => {
        if (sequence.data) {
            setSequencerData(sequence.data);
            showToast(`Loaded "${sequence.name_or_title}"`, 'success');
            setShowLoadDialog(false);
        }
    };

    if (!classNames || classNames.length === 0) {
        return (
            <div className="piano-tab">
                <Card className="flex flex-col items-center justify-center gap-4 py-12 text-center">
                    <MusicalNoteIcon className="h-12 w-12 text-[var(--fg-muted)] opacity-40" />
                    <h2 className="text-lg font-bold">Piano Player</h2>
                    <p className="text-sm text-[var(--fg-dim)] max-w-[400px]">
                        Train at least one class in the Train tab to configure note sequences.
                    </p>
                </Card>
            </div>
        );
    }

    return (
        <div className="piano-layout animate-fade-in relative">
            {/* ── Save Dialog ── */}
            {showSaveDialog && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <Card className="w-full max-w-sm p-5 space-y-4 shadow-2xl">
                        <h3 className="font-bold">Save Configuration</h3>
                        <Input
                            placeholder="e.g. Dreamy Chords"
                            value={saveName}
                            onChange={e => setSaveName(e.target.value)}
                        />
                        <div className="flex justify-end gap-2">
                            <Button variant="ghost" onClick={() => setShowSaveDialog(false)}>Cancel</Button>
                            <Button onClick={handleSave}>Save</Button>
                        </div>
                    </Card>
                </div>
            )}

            {/* ── Load Dialog ── */}
            {showLoadDialog && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <Card className="w-full max-w-md p-5 space-y-4 shadow-2xl max-h-[80vh] flex flex-col">
                        <div className="flex justify-between items-center">
                            <h3 className="font-bold">Load Configuration</h3>
                            <Button variant="ghost" size="sm" onClick={() => setShowLoadDialog(false)}>Close</Button>
                        </div>
                        <div className="overflow-y-auto space-y-2 flex-1">
                            {savedSequences.length === 0 ? <p className="text-sm text-[var(--fg-muted)]">No saved sequences.</p> :
                                savedSequences.map(s => (
                                    <button key={s.id} onClick={() => handleLoad(s)} className="w-full text-left p-3 rounded bg-[var(--bg3)] hover:bg-[var(--bg2)] flex justify-between">
                                        <span className="font-medium">{s.name_or_title}</span>
                                        <span className="text-xs text-[var(--fg-muted)]">{new Date(s.created_at).toLocaleDateString()}</span>
                                    </button>
                                ))}
                        </div>
                    </Card>
                </div>
            )}

            {/* Left Column: Camera & Predictions */}
            <div className="piano-left flex flex-col gap-6">
                <WebcamPanel
                    onVideoReady={handleVideoReady}
                    isDetecting={hand.isHandDetected || prediction.isPredicting}
                />
                <PredictionBars
                    predictions={prediction.predictions}
                    classNames={classNames}
                />
            </div>

            {/* Right Column: Piano Controls */}
            <div className="piano-right flex flex-col gap-6">

                {/* Controls Bar */}
                <Card className="piano-controls">
                    <div className="piano-controls-row">
                        <div className="flex items-center gap-2">
                            <MusicalNoteIcon className="h-6 w-6 text-[var(--purple)]" />
                            <h2 className="text-lg font-semibold">Piano Sequencer</h2>
                        </div>

                        <div className="flex items-center gap-2 ml-auto">
                            {user && (
                                <>
                                    <Button variant="ghost" size="sm" onClick={handleLoadList}>
                                        <CloudArrowDownIcon className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => setShowSaveDialog(true)}>
                                        <CloudArrowUpIcon className="h-4 w-4" />
                                    </Button>
                                </>
                            )}
                            <Button
                                variant="danger"
                                size="sm"
                                onClick={handleStopAll}
                            >
                                <StopIcon className="h-3.5 w-3.5" />
                                Stop
                            </Button>
                        </div>
                    </div>
                </Card>

                {/* Note Sequences */}
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
                            initialSlots={sequencerData[name]}
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
    initialSlots,
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
            initialSlots={initialSlots} // Pass down
        />
    );
}
