/**
 * useModelTrainer — React hook for TensorFlow.js model training & prediction
 * 
 * Ported from: js/modelTrainer.js
 * 
 * Creates a dense neural network: 63 → 64 → 32 → numClasses
 */

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import * as tf from '@tensorflow/tfjs';

export function useModelTrainer() {
    const [isTraining, setIsTraining] = useState(false);
    const [isTrained, setIsTrained] = useState(false);
    const [trainingProgress, setTrainingProgress] = useState(null);
    const modelRef = useRef(null);
    const numClassesRef = useRef(0);

    // Build the model
    const buildModel = useCallback((numClasses) => {
        // Dispose old model if exists
        if (modelRef.current) {
            modelRef.current.dispose();
        }

        const model = tf.sequential();
        model.add(
            tf.layers.dense({
                inputShape: [63],
                units: 64,
                activation: 'relu',
            })
        );
        model.add(tf.layers.dropout({ rate: 0.2 }));
        model.add(
            tf.layers.dense({
                units: 32,
                activation: 'relu',
            })
        );
        model.add(tf.layers.dropout({ rate: 0.2 }));
        model.add(
            tf.layers.dense({
                units: numClasses,
                activation: 'softmax',
            })
        );

        model.compile({
            optimizer: tf.train.adam(0.001),
            loss: 'categoricalCrossentropy',
            metrics: ['accuracy'],
        });

        modelRef.current = model;
        numClassesRef.current = numClasses;
        return model;
    }, []);

    // Train the model
    const train = useCallback(
        async ({ features, labels, numClasses, epochs = 50, batchSize = 16 }) => {
            setIsTraining(true);
            setTrainingProgress({ epoch: 0, totalEpochs: epochs, loss: 0, accuracy: 0 });

            try {
                const model = buildModel(numClasses);

                // Create tensors
                const xs = tf.tensor2d(features);
                const ys = tf.oneHot(tf.tensor1d(labels, 'int32'), numClasses);

                await model.fit(xs, ys, {
                    epochs,
                    batchSize,
                    shuffle: true,
                    validationSplit: 0.1,
                    callbacks: {
                        onEpochEnd: (epoch, logs) => {
                            setTrainingProgress({
                                epoch: epoch + 1,
                                totalEpochs: epochs,
                                loss: logs.loss,
                                accuracy: logs.acc,
                            });
                        },
                    },
                });

                // Cleanup tensors
                xs.dispose();
                ys.dispose();

                setIsTrained(true);
                return true;
            } catch (err) {
                console.error('Training error:', err);
                return false;
            } finally {
                setIsTraining(false);
            }
        },
        [buildModel]
    );

    // Run prediction on features
    const predict = useCallback((features) => {
        if (!modelRef.current || !features) return null;

        try {
            const input = tf.tensor2d([features]);
            const prediction = modelRef.current.predict(input);
            const data = prediction.dataSync();
            input.dispose();
            prediction.dispose();

            // Return array of { classIndex, confidence }
            return Array.from(data).map((conf, i) => ({
                classIndex: i,
                confidence: conf,
            }));
        } catch {
            return null;
        }
    }, []);

    // Reset model
    const resetModel = useCallback(() => {
        if (modelRef.current) {
            modelRef.current.dispose();
            modelRef.current = null;
        }
        setIsTrained(false);
        setIsTraining(false);
        setTrainingProgress(null);

        // Clear session storage
        window.sessionStorage.removeItem('model_isTrained');
        window.sessionStorage.removeItem('model_numClasses');
        tf.io.removeModel('localstorage://session_current_model').catch(() => { });
    }, []);

    // Get model reference (for save/export)
    const getModel = useCallback(() => modelRef.current, []);

    // Set a loaded model
    const setModel = useCallback((model, numClasses, isTrainedFlag = true) => {
        if (modelRef.current) {
            modelRef.current.dispose();
        }
        modelRef.current = model;
        numClassesRef.current = numClasses;
        setIsTrained(isTrainedFlag);
    }, []);

    // ── Session State Persistence ──
    const [isRestoring, setIsRestoring] = useState(true);

    useEffect(() => {
        // Hydrate from session storage
        const restoreFromSession = async () => {
            try {
                const storedIsTrained = window.sessionStorage.getItem('model_isTrained');
                const storedNumClasses = window.sessionStorage.getItem('model_numClasses');

                if (storedIsTrained === 'true' && storedNumClasses) {
                    try {
                        const loadedModel = await tf.loadLayersModel('localstorage://session_current_model');
                        modelRef.current = loadedModel;
                        numClassesRef.current = parseInt(storedNumClasses, 10);
                        setIsTrained(true);
                    } catch (e) {
                        console.warn("Could not load model from local storage:", e);
                    }
                }
            } catch (e) {
                console.error("Session restore error:", e);
            } finally {
                setIsRestoring(false);
            }
        };

        restoreFromSession();
    }, []);

    useEffect(() => {
        // Save to local storage whenever state changes
        if (isRestoring) return;

        window.sessionStorage.setItem('model_isTrained', isTrained);
        window.sessionStorage.setItem('model_numClasses', numClassesRef.current);

        const saveToSession = async () => {
            if (modelRef.current && isTrained) {
                try {
                    await modelRef.current.save('localstorage://session_current_model');
                } catch (e) {
                    console.error("Could not save model to session storage:", e);
                }
            } else if (!isTrained) {
                try {
                    await tf.io.removeModel('localstorage://session_current_model');
                } catch (e) {
                    // Ignore errors if model doesn't exist
                }
            }
        };

        // Fire and forget
        saveToSession();
    }, [isTrained, isRestoring]);

    return useMemo(() => ({
        isTraining,
        isTrained,
        trainingProgress,
        train,
        predict,
        resetModel,
        getModel,
        setModel,
    }), [isTraining, isTrained, trainingProgress, train, predict, resetModel, getModel, setModel]);
}
