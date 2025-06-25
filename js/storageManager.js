/**
 * Storage Manager Module for Hand Poses
 * Handles saving and loading models and configurations
 */

const StorageManagerModule = (function () {
    // Private variables
    let modelTrainer = null;
    let classManager = null;

    // Storage keys
    const STORAGE_KEYS = {
        MODEL_INFO: 'hand-pose-classifier-model-info',
        CLASSES: 'hand-pose-classifier-classes'
    };

    // Initialize storage manager
    function init(modelTrainerModule, classManagerModule) {
        modelTrainer = modelTrainerModule;
        classManager = classManagerModule;

        return this;
    }

    // Save the model
    async function saveModel(modelName = 'default') {
        if (!modelTrainer.isModelTrained()) {
            throw new Error('No trained model to save');
        }

        try {
            // Create model info
            const modelInfo = {
                name: modelName,
                timestamp: Date.now(),
                classes: classManager.getAllClasses().map(c => ({
                    id: c.id,
                    name: c.name
                }))
            };

            // Save model to IndexedDB
            const model = modelTrainer.getModel();
            await model.save(`indexeddb://hand-pose-classifier-${modelName}`);

            // Save model info to localStorage
            const savedModels = getSavedModelsList();
            savedModels.push(modelInfo);
            localStorage.setItem(STORAGE_KEYS.MODEL_INFO, JSON.stringify(savedModels));

            return modelInfo;
        } catch (error) {
            console.error('Error saving model:', error);
            throw error;
        }
    }

    // Load a model
    async function loadModel(modelName = 'default') {
        try {
            // Load model from IndexedDB
            const model = await tf.loadLayersModel(`indexeddb://hand-pose-classifier-${modelName}`);

            // Get model info from localStorage
            const savedModels = getSavedModelsList();
            const modelInfo = savedModels.find(m => m.name === modelName);

            if (!modelInfo) {
                throw new Error(`Model info for "${modelName}" not found`);
            }

            // Set the model in the trainer
            modelTrainer.setModel(model);

            // Set classes in the class manager
            classManager.setClasses(modelInfo.classes.map(c => ({
                id: c.id,
                name: c.name,
                samples: [] // We don't save samples
            })));

            return modelInfo;
        } catch (error) {
            console.error('Error loading model:', error);
            throw error;
        }
    }

    // Delete a saved model
    async function deleteModel(modelName) {
        try {
            // Get the list of saved models
            const savedModels = getSavedModelsList();
            const modelIndex = savedModels.findIndex(m => m.name === modelName);

            if (modelIndex === -1) {
                throw new Error(`Model "${modelName}" not found`);
            }

            // Remove from list
            savedModels.splice(modelIndex, 1);
            localStorage.setItem(STORAGE_KEYS.MODEL_INFO, JSON.stringify(savedModels));

            // Delete from IndexedDB
            // Note: This is a bit tricky as the tf.js API doesn't provide a direct way to delete models
            // We'll use the underlying IndexedDB API

            return new Promise((resolve, reject) => {
                const request = indexedDB.deleteDatabase(`tensorflowjs_models/hand-pose-classifier-${modelName}`);

                request.onsuccess = () => resolve(true);
                request.onerror = () => reject(new Error('Error deleting model from IndexedDB'));
            });
        } catch (error) {
            console.error('Error deleting model:', error);
            throw error;
        }
    }

    // Get list of saved models
    function getSavedModelsList() {
        const modelsJson = localStorage.getItem(STORAGE_KEYS.MODEL_INFO);
        return modelsJson ? JSON.parse(modelsJson) : [];
    }

    // Export a model to a JSON file
    async function exportModel(modelName = 'default') {
        if (!modelTrainer.isModelTrained()) {
            throw new Error('No trained model to export');
        }

        try {
            // Get model
            const model = modelTrainer.getModel();

            // Get classes
            const classes = classManager.getAllClasses().map(c => ({
                id: c.id,
                name: c.name
            }));

            // Convert model to JSON format (weights and topology)
            const modelJSON = await model.save(tf.io.withSaveHandler(async modelArtifacts => {
                return modelArtifacts;
            }));

            // Combine model and metadata
            const exportData = {
                model: modelJSON,
                metadata: {
                    name: modelName,
                    timestamp: Date.now(),
                    classes: classes,
                    type: 'hand-pose-classifier'
                }
            };

            // Convert to JSON string
            const jsonString = JSON.stringify(exportData);

            // Create blob and download link
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            // Create and click download link
            const a = document.createElement('a');
            a.href = url;
            a.download = `hand-pose-model-${modelName}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            return true;
        } catch (error) {
            console.error('Error exporting model:', error);
            throw error;
        }
    }

    // Import a model from a JSON file
    async function importModel(fileInput) {
        try {
            return new Promise((resolve, reject) => {
                if (!fileInput.files || fileInput.files.length === 0) {
                    reject(new Error('No file selected'));
                    return;
                }

                const file = fileInput.files[0];
                const reader = new FileReader();

                reader.onload = async (event) => {
                    try {
                        // Parse JSON
                        const importData = JSON.parse(event.target.result);

                        // Validate data structure
                        if (!importData.model || !importData.metadata || !importData.metadata.classes) {
                            reject(new Error('Invalid model file format'));
                            return;
                        }

                        // Verify it's a hand pose classifier
                        if (importData.metadata.type !== 'hand-pose-classifier') {
                            reject(new Error('This model is not a hand pose classifier'));
                            return;
                        }

                        // Load model
                        const model = await tf.loadLayersModel(tf.io.fromMemory(importData.model));

                        // Set the model
                        modelTrainer.setModel(model);

                        // Set classes
                        classManager.setClasses(importData.metadata.classes.map(c => ({
                            id: c.id,
                            name: c.name,
                            samples: []
                        })));

                        // Save to localStorage/IndexedDB for future use
                        const modelName = importData.metadata.name || 'imported';
                        await model.save(`indexeddb://hand-pose-classifier-${modelName}`);

                        // Save model info
                        const modelInfo = {
                            name: modelName,
                            timestamp: importData.metadata.timestamp || Date.now(),
                            classes: importData.metadata.classes
                        };

                        const savedModels = getSavedModelsList();
                        savedModels.push(modelInfo);
                        localStorage.setItem(STORAGE_KEYS.MODEL_INFO, JSON.stringify(savedModels));

                        resolve(modelInfo);
                    } catch (error) {
                        reject(error);
                    }
                };

                reader.onerror = () => {
                    reject(new Error('Error reading file'));
                };

                reader.readAsText(file);
            });
        } catch (error) {
            console.error('Error importing model:', error);
            throw error;
        }
    }

    // Generate example code for using the model
    function generateCodeSnippet() {
        if (!modelTrainer.isModelTrained()) {
            return '// Train your model first to see example code';
        }

        const classes = classManager.getAllClasses().map(c => c.name);

        const code = `// Example code to use this hand pose model in another project
// Step 1: Setup MediaPipe HandLandmarker
import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";

let handLandmarker;
let model;

async function setup() {
    // Load MediaPipe HandLandmarker
    const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
    );
    
    handLandmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
            delegate: "GPU"
        },
        runningMode: "VIDEO",
        numHands: 1
    });
    
    // Load your trained model
    model = await tf.loadLayersModel('path/to/your/model.json');
    
    // Start webcam
    startWebcam();
}

// Step 2: Extract hand features (same as training)
function extractHandFeatures(landmarks) {
    if (!landmarks || landmarks.length === 0) return null;
    
    // Get wrist as reference point
    const wristPos = landmarks[0];
    
    const features = [];
    
    // For each landmark, calculate normalized position
    landmarks.forEach(landmark => {
        const x = (landmark.x - wristPos.x);
        const y = (landmark.y - wristPos.y);
        const z = (landmark.z - wristPos.z);
        
        features.push(x, y, z);
    });
    
    return features;
}

// Step 3: Make predictions
function predict(landmarks) {
    const features = extractHandFeatures(landmarks);
    
    if (!features) return;
    
    const input = tf.tensor2d([features]);
    const prediction = model.predict(input);
    const values = prediction.dataSync();
    
    // Get class with highest probability
    let maxIndex = 0;
    let maxValue = values[0];
    
    for (let i = 1; i < values.length; i++) {
        if (values[i] > maxValue) {
            maxValue = values[i];
            maxIndex = i;
        }
    }
    
    const classNames = ${JSON.stringify(classes)};
    
    console.log('Detected hand pose:', classNames[maxIndex], 'with confidence:', maxValue);
    
    // Clean up tensor
    input.dispose();
    prediction.dispose();
    
    return {
        className: classNames[maxIndex],
        confidence: maxValue
    };
}

// You can use this function in your animation loop
function processVideo() {
    if (video.readyState === 4) { // Has enough data
        const results = handLandmarker.detectForVideo(video, performance.now());
        
        if (results.landmarks && results.landmarks.length > 0) {
            // Hand detected, make prediction
            const prediction = predict(results.landmarks[0]);
            
            if (prediction && prediction.confidence > 0.7) {
                // Do something with the prediction
                updateUI(prediction);
            }
        }
    }
    
    requestAnimationFrame(processVideo);
}`;

        return code;
    }

    // Public API
    return {
        init,
        saveModel,
        loadModel,
        deleteModel,
        getSavedModelsList,
        exportModel,
        importModel,
        generateCodeSnippet
    };
})();

// Export the module
window.StorageManagerModule = StorageManagerModule;