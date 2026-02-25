/**
 * NoteSequencer — Per-class note sequence configuration
 *
 * Modified to support interactive virtual piano for note selection.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import {
    MusicalNoteIcon,
    ChevronRightIcon,
    ChevronDownIcon,
    PlayIcon,
    PlusIcon,
    MinusIcon,
    ArrowPathIcon,
    SpeakerWaveIcon,
    PauseIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline';
import { Button } from '../ui/button.jsx';
import PianoKeyboard from './PianoKeyboard.jsx';
import './NoteSequencer.css';

const DEFAULT_SLOT_COUNT = 4;

function createDefaultSlot(index) {
    return {
        id: index,
        isDelay: false,
        note: 'C4',
        duration: 'medium',
    };
}

export default function NoteSequencer({
    className,
    classId,
    onPlaySequence,
    onPlayNote,
    notes,      // still passed but used less directly
    durations,
    isPlaying,
    initialSlots = null,
    onChange = null,
}) {
    const [slots, setSlots] = useState(() =>
        initialSlots || Array.from({ length: DEFAULT_SLOT_COUNT }, (_, i) => createDefaultSlot(i))
    );
    const [collapsed, setCollapsed] = useState(false);
    const [playingSlot, setPlayingSlot] = useState(-1);
    const [editingSlotIndex, setEditingSlotIndex] = useState(null); // The index of the slot being edited via piano

    // Bubble state changes up to parent so it can persist without requiring a "Play" action.
    // We skip the very first render to avoid calling onChange with the initial/hydrated value,
    // which would cause a setSequencerData → re-render → effect loop (Maximum update depth exceeded).
    const isMountedRef = useRef(false);
    useEffect(() => {
        if (!isMountedRef.current) {
            isMountedRef.current = true;
            return; // skip initial mount
        }
        if (onChange) {
            onChange(slots);
        }
    }, [slots, onChange]);

    // Update a slot
    const updateSlot = useCallback((slotId, field, value) => {
        setSlots((prev) =>
            prev.map((s) => (s.id === slotId ? { ...s, [field]: value } : s))
        );
    }, []);

    // Toggle between note and delay
    const toggleSlotType = useCallback((slotId) => {
        setSlots((prev) =>
            prev.map((s) =>
                s.id === slotId ? { ...s, isDelay: !s.isDelay } : s
            )
        );
    }, []);

    // Add a slot
    const addSlot = useCallback(() => {
        setSlots((prev) => [...prev, createDefaultSlot(prev.length)]);
    }, []);

    // Remove last slot
    const removeSlot = useCallback(() => {
        setSlots((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
        // If we removed the slot being edited, close the keyboard
        if (editingSlotIndex !== null && editingSlotIndex >= slots.length - 1) {
            setEditingSlotIndex(null);
        }
    }, [slots.length, editingSlotIndex]);

    // Reset to defaults
    const resetSlots = useCallback(() => {
        setSlots(Array.from({ length: DEFAULT_SLOT_COUNT }, (_, i) => createDefaultSlot(i)));
        setEditingSlotIndex(null);
    }, []);

    // Test a single note
    const handleTestNote = useCallback((slot) => {
        if (!slot.isDelay && onPlayNote) {
            onPlayNote(slot.note, slot.duration);
        }
    }, [onPlayNote]);

    // Play the full sequence
    const handlePlaySequence = useCallback(() => {
        if (onPlaySequence) {
            onPlaySequence(slots, (slotIndex) => {
                setPlayingSlot(slotIndex);
            });
            // Clear playing slot after sequence duration (approx, handled by parent mostly)
            const totalDuration = slots.reduce((acc, s) => {
                const d = s.duration === 'very short' ? 100 : s.duration === 'short' ? 200 : s.duration === 'medium' ? 500 : s.duration === 'long' ? 1000 : 2000;
                return acc + d;
            }, 0);
            setTimeout(() => setPlayingSlot(-1), totalDuration + 500);
        }
    }, [slots, onPlaySequence]);

    // Handle piano key click
    const handlePianoNoteSelect = (note) => {
        if (editingSlotIndex !== null) {
            const slot = slots[editingSlotIndex];
            updateSlot(slot.id, 'note', note);
            if (onPlayNote) onPlayNote(note, slot.duration);
        }
    };

    const toggleEditSlot = (index) => {
        if (editingSlotIndex === index) {
            setEditingSlotIndex(null);
        } else {
            setEditingSlotIndex(index);
        }
    };

    return (
        <div className={`note-sequencer ${collapsed ? 'collapsed' : ''}`}>
            <div className="note-seq-header" onClick={() => setCollapsed(!collapsed)}>
                <div className="note-seq-title">
                    <MusicalNoteIcon className="h-4 w-4 text-[var(--primary)]" />
                    <span className="note-seq-name">{className}</span>
                    <span className="note-seq-slot-count">{slots.length} slots</span>
                </div>
                <div className="note-seq-header-actions">
                    <Button
                        variant="primary"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); handlePlaySequence(); }}
                        disabled={isPlaying}
                    >
                        <PlayIcon className="h-3.5 w-3.5" />
                        Test
                    </Button>
                    {collapsed ? (
                        <ChevronRightIcon className="h-4 w-4 text-[var(--fg-muted)]" />
                    ) : (
                        <ChevronDownIcon className="h-4 w-4 text-[var(--fg-muted)]" />
                    )}
                </div>
            </div>

            {!collapsed && (
                <div className="note-seq-body animate-fade-in">
                    <div className="note-seq-slots">
                        {slots.map((slot, i) => (
                            <div
                                key={slot.id}
                                className={`note-slot ${slot.isDelay ? 'delay' : 'note'} ${playingSlot === i ? 'playing' : ''} ${editingSlotIndex === i ? 'editing' : ''}`}
                                onClick={() => !slot.isDelay && toggleEditSlot(i)}
                            >
                                <div className="note-slot-header">
                                    <span className="note-slot-index">{i + 1}</span>
                                    <label className="note-slot-type-toggle" onClick={(e) => e.stopPropagation()}>
                                        <input
                                            type="checkbox"
                                            checked={slot.isDelay}
                                            onChange={() => {
                                                toggleSlotType(slot.id);
                                                if (editingSlotIndex === i) setEditingSlotIndex(null);
                                            }}
                                        />
                                        <span className="note-slot-type-label flex items-center gap-1">
                                            {slot.isDelay ? (
                                                <PauseIcon className="h-3 w-3" />
                                            ) : (
                                                <MusicalNoteIcon className="h-3 w-3" />
                                            )}
                                        </span>
                                    </label>
                                </div>

                                {!slot.isDelay ? (
                                    <div className="note-slot-content">
                                        <div className="note-display">
                                            <span className="note-name">{slot.note}</span>
                                            <span className="note-edit-hint">Click to edit</span>
                                        </div>
                                        <div className="note-duration-control" onClick={(e) => e.stopPropagation()}>
                                            <select
                                                className="duration-select"
                                                value={slot.duration}
                                                onChange={(e) => updateSlot(slot.id, 'duration', e.target.value)}
                                            >
                                                {durations.map((d) => (
                                                    <option key={d} value={d}>{d}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="note-slot-config delay-config" onClick={(e) => e.stopPropagation()}>
                                        <div className="note-display">
                                            <span className="note-name delay-label">Delay</span>
                                        </div>
                                        <select
                                            className="duration-select"
                                            value={slot.duration}
                                            onChange={(e) => updateSlot(slot.id, 'duration', e.target.value)}
                                        >
                                            {durations.map((d) => (
                                                <option key={d} value={d}>{d}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Virtual Piano Panel */}
                    {editingSlotIndex !== null && slots[editingSlotIndex] && !slots[editingSlotIndex].isDelay && (
                        <div className="piano-panel animate-fade-in">
                            <div className="piano-panel-header">
                                <span className="text-sm font-medium text-[var(--fg)]">
                                    Editing Slot {editingSlotIndex + 1}: <strong>{slots[editingSlotIndex].note}</strong>
                                </span>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setEditingSlotIndex(null)}
                                    className="h-6 w-6 p-0"
                                >
                                    <XMarkIcon className="h-4 w-4" />
                                </Button>
                            </div>
                            <PianoKeyboard
                                selectedNote={slots[editingSlotIndex].note}
                                onSelectNote={handlePianoNoteSelect}
                                onPreviewNote={(note) => onPlayNote(note, slots[editingSlotIndex].duration)}
                            />
                        </div>
                    )}

                    <div className="note-seq-footer">
                        <Button size="sm" onClick={addSlot}>
                            <PlusIcon className="h-3.5 w-3.5" />
                            Add Slot
                        </Button>
                        <Button size="sm" onClick={removeSlot} disabled={slots.length <= 1}>
                            <MinusIcon className="h-3.5 w-3.5" />
                            Remove
                        </Button>
                        <Button size="sm" onClick={resetSlots}>
                            <ArrowPathIcon className="h-3.5 w-3.5" />
                            Reset
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}

// Export default slots helper
NoteSequencer.getDefaultSlots = () =>
    Array.from({ length: DEFAULT_SLOT_COUNT }, (_, i) => createDefaultSlot(i));
