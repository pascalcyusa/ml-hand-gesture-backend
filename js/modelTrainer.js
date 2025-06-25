/**
 * Model Trainer Module
 * Handles creating and training the TensorFlow.js model
 */

const ModelTrainerModule = (function () {
    // Private variables
    let model = null;
    let classManager = null;
    let trainingCallbacks = [];
    let modelTrainedCallbacks = [];
    let isTraining = false;
    let isTrained = false;

    // Model configuration
    const modelConfig = {
        hiddenLayers: [64, 32],   // Size of hidden layers
        epochs: 50,               // Training iterations
        learningRate: 0.001,      // Learning rate
        batchSize: 16             // Batch size for training
    };

    // Initialize model trainer
    function init(classManagerModule) {
        classManager = classManagerModule;
        return this;
    }

    // Create the model architecture
    function createModel(inputShape, numClasses) {
        try {
            // Create a sequential model
            const newModel = tf.sequential();

            // Input layer
            newModel.add(tf.layers.dense({
                inputShape: [inputShape],
                units: modelConfig.hiddenLayers[0],
                activation: 'relu'
            }));

            // Hidden layers
            for (let i = 1; i < modelConfig.hiddenLayers.length; i++) {
                newModel.add(tf.layers.dense({
                    units: modelConfig.hiddenLayers[i],
                    activation: 'relu'
                }));
            }

            // Output layer (softmax for classification)
            newModel.add(tf.layers.dense({
                units: numClasses,
                activation: 'softmax'
            }));

            // Compile model
            newModel.compile({
                optimizer: tf.train.adam(modelConfig.learningRate),
                loss: 'categoricalCrossentropy',
                metrics: ['accuracy']
            });

            return newModel;
        } catch (error) {
            console.error('Error creating model:', error);
            throw error;
        }
    }

    // Train the model with collected samples
    async function train() {
        if (isTraining) {
            console.warn('Model is already training');
            return false;
        }

        if (!classManager) {
            throw new Error('Class manager not initialized');
        }

        // Check if we have enough data
        if (!classManager.hasEnoughDataForTraining()) {
            throw new Error('Not enough data for training. Need at least 2 classes with samples.');
        }

        try {
            isTraining = true;
            notifyTrainingCallbacks({ status: 'started' });

            // Get training data
            const trainingData = classManager.getAllSamples();
            const numFeatures = trainingData.features[0].length;
            const numClasses = classManager.getAllClasses().length;

            console.log(`Training with ${numClasses} classes and ${trainingData.features.length} samples`);

            // Convert to tensors
            const xs = tf.tensor2d(trainingData.features);
            const ys = tf.tensor2d(trainingData.labels);

            // Always create a new model to ensure architecture matches current data
            // This prevents issues when adding/removing classes
            if (model) {
                console.log('Disposing existing model to recreate with correct architecture');
                model.dispose();
            }

            console.log(`Creating new model: ${numFeatures} features → ${numClasses} classes`);
            model = createModel(numFeatures, numClasses);

            // Train model
            const result = await model.fit(xs, ys, {
                epochs: modelConfig.epochs,
                batchSize: modelConfig.batchSize,
                shuffle: true,
                callbacks: {
                    onEpochBegin: (epoch) => {
                        notifyTrainingCallbacks({
                            status: 'epoch_begin',
                            epoch: epoch + 1,
                            totalEpochs: modelConfig.epochs
                        });
                    },
                    onEpochEnd: (epoch, logs) => {
                        notifyTrainingCallbacks({
                            status: 'epoch_end',
                            epoch: epoch + 1,
                            totalEpochs: modelConfig.epochs,
                            loss: logs.loss,
                            accuracy: logs.acc
                        });
                    }
                }
            });

            // Clean up tensors
            xs.dispose();
            ys.dispose();

            // Update state
            isTraining = false;
            isTrained = true;

            // Notify callbacks
            notifyTrainingCallbacks({
                status: 'completed',
                accuracy: result.history.acc[result.history.acc.length - 1],
                loss: result.history.loss[result.history.loss.length - 1]
            });

            notifyModelTrainedCallbacks();

            console.log(`Training completed successfully! Final accuracy: ${result.history.acc[result.history.acc.length - 1].toFixed(4)}`);

            return true;
        } catch (error) {
            isTraining = false;
            notifyTrainingCallbacks({ status: 'error', error: error.message });
            console.error('Error training model:', error);
            throw error;
        }
    }

    // Make a prediction with the model
    async function predict(features) {
        if (!model || !isTrained) {
            throw new Error('Model not trained');
        }

        try {
            // Convert features to tensor
            const input = tf.tensor2d([features]);

            // Get prediction
            const prediction = await model.predict(input).data();

            // Clean up tensor
            input.dispose();

            return prediction;
        } catch (error) {
            console.error('Error making prediction:', error);
            throw error;
        }
    }

    // Get the trained model
    function getModel() {
        return model;
    }

    // Check if model is trained
    function isModelTrained() {
        return isTrained;
    }

    // Check if model is currently training
    function isModelTraining() {
        return isTraining;
    }

    // Set an existing model
    function setModel(newModel) {
        model = newModel;
        isTrained = true;
        notifyModelTrainedCallbacks();
    }

    // Reset the model
    function reset() {
        if (model) {
            model.dispose();
            model = null;
        }
        isTrained = false;
        isTraining = false;
    }

    // Generate model summary
    function getModelSummary() {
        if (!model) {
            return 'No model created yet';
        }

        const layers = [];
        model.layers.forEach((layer, i) => {
            const config = layer.getConfig();
            const weights = layer.getWeights();
            let params = 0;
            weights.forEach(weight => {
                params += weight.size;
            });

            layers.push({
                type: layer.getClassName(),
                units: config.units,
                activation: config.activation,
                params: params
            });
        });

        return {
            layers: layers,
            totalParams: model.countParams()
        };
    }

    // Register for training events
    function onTraining(callback) {
        if (typeof callback === 'function') {
            trainingCallbacks.push(callback);
        }
    }

    // Remove training event callback
    function offTraining(callback) {
        const index = trainingCallbacks.indexOf(callback);
        if (index !== -1) {
            trainingCallbacks.splice(index, 1);
        }
    }

    // Notify all registered callbacks about training events
    function notifyTrainingCallbacks(data) {
        trainingCallbacks.forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error('Error in training callback:', error);
            }
        });
    }

    // Register for model trained event
    function onModelTrained(callback) {
        if (typeof callback === 'function') {
            modelTrainedCallbacks.push(callback);

            // If model is already trained, notify immediately
            if (isTrained) {
                callback();
            }
        }
    }

    // Remove model trained callback
    function offModelTrained(callback) {
        const index = modelTrainedCallbacks.indexOf(callback);
        if (index !== -1) {
            modelTrainedCallbacks.splice(index, 1);
        }
    }

    // Notify all registered callbacks about model being trained
    function notifyModelTrainedCallbacks() {
        modelTrainedCallbacks.forEach(callback => {
            try {
                callback();
            } catch (error) {
                console.error('Error in model trained callback:', error);
            }
        });
    }

    // Public API
    return {
        init,
        train,
        predict,
        getModel,
        setModel,
        isModelTrained,
        isModelTraining,
        getModelSummary,
        onTraining,
        offTraining,
        onModelTrained,
        offModelTrained,
        reset
    };
})();

// Export the module
window.ModelTrainerModule = ModelTrainerModule;