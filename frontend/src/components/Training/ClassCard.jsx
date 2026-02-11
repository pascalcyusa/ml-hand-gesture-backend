import { useRef, useEffect, useCallback } from 'react';
import { drawLandmarks } from '../../utils/mediapipe.js';
import './ClassCard.css';

export default function ClassCard({
    classData,
    onCollect,
    onDeleteSample,
    onDelete,
    isCollecting,
    currentLandmarks,
}) {
    const { id, name, samples } = classData;

    return (
        <div className="class-card card animate-fade-in">
            <div className="class-card-header">
                <div className="class-card-info">
                    <h4 className="class-card-name">{name}</h4>
                    <span className="class-card-count">
                        {samples.length} sample{samples.length !== 1 ? 's' : ''}
                    </span>
                </div>
                <div className="class-card-actions">
                    <button
                        className="btn btn-primary btn-sm"
                        onClick={() => onCollect(id)}
                        disabled={!currentLandmarks}
                        title={!currentLandmarks ? 'Show your hand to collect' : `Collect sample for ${name}`}
                    >
                        ✋ Collect
                    </button>
                    <button
                        className="btn btn-danger btn-sm"
                        onClick={() => onDelete(id)}
                        title={`Delete class "${name}"`}
                    >
                        ✕
                    </button>
                </div>
            </div>

            {samples.length > 0 && (
                <div className="class-card-samples">
                    {samples.map((sample, i) => (
                        <SampleThumb
                            key={i}
                            sample={sample}
                            onDelete={() => onDeleteSample(id, i)}
                        />
                    ))}
                </div>
            )}

            {samples.length === 0 && (
                <div className="class-card-empty">
                    <p>No samples yet — hold a pose and click Collect</p>
                </div>
            )}
        </div>
    );
}

function SampleThumb({ sample, onDelete }) {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !sample.landmarks) return;

        const ctx = canvas.getContext('2d');
        canvas.width = 72;
        canvas.height = 72;

        // Draw dark bg
        ctx.fillStyle = '#1d2021';
        ctx.fillRect(0, 0, 72, 72);

        // Draw landmarks scaled to thumbnail
        drawLandmarks(ctx, sample.landmarks, 72, 72);
    }, [sample]);

    const handleDoubleClick = useCallback((e) => {
        e.preventDefault();
        if (window.confirm('Delete this sample?')) {
            onDelete();
        }
    }, [onDelete]);

    return (
        <div className="sample-thumb" onDoubleClick={handleDoubleClick} title="Double-click to delete">
            <canvas ref={canvasRef} />
        </div>
    );
}
