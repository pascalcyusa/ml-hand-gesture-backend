/**
 * Hand Detection Module
 * Handles hand pose detection using MediaPipe
 */

const HandDetectionModule = (function () {
    // Private variables
    let handLandmarker = null;
    let canvasElement = null;
    let ctx = null;
    let webcamElement = null;
    let drawingUtils = null;
    let currentHands = [];
    let isRunning = false;
    let handDetectionCallbacks = [];
    let lastVideoTime = -1;
    let modelLoaded = false;
    let modelLoadingPromise = null;

    // Initialize hand detection module
    function init(webcamElementId, canvasElementId) {
        webcamElement = document.getElementById(webcamElementId);
        canvasElement = document.getElementById(canvasElementId);

        if (!webcamElement || !canvasElement) {
            throw new Error('Webcam or canvas element not found');
        }

        // Setup canvas context
        ctx = canvasElement.getContext('2d');

        // Start loading the model, but don't wait for it to complete
        modelLoadingPromise = createHandLandmarker();

        return this;
    }

    // Create hand landmarker instance
    async function createHandLandmarker() {
        const addClassButton = document.getElementById('add-class-btn');

        try {
            // Wait for MediaPipe to be available
            await waitForMediaPipe();

            // Create FilesetResolver
            console.log('Creating FilesetResolver...');
            const vision = await window.mp.FilesetResolver.forVisionTasks(
                "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
            );
            console.log('FilesetResolver created successfully');

            // Try multiple model URLs in case one fails
            const modelUrls = [
                "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task",
                "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
                "https://storage.googleapis.com/mediapipe-assets/hand_landmarker.task"
            ];

            // Try GPU first, then CPU - important for Chromebooks!
            const delegates = ["GPU", "CPU"];

            let lastError = null;
            let modelLoaded = false;

            // Try each model URL with each delegate
            for (let urlIndex = 0; urlIndex < modelUrls.length && !modelLoaded; urlIndex++) {
                for (let delegateIndex = 0; delegateIndex < delegates.length && !modelLoaded; delegateIndex++) {
                    try {
                        const currentUrl = modelUrls[urlIndex];
                        const currentDelegate = delegates[delegateIndex];

                        console.log(`Trying URL ${urlIndex + 1}/${modelUrls.length} with ${currentDelegate}: ${currentUrl}`);
                        // Create HandLandmarker with current URL and delegate
                        handLandmarker = await window.mp.HandLandmarker.createFromOptions(vision, {
                            baseOptions: {
                                modelAssetPath: currentUrl,
                                delegate: currentDelegate
                            },
                            runningMode: "VIDEO",
                            numHands: 1
                        });

                        console.log(`✅ HandLandmarker created successfully!`);
                        console.log(`   Model: ${currentUrl}`);
                        console.log(`   Delegate: ${currentDelegate} ${currentDelegate === 'GPU' ? '(Hardware Accelerated 🚀)' : '(CPU Fallback)'}`);

                        // If we get here, it worked!
                        modelLoaded = true;

                        // Log performance info for teachers/developers
                        if (currentDelegate === 'CPU' && delegateIndex > 0) {
                            console.warn('⚠️ GPU acceleration not available - using CPU. Performance may be reduced on this device.');
                        }

                        break; // Success! Exit the delegate loop

                    } catch (error) {
                        console.warn(`❌ Failed with ${delegates[delegateIndex]} delegate:`, error.message);
                        lastError = error;

                        // Continue to next delegate or next URL
                    }
                }
            }

            // Check if we failed completely
            if (!modelLoaded) {
                throw new Error(`Failed to load HandLandmarker with any configuration. Last error: ${lastError?.message || 'Unknown error'}`);
            }

            // Create drawing utils
            drawingUtils = new window.mp.DrawingUtils(ctx);

            // Update final status
            addClassButton.disabled = false;
            this.modelLoaded = true;

            console.log('🎉 Hand detection model loaded successfully and ready for classroom use!');

            return handLandmarker;

        } catch (error) {
            console.error("💥 Error loading HandLandmarker:", error);

            // Provide helpful error message for teachers
            let errorMessage = 'Error loading hand detection model.';
            if (error.message.includes('startsWith')) {
                errorMessage += ' Model URL issue detected.';
            } else if (error.message.includes('network')) {
                errorMessage += ' Network connection issue - check internet connection.';
            } else if (error.message.includes('CORS')) {
                errorMessage += ' Cross-origin resource sharing issue.';
            } else if (error.message.includes('GPU')) {
                errorMessage += ' Graphics acceleration issue - trying CPU mode.';
            }

            errorMessage += ' This device may have limited capabilities.';

            throw error;
        }
    }

    // Wait for MediaPipe to be available
    function waitForMediaPipe() {
        return new Promise((resolve, reject) => {
            const maxAttempts = 20;
            let attempts = 0;

            function checkMediaPipe() {
                attempts++;

                if (window.mp) {
                    console.log('MediaPipe is available');
                    resolve();
                } else if (attempts >= maxAttempts) {
                    reject(new Error('MediaPipe failed to load after multiple attempts'));
                } else {
                    console.log(`Waiting for MediaPipe to load... (attempt ${attempts}/${maxAttempts})`);
                    setTimeout(checkMediaPipe, 500);
                }
            }

            checkMediaPipe();
        });
    }

    // Start hand detection
    async function start() {
        // Wait for model to finish loading if it hasn't already
        if (!handLandmarker) {
            try {
                console.log('Waiting for HandLandmarker to finish loading...');
                handLandmarker = await modelLoadingPromise;
            } catch (error) {
                throw new Error('Failed to load HandLandmarker: ' + error.message);
            }
        }


        // Initialize webcam if not already running
        if (!isRunning) {
            try {
                const constraints = {
                    video: {
                        width: { ideal: 640 },
                        height: { ideal: 480 }
                    }
                };
                const stream = await navigator.mediaDevices.getUserMedia(constraints);
                webcamElement.srcObject = stream;

                return new Promise((resolve) => {
                    webcamElement.addEventListener('loadeddata', () => {
                        console.log('Webcam data loaded');
                        isRunning = true;
                        lastVideoTime = -1;
                        updateCanvasDimensions()
                        requestAnimationFrame(predictWebcam);
                        resolve(true);
                    });
                });
            } catch (error) {
                console.error('Error accessing webcam:', error);
                throw new Error('Could not access webcam: ' + error.message);
            }
        } else {
            isRunning = true;
            requestAnimationFrame(predictWebcam);
            return true;
        }
    }

    // Stop hand detection
    function stop() {
        isRunning = false;

        // Don't stop the webcam stream as we might restart detection
    }

    // Update canvas dimensions to match webcam
    function updateCanvasDimensions() {
        canvasElement.width = webcamElement.videoWidth;
        canvasElement.height = webcamElement.videoHeight;

        // Set actual canvas dimensions based on display size
        canvasElement.style.width = "100%"
        canvasElement.style.height = "100%"
    }

    // Main prediction loop
    async function predictWebcam() {
        if (!isRunning) return;

        // Only run detection when a new frame is available
        if (lastVideoTime !== webcamElement.currentTime) {
            lastVideoTime = webcamElement.currentTime;

            // Run hand detection
            const startTimeMs = performance.now();

            if (handLandmarker && webcamElement.readyState === 4) { // 4 = HAVE_ENOUGH_DATA
                const results = handLandmarker.detectForVideo(webcamElement, startTimeMs);
                currentHands = results.landmarks || [];

                // Draw detection results
                drawResults(results);

                // Notify callbacks
                notifyHandDetectionCallbacks();
            }
        }

        if (isRunning) {
            requestAnimationFrame(predictWebcam);
        }
    }

    // Draw detection results
    function drawResults(results) {
        // Clear canvas
        ctx.save();
        ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);

        // No hands detected
        if (!results.landmarks || results.landmarks.length === 0) {
            // Draw a hint message when no hands are detected
            ctx.translate(canvasElement.width, 0);
            ctx.scale(-1, 1);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('No hand detected - show your hand to the camera', canvasElement.width / 2, 30);
            ctx.restore();
            return;
        }

        // Draw hands
        for (const landmarks of results.landmarks) {
            // Draw connections
            drawingUtils.drawConnectors(
                landmarks,
                window.mp.HAND_CONNECTIONS,
                { color: '#00FF00', lineWidth: 3 }
            );

            // Draw landmarks
            drawingUtils.drawLandmarks(landmarks, {
                color: '#FF0000',
                lineWidth: 1,
                radius: 3
            });
        }

        ctx.restore();
    }

    // Get current hand landmarks
    function getCurrentHand() {
        if (currentHands && currentHands.length > 0) {
            return currentHands[0];
        }
        return null;
    }

    // Get all detected hands
    function getAllHands() {
        return currentHands || [];
    }

    // Extract hand features for ML training
    function extractHandFeatures(landmarks) {
        if (!landmarks || landmarks.length === 0) {
            console.error('No hand landmarks to extract features from');
            return null;
        }

        try {
            console.log('Extracting features from hand with', landmarks.length, 'landmarks');

            // Normalize coordinates relative to wrist position
            const wristPos = landmarks[0]; // Wrist is the first landmark

            const features = [];

            // For each landmark, calculate normalized position
            landmarks.forEach(landmark => {
                // Calculate position relative to wrist and normalize by canvas size
                const x = (landmark.x - wristPos.x);
                const y = (landmark.y - wristPos.y);
                const z = (landmark.z - wristPos.z);

                // Add normalized coordinates to features
                features.push(x, y, z);
            });

            return features;
        } catch (error) {
            console.error('Error extracting hand features:', error);
            return null;
        }
    }

    // Register for hand detection callbacks
    function onHandDetected(callback) {
        if (typeof callback === 'function') {
            handDetectionCallbacks.push(callback);
        }
    }

    // Remove hand detection callback
    function offHandDetected(callback) {
        const index = handDetectionCallbacks.indexOf(callback);
        if (index !== -1) {
            handDetectionCallbacks.splice(index, 1);
        }
    }

    // Notify all registered callbacks about hand detections
    function notifyHandDetectionCallbacks() {
        const hands = currentHands;
        handDetectionCallbacks.forEach(callback => {
            try {
                callback(hands);
            } catch (error) {
                console.error('Error in hand detection callback:', error);
            }
        });
    }

    /**
     * Draw the 21‐point hand skeleton onto an arbitrary canvas.
     * @param {HTMLCanvasElement} canvas –  size should be set beforehand
     * @param {Array< {x,y,z} >} landmarks – array from getCurrentHand() or detectForVideo()
     */
    function drawHandSkeletonToCanvas(canvas, landmarks) {
        const cctx = canvas.getContext('2d');
        if (!landmarks || landmarks.length === 0) {
            cctx.clearRect(0, 0, canvas.width, canvas.height);
            return;
        }
        // clear and set a neutral background
        cctx.clearRect(0, 0, canvas.width, canvas.height);
        cctx.fillStyle = '#fafafa';
        cctx.fillRect(0, 0, canvas.width, canvas.height);

        // create a fresh DrawingUtils tied to this canvas
        const utils = new window.mp.DrawingUtils(cctx);

        // draw the same connections & keypoints you use in drawResults()
        utils.drawConnectors(
            landmarks,
            window.mp.HAND_CONNECTIONS,
            { color: '#00FF00', lineWidth: 2 }
        );
        utils.drawLandmarks(landmarks, {
            color: '#FF0000',
            lineWidth: 1,
            radius: 2
        });
    }

    /**
     * Take a normalized landmark array (x,y in [0..1]) and
     * return pixel coords for a target width/height.
     */
    function getScaledLandmarks(landmarks, width, height) {
        if (!landmarks || landmarks.length === 0) return [];
        return landmarks.map(pt => ({
            x: pt.x * width,
            y: pt.y * height
        }));
    }


    // Check if model is loaded
    function isModelLoaded() {
        return modelLoaded;
    }

    // Public API
    return {
        init,
        start,
        stop,
        getCurrentHand,
        getAllHands,
        extractHandFeatures,
        onHandDetected,
        offHandDetected,
        drawHandSkeletonToCanvas,
        getScaledLandmarks,
        isModelLoaded
    };
})();

// Export the module
window.HandDetectionModule = HandDetectionModule;