/**
 * useHandDetection — React hook wrapping MediaPipe hand detection
 * 
 * Ported from: js/handDetection.js
 * 
 * Manages webcam stream, MediaPipe HandLandmarker, and the 
 * requestAnimationFrame detection loop.
 */

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { loadHandLandmarker, extractFeatures, drawLandmarks } from '../utils/mediapipe.js';

export function useHandDetection() {
    const [isModelLoaded, setIsModelLoaded] = useState(false);
    const [isRunning, setIsRunning] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isHandDetected, setIsHandDetected] = useState(false); // Triggers UI updates

    // Store landmarks in a ref to avoid re-rendering on every frame (~60fps).
    const currentLandmarksRef = useRef(null);

    const handLandmarkerRef = useRef(null);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);
    const animFrameRef = useRef(null);
    const lastTimestampRef = useRef(-1);

    // Load the MediaPipe model
    const loadModel = useCallback(async () => {
        if (handLandmarkerRef.current) return;
        setIsLoading(true);
        try {
            handLandmarkerRef.current = await loadHandLandmarker();
            setIsModelLoaded(true);
        } catch (err) {
            console.error('Failed to load HandLandmarker:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Start webcam + detection loop
    const start = useCallback(async (videoElement, canvasElement) => {
        videoRef.current = videoElement;
        canvasRef.current = canvasElement;

        if (!handLandmarkerRef.current) {
            await loadModel();
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480, facingMode: 'user' },
            });
            streamRef.current = stream;
            videoElement.srcObject = stream;
            await videoElement.play();

            setIsRunning(true);
            lastTimestampRef.current = -1;
            detectLoop();
        } catch (err) {
            console.error('Failed to start webcam:', err);
        }
    }, [loadModel]);

    // Detection loop
    const detectLoop = useCallback(() => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const handLandmarker = handLandmarkerRef.current;

        if (!video || !canvas || !handLandmarker) return;

        const ctx = canvas.getContext('2d');
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;

        const tick = () => {
            if (!videoRef.current || videoRef.current.paused || videoRef.current.ended) return;

            // Ensure valid dimensions (fixes ROI width/height > 0 error)
            if (videoRef.current.videoWidth === 0 || videoRef.current.videoHeight === 0) {
                animFrameRef.current = requestAnimationFrame(tick);
                return;
            }

            const timestamp = performance.now();
            if (timestamp === lastTimestampRef.current) {
                animFrameRef.current = requestAnimationFrame(tick);
                return;
            }
            lastTimestampRef.current = timestamp;

            try {
                const result = handLandmarkerRef.current.detectForVideo(video, timestamp);
                const landmarks = result.landmarks;

                // Clear and draw
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                drawLandmarks(ctx, landmarks, canvas.width, canvas.height);

                const hasHands = landmarks && landmarks.length > 0;
                currentLandmarksRef.current = hasHands ? landmarks : null;

                // Only update state if changed (debounce UI updates)
                setIsHandDetected(prev => {
                    if (prev !== hasHands) return hasHands;
                    return prev;
                });

            } catch (err) {
                // Silently handle detection errors (frame timing issues)
            }

            animFrameRef.current = requestAnimationFrame(tick);
        };

        animFrameRef.current = requestAnimationFrame(tick);
    }, []);

    // Stop webcam + detection
    const stop = useCallback(() => {
        if (animFrameRef.current) {
            cancelAnimationFrame(animFrameRef.current);
            animFrameRef.current = null;
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        setIsRunning(false);
        setIsHandDetected(false);
        currentLandmarksRef.current = null;
    }, []);

    // Extract features from current landmarks
    const getFeatures = useCallback(() => {
        return extractFeatures(currentLandmarksRef.current);
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => stop();
    }, [stop]);

    return useMemo(() => ({
        isModelLoaded,
        isLoading,
        isRunning,
        isHandDetected,
        get currentLandmarks() { return currentLandmarksRef.current; },
        start,
        stop,
        getFeatures,
        loadModel,
    }), [isModelLoaded, isLoading, isRunning, isHandDetected, start, stop, getFeatures, loadModel]);
}
