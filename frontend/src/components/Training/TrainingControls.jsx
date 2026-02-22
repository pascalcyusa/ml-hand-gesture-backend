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
    AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';
import { Button } from '../ui/button.jsx';
import { Card } from '../ui/card.jsx';
import { Input } from '../ui/input.jsx';
import ModalPortal from '../common/ModalPortal.jsx';
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
    // Dialog States
    const [showLoadDialog, setShowLoadDialog] = useState(false);
    const [showAddClassDialog, setShowAddClassDialog] = useState(false);
    const [newClassName, setNewClassName] = useState('');
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [saveModelName, setSaveModelName] = useState('my-model');
    const [isPublic, setIsPublic] = useState(false);
    const [showResetDialog, setShowResetDialog] = useState(false);

    // Handlers
    const handleConfirmAddClass = () => {
        if (newClassName?.trim()) {
            onAddClass(newClassName);
            setNewClassName('');
            setShowAddClassDialog(false);
        }
    };

    const handleConfirmSave = () => {
        if (saveModelName?.trim()) {
            onSave(saveModelName, isPublic);
            setShowSaveDialog(false);
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
        <div className="training-controls-container">

            {/* ── Main Control Panel ── */}
            <div className="control-panel">

                {/* Header */}
                <div className="panel-header">
                    <div className="panel-title">
                        <AdjustmentsHorizontalIcon className="h-5 w-5 text-[var(--fg-muted)]" />
                        <span>Control Center</span>
                    </div>
                    <div className={`status-indicator ${isTrained ? 'ready' : ''}`} title={isTrained ? "Model Ready" : "Untrained"} />
                </div>

                {/* Primary Actions Grid (Big Buttons) */}
                <div className="action-grid">
                    {/* Add Class Button (Yellow Accent) */}
                    <button
                        className="control-btn accent"
                        onClick={() => setShowAddClassDialog(true)}
                    >
                        <div className="btn-icon-wrapper">
                            <PlusIcon className="h-6 w-6" />
                        </div>
                        <div>
                            <span className="btn-label">Add Class</span>
                        </div>
                    </button>

                    {/* Train Button (Gold Primary) */}
                    <button
                        className={`control-btn ${isTraining ? 'secondary' : 'primary'}`}
                        onClick={onTrain}
                        disabled={!hasEnoughData || isTraining}
                    >
                        <div className="btn-icon-wrapper">
                            <CpuChipIcon className="h-6 w-6" />
                        </div>
                        <div>
                            <span className="btn-label">
                                {isTraining ? 'Training...' : 'Train Model'}
                            </span>
                            <div className="btn-sublabel">
                                {isTraining
                                    ? 'Please wait...'
                                    : isTrained
                                        ? (hasEnoughData ? 'Ready to retrain' : 'Take samples to retrain')
                                        : (hasEnoughData ? 'Ready to train' : 'Take samples')
                                }
                            </div>
                        </div>
                    </button>
                </div>

                {/* Stats Row */}
                <div className="stats-row">
                    <div className="stat-pill">
                        <span className="stat-value">{numClasses}</span>
                        <span className="stat-label">Classes</span>
                    </div>
                    <div className="stat-pill">
                        <span className="stat-value">{totalSamples}</span>
                        <span className="stat-label">Samples</span>
                    </div>
                    <div className="stat-pill" style={{ color: isTrained ? 'var(--gold)' : 'var(--fg-muted)' }}>
                        <span className="stat-value">
                            {isTrained ? <CheckIcon className="h-6 w-6" /> : '—'}
                        </span>
                        <span className="stat-label">Status</span>
                    </div>
                </div>

                {/* Progress Bar (Visible only when training) */}
                {isTraining && trainingProgress && (
                    <div className="progress-container">
                        <div className="progress-info">
                            <span>Epoch {trainingProgress.epoch} / {trainingProgress.totalEpochs}</span>
                            <span>{Math.round((trainingProgress.accuracy || 0) * 100)}%</span>
                        </div>
                        <div className="progress-track">
                            <div
                                className="progress-fill"
                                style={{ width: `${(trainingProgress.epoch / trainingProgress.totalEpochs) * 100}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* Secondary Tools Grid */}
                <div className="tools-grid">
                    {/* Save */}
                    <button className="tool-btn" onClick={() => setShowSaveDialog(true)} disabled={!isTrained}>
                        <ArrowDownTrayIcon />
                        <span>Save</span>
                    </button>

                    {/* Load */}
                    <button className="tool-btn" onClick={() => setShowLoadDialog(true)}>
                        <FolderOpenIcon />
                        <span>Load</span>
                    </button>

                    {/* Import */}
                    <button className="tool-btn" onClick={handleImport}>
                        <ArrowDownTrayIcon />
                        <span>Import</span>
                    </button>

                    {/* Reset (Danger) */}
                    <button className="tool-btn danger" onClick={() => setShowResetDialog(true)}>
                        <TrashIcon />
                        <span>Reset</span>
                    </button>
                </div>
            </div>

            {/* ── Modals (Keep existing functionality) ── */}
            {showAddClassDialog && (
                <ModalPortal>
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                        <Card className="w-full max-w-sm p-6 shadow-2xl border border-[var(--bg2)] bg-[var(--bg1)] space-y-4 rounded-2xl">
                            <h3 className="font-bold text-lg">Add New Class</h3>
                            <Input
                                placeholder="Class Name (e.g. Fist)"
                                value={newClassName}
                                onChange={(e) => setNewClassName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleConfirmAddClass()}
                                autoFocus
                                className="bg-[var(--bg-hard)] border-[var(--bg3)]"
                            />
                            <div className="flex justify-end gap-2 mt-4">
                                <Button variant="ghost" onClick={() => setShowAddClassDialog(false)}>Cancel</Button>
                                <Button variant="primary" onClick={handleConfirmAddClass}>Add Class</Button>
                            </div>
                        </Card>
                    </div>
                </ModalPortal>
            )}

            {/* Save Dialog */}
            {showSaveDialog && (
                <ModalPortal>
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                        <Card className="w-full max-w-sm p-6 shadow-2xl border border-[var(--bg2)] bg-[var(--bg1)] space-y-4 rounded-2xl">
                            <h3 className="font-bold text-lg">Save Model</h3>
                            <Input
                                placeholder="Model Name"
                                value={saveModelName}
                                onChange={(e) => setSaveModelName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleConfirmSave()}
                                autoFocus
                                className="bg-[var(--bg-hard)] border-[var(--bg3)]"
                            />

                            <label className="flex items-center gap-2 cursor-pointer text-sm text-[var(--fg)] select-none">
                                <input
                                    type="checkbox"
                                    checked={isPublic}
                                    onChange={(e) => setIsPublic(e.target.checked)}
                                    className="accent-[var(--gold)] w-4 h-4 rounded border-gray-300"
                                />
                                <span>Make Public (Visible to Community)</span>
                            </label>

                            <div className="flex justify-end gap-2 mt-4">
                                <Button variant="ghost" onClick={() => setShowSaveDialog(false)}>Cancel</Button>
                                <Button variant="primary" onClick={handleConfirmSave}>Save</Button>
                            </div>
                        </Card>
                    </div>
                </ModalPortal>
            )}

            {/* Load Dialog */}
            {showLoadDialog && (
                <ModalPortal>
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                        <Card className="w-full max-w-sm p-6 shadow-2xl border border-[var(--bg2)] bg-[var(--bg1)] flex flex-col max-h-[400px] rounded-2xl">
                            <div className="flex justify-between items-center border-b border-[var(--bg3)] pb-4 mb-2">
                                <h3 className="font-bold text-lg">Load Model</h3>
                                <button onClick={() => setShowLoadDialog(false)} className="text-[var(--fg-muted)] hover:text-[var(--fg)]">
                                    <XMarkIcon className="h-5 w-5" />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                                {savedModels.length === 0 ? (
                                    <p className="text-sm text-[var(--fg-muted)] text-center py-4">No saved models found.</p>
                                ) : (
                                    savedModels.map(m => (
                                        <button
                                            key={m.id}
                                            onClick={() => { onLoad(m.name); setShowLoadDialog(false); }}
                                            className="w-full text-left p-3 rounded-xl bg-[var(--bg2)] hover:bg-[var(--bg3)] transition-colors flex justify-between items-center group"
                                        >
                                            <span className="font-medium text-[var(--fg)]">{m.name}</span>
                                            <span className="text-xs text-[var(--fg-muted)]">
                                                {new Date(m.created_at).toLocaleDateString()}
                                            </span>
                                        </button>
                                    ))
                                )}
                            </div>
                        </Card>
                    </div>
                </ModalPortal>
            )}

            {/* Reset Dialog */}
            {showResetDialog && (
                <ModalPortal>
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                        <Card className="w-full max-w-sm p-6 shadow-2xl border border-[var(--bg2)] bg-[var(--bg1)] space-y-4 rounded-2xl">
                            <div className="flex flex-col gap-3">
                                <h3 className="font-bold text-lg text-[var(--red)] flex items-center gap-2">
                                    <TrashIcon className="h-5 w-5" />
                                    Confirm Reset
                                </h3>
                                <p className="text-sm text-[var(--fg-muted)] leading-relaxed">
                                    This will delete all current gesture classes and samples. <br />
                                    <strong>This action cannot be undone.</strong>
                                </p>
                            </div>
                            <div className="flex justify-end gap-2 mt-4">
                                <Button variant="ghost" onClick={() => setShowResetDialog(false)}>Cancel</Button>
                                <Button variant="danger" onClick={() => { onReset(); setShowResetDialog(false); }}>Yes, Reset</Button>
                            </div>
                        </Card>
                    </div>
                </ModalPortal>
            )}
        </div>
    );
}