/**
 * useStorageManager — Manages saving/loading models and configs to backend
 * 
 * Replaces localStorage with backend API calls.
 */

import { useCallback, useMemo } from 'react';
import { useAuth } from './useAuth';
import { API_BASE_URL as API_Base } from '../config';

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

    const listCommunityPiano = useCallback(async () => {
        try {
            const res = await fetch(`${API_Base}/piano/community`);
            if (res.ok) {
                return await res.json();
            }
            return [];
        } catch (err) {
            console.error("List community piano error:", err);
            return [];
        }
    }, []);

    const listCommunityGestures = useCallback(async () => {
        try {
            const res = await fetch(`${API_Base}/gestures/community`);
            if (res.ok) {
                return await res.json();
            }
            return [];
        } catch (err) {
            console.error("List community gestures error:", err);
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

            // If we have a dataset with classes, use that (contains samples)
            if (fullModel.dataset && fullModel.dataset.classes) {
                return {
                    model: fullModel.model_data,
                    classes: fullModel.dataset.classes,
                    dataset: fullModel.dataset
                };
            }

            // Fallback: create class objects from class_names
            const classes = (fullModel.class_names || []).map(name => ({
                name,
                samples: []
            }));

            return {
                model: fullModel.model_data,
                classes,
                dataset: null
            };
        }
        return null;
    }, [loadModel]);


    const deleteModel = useCallback(async (id) => {
        try {
            const headers = getHeaders();
            if (!headers.Authorization) return false;
            const res = await fetch(`${API_Base}/models/${id}`, {
                method: 'DELETE',
                headers
            });
            return res.ok;
        } catch (err) {
            console.error("Delete model error:", err);
            return false;
        }
    }, [getHeaders]);

    const updateModelVisibility = useCallback(async (id, isPublic) => {
        try {
            const headers = getHeaders();
            if (!headers.Authorization) return false;

            const res = await fetch(`${API_Base}/models/${id}/visibility`, {
                method: 'PATCH',
                headers: {
                    ...headers,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ is_public: isPublic })
            });
            return res.ok;
        } catch (err) {
            console.error("Update visibility error:", err);
            return false;
        }
    }, [getHeaders]);

    const deletePianoSequence = useCallback(async (id) => {
        try {
            const headers = getHeaders();
            if (!headers.Authorization) return false;
            const res = await fetch(`${API_Base}/piano/${id}`, {
                method: 'DELETE',
                headers
            });
            return res.ok;
        } catch (err) {
            console.error("Delete piano error:", err);
            return false;
        }
    }, [getHeaders]);

    const deleteGestureMapping = useCallback(async (id) => {
        try {
            const headers = getHeaders();
            if (!headers.Authorization) return false;
            const res = await fetch(`${API_Base}/gestures/${id}`, {
                method: 'DELETE',
                headers
            });
            return res.ok;
        } catch (err) {
            console.error("Delete gesture error:", err);
            return false;
        }
    }, [getHeaders]);

    const updatePianoVisibility = useCallback(async (id, isPublic) => {
        try {
            const headers = getHeaders();
            if (!headers.Authorization) return false;

            const res = await fetch(`${API_Base}/piano/${id}/visibility`, {
                method: 'PATCH',
                headers: {
                    ...headers,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ is_public: isPublic })
            });
            return res.ok;
        } catch (err) {
            console.error("Update piano visibility error:", err);
            return false;
        }
    }, [getHeaders]);

    const updateGestureVisibility = useCallback(async (id, isPublic) => {
        try {
            const headers = getHeaders();
            if (!headers.Authorization) return false;

            const res = await fetch(`${API_Base}/gestures/${id}/visibility`, {
                method: 'PATCH',
                headers: {
                    ...headers,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ is_public: isPublic })
            });
            return res.ok;
        } catch (err) {
            console.error("Update gesture visibility error:", err);
            return false;
        }
    }, [getHeaders]);

    return useMemo(() => ({
        saveModel,
        listMyModels,
        loadModel,
        listCommunityModels,
        listCommunityPiano,
        listCommunityGestures,
        deleteModel,
        importFromCloud,
        savePianoSequence,
        getPianoSequences,
        deletePianoSequence,
        saveGestureMapping,
        getGestureMappings,
        deleteGestureMapping,
        saveTrainingSession,
        updateModelVisibility,
        updatePianoVisibility,
        updateGestureVisibility,
    }), [
        saveModel,
        listMyModels,
        loadModel,
        listCommunityModels,
        listCommunityPiano,
        listCommunityGestures,
        deleteModel,
        importFromCloud,
        savePianoSequence,
        getPianoSequences,
        deletePianoSequence,
        saveGestureMapping,
        getGestureMappings,
        deleteGestureMapping,
        saveTrainingSession,
        updateModelVisibility,
        updatePianoVisibility,
        updateGestureVisibility,
    ]);
}
