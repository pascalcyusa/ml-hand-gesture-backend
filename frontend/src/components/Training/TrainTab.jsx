import { useState, useCallback, useRef, useEffect } from 'react';
import * as tf from '@tensorflow/tfjs';

import WebcamPanel from './WebcamPanel.jsx';
import ClassCard from './ClassCard.jsx';
import PredictionBars from './PredictionBars.jsx';
import TrainingControls from './TrainingControls.jsx';
import LoadingOverlay from '../common/LoadingOverlay.jsx';
import { arrayBufferToBase64, base64ToArrayBuffer } from '../../utils/helpers.js';
import './TrainTab.css';

export default function TrainTab({ showToast, hand, cm, trainer, prediction, storage, auth }) {
    const [showLoadingOverlay, setShowLoadingOverlay] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [savedModels, setSavedModels] = useState([]);
    const [isCameraStarted, setIsCameraStarted] = useState(false);
    const videoReadyRef = useRef(false);

    // ── Fetch saved models on mount ──
    const refreshModels = useCallback(async () => {
        if (auth && auth.user) {
            const models = await storage.listMyModels();
            setSavedModels(models);
        } else {
            setSavedModels([]);
        }
    }, [auth, storage]);

    useEffect(() => {
        refreshModels();
    }, [refreshModels]);

    // ── Start detection when webcam is ready ──
    const handleVideoReady = useCallback(async (videoEl, canvasEl) => {
        if (videoReadyRef.current) return;
        videoReadyRef.current = true;
        setShowLoadingOverlay(true);
        setLoadingMessage('Loading hand detection model...');
        await hand.start(videoEl, canvasEl);
        setShowLoadingOverlay(false);
        showToast('Hand detection ready!', 'success');
    }, [hand, showToast]);

    // ── Handle webcam errors ──
    useEffect(() => {
        if (hand.error) {
            const msg = hand.error.name === 'NotAllowedError'
                ? 'Camera permissions denied'
                : `Camera error: ${hand.error.message}`;
            showToast(msg, 'error');
            setIsCameraStarted(false);
        }
    }, [hand.error, showToast]);

    const handleStartCamera = useCallback(() => {
        setIsCameraStarted(true);
    }, []);

    // ── Collect sample ──
    const handleCollect = useCallback((classId) => {
        if (!hand.currentLandmarks) {
            showToast('No hand detected — show your hand to the camera', 'warning');
            return;
        }
        const success = cm.collectSample(classId, hand.currentLandmarks);
        if (success) {
            // Optional: shorter toast or no toast to avoid spam
            // showToast('Sample collected!', 'success'); 
        }
    }, [hand.currentLandmarks, cm, showToast]);

    // ── Train model ──
    const handleTrain = useCallback(async () => {
        prediction.stopPredicting();
        setShowLoadingOverlay(true);
        setLoadingMessage('Training model...');

        const trainingData = cm.getTrainingData();

        if (auth.user) {
            setLoadingMessage('Backing up training data...');
            await storage.saveTrainingSession(cm.classNames, {
                features: trainingData.features,
                labels: trainingData.labels
            });
            setLoadingMessage('Training model...');
        }

        const success = await trainer.train(trainingData);
        setShowLoadingOverlay(false);

        if (success) {
            showToast('Model trained successfully!', 'success');
            prediction.startPredicting();
        } else {
            showToast('Training failed — check console', 'error');
        }
    }, [cm, trainer, prediction, showToast, auth, storage]);

    // ── Reset ──
    const handleReset = useCallback(() => {
        prediction.stopPredicting();
        trainer.resetModel();
        cm.reset();
        showToast('All data cleared', 'info');
    }, [prediction, trainer, cm, showToast]);

    // ── Save/Load Logic ──
    const handleSave = useCallback(async (name) => {
        if (!auth.user) return showToast('Please log in to save', 'info');
        if (!trainer.isTrained) return showToast('Train a model first', 'warning');

        setShowLoadingOverlay(true);
        try {
            const saveHandler = tf.io.withSaveHandler(async (artifacts) => {
                const weightDataB64 = arrayBufferToBase64(artifacts.weightData);
                const success = await storage.saveModel(
                    name, artifacts.modelTopology, artifacts.weightSpecs, weightDataB64,
                    cm.classNames, { classes: cm.classes }, false
                );
                if (success) {
                    showToast(`Model "${name}" saved!`, 'success');
                    refreshModels();
                } else {
                    showToast('Failed to save', 'error');
                }
            });
            await trainer.getModel().save(saveHandler);
        } catch (err) {
            console.error(err);
            showToast('Error saving model', 'error');
        } finally {
            setShowLoadingOverlay(false);
        }
    }, [trainer, storage, cm.classes, cm.classNames, showToast, auth, refreshModels]);

    const handleLoad = useCallback(async (name) => {
        if (!auth.user) return showToast('Please log in', 'info');
        const modelItem = savedModels.find(m => m.name === name);
        if (!modelItem) return showToast(`Model "${name}" not found`, 'error');

        prediction.stopPredicting();
        setShowLoadingOverlay(true);
        setLoadingMessage('Loading model...');

        try {
            const modelData = await storage.loadModel(modelItem.id);
            if (modelData) {
                // Restore Classes
                const restoredClasses = modelData.dataset?.classes ||
                    modelData.class_names.map(n => ({ name: n, samples: [] }));
                cm.restoreClasses(restoredClasses);

                // Restore Model
                if (modelData.model_data) {
                    const { modelTopology, weightSpecs, weightData } = modelData.model_data;
                    const model = await tf.loadLayersModel(tf.io.fromMemory({
                        modelTopology,
                        weightSpecs,
                        weightData: base64ToArrayBuffer(weightData)
                    }));
                    trainer.setModel(model, modelData.class_names.length);
                    showToast(`Model loaded!`, 'success');
                    prediction.startPredicting();
                }
            }
        } catch (err) {
            console.error(err);
            showToast('Error loading model', 'error');
        } finally {
            setShowLoadingOverlay(false);
        }
    }, [storage, trainer, cm, prediction, showToast, auth, savedModels]);

    return (
        <div className="train-tab">
            {showLoadingOverlay && (
                <LoadingOverlay
                    message={loadingMessage}
                    progress={trainer.trainingProgress ? (trainer.trainingProgress.epoch / trainer.trainingProgress.totalEpochs) : null}
                />
            )}

            <div className="train-layout">
                {/* Left Panel */}
                <div className="train-left">
                    <WebcamPanel
                        onVideoReady={handleVideoReady}
                        isDetecting={hand.isRunning}
                        isStarted={isCameraStarted}
                        onStartCamera={handleStartCamera}
                    />
                    <TrainingControls
                        onAddClass={cm.addClass}
                        onTrain={handleTrain}
                        onReset={handleReset}
                        onSave={handleSave}
                        onLoad={handleLoad}
                        savedModels={savedModels}
                        hasEnoughData={cm.hasEnoughData}
                        isTraining={trainer.isTraining}
                        isTrained={trainer.isTrained}
                        trainingProgress={trainer.trainingProgress}
                        totalSamples={cm.totalSamples}
                        numClasses={cm.classes.length}
                    />
                </div>

                {/* Right Panel */}
                <div className="train-right">
                    <div className="train-classes">
                        <h3 className="train-section-title">
                            Gesture Classes
                        </h3>
                        <div className="train-classes-list">
                            {cm.classes.map((cls, index) => (
                                <ClassCard
                                    /* * FIX: Use cls.id if available, otherwise fallback to index.
                                     * This prevents the 'coupling' bug if IDs are missing.
                                     */
                                    key={cls.id || index}
                                    classData={cls}
                                    onCollect={handleCollect}
                                    onDeleteSample={cm.deleteSample}
                                    onDelete={cm.deleteClass}
                                    currentLandmarks={hand.currentLandmarks}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="train-predictions">
                        <PredictionBars
                            predictions={prediction.predictions}
                            classNames={cm.classNames}
                            threshold={prediction.confidenceThreshold}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}