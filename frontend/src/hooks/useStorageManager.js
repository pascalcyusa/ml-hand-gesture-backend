/**
 * useStorageManager — Manages saving/loading models and configs to backend
 * 
 * Replaces localStorage with backend API calls.
 */

import { useCallback } from 'react';
import { useAuth } from './useAuth';

const API_Base = 'http://localhost:8000';

export function useStorageManager() {
    const { getHeaders } = useAuth();

    // ── Models ──

    const saveModel = useCallback(async (name, modelTopology, weightSpecs, weightData, classNames, dataset = null, isPublic = false) => {
        try {
            const headers = getHeaders();
            if (!headers.Authorization) return false;

            const payload = {
                name,
                class_names: classNames,
                model_data: {
                    modelTopology,
                    weightSpecs,
                    weightData, // Base64 encoded by caller
                },
                dataset, // { features: [...], labels: [...] }
                is_public: isPublic,
            };

            const res = await fetch(`${API_Base}/models/save`, {
                method: 'POST',
                headers: {
                    ...headers,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            return res.ok;
        } catch (err) {
            console.error("Save model error:", err);
            return false;
        }
    }, [getHeaders]);

    const listMyModels = useCallback(async () => {
        try {
            const headers = getHeaders();
            if (!headers.Authorization) return [];

            const res = await fetch(`${API_Base}/models/my`, { headers });
            if (res.ok) {
                return await res.json();
            }
            return [];
        } catch (err) {
            console.error("List models error:", err);
            return [];
        }
    }, [getHeaders]);

    const loadModel = useCallback(async (id) => {
        try {
            const headers = getHeaders(); // Optional for public, required for private
            // We pass headers anyway if logged in

            const res = await fetch(`${API_Base}/models/${id}`, { headers });
            if (res.ok) {
                return await res.json(); // { model_data, dataset, class_names, ... }
            }
            return null;
        } catch (err) {
            console.error("Load model error:", err);
            return null;
        }
    }, [getHeaders]);

    // ── Community ──

    const listCommunityModels = useCallback(async () => {
        try {
            const res = await fetch(`${API_Base}/models/community`);
            if (res.ok) {
                return await res.json();
            }
            return [];
        } catch (err) {
            console.error("List community models error:", err);
            return [];
        }
    }, []);

    // ── Configurations (Piano / Gestures) ──

    const savePianoSequence = useCallback(async (title, sequenceData, isActive = false) => {
        try {
            const headers = getHeaders();
            if (!headers.Authorization) return false;

            const res = await fetch(`${API_Base}/piano`, {
                method: 'POST',
                headers: { ...headers, 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, sequence_data: sequenceData, is_active: isActive }),
            });
            return res.ok;
        } catch (err) {
            console.error("Save piano error:", err);
            return false;
        }
    }, [getHeaders]);

    const getPianoSequences = useCallback(async () => {
        try {
            const headers = getHeaders();
            if (!headers.Authorization) return [];
            const res = await fetch(`${API_Base}/piano`, { headers });
            return res.ok ? await res.json() : [];
        } catch (err) {
            return [];
        }
    }, [getHeaders]);

    const saveGestureMapping = useCallback(async (name, mappingData, isActive = false) => {
        try {
            const headers = getHeaders();
            if (!headers.Authorization) return false;

            const res = await fetch(`${API_Base}/gestures`, {
                method: 'POST',
                headers: { ...headers, 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, mapping_data: mappingData, is_active: isActive }),
            });
            return res.ok;
        } catch (err) {
            console.error("Save gesture error:", err);
            return false;
        }
    }, [getHeaders]);

    const getGestureMappings = useCallback(async () => {
        try {
            const headers = getHeaders();
            if (!headers.Authorization) return [];
            const res = await fetch(`${API_Base}/gestures`, { headers });
            return res.ok ? await res.json() : [];
        } catch (err) {
            return [];
        }
    }, [getHeaders]);

    // ── Training Sessions (Raw Data) ──

    const saveTrainingSession = useCallback(async (classNames, samples) => {
        try {
            const headers = getHeaders();
            if (!headers.Authorization) return false;

            // samples: { features: [], labels: [] }
            const res = await fetch(`${API_Base}/training-sessions`, {
                method: 'POST',
                headers: { ...headers, 'Content-Type': 'application/json' },
                body: JSON.stringify({ class_names: classNames, samples }),
            });
            return res.ok;
        } catch (err) {
            console.error("Save training session error:", err);
            return false;
        }
    }, [getHeaders]);

    // Legacy support: importFromCloud (renamed/adjusted)
    // The App.js uses importFromCloud for community models
    const importFromCloud = useCallback(async (modelItem) => {
        // Load full details including model data
        const fullModel = await loadModel(modelItem.id);
        if (fullModel && fullModel.model_data) {
            // Convert back to TFJS Artifacts format if needed
            // our model_data structure matches what TFJS expects for loadLayersModel
            return {
                model: fullModel.model_data,
                classes: fullModel.class_names,
                dataset: fullModel.dataset
            };
        }
        return null;
    }, [loadModel]);


    return {
        saveModel,
        listMyModels,
        loadModel,
        listCommunityModels,
        importFromCloud,
        savePianoSequence,
        getPianoSequences,
        saveGestureMapping,
        getGestureMappings,
        saveTrainingSession,
    };
}
