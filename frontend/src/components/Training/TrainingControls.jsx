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
        <div className="training-controls card">
            <h3 className="training-controls-title">Controls</h3>

            {/* Primary Actions */}
            <div className="controls-group">
                <button className="btn btn-accent btn-lg controls-full-width" onClick={handleAddClass}>
                    ＋ Add Class
                </button>

                <button
                    className="btn btn-primary btn-lg controls-full-width"
                    onClick={onTrain}
                    disabled={!hasEnoughData || isTraining}
                >
                    {isTraining ? '⏳ Training...' : '🧠 Train Model'}
                </button>

                {!hasEnoughData && numClasses > 0 && (
                    <p className="controls-hint">
                        Need ≥2 classes with ≥1 sample each
                    </p>
                )}
            </div>

            {/* Training Progress */}
            {trainingProgress && (
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
                        {isTrained ? '✓' : '—'}
                    </span>
                    <span className="controls-stat-label">Trained</span>
                </div>
            </div>

            {/* Secondary Actions */}
            <div className="controls-group controls-secondary">
                {isTrained && (
                    <>
                        <button className="btn btn-sm" onClick={() => {
                            const name = prompt('Model name:', 'my-model');
                            if (name?.trim()) onSave(name);
                        }}>
                            💾 Save
                        </button>
                        <button className="btn btn-sm" onClick={onExport}>
                            📤 Export
                        </button>
                    </>
                )}

                {savedModels.length > 0 && (
                    <button className="btn btn-sm" onClick={() => {
                        const name = prompt(
                            `Load model:\n${savedModels.map((m) => `• ${m.name}`).join('\n')}`
                        );
                        if (name?.trim()) onLoad(name);
                    }}>
                        📂 Load
                    </button>
                )}

                <button className="btn btn-sm" onClick={handleImport}>
                    📥 Import
                </button>

                <button
                    className="btn btn-danger btn-sm"
                    onClick={() => {
                        if (window.confirm('Reset all classes and model?')) onReset();
                    }}
                >
                    🗑 Reset
                </button>
            </div>
        </div>
    );
}
