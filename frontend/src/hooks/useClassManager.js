/**
 * useClassManager — React hook for managing gesture classes and samples
 * 
 * Ported from: js/classManager.js
 */

import { useState, useCallback } from 'react';
import { extractFeatures } from '../utils/mediapipe.js';

let nextClassId = 1;

export function useClassManager() {
    const [classes, setClasses] = useState([]);

    // Add a new gesture class
    const addClass = useCallback((name) => {
        const trimmed = name?.trim();
        if (!trimmed) return;

        setClasses((prev) => [
            ...prev,
            {
                id: nextClassId++,
                name: trimmed,
                samples: [], // Array of { features: number[63], landmarks: object }
            },
        ]);
    }, []);

    // Rename a class
    const renameClass = useCallback((classId, newName) => {
        setClasses((prev) =>
            prev.map((c) =>
                c.id === classId ? { ...c, name: newName.trim() } : c
            )
        );
    }, []);

    // Delete a class
    const deleteClass = useCallback((classId) => {
        setClasses((prev) => prev.filter((c) => c.id !== classId));
    }, []);

    // Collect a sample for a class from current landmarks
    const collectSample = useCallback((classId, landmarks) => {
        if (!landmarks || landmarks.length === 0) return false;

        const features = extractFeatures(landmarks);
        if (!features) return false;

        setClasses((prev) =>
            prev.map((c) => {
                if (c.id !== classId) return c;
                return {
                    ...c,
                    samples: [
                        ...c.samples,
                        {
                            features,
                            landmarks: JSON.parse(JSON.stringify(landmarks)),
                        },
                    ],
                };
            })
        );
        return true;
    }, []);

    // Delete a single sample from a class
    const deleteSample = useCallback((classId, sampleIndex) => {
        setClasses((prev) =>
            prev.map((c) => {
                if (c.id !== classId) return c;
                return {
                    ...c,
                    samples: c.samples.filter((_, i) => i !== sampleIndex),
                };
            })
        );
    }, []);

    // Reset all classes
    const reset = useCallback(() => {
        setClasses([]);
        nextClassId = 1;
    }, []);

    // Restore classes from saved model data
    const restoreClasses = useCallback((classData) => {
        if (!Array.isArray(classData)) return;
        const restored = classData.map((c, i) => ({
            id: nextClassId++,
            name: c.name || `Class ${i + 1}`,
            samples: c.samples || [],
        }));
        setClasses(restored);
    }, []);

    // Derived state
    const classNames = classes.map((c) => c.name);
    const totalSamples = classes.reduce((sum, c) => sum + c.samples.length, 0);
    const hasEnoughData =
        classes.length >= 2 && classes.every((c) => c.samples.length >= 1);

    // Get training data (features + labels)
    const getTrainingData = useCallback(() => {
        const features = [];
        const labels = [];
        classes.forEach((c, classIndex) => {
            c.samples.forEach((s) => {
                features.push(s.features);
                labels.push(classIndex);
            });
        });
        return { features, labels, numClasses: classes.length };
    }, [classes]);

    return {
        classes,
        classNames,
        totalSamples,
        hasEnoughData,
        addClass,
        renameClass,
        deleteClass,
        collectSample,
        deleteSample,
        reset,
        restoreClasses,
        getTrainingData,
        setClasses,
    };
}
