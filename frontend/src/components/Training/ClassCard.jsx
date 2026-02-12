import { useRef, useEffect, useCallback, useState } from 'react';
import { HandRaisedIcon, XMarkIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { drawLandmarks } from '../../utils/mediapipe.js';
import { Button } from '../ui/button.jsx';
import { Card } from '../ui/card.jsx';
import './ClassCard.css';

/**
 * ClassCard - Rebuilt from scratch for better state isolation and aesthetics.
 * Each card manages its own expanded state and provides a scrollable sample area.
 */
export default function ClassCard({
    classData,
    onCollect,
    onDeleteSample,
    onDelete,
    currentLandmarks,
}) {
    const { id, name, samples } = classData;
    const [isExpanded, setIsExpanded] = useState(true);

    const toggleExpanded = useCallback((e) => {
        // Only toggle if we didn't click an action button
        if (e.target.closest('.class-card-actions')) return;
        setIsExpanded(prev => !prev);
    }, []);

    return (
        <Card className={`class-card animate-fade-in ${isExpanded ? 'is-expanded' : 'is-collapsed'}`}>
            {/* Header Area */}
            <div className="class-card-header" onClick={toggleExpanded}>
                <div className="class-card-title-group">
                    <ChevronDownIcon className={`class-card-chevron ${isExpanded ? 'expanded' : ''}`} />
                    <h4 className="class-card-name">{name}</h4>
                    <span className="class-card-badge">{samples.length}</span>
                </div>

                <div className="class-card-actions">
                    <Button
                        variant="primary"
                        size="sm"
                        onClick={() => onCollect(id)}
                        disabled={!currentLandmarks}
                        title={!currentLandmarks ? 'Show your hand to collect' : `Collect sample for ${name}`}
                        className="collect-btn"
                    >
                        <HandRaisedIcon className="h-3.5 w-3.5" />
                        <span>Collect</span>
                    </Button>
                    <Button
                        variant="danger"
                        size="icon"
                        onClick={() => onDelete(id)}
                        title={`Delete class "${name}"`}
                        className="delete-btn"
                    >
                        <XMarkIcon className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Body Area with smooth transition */}
            <div className="class-card-body">
                <div className="class-card-inner">
                    {samples.length > 0 ? (
                        <div className="class-card-samples-container">
                            <div className="class-card-samples-grid">
                                {samples.map((sample, i) => (
                                    <SampleIcon
                                        key={i}
                                        sample={sample}
                                        onDelete={() => onDeleteSample(id, i)}
                                    />
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="class-card-empty-state">
                            <p>No samples collected yet</p>
                            <span className="text-xs text-[var(--fg-muted)]">Hold a pose and click Collect</span>
                        </div>
                    )}
                </div>
            </div>
        </Card>
    );
}

/**
 * Optimized Sample Thumbnail
 */
function SampleIcon({ sample, onDelete }) {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !sample.landmarks) return;

        const ctx = canvas.getContext('2d');
        const size = 64; // Slightly smaller for better grid fit
        canvas.width = size;
        canvas.height = size;

        ctx.fillStyle = '#1d2021';
        ctx.fillRect(0, 0, size, size);

        drawLandmarks(ctx, sample.landmarks, size, size);
    }, [sample]);

    const handleRemove = (e) => {
        e.preventDefault();
        if (window.confirm('Delete this sample?')) {
            onDelete();
        }
    };

    return (
        <div className="sample-icon-wrapper" onDoubleClick={handleRemove} title="Double-click to delete">
            <canvas ref={canvasRef} className="sample-canvas" />
            <button className="sample-remove-overlay" onClick={handleRemove}>
                <XMarkIcon className="h-3 w-3" />
            </button>
        </div>
    );
}
