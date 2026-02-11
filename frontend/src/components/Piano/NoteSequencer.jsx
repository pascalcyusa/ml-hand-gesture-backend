/**
 * NoteSequencer — Per-class note sequence configuration
 * 
 * Ported from: js/notesController.js
 * 
 * Each class gets a row of configurable slots:
 *  - Note slots (select note + duration)
 *  - Delay slots (just a pause)
 * 
 * Sequences can be tested independently or triggered by predictions.
 */

import { useState, useCallback } from 'react';
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
    notes,
    durations,
    isPlaying,
}) {
    const [slots, setSlots] = useState(() =>
        Array.from({ length: DEFAULT_SLOT_COUNT }, (_, i) => createDefaultSlot(i))
    );
    const [collapsed, setCollapsed] = useState(false);
    const [activeSlot, setActiveSlot] = useState(-1);

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
    }, []);

    // Reset to defaults
    const resetSlots = useCallback(() => {
        setSlots(Array.from({ length: DEFAULT_SLOT_COUNT }, (_, i) => createDefaultSlot(i)));
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
                setActiveSlot(slotIndex);
                setTimeout(() => setActiveSlot(-1), 300);
            });
        }
    }, [slots, onPlaySequence]);

    // Get current slots (for external use by PianoTab)
    const getSlots = useCallback(() => slots, [slots]);

    return (
        <div className={`note-sequencer ${collapsed ? 'collapsed' : ''}`}>
            <div className="note-seq-header" onClick={() => setCollapsed(!collapsed)}>
                <div className="note-seq-title">
                    <span className="note-seq-icon">🎵</span>
                    <span className="note-seq-name">{className}</span>
                    <span className="note-seq-slot-count">{slots.length} slots</span>
                </div>
                <div className="note-seq-header-actions">
                    <button
                        className="btn btn-sm btn-primary"
                        onClick={(e) => { e.stopPropagation(); handlePlaySequence(); }}
                        disabled={isPlaying}
                    >
                        ▶ Test
                    </button>
                    <span className="note-seq-chevron">{collapsed ? '▸' : '▾'}</span>
                </div>
            </div>

            {!collapsed && (
                <div className="note-seq-body animate-fade-in">
                    <div className="note-seq-slots">
                        {slots.map((slot, i) => (
                            <div
                                key={slot.id}
                                className={`note-slot ${slot.isDelay ? 'delay' : 'note'} ${activeSlot === i ? 'active' : ''}`}
                            >
                                <div className="note-slot-header">
                                    <span className="note-slot-index">{i + 1}</span>
                                    <label className="note-slot-type-toggle" title="Toggle delay">
                                        <input
                                            type="checkbox"
                                            checked={slot.isDelay}
                                            onChange={() => toggleSlotType(slot.id)}
                                        />
                                        <span className="note-slot-type-label">
                                            {slot.isDelay ? '⏸ Delay' : '♪ Note'}
                                        </span>
                                    </label>
                                </div>

                                {!slot.isDelay ? (
                                    <div className="note-slot-config">
                                        <select
                                            className="note-select"
                                            value={slot.note}
                                            onChange={(e) => updateSlot(slot.id, 'note', e.target.value)}
                                        >
                                            {notes.map((n) => (
                                                <option key={n} value={n}>{n}</option>
                                            ))}
                                        </select>
                                        <select
                                            className="duration-select"
                                            value={slot.duration}
                                            onChange={(e) => updateSlot(slot.id, 'duration', e.target.value)}
                                        >
                                            {durations.map((d) => (
                                                <option key={d} value={d}>{d}</option>
                                            ))}
                                        </select>
                                        <button
                                            className="btn btn-sm note-test-btn"
                                            onClick={() => handleTestNote(slot)}
                                            title="Test this note"
                                        >
                                            🔊
                                        </button>
                                    </div>
                                ) : (
                                    <div className="note-slot-config delay-config">
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

                    <div className="note-seq-footer">
                        <button className="btn btn-sm" onClick={addSlot}>＋ Add Slot</button>
                        <button className="btn btn-sm" onClick={removeSlot} disabled={slots.length <= 1}>
                            − Remove
                        </button>
                        <button className="btn btn-sm" onClick={resetSlots}>↻ Reset</button>
                    </div>
                </div>
            )}
        </div>
    );
}

// Export a helper to get slots from outside (via ref)
NoteSequencer.getDefaultSlots = () =>
    Array.from({ length: DEFAULT_SLOT_COUNT }, (_, i) => createDefaultSlot(i));
