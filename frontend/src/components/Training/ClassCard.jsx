import { useRef, useEffect, useCallback, useState } from 'react';
import { HandRaisedIcon, XMarkIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { drawLandmarks } from '../../utils/mediapipe.js';
import { Button } from '../ui/button.jsx';
import { Card } from '../ui/card.jsx';
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
    const [expanded, setExpanded] = useState(false);

    return (
        <Card className="class-card animate-fade-in">
            <div className="class-card-header" onClick={() => setExpanded(prev => !prev)}>
                <div className="class-card-info">
                    <ChevronDownIcon className={`class-card-chevron ${expanded ? 'expanded' : ''}`} />
                    <h4 className="class-card-name">{name}</h4>
                    <span className="class-card-count">
                        {samples.length} sample{samples.length !== 1 ? 's' : ''}
                    </span>
                </div>
                <div className="class-card-actions" onClick={e => e.stopPropagation()}>
                    <Button
                        variant="primary"
                        size="sm"
                        onClick={() => onCollect(id)}
                        disabled={!currentLandmarks}
                        title={!currentLandmarks ? 'Show your hand to collect' : `Collect sample for ${name}`}
                    >
                        <HandRaisedIcon className="h-3.5 w-3.5" />
                        Collect
                    </Button>
                    <Button
                        variant="danger"
                        size="icon"
                        onClick={() => onDelete(id)}
                        title={`Delete class "${name}"`}
                    >
                        <XMarkIcon className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <div className={`class-card-body ${expanded ? 'expanded' : ''}`}>
                <div className="class-card-content">
                    {samples.length > 0 ? (
                        <div className="class-card-samples">
                            {samples.map((sample, i) => (
                                <SampleThumb
                                    key={i}
                                    sample={sample}
                                    onDelete={() => onDeleteSample(id, i)}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="class-card-empty">
                            <p>No samples yet — hold a pose and click Collect</p>
                        </div>
                    )}
                </div>
            </div>
        </Card>
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

        ctx.fillStyle = '#1d2021';
        ctx.fillRect(0, 0, 72, 72);

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
