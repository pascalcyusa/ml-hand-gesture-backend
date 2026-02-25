import { useState, useCallback, useRef, useEffect } from 'react';
import {
    MusicalNoteIcon,
    StopIcon,
    CloudArrowUpIcon,
    CloudArrowDownIcon,
    PlayIcon,
    TrashIcon,
} from '@heroicons/react/24/outline';
import { useAudioEngine } from '../../hooks/useAudioEngine.js';
import { useStorageManager } from '../../hooks/useStorageManager.js';
import { useSessionStorage } from '../../hooks/useSessionStorage.js';
import { useAuth } from '../../hooks/useAuth.js';
import { Button } from '../ui/button.jsx';
import { Card } from '../ui/card.jsx';
import { Input } from '../ui/input.jsx';
import ConfirmDialog from '../common/ConfirmDialog.jsx';
import NoteSequencer from './NoteSequencer.jsx';
import WebcamPanel from '../Training/WebcamPanel.jsx';
import PredictionBars from '../Training/PredictionBars.jsx';
import './PianoTab.css';

export default function PianoTab({ classNames, topPrediction, showToast, hand, prediction, trainer }) {
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
    const [isCameraStarted, setIsCameraStarted] = useState(hand.isRunning);

    const videoReadyRef = useRef(false);

    const [deleteConfirm, setDeleteConfirm] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: null
    });

    const [sequencerData, setSequencerData] = useSessionStorage('piano_draft', {}); // { className: slots[] }

    // Start camera when tab mounts
    const handleVideoReady = useCallback((video, canvas) => {
        if (videoReadyRef.current) return;
        videoReadyRef.current = true;
        hand.start(video, canvas);
    }, [hand]);

    const handleStartCamera = useCallback(() => {
        setIsCameraStarted(true);
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

    // Play all Configured Sequences
    const handlePlayAll = useCallback(async () => {
        if (isPlaying) return;
        setIsPlaying(true);
        try {
            for (const name of classNames) {
                const slots = sequencerData[name];
                if (slots) {
                    // Optional: Highlight the class currently playing or show a toast
                    await showToast(`Playing ${name}...`, 'info', 1000);

                    // Filter out empty slots to check if we should play
                    const hasNotes = slots.some(s => !s.isDelay);
                    if (hasNotes) {
                        await audio.playSequence(slots, waveform);
                        // Small buffer between classes
                        await new Promise(r => setTimeout(r, 500));
                    }
                }
            }
        } finally {
            setIsPlaying(false);
        }
    }, [classNames, isPlaying, audio, waveform]);

    // Handle prediction-triggered playback
    const lastPredRef = useRef(null);
    const lastTimeRef = useRef(0);
    const sequencerDataRef = useRef(sequencerData);
    useEffect(() => {
        sequencerDataRef.current = sequencerData;
    }, [sequencerData]);

    useEffect(() => {
        if (!pianoEnabled || !topPrediction || isPlaying) {
            if (!topPrediction) {
                // Reset last prediction when hand is hidden/no gesture
                lastPredRef.current = null;
            }
            return;
        }

        const now = Date.now();
        // Prevent re-triggering the same class within 1 second of it starting
        if (topPrediction.className === lastPredRef.current && now - lastTimeRef.current < 1000) {
            return;
        }

        lastPredRef.current = topPrediction.className;
        lastTimeRef.current = now;

        // Get slots for this class's sequencer from sequencerData ref
        const slots = sequencerDataRef.current[topPrediction.className];
        if (slots) {
            handlePlaySequence(slots, null);
        }
    }, [topPrediction, pianoEnabled, isPlaying, handlePlaySequence]);

    const handleSlotsChange = useCallback((className, newSlots) => {
        setSequencerData((prev) => ({
            ...prev,
            [className]: newSlots
        }));
    }, [setSequencerData]);

    // ── Session State Persistence ──
    // Live save is now handled by handleSlotsChange below
    // ── Persistence Handlers ──

    const handleSave = async () => {
        if (!saveName.trim()) return showToast('Enter a name', 'warning');

        const currentData = sequencerData;

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

    const handleDelete = (id, name) => {
        setDeleteConfirm({
            isOpen: true,
            title: 'Delete Sequence',
            message: `Are you sure you want to delete sequence "${name}"?`,
            onConfirm: async () => {
                const success = await storage.deletePianoSequence(id);
                if (success) {
                    setSavedSequences(prev => prev.filter(s => s.id !== id));
                    showToast("Sequence deleted", "success");
                } else {
                    showToast("Failed to delete", "error");
                }
                setDeleteConfirm(prev => ({ ...prev, isOpen: false }));
            }
        });
    };

    if (!classNames || classNames.length === 0 || !trainer?.isTrained) {
        return (
            <div className="piano-tab animate-fade-in">
                <div className="piano-header">
                    <h2 className="flex items-center gap-2">
                        <MusicalNoteIcon className="h-6 w-6 text-[var(--primary)]" />
                        Piano Player
                    </h2>
                </div>
                <Card className="flex flex-col items-center justify-center gap-4 py-12 text-center">
                    <MusicalNoteIcon className="h-16 w-16 text-[var(--primary)] opacity-20" />
                    <h2 className="text-xl font-bold text-[var(--fg-dim)]">Model Not Trained</h2>
                    <p className="text-[var(--fg-muted)] max-w-[400px]">
                        Train gesture classes in the Train tab, or load a pre-trained model to start playing music.
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
                                    <div key={s.id} className="flex gap-2 items-center w-full p-2 hover:bg-[var(--bg3)] rounded">
                                        <button onClick={() => handleLoad(s)} className="flex-1 text-left">
                                            <div className="font-medium">{s.name_or_title}</div>
                                            <div className="text-xs text-[var(--fg-muted)]">{new Date(s.created_at).toLocaleDateString()}</div>
                                        </button>
                                        <button
                                            className="p-2 text-[var(--fg-muted)] hover:text-[var(--red)] transition-colors"
                                            onClick={(e) => { e.stopPropagation(); handleDelete(s.id, s.name_or_title); }}
                                            title="Delete"
                                        >
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </div>
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
                    isStarted={isCameraStarted}
                    onStartCamera={handleStartCamera}
                    showVideo={hand.showVideo}
                    onToggleVideo={hand.setShowVideo}
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
                            <MusicalNoteIcon className="h-6 w-6 text-[var(--primary)]" />
                            <h2 className="text-lg font-semibold">Piano Sequencer</h2>
                        </div>

                        <div className="flex items-center gap-2 ml-auto">
                            {user && (
                                <>
                                    <Button variant="ghost" size="sm" onClick={handleLoadList}>
                                        <CloudArrowDownIcon className="h-4 w-4" />
                                        Load
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => setShowSaveDialog(true)}>
                                        <CloudArrowUpIcon className="h-4 w-4" />
                                        Save
                                    </Button>
                                </>
                            )}
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={handlePlayAll}
                                disabled={isPlaying}
                            >
                                <PlayIcon className="h-3.5 w-3.5" />
                                Play All
                            </Button>
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
                            onSlotsChange={handleSlotsChange}
                            initialSlots={sequencerData[name]}
                        />
                    ))}
                </div>
            </div >

            <ConfirmDialog
                isOpen={deleteConfirm.isOpen}
                title={deleteConfirm.title}
                message={deleteConfirm.message}
                onConfirm={deleteConfirm.onConfirm}
                onCancel={() => setDeleteConfirm(prev => ({ ...prev, isOpen: false }))}
                confirmText="Delete"
                isDangerous={true}
            />
        </div >
    );
}

/**
 * Wrapper to expose NoteSequencer's changes
 */
function NoteSequencerWithRef({
    className: seqClassName,
    classId,
    onPlaySequence,
    onPlayNote,
    notes,
    durations,
    isPlaying,
    onSlotsChange,
    initialSlots,
}) {
    // Also need to push live edits from NoteSequencer to the parent
    const handleSlotsChange = useCallback((newSlots) => {
        onSlotsChange(seqClassName, newSlots);
    }, [seqClassName, onSlotsChange]);

    const handlePlaySequence = useCallback(
        (slots, onSlotPlay) => {
            handleSlotsChange(slots); // Ensure parent has latest
            onPlaySequence(slots, onSlotPlay);
        },
        [onPlaySequence, handleSlotsChange]
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
            onChange={handleSlotsChange}
        />
    );
}
