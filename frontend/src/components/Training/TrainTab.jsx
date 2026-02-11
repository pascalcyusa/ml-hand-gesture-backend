/**
 * TrainTab — Main orchestrator for the hand pose training workflow.
 * 
 * Composes: WebcamPanel, ClassCard, PredictionBars, TrainingControls
 * Hooks are passed in from App.jsx (lifted state).
 */

import { useState, useCallback, useRef } from 'react';

import WebcamPanel from './WebcamPanel.jsx';
import ClassCard from './ClassCard.jsx';
import PredictionBars from './PredictionBars.jsx';
import TrainingControls from './TrainingControls.jsx';
import LoadingOverlay from '../common/LoadingOverlay.jsx';
import './TrainTab.css';

export default function TrainTab({ showToast, hand, cm, trainer, prediction, storage }) {
    const [showLoadingOverlay, setShowLoadingOverlay] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const videoReadyRef = useRef(false);

    // ── Start detection when webcam is ready ──
    const handleVideoReady = useCallback(
        async (videoEl, canvasEl) => {
            if (videoReadyRef.current) return;
            videoReadyRef.current = true;

            setShowLoadingOverlay(true);
            setLoadingMessage('Loading hand detection model...');

            await hand.start(videoEl, canvasEl);

            setShowLoadingOverlay(false);
            showToast('Hand detection ready!', 'success');
        },
        [hand, showToast]
    );

    // ── Collect sample ──
    const handleCollect = useCallback(
        (classId) => {
            if (!hand.currentLandmarks) {
                showToast('No hand detected — show your hand to the camera', 'warning');
                return;
            }
            const success = cm.collectSample(classId, hand.currentLandmarks);
            if (success) {
                showToast('Sample collected!', 'success');
            }
        },
        [hand.currentLandmarks, cm, showToast]
    );

    // ── Train model ──
    const handleTrain = useCallback(async () => {
        prediction.stopPredicting();

        setShowLoadingOverlay(true);
        setLoadingMessage('Training model...');

        const trainingData = cm.getTrainingData();
        const success = await trainer.train(trainingData);

        setShowLoadingOverlay(false);

        if (success) {
            showToast('Model trained successfully!', 'success');
            prediction.startPredicting();
        } else {
            showToast('Training failed — check console for details', 'error');
        }
    }, [cm, trainer, prediction, showToast]);

    // ── Reset everything ──
    const handleReset = useCallback(() => {
        prediction.stopPredicting();
        trainer.resetModel();
        cm.reset();
        showToast('All data cleared', 'info');
    }, [prediction, trainer, cm, showToast]);

    // ── Save model ──
    const handleSave = useCallback(
        async (name) => {
            const model = trainer.getModel();
            if (!model) return;
            const success = await storage.saveModel(name, model, cm.classes);
            if (success) {
                showToast(`Model "${name}" saved!`, 'success');
            } else {
                showToast('Failed to save model', 'error');
            }
        },
        [trainer, storage, cm.classes, showToast]
    );

    // ── Load model ──
    const handleLoad = useCallback(
        async (name) => {
            prediction.stopPredicting();

            const result = await storage.loadModel(name);
            if (!result) {
                showToast(`Model "${name}" not found`, 'error');
                return;
            }

            const numClasses = result.metadata?.classes?.length || 0;
            trainer.setModel(result.model, numClasses);

            if (result.metadata?.classes) {
                cm.restoreClasses(
                    result.metadata.classes.map((c) => ({
                        name: c.name,
                        samples: [],
                    }))
                );
            }

            showToast(`Model "${name}" loaded!`, 'success');
            prediction.startPredicting();
        },
        [storage, trainer, cm, prediction, showToast]
    );

    // ── Export model ──
    const handleExport = useCallback(async () => {
        const model = trainer.getModel();
        if (!model) return;
        const success = await storage.exportModel('hand-pose-model', model, cm.classes);
        if (success) {
            showToast('Model exported!', 'success');
        }
    }, [trainer, storage, cm.classes, showToast]);

    // ── Import model ──
    const handleImport = useCallback(
        async (file) => {
            prediction.stopPredicting();

            const result = await storage.importModel(file);
            if (!result) {
                showToast('Failed to import model', 'error');
                return;
            }

            const numClasses = result.classes?.length || 0;
            trainer.setModel(result.model, numClasses);

            if (result.classes) {
                cm.restoreClasses(result.classes);
            }

            showToast(`Model "${result.name}" imported!`, 'success');
            prediction.startPredicting();
        },
        [storage, trainer, cm, prediction, showToast]
    );

    return (
        <div className="train-tab">
            {showLoadingOverlay && (
                <LoadingOverlay
                    message={loadingMessage}
                    progress={
                        trainer.trainingProgress
                            ? trainer.trainingProgress.epoch / trainer.trainingProgress.totalEpochs
                            : undefined
                    }
                />
            )}

            <div className="train-layout">
                {/* Left Column: Webcam + Controls */}
                <div className="train-left">
                    <WebcamPanel
                        onVideoReady={handleVideoReady}
                        isDetecting={hand.isRunning}
                    />
                    <TrainingControls
                        onAddClass={cm.addClass}
                        onTrain={handleTrain}
                        onReset={handleReset}
                        onSave={handleSave}
                        onLoad={handleLoad}
                        onExport={handleExport}
                        onImport={handleImport}
                        hasEnoughData={cm.hasEnoughData}
                        isTraining={trainer.isTraining}
                        isTrained={trainer.isTrained}
                        trainingProgress={trainer.trainingProgress}
                        totalSamples={cm.totalSamples}
                        numClasses={cm.classes.length}
                        savedModels={storage.savedModels}
                    />
                </div>

                {/* Right Column: Classes + Predictions */}
                <div className="train-right">
                    <div className="train-classes">
                        <h3 className="train-section-title">
                            Gesture Classes
                            {cm.classes.length === 0 && (
                                <span className="train-section-hint">
                                    Click "Add Class" to start
                                </span>
                            )}
                        </h3>
                        <div className="train-classes-list">
                            {cm.classes.map((cls) => (
                                <ClassCard
                                    key={cls.id}
                                    classData={cls}
                                    onCollect={handleCollect}
                                    onDeleteSample={cm.deleteSample}
                                    onDelete={cm.deleteClass}
                                    currentLandmarks={hand.currentLandmarks}
                                />
                            ))}
                        </div>
                    </div>

                    <PredictionBars
                        predictions={prediction.predictions}
                        classNames={cm.classNames}
                        threshold={prediction.confidenceThreshold}
                    />
                </div>
            </div>
        </div>
    );
}
