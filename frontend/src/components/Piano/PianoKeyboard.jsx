import { useState, useMemo } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { Button } from '../ui/button.jsx';
import KEYS_TEMPLATE from './pianoKeys.json';
import './PianoKeyboard.css';

const TOTAL_OCTAVES = 3; // C3, C4, C5 (partial 6th C not needed)
const VISIBLE_OCTAVES = 2; // Show 2 at a time

export default function PianoKeyboard({
    selectedNote, // e.g., "C4"
    onSelectNote,
    onPreviewNote,
}) {
    // Current base octave (3 or 4)
    const [baseOctave, setBaseOctave] = useState(3);

    // Calculate visible keys based on baseOctave
    const visibleKeys = useMemo(() => {
        const keys = [];
        for (let i = 0; i < VISIBLE_OCTAVES; i++) {
            const octave = baseOctave + i;
            if (octave > 5) break;

            KEYS_TEMPLATE.forEach((k) => {
                const note = `${k.id}${octave}`;
                // Limit: Only go up to B5
                if (octave === 5 && k.id === 'C' && i > 0) return; // Logic check: we want C5-B5

                keys.push({
                    ...k,
                    note,
                    octave,
                    octaveOffset: i, // 0 or 1, for CSS positioning
                });
            });
        }
        return keys;
    }, [baseOctave]);

    const handleKeyClick = (note) => {
        if (onSelectNote) onSelectNote(note);
        if (onPreviewNote) onPreviewNote(note);
    };

    const shiftOctave = (direction) => {
        if (direction === 'down' && baseOctave > 3) {
            setBaseOctave(baseOctave - 1);
        } else if (direction === 'up' && baseOctave < 4) {
            setBaseOctave(baseOctave + 1);
        }
    };

    const renderKeys = () => {
        const whiteKeys = visibleKeys.filter((k) => k.type === 'white');
        const blackKeys = visibleKeys.filter((k) => k.type === 'black');

        return (
            <div className="piano-keys">
                {/* Render White Keys First (z-index 1) */}
                {whiteKeys.map((k) => (
                    <div
                        key={k.note}
                        className={`key-white ${selectedNote === k.note ? 'active' : ''}`}
                        onClick={() => handleKeyClick(k.note)}
                    >
                        <span className="key-label">{k.note}</span>
                    </div>
                ))}

                {/* Render Black Keys Overlay (z-index 2) */}
                {blackKeys.map((k) => (
                    <div
                        key={k.note}
                        className={`key-black ${selectedNote === k.note ? 'active' : ''}`}
                        data-note={k.id}
                        data-octave-offset={k.octaveOffset}
                        onClick={() => handleKeyClick(k.note)}
                    >
                        <span className="key-label">{k.note}</span>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="piano-keyboard-container animate-fade-in">
            <div className="piano-controls-bar">
                <Button
                    size="sm"
                    variant="ghost"
                    disabled={baseOctave <= 3}
                    onClick={() => shiftOctave('down')}
                >
                    <ChevronLeftIcon className="h-4 w-4" />
                </Button>
                <span className="octave-label">
                    Octaves {baseOctave} - {baseOctave + 1}
                </span>
                <Button
                    size="sm"
                    variant="ghost"
                    disabled={baseOctave >= 4}
                    onClick={() => shiftOctave('up')}
                >
                    <ChevronRightIcon className="h-4 w-4" />
                </Button>
            </div>
            {renderKeys()}
        </div>
    );
}
