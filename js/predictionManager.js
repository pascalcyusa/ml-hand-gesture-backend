/**
 * Prediction Manager Module for Hand Poses
 * Handles predictions using the trained model and updates UI
 */

const PredictionManagerModule = (function() {
    // Private variables
    let containerElement = null;
    let modelTrainer = null;
    let handDetection = null;
    let classManager = null;
    let isPredicting = false;
    let predictionThreshold = 0.75; // Minimum confidence to consider a prediction valid
    let predictionCallbacks = [];
    let predictionInterval = null;
    let predictionFrequency = 100; // milliseconds between predictions
    let lastClassId = null;

    
    // Initialize prediction manager
    function init(containerElementId, modelTrainerModule, handDetectionModule, classManagerModule) {
        containerElement = document.getElementById(containerElementId);
        if (!containerElement) {
            throw new Error(`Prediction container element with ID '${containerElementId}' not found`);
        }
        
        modelTrainer = modelTrainerModule;
        handDetection = handDetectionModule;
        classManager = classManagerModule;
        
        // Listen for model trained event
        modelTrainer.onModelTrained(() => {
            createPredictionUI();
        });
        
        return this;
    }
    
    // Create prediction UI
    function createPredictionUI() {
        // Clear existing content
        containerElement.innerHTML = '';
        
        const classes = classManager.getAllClasses();
        
        // Create prediction bars for each class
        classes.forEach(classObj => {
            const predictionElement = document.createElement('div');
            predictionElement.innerHTML = `
                <div class="prediction-bar">
                    <div class="prediction-fill" id="prediction-fill-${classObj.id}" style="width: 0%"></div>
                    <div class="prediction-label">${classObj.name}: <span id="prediction-value-${classObj.id}">0%</span></div>
                </div>
            `;
            containerElement.appendChild(predictionElement);
        });
        
        // Add status element
        const statusElement = document.createElement('div');
        statusElement.className = 'status ready';
        statusElement.textContent = 'Model is ready! Show a hand pose to see predictions.';
        containerElement.appendChild(statusElement);
    }
    
    // Start prediction
    function startPredicting() {
        if (isPredicting) return;
        
        if (!modelTrainer.isModelTrained()) {
            throw new Error('Model not trained');
        }
        
        isPredicting = true;
        
        // Start prediction loop
        predictionInterval = setInterval(predictCurrentPose, predictionFrequency);
        
        return true;
    }
    
    // Stop prediction
    function stopPredicting() {
        isPredicting = false;
        
        if (predictionInterval) {
            clearInterval(predictionInterval);
            predictionInterval = null;
        }
        
        // Reset UI
        resetPredictionUI();
    }
    
    // Reset prediction UI
    function resetPredictionUI() {
        const classes = classManager.getAllClasses();
        
        classes.forEach(classObj => {
            const fillElement = document.getElementById(`prediction-fill-${classObj.id}`);
            const valueElement = document.getElementById(`prediction-value-${classObj.id}`);
            
            if (fillElement && valueElement) {
                fillElement.style.width = '0%';
                valueElement.textContent = '0%';
                fillElement.style.backgroundColor = '#4c84ff';
            }
        });
    }
    
    // Predict based on current hand pose
    async function predictCurrentPose() {
        if (!isPredicting) return;
      
        const currentHand = handDetection.getCurrentHand();
      
        // ——— No hand detected → fire a null event ———
        if (!currentHand) {
          resetPredictionUI();
          notifyPredictionCallbacks({ classId: null });
          return;
        }
      
        const features = handDetection.extractHandFeatures(currentHand);
        if (!features) {
          resetPredictionUI();
          notifyPredictionCallbacks({ classId: null });
          return;
        }
      
        const prediction = await modelTrainer.predict(features);
        updatePredictionUI(prediction);
      
        // find best guess
        let maxIndex = 0, maxValue = prediction[0];
        for (let i = 1; i < prediction.length; i++) {
          if (prediction[i] > maxValue) {
            maxValue = prediction[i];
            maxIndex = i;
          }
        }
      
        // ——— Below threshold → same null event ———
        if (maxValue < predictionThreshold) {
          resetPredictionUI();
          notifyPredictionCallbacks({ classId: null });
          return;
        }
      
        // ——— Only valid prediction left ———
        const cls = classManager.getClass(maxIndex);
        notifyPredictionCallbacks({
          classId:      maxIndex,
          className:    cls.name,
          confidence:   maxValue,
          allPredictions: prediction
        });
      }
      
      
    
    // Update prediction UI
    function updatePredictionUI(prediction) {
        // Find max prediction
        let maxIndex = 0;
        let maxValue = prediction[0];
        
        for (let i = 1; i < prediction.length; i++) {
            if (prediction[i] > maxValue) {
                maxValue = prediction[i];
                maxIndex = i;
            }
        }
        
        // Update each class prediction
        const classes = classManager.getAllClasses();
        
        classes.forEach((classObj, i) => {
            const fillElement = document.getElementById(`prediction-fill-${classObj.id}`);
            const valueElement = document.getElementById(`prediction-value-${classObj.id}`);
            
            if (fillElement && valueElement) {
                const value = prediction[i] * 100;
                fillElement.style.width = `${value}%`;
                valueElement.textContent = `${value.toFixed(1)}%`;
                
                // Highlight the max prediction
                if (i === maxIndex) {
                    fillElement.style.backgroundColor = value >= predictionThreshold * 100 ? 
                        '#4CAF50' : '#ff9800';
                } else {
                    fillElement.style.backgroundColor = '#4c84ff';
                }
            }
        });
    }
    
    // Register for prediction events
    function onPrediction(callback) {
        if (typeof callback === 'function') {
            predictionCallbacks.push(callback);
        }
    }
    
    // Remove prediction callback
    function offPrediction(callback) {
        const index = predictionCallbacks.indexOf(callback);
        if (index !== -1) {
            predictionCallbacks.splice(index, 1);
        }
    }
    
    // Notify all registered callbacks about predictions
    function notifyPredictionCallbacks(data) {
        predictionCallbacks.forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error('Error in prediction callback:', error);
            }
        });
    }
    
    // Set prediction threshold
    function setThreshold(threshold) {
        if (threshold >= 0 && threshold <= 1) {
            predictionThreshold = threshold;
        }
    }
    
    // Get current prediction threshold
    function getThreshold() {
        return predictionThreshold;
    }
    
    // Check if prediction is running
    function isPredictionRunning() {
        return isPredicting;
    }
    
    // Set prediction frequency (in milliseconds)
    function setPredictionFrequency(frequency) {
        if (frequency > 0) {
            predictionFrequency = frequency;
            
            // Reset interval if already predicting
            if (isPredicting) {
                stopPredicting();
                startPredicting();
            }
        }
    }
    
    // Public API
    return {
        init,
        createPredictionUI,
        startPredicting,
        stopPredicting,
        onPrediction,
        offPrediction,
        setThreshold,
        getThreshold,
        isPredictionRunning,
        setPredictionFrequency
    };
})();

// Export the module
window.PredictionManagerModule = PredictionManagerModule;