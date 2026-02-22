/**
 * usePredictionManager — React hook for real-time prediction loop
 * 
 * Ported from: js/predictionManager.js
 * 
 * Runs predictions at ~100ms intervals when active,
 * exposing per-class confidence values.
 */

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';

const PREDICTION_INTERVAL = 100; // ms
const CONFIDENCE_THRESHOLD = 0.75;
const EMPTY_PREDICTIONS = []; // Stable reference for "no predictions"

export function usePredictionManager({ getFeatures, predict, classNames }) {
    const [isPredicting, setIsPredicting] = useState(false);
    const [predictions, setPredictions] = useState(EMPTY_PREDICTIONS); // { className, confidence }[]
    const [topPrediction, setTopPrediction] = useState(null); // { className, confidence } | null

    const intervalRef = useRef(null);
    const onPredictionCallbackRef = useRef(null);
    const classNamesRef = useRef(classNames);
    const prevTopClassRef = useRef(null); // Track the previous top prediction class name

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
                // Only update state if it was previously non-empty
                setPredictions(prev => prev.length === 0 ? prev : EMPTY_PREDICTIONS);
                setTopPrediction(prev => prev === null ? prev : null);
                prevTopClassRef.current = null;
                return;
            }

            const result = predict(features);
            if (!result) return;

            const mapped = result.map((r) => ({
                className: classNamesRef.current[r.classIndex] || `Class ${r.classIndex}`,
                confidence: r.confidence,
            }));

            // Only update predictions if values actually changed
            setPredictions(prev => {
                // Quick check: if lengths differ, definitely changed
                if (prev.length !== mapped.length) return mapped;
                // Compare confidences (fast enough for small arrays)
                for (let i = 0; i < mapped.length; i++) {
                    if (prev[i]?.className !== mapped[i].className ||
                        Math.abs((prev[i]?.confidence || 0) - mapped[i].confidence) > 0.01) {
                        return mapped;
                    }
                }
                return prev; // No meaningful change, keep same reference
            });

            // Find top prediction
            const top = mapped.reduce((best, curr) =>
                curr.confidence > best.confidence ? curr : best
            );

            if (top.confidence >= CONFIDENCE_THRESHOLD) {
                // Only update if the top class changed
                if (prevTopClassRef.current !== top.className) {
                    prevTopClassRef.current = top.className;
                    setTopPrediction(top);
                    if (onPredictionCallbackRef.current) {
                        onPredictionCallbackRef.current(top);
                    }
                }
            } else {
                if (prevTopClassRef.current !== null) {
                    prevTopClassRef.current = null;
                    setTopPrediction(null);
                }
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
        setPredictions(EMPTY_PREDICTIONS);
        setTopPrediction(null);
        prevTopClassRef.current = null;
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, []);

    return useMemo(() => ({
        isPredicting,
        predictions,
        topPrediction,
        startPredicting,
        stopPredicting,
        onPrediction,
        confidenceThreshold: CONFIDENCE_THRESHOLD,
    }), [isPredicting, predictions, topPrediction, startPredicting, stopPredicting, onPrediction]);
}
