import { useState } from 'react';
import {
    PlusIcon,
    CpuChipIcon,
    ArrowDownTrayIcon,
    ArrowUpTrayIcon,
    FolderOpenIcon,
    TrashIcon,
    CheckIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline';
import { Button } from '../ui/button.jsx';
import { Card, CardTitle } from '../ui/card.jsx';
import './TrainingControls.css';

export default function TrainingControls({
    onAddClass,
    onTrain,
    onReset,
    onSave,
    onLoad,
    onExport,
    onImport,
    hasEnoughData,
    isTraining,
    isTrained,
    trainingProgress,
    totalSamples,
    numClasses,
    savedModels,
}) {
    const [showLoadDialog, setShowLoadDialog] = useState(false);

    const handleAddClass = () => {
        const name = prompt('Enter class name:');
        if (name?.trim()) {
            onAddClass(name);
        }
    };

    const handleImport = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json,.handpose.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) onImport(file);
        };
        input.click();
    };

    return (
        <Card className="training-controls relative">
            <CardTitle>Controls</CardTitle>

            {/* Load Dialog Overlay */}
            {showLoadDialog && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-lg p-4">
                    <Card className="w-full h-full max-h-[300px] flex flex-col shadow-2xl border-none">
                        <div className="flex justify-between items-center p-3 border-b border-[var(--bg3)]">
                            <h3 className="font-bold text-sm">Load Model</h3>
                            <button onClick={() => setShowLoadDialog(false)} className="text-[var(--fg-muted)] hover:text-[var(--fg)]">
                                <XMarkIcon className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 space-y-1">
                            {savedModels.length === 0 ? (
                                <p className="text-xs text-[var(--fg-muted)] text-center py-4">No saved models.</p>
                            ) : (
                                savedModels.map(m => (
                                    <button
                                        key={m.id}
                                        onClick={() => {
                                            onLoad(m.name);
                                            setShowLoadDialog(false);
                                        }}
                                        className="w-full text-left p-2 rounded hover:bg-[var(--bg2)] text-sm flex justify-between items-center group"
                                    >
                                        <span className="font-medium truncate">{m.name}</span>
                                        <span className="text-[10px] text-[var(--fg-muted)] opacity-0 group-hover:opacity-100">
                                            {new Date(m.created_at).toLocaleDateString()}
                                        </span>
                                    </button>
                                ))
                            )}
                        </div>
                    </Card>
                </div>
            )}

            {/* Primary Actions */}
            <div className="controls-group mt-4">
                <Button variant="accent" className="w-full" onClick={handleAddClass}>
                    <PlusIcon className="h-4 w-4" />
                    Add Class
                </Button>

                <Button
                    variant="primary"
                    className="w-full"
                    onClick={onTrain}
                    disabled={!hasEnoughData || isTraining}
                >
                    <CpuChipIcon className="h-4 w-4" />
                    {isTraining ? 'Training...' : 'Train Model'}
                </Button>

                {!hasEnoughData && numClasses > 0 && (
                    <p className="controls-hint">
                        Add at least 2 classes with 1 sample each.
                    </p>
                )}
            </div>

            {/* Training Progress */}
            {isTraining && trainingProgress && (
                <div className="training-progress-section">
                    <div className="training-progress-header">
                        <span>Epoch {trainingProgress.epoch}/{trainingProgress.totalEpochs}</span>
                        <span>{Math.round((trainingProgress.accuracy || 0) * 100)}% acc</span>
                    </div>
                    <div className="training-progress-track">
                        <div
                            className="training-progress-fill"
                            style={{
                                width: `${(trainingProgress.epoch / trainingProgress.totalEpochs) * 100}%`,
                            }}
                        />
                    </div>
                    {trainingProgress.loss !== undefined && (
                        <span className="training-progress-loss">
                            loss: {trainingProgress.loss.toFixed(4)}
                        </span>
                    )}
                </div>
            )}

            {/* Stats */}
            <div className="controls-stats">
                <div className="controls-stat">
                    <span className="controls-stat-value">{numClasses}</span>
                    <span className="controls-stat-label">Classes</span>
                </div>
                <div className="controls-stat">
                    <span className="controls-stat-value">{totalSamples}</span>
                    <span className="controls-stat-label">Samples</span>
                </div>
                <div className="controls-stat">
                    <span className={`controls-stat-value ${isTrained ? 'trained' : ''}`}>
                        {isTrained ? <CheckIcon className="h-4 w-4 inline" /> : '—'}
                    </span>
                    <span className="controls-stat-label">Trained</span>
                </div>
            </div>

            {/* Secondary Actions */}
            {/* Secondary Actions */}
            <div className="controls-group">
                {/* Row 1: Persistence */}
                <div className="flex gap-2">
                    {isTrained && (
                        <>
                            <Button size="sm" className="flex-1" onClick={() => {
                                const name = prompt('Model name:', 'my-model');
                                if (name?.trim()) onSave(name);
                            }}>
                                <ArrowDownTrayIcon className="h-3.5 w-3.5" />
                                Save
                            </Button>
                            <Button size="sm" className="flex-1" onClick={onExport}>
                                <ArrowUpTrayIcon className="h-3.5 w-3.5" />
                                Export
                            </Button>
                        </>
                    )}

                    {savedModels.length > 0 && (
                        <Button size="sm" className="flex-1" onClick={() => setShowLoadDialog(true)}>
                            <FolderOpenIcon className="h-3.5 w-3.5" />
                            Load
                        </Button>
                    )}

                    <Button size="sm" className="flex-1" onClick={handleImport}>
                        <ArrowDownTrayIcon className="h-3.5 w-3.5" />
                        Import
                    </Button>
                </div>

                {/* Row 2: Reset */}
                <Button
                    variant="danger"
                    size="sm"
                    className="w-full mt-2"
                    onClick={() => {
                        if (window.confirm('Reset all classes and model?')) onReset();
                    }}
                >
                    <TrashIcon className="h-3.5 w-3.5" />
                    Reset
                </Button>
            </div>
        </Card>
    );
}
