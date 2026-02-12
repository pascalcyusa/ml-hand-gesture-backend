/**
 * TrainTab — Gesture Collection & Model Training
 *
 * Modified to save/load full training session (model + dataset) to backend.
 */

import { useState, useRef, useEffect } from 'react';
import {
    CameraIcon,
    TrashIcon,
    ArrowPathIcon,
    CloudArrowUpIcon,
    CloudArrowDownIcon,
    ArrowDownTrayIcon,
    CpuChipIcon,
} from '@heroicons/react/24/outline';
import * as tf from '@tensorflow/tfjs';

import { Button } from '../ui/button.jsx';
import { Card } from '../ui/card.jsx';
import { Input } from '../ui/input.jsx';
import { Badge } from '../ui/badge.jsx';
import './TrainTab.css';

// Helper: Convert ArrayBuffer to Base64
function arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
}

// Helper: Convert Base64 to ArrayBuffer
function base64ToArrayBuffer(base64) {
    const binary_string = window.atob(base64);
    const len = binary_string.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
}

export default function TrainTab({ showToast, hand, cm, trainer, prediction, storage, auth }) {
    const [isSaving, setIsSaving] = useState(false);
    const [modelName, setModelName] = useState('');
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [modelsList, setModelsList] = useState([]);
    const [showLoadDialog, setShowLoadDialog] = useState(false);

    // Filter cloud models if not logged in?
    // Actually, require login for save/load to backend.

    const handleCollectSample = (classId) => {
        if (!hand.features) {
            showToast('No hand detected', 'warning');
            return;
        }
        cm.addSample(classId, hand.features);
    };

    const handleTrainModel = async () => {
        if (cm.totalSamples === 0) {
            showToast('Collect some samples first', 'warning');
            return;
        }

        const { features, labels } = cm.getTrainingData();
        const success = await trainer.train({
            features,
            labels,
            numClasses: cm.classes.length,
            epochs: 50,
        });

        if (success) {
            showToast('Training complete!', 'success');
        } else {
            showToast('Training failed', 'error');
        }
    };

    const handleSaveModel = async () => {
        if (!auth.user) {
            showToast('Please log in to save models', 'info');
            return;
        }
        if (!modelName.trim()) {
            showToast('Enter a model name', 'warning');
            return;
        }
        if (!trainer.isTrained) {
            showToast('Train a model first', 'warning');
            return;
        }

        setIsSaving(true);
        try {
            const model = trainer.getModel();

            // Custom save handler to capture artifacts
            const saveHandler = tf.io.withSaveHandler(async (artifacts) => {
                const weightDataB64 = arrayBufferToBase64(artifacts.weightData);

                // We also save the dataset (classes with samples)
                // This allows retraining later!
                // cm.classes structure: [{id, name, samples: [...]}, ...]
                // samples need to be serializable (features are arrays, should be fine)

                const success = await storage.saveModel(
                    modelName,
                    artifacts.modelTopology,
                    artifacts.weightSpecs,
                    weightDataB64,
                    cm.classNames,
                    { classes: cm.classes }, // dataset object
                    false // private by default
                );

                if (success) {
                    showToast('Model & Session saved!', 'success');
                    setShowSaveDialog(false);
                } else {
                    showToast('Failed to save model', 'error');
                }
            });

            await model.save(saveHandler);

        } catch (err) {
            console.error(err);
            showToast('Error saving model', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleLoadList = async () => {
        if (!auth.user) {
            showToast('Please log in to load models', 'info');
            return;
        }

        const models = await storage.listMyModels();
        setModelsList(models);
        setShowLoadDialog(true);
    };

    const handleLoadModel = async (id) => {
        try {
            const modelData = await storage.loadModel(id);
            if (!modelData) {
                showToast('Failed to load model data', 'error');
                return;
            }

            // Restore Dataset (Classes & Samples)
            if (modelData.dataset && modelData.dataset.classes) {
                cm.restoreClasses(modelData.dataset.classes);
            } else {
                // Legacy or no dataset
                cm.restoreClasses(modelData.class_names.map((name, i) => ({
                    id: i,
                    name,
                    samples: []
                })));
            }

            // Restore Model
            if (modelData.model_data) {
                const { modelTopology, weightSpecs, weightData } = modelData.model_data;
                const weightBuffer = base64ToArrayBuffer(weightData);

                // Create IO handler
                const model = await tf.loadLayersModel(tf.io.fromMemory(
                    modelTopology,
                    weightSpecs,
                    weightBuffer
                ));

                trainer.setModel(model, modelData.class_names.length);
                showToast(`Loaded "${modelData.name}"`, 'success');
                setShowLoadDialog(false);
            }

        } catch (err) {
            console.error(err);
            showToast('Error loading model', 'error');
        }
    };

    return (
        <div className="train-tab animate-fade-in relative">
            {/* ── Save Dialog ── */}
            {showSaveDialog && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <Card className="w-full max-w-md p-6 space-y-4 shadow-2xl">
                        <h3 className="text-lg font-bold">Save Session</h3>
                        <p className="text-sm text-[var(--fg-muted)]">
                            Save your trained model and all collected samples to the cloud.
                        </p>
                        <Input
                            placeholder="Model Name (e.g. My First Project)"
                            value={modelName}
                            onChange={(e) => setModelName(e.target.value)}
                        />
                        <div className="flex justify-end gap-2">
                            <Button variant="ghost" onClick={() => setShowSaveDialog(false)}>Cancel</Button>
                            <Button onClick={handleSaveModel} disabled={isSaving}>
                                {isSaving ? 'Saving...' : 'Save'}
                            </Button>
                        </div>
                    </Card>
                </div>
            )}

            {/* ── Load Dialog ── */}
            {showLoadDialog && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <Card className="w-full max-w-md p-6 space-y-4 shadow-2xl max-h-[80vh] flex flex-col">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-bold">Load Session</h3>
                            <Button variant="ghost" size="sm" onClick={() => setShowLoadDialog(false)}>Close</Button>
                        </div>
                        <div className="overflow-y-auto space-y-2 flex-1">
                            {modelsList.length === 0 ? (
                                <p className="text-sm text-[var(--fg-muted)]">No saved models found.</p>
                            ) : (
                                modelsList.map((m) => (
                                    <div key={m.id} className="flex justify-between items-center p-3 rounded-lg bg-[var(--bg3)] hover:bg-[var(--bg2)] cursor-pointer" onClick={() => handleLoadModel(m.id)}>
                                        <div>
                                            <div className="font-medium">{m.name}</div>
                                            <div className="text-xs text-[var(--fg-muted)]">
                                                {new Date(m.created_at).toLocaleDateString()} • {m.class_names.length} classes
                                            </div>
                                        </div>
                                        <ArrowDownTrayIcon className="h-4 w-4 text-[var(--fg-muted)]" />
                                    </div>
                                ))
                            )}
                        </div>
                    </Card>
                </div>
            )}

            <div className="flex flex-col gap-6">
                {/* ── Status Bar ── */}
                <Card className="flex items-center justify-between py-3 px-4">
                    <div className="flex items-center gap-4">
                        <div className={`status-badge ${hand.isConnected ? 'on' : 'off'}`}>
                            <div className="status-dot" />
                            {hand.isConnected ? 'Camera On' : 'Camera Off'}
                        </div>
                        <div className={`status-badge ${trainer.isTrained ? 'ready' : 'waiting'}`}>
                            <div className="status-dot" />
                            {trainer.isTrained ? 'Model Ready' : 'Need Training'}
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={handleLoadList}>
                            <CloudArrowDownIcon className="h-4 w-4 mr-1.5" />
                            Load
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setShowSaveDialog(true)} disabled={!trainer.isTrained}>
                            <CloudArrowUpIcon className="h-4 w-4 mr-1.5" />
                            Save
                        </Button>
                    </div>
                </Card>

                {/* ── Main Area ── */}
                <div className="train-main-grid">
                    {/* Camera Feed */}
                    <div className="camera-section">
                        <div className="video-container">
                            <video
                                ref={hand.videoRef}
                                className="input-video"
                                playsInline
                                muted
                                autoPlay
                            />
                            <canvas ref={hand.canvasRef} className="output-canvas" />

                            {/* Overlay Controls */}
                            <div className="video-overlay-controls">
                                {/* Only show when prediction active */}
                                {trainer.isTrained && prediction.topPrediction && (
                                    <div className="prediction-overlay">
                                        <span className="pred-label">{prediction.topPrediction.className}</span>
                                        <span className="pred-conf">{Math.round(prediction.topPrediction.confidence * 100)}%</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Classes Panel */}
                    <div className="classes-section">
                        <div className="classes-header">
                            <h3 className="text-lg font-bold">Classes</h3>
                            <Button size="sm" variant="ghost" onClick={cm.addClass}>
                                + Add Class
                            </Button>
                        </div>

                        <div className="classes-list">
                            {cm.classes.map((cls) => (
                                <Card key={cls.id} className="class-card group">
                                    <div className="flex justify-between items-start mb-2">
                                        <Input
                                            value={cls.name}
                                            onChange={(e) => cm.updateClassName(cls.id, e.target.value)}
                                            className="h-7 text-sm font-medium w-32 border-transparent hover:border-[var(--bg3)] focus:border-[var(--blue)] px-1"
                                        />
                                        <button
                                            onClick={() => cm.removeClass(cls.id)}
                                            className="text-[var(--fg-muted)] hover:text-[var(--red)] opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <TrashIcon className="h-4 w-4" />
                                        </button>
                                    </div>

                                    <div className="flex justify-between items-end">
                                        <div className="text-xs text-[var(--fg-muted)]">
                                            <span className="font-mono text-[var(--fg)] text-lg">{cls.samples.length}</span> samples
                                        </div>
                                        <Button
                                            size="sm"
                                            className="collect-btn"
                                            onMouseDown={() => handleCollectSample(cls.id)}
                                            disabled={!hand.isConnected}
                                        >
                                            <CameraIcon className="h-4 w-4 mr-1" />
                                            Collect
                                        </Button>
                                    </div>

                                    {/* Progress bar visual */}
                                    <div className="w-full h-1 bg-[var(--bg1)] mt-3 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-[var(--green)] transition-all duration-300"
                                            style={{ width: `${Math.min(cls.samples.length * 2, 100)}%` }}
                                        />
                                    </div>
                                </Card>
                            ))}
                        </div>

                        <div className="train-actions mt-4 pt-4 border-t border-[var(--bg2)]">
                            <Button
                                variant="primary"
                                className="w-full"
                                onClick={handleTrainModel}
                                disabled={trainer.isTraining || cm.totalSamples === 0}
                            >
                                {trainer.isTraining ? (
                                    <>
                                        <ArrowPathIcon className="h-4 w-4 animate-spin mr-2" />
                                        Training... {trainer.trainingProgress ? `(${Math.round(trainer.trainingProgress.accuracy * 100)}%)` : ''}
                                    </>
                                ) : (
                                    <>
                                        <CpuChipIcon className="h-5 w-5 mr-2" />
                                        Train Model
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
