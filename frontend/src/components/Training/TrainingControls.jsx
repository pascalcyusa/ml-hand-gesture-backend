import {
    PlusIcon,
    CpuChipIcon,
    ArrowDownTrayIcon,
    ArrowUpTrayIcon,
    FolderOpenIcon,
    TrashIcon,
    CheckIcon,
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
        <Card className="training-controls">
            <CardTitle>Controls</CardTitle>

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
                        Need ≥2 classes with ≥1 sample each
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
            <div className="controls-group controls-secondary">
                {isTrained && (
                    <>
                        <Button size="sm" onClick={() => {
                            const name = prompt('Model name:', 'my-model');
                            if (name?.trim()) onSave(name);
                        }}>
                            <ArrowDownTrayIcon className="h-3.5 w-3.5" />
                            Save
                        </Button>
                        <Button size="sm" onClick={onExport}>
                            <ArrowUpTrayIcon className="h-3.5 w-3.5" />
                            Export
                        </Button>
                    </>
                )}

                {savedModels.length > 0 && (
                    <Button size="sm" onClick={() => {
                        const name = prompt(
                            `Load model:\n${savedModels.map((m) => `• ${m.name}`).join('\n')}`
                        );
                        if (name?.trim()) onLoad(name);
                    }}>
                        <FolderOpenIcon className="h-3.5 w-3.5" />
                        Load
                    </Button>
                )}

                <Button size="sm" onClick={handleImport}>
                    <ArrowDownTrayIcon className="h-3.5 w-3.5" />
                    Import
                </Button>

                <Button
                    variant="danger"
                    size="sm"
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
