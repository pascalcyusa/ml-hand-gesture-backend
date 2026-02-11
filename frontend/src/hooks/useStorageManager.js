/**
 * useStorageManager — React hook for model persistence
 * 
 * Ported from: js/storageManager.js
 * 
 * Uses TensorFlow.js tf.io for IndexedDB model storage,
 * and localStorage for class metadata.
 */

import { useState, useCallback, useEffect } from 'react';
import * as tf from '@tensorflow/tfjs';

const STORAGE_KEY_PREFIX = 'handpose-model-';
const METADATA_KEY = 'handpose-saved-models';

export function useStorageManager() {
    const [savedModels, setSavedModels] = useState([]);

    // Load list of saved models on mount
    useEffect(() => {
        refreshModelList();
    }, []);

    const refreshModelList = useCallback(() => {
        try {
            const data = localStorage.getItem(METADATA_KEY);
            const models = data ? JSON.parse(data) : [];
            setSavedModels(models);
        } catch {
            setSavedModels([]);
        }
    }, []);

    // Save model + metadata
    const saveModel = useCallback(async (name, model, classesData) => {
        if (!model || !name) return false;

        try {
            const modelKey = `${STORAGE_KEY_PREFIX}${name}`;
            await model.save(`indexeddb://${modelKey}`);

            // Save metadata
            const metadata = {
                name,
                key: modelKey,
                classes: classesData.map((c) => ({
                    name: c.name,
                    sampleCount: c.samples?.length || 0,
                })),
                savedAt: new Date().toISOString(),
            };

            const existing = JSON.parse(localStorage.getItem(METADATA_KEY) || '[]');
            const updated = existing.filter((m) => m.name !== name);
            updated.push(metadata);
            localStorage.setItem(METADATA_KEY, JSON.stringify(updated));

            refreshModelList();
            return true;
        } catch (err) {
            console.error('Error saving model:', err);
            return false;
        }
    }, [refreshModelList]);

    // Load a saved model
    const loadModel = useCallback(async (name) => {
        try {
            const modelKey = `${STORAGE_KEY_PREFIX}${name}`;
            const model = await tf.loadLayersModel(`indexeddb://${modelKey}`);

            const existing = JSON.parse(localStorage.getItem(METADATA_KEY) || '[]');
            const metadata = existing.find((m) => m.name === name);

            return { model, metadata };
        } catch (err) {
            console.error('Error loading model:', err);
            return null;
        }
    }, []);

    // Delete a saved model
    const deleteModel = useCallback(async (name) => {
        try {
            const modelKey = `${STORAGE_KEY_PREFIX}${name}`;
            await tf.io.removeModel(`indexeddb://${modelKey}`);

            const existing = JSON.parse(localStorage.getItem(METADATA_KEY) || '[]');
            const updated = existing.filter((m) => m.name !== name);
            localStorage.setItem(METADATA_KEY, JSON.stringify(updated));

            refreshModelList();
            return true;
        } catch (err) {
            console.error('Error deleting model:', err);
            return false;
        }
    }, [refreshModelList]);

    // Export model as JSON download
    const exportModel = useCallback(async (name, model, classesData) => {
        if (!model) return false;

        try {
            // Get model topology and weights
            const saveResult = await model.save(tf.io.withSaveHandler(async (artifacts) => {
                return artifacts;
            }));

            const exportData = {
                format: 'handpose-model-v1',
                name,
                classes: classesData.map((c) => ({
                    name: c.name,
                    samples: c.samples,
                })),
                modelTopology: saveResult.modelTopology,
                weightSpecs: saveResult.weightSpecs,
                weightData: Array.from(new Uint8Array(saveResult.weightData)),
                exportedAt: new Date().toISOString(),
            };

            const blob = new Blob([JSON.stringify(exportData)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${name}.handpose.json`;
            a.click();
            URL.revokeObjectURL(url);

            return true;
        } catch (err) {
            console.error('Error exporting model:', err);
            return false;
        }
    }, []);

    // Import model from JSON file
    const importModel = useCallback(async (file) => {
        try {
            const text = await file.text();
            const data = JSON.parse(text);

            if (data.format !== 'handpose-model-v1') {
                throw new Error('Invalid model format');
            }

            // Reconstruct weight data
            const weightData = new Uint8Array(data.weightData).buffer;

            const model = await tf.loadLayersModel(
                tf.io.fromMemory(data.modelTopology, data.weightSpecs, weightData)
            );

            return {
                model,
                name: data.name,
                classes: data.classes,
            };
        } catch (err) {
            console.error('Error importing model:', err);
            return null;
        }
    }, []);

    return {
        savedModels,
        saveModel,
        loadModel,
        deleteModel,
        exportModel,
        importModel,
        refreshModelList,
    };
}
