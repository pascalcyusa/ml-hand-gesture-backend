import { useRef, useEffect, useCallback, useState } from 'react';
import {
    HandRaisedIcon,
    XMarkIcon,
    ChevronDownIcon,
    CheckCircleIcon
} from '@heroicons/react/24/outline';
import { drawLandmarks } from '../../utils/mediapipe.js';
import { Button } from '../ui/button.jsx';
import './ClassCard.css';

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
        // Prevent toggle if clicking buttons
        if (e.target.closest('button')) return;
        setIsExpanded(prev => !prev);
    }, []);

    const sampleCount = samples?.length || 0;

    return (
        <div className={`class-card ${isExpanded ? 'is-expanded' : ''}`}>
            {/* Header: Delete Left | Title Middle | Collect & Collapse Right */}
            <div className="class-card-header" onClick={toggleExpanded}>

                <div className="class-card-title-group">
                    {/* 1. Delete Icon (Moved to Left) */}
                    <button
                        className="icon-btn delete-class-btn"
                        onClick={(e) => {
                            e.stopPropagation(); // Stop card from collapsing
                            onDelete(id);
                        }}
                        title={`Delete class "${name}"`}
                    >
                        <XMarkIcon className="h-5 w-5" />
                    </button>

                    {/* 2. Title with Ellipsis */}
                    <h3 className="class-card-name" title={name}>{name}</h3>
                </div>

                <div className="class-card-actions">
                    {/* 3. Rounded Collect Button */}
                    <Button
                        variant="primary" /* or 'outline' depending on preference */
                        size="icon"     /* Helper class if you have it, or handled by CSS below */
                        onClick={(e) => {
                            e.stopPropagation();
                            onCollect(id);
                        }}
                        disabled={!currentLandmarks}
                        title={!currentLandmarks ? 'Show hand to enable' : 'Collect Sample'}
                        className="collect-btn"
                    >
                        <HandRaisedIcon className="h-5 w-5" />
                    </Button>

                    {/* 4. Aligned Chevron */}
                    <div className="chevron-wrapper">
                        <ChevronDownIcon
                            className={`h-5 w-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        />
                    </div>
                </div>
            </div>

            {/* Middle: Thumbnail Grid */}
            <div className="class-card-body">
                <div className="class-card-inner">
                    <div className="class-card-samples-container">
                        {sampleCount > 0 ? (
                            <div className="class-card-samples-grid">
                                {samples.map((sample, i) => (
                                    <SampleIcon
                                        key={i}
                                        sample={sample}
                                        onDelete={() => onDeleteSample(id, i)}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="empty-placeholder">
                                <p>No samples yet</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Footer: Stats */}
            <div className="class-card-footer">
                {sampleCount > 0 ? (
                    <div className="status-badge active">
                        <CheckCircleIcon className="status-icon" />
                        <span>{sampleCount} Samples collected</span>
                    </div>
                ) : (
                    <div className="status-badge">
                        <div className="h-2 w-2 rounded-full bg-gray-500 mr-2"></div>
                        <span>0 Samples</span>
                    </div>
                )}
            </div>
        </div>
    );
}

function SampleIcon({ sample, onDelete }) {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !sample.landmarks) return;

        const ctx = canvas.getContext('2d');
        const size = 64;
        canvas.width = size;
        canvas.height = size;

        ctx.fillStyle = '#1d2021'; // Gruvbox dark bg
        ctx.fillRect(0, 0, size, size);

        drawLandmarks(ctx, sample.landmarks, size, size);
    }, [sample]);

    return (
        <div
            className="sample-icon-wrapper"
            onClick={onDelete}
            title="Click to delete this sample"
        >
            <canvas ref={canvasRef} className="sample-canvas" />
        </div>
    );
}