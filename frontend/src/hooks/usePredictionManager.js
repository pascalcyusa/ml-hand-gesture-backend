/**
 * usePredictionManager — React hook for real-time prediction loop
 * 
 * Ported from: js/predictionManager.js
 * 
 * Runs predictions at ~100ms intervals when active,
 * exposing per-class confidence values.
 */

import { useState, useRef, useCallback, useEffect } from 'react';

const PREDICTION_INTERVAL = 100; // ms
const CONFIDENCE_THRESHOLD = 0.75;

export function usePredictionManager({ getFeatures, predict, classNames }) {
    const [isPredicting, setIsPredicting] = useState(false);
    const [predictions, setPredictions] = useState([]); // { className, confidence }[]
    const [topPrediction, setTopPrediction] = useState(null); // { className, confidence } | null

    const intervalRef = useRef(null);
    const onPredictionCallbackRef = useRef(null);
    const classNamesRef = useRef(classNames);

    // Keep classNames ref in sync
    useEffect(() => {
        classNamesRef.current = classNames;
    }, [classNames]);

    // Set external callback for when a high-confidence prediction is made
    const onPrediction = useCallback((callback) => {
        onPredictionCallbackRef.current = callback;
    }, []);

    // Start prediction loop
    const startPredicting = useCallback(() => {
        if (intervalRef.current) return;
        setIsPredicting(true);

        intervalRef.current = setInterval(() => {
            const features = getFeatures();
            if (!features) {
                setPredictions([]);
                setTopPrediction(null);
                return;
            }

            const result = predict(features);
            if (!result) return;

            const mapped = result.map((r) => ({
                className: classNamesRef.current[r.classIndex] || `Class ${r.classIndex}`,
                confidence: r.confidence,
            }));

            setPredictions(mapped);

            // Find top prediction
            const top = mapped.reduce((best, curr) =>
                curr.confidence > best.confidence ? curr : best
            );

            if (top.confidence >= CONFIDENCE_THRESHOLD) {
                setTopPrediction(top);
                if (onPredictionCallbackRef.current) {
                    onPredictionCallbackRef.current(top);
                }
            } else {
                setTopPrediction(null);
            }
        }, PREDICTION_INTERVAL);
    }, [getFeatures, predict]); // Removed classNames dependency as we use ref

    // Stop prediction loop
    const stopPredicting = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        setIsPredicting(false);
        setPredictions([]);
        setTopPrediction(null);
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, []);

    return {
        isPredicting,
        predictions,
        topPrediction,
        startPredicting,
        stopPredicting,
        onPrediction,
        confidenceThreshold: CONFIDENCE_THRESHOLD,
    };
}
