/**
 * MediaPipe HandLandmarker loader utility
 * 
 * Handles loading the MediaPipe vision WASM and HandLandmarker model
 * with GPU → CPU fallback.
 */

import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';

let handLandmarkerInstance = null;
let loadingPromise = null;

export async function loadHandLandmarker() {
    if (handLandmarkerInstance) return handLandmarkerInstance;
    if (loadingPromise) return loadingPromise;

    loadingPromise = (async () => {
        const vision = await FilesetResolver.forVisionTasks(
            'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        );

        // Try GPU first, fall back to CPU
        let delegate = 'GPU';
        try {
            handLandmarkerInstance = await HandLandmarker.createFromOptions(vision, {
                baseOptions: {
                    modelAssetPath:
                        'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
                    delegate,
                },
                runningMode: 'VIDEO',
                numHands: 2,
            });
        } catch {
            console.warn('GPU delegate failed, falling back to CPU');
            delegate = 'CPU';
            handLandmarkerInstance = await HandLandmarker.createFromOptions(vision, {
                baseOptions: {
                    modelAssetPath:
                        'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
                    delegate,
                },
                runningMode: 'VIDEO',
                numHands: 2,
            });
        }

        console.log(`HandLandmarker loaded with ${delegate} delegate`);
        return handLandmarkerInstance;
    })();

    return loadingPromise;
}

/**
 * Extract 63 features from hand landmarks (21 landmarks × 3 coords)
 */
export function extractFeatures(landmarks) {
    if (!landmarks || landmarks.length === 0) return null;
    const hand = landmarks[0]; // Use first detected hand
    const features = [];
    for (const lm of hand) {
        features.push(lm.x, lm.y, lm.z);
    }
    return features; // 63 floats
}

/**
 * Draw hand landmarks + connections on a canvas
 */
export function drawLandmarks(ctx, landmarks, width, height) {
    if (!landmarks || landmarks.length === 0) return;

    const connections = [
        [0, 1], [1, 2], [2, 3], [3, 4],           // thumb
        [0, 5], [5, 6], [6, 7], [7, 8],           // index
        [0, 9], [9, 10], [10, 11], [11, 12],      // middle
        [0, 13], [13, 14], [14, 15], [15, 16],    // ring
        [0, 17], [17, 18], [18, 19], [19, 20],    // pinky
        [5, 9], [9, 13], [13, 17],             // palm
    ];

    for (const hand of landmarks) {
        // Draw connections
        ctx.strokeStyle = 'var(--gold)';
        ctx.lineWidth = 2;
        for (const [a, b] of connections) {
            ctx.beginPath();
            ctx.moveTo(hand[a].x * width, hand[a].y * height);
            ctx.lineTo(hand[b].x * width, hand[b].y * height);
            ctx.stroke();
        }

        // Draw landmarks
        for (const lm of hand) {
            ctx.fillStyle = 'var(--gold)';
            ctx.beginPath();
            ctx.arc(lm.x * width, lm.y * height, 4, 0, 2 * Math.PI);
            ctx.fill();
        }
    }
}
