/**
 * Main Application Module for Hand Pose Teachable Machine
 * Initializes and connects all modules
 */

(async function () {
    // Wait for DOM to be ready
    document.addEventListener('DOMContentLoaded', async () => {
        try {
            console.log('Starting application initialization...');

            // Initialize UI module
            console.log('Initializing UI module...');
            UIModule.init();
            UIModule.showLoading('Initializing application...');

            // Check if TensorFlow.js is loaded
            if (!window.tf) {
                throw new Error('TensorFlow.js library not loaded');
            }
            console.log('TensorFlow.js loaded successfully');

            // Wait for MediaPipe module to be available
            console.log('Waiting for MediaPipe to load...');
            await waitForMediaPipe(20); // Wait up to 10 seconds
            console.log('MediaPipe loaded successfully');

            // Initialize hand detection module
            console.log('Initializing hand detection module...');
            HandDetectionModule.init('webcam', 'pose-canvas');

            // Initialize webcam and start hand detection
            try {
                await HandDetectionModule.start();
                console.log('Hand detection started successfully');
            } catch (error) {
                console.error('Hand detection initialization error:', error);
                UIModule.hideLoading();
                alert('Camera access error: ' + error.message + '\n\nPlease make sure your camera is connected and you have given permission to access it.');
                throw new Error('Hand detection initialization failed: ' + error.message);
            }

            // Initialize class manager module
            console.log('Initializing class manager module...');
            ClassManagerModule.init('classes-container', HandDetectionModule);

            // Initialize model trainer module
            console.log('Initializing model trainer module...');
            ModelTrainerModule.init(ClassManagerModule);

            // Initialize prediction manager module
            console.log('Initializing prediction manager module...');
            PredictionManagerModule.init('prediction-container', ModelTrainerModule, HandDetectionModule, ClassManagerModule);

            // // Initialize output manager module
            // console.log('Initializing output manager module...');
            // // Use the webcam-panel or an existing element instead of 'output-display'
            // const outputElement = document.querySelector('.webcam-panel');
            // if (!outputElement) {
            //     console.warn("Could not find webcam-panel element for output display, creating a fallback element");
            //     // Create a fallback element if needed
            //     const fallbackElement = document.createElement('div');
            //     fallbackElement.id = 'output-display';
            //     document.querySelector('.webcam-container').appendChild(fallbackElement);

            //     OutputManagerModule.init('output-display', PredictionManagerModule, ClassManagerModule);
            // } else {
            //     // Add an ID to the existing element so it can be referenced later
            //     outputElement.id = 'output-display';
            //     OutputManagerModule.init('output-display', PredictionManagerModule, ClassManagerModule);
            // }

            // Initialize piano player module
            console.log('Initializing piano player module...');
            // Pass the same element or ID that was used for the output manager
            PianoPlayerModule.init('output-display', PredictionManagerModule, ClassManagerModule);
            // Initialize storage manager module
            console.log('Initializing storage manager module...');
            StorageManagerModule.init(ModelTrainerModule, ClassManagerModule);

            // Setup event handlers
            console.log('Setting up event handlers...');
            setupEventHandlers();

            // Hide loading screen
            UIModule.hideLoading();

            setupWebcamTabSwitching();

            console.log('Application initialized successfully');
        } catch (error) {
            console.error('Error initializing application:', error);
            UIModule.hideLoading();
            alert('Error initializing application: ' + error.message);
            UIModule.showMessage('Error initializing application: ' + error.message, 'error');
        }
    });

    function setupWebcamTabSwitching() {
        // grabs the ONE webcam panel
        const webcamPanel = document.querySelector('#train-tab .webcam-panel');
        // look up the containers in each tab
        const pianoMain = document.querySelector('#piano-tab .main-panel');
        const trainMain = document.querySelector('#train-tab .main-panel');

        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const which = tab.dataset.tab;

                // ✨ NEW: Stop all sounds and motors when switching tabs
                if (window.PianoPlayerModule) {
                    console.log('Stopping all sounds/motors due to tab switch');
                    PianoPlayerModule.stopAllSounds();
                }

                if (which === 'piano') {
                    // if it's not already there, move it into the Piano tab
                    if (!pianoMain.contains(webcamPanel)) {
                        pianoMain.insertBefore(webcamPanel, pianoMain.firstChild);
                    }
                } else if (which === 'train') {
                    // move it into the Train tab
                    if (!trainMain.contains(webcamPanel)) {
                        trainMain.insertBefore(webcamPanel, trainMain.firstChild);
                    }
                }
            });
        });

        // on load, make sure it's in the train tab by default
        trainMain.insertBefore(webcamPanel, trainMain.firstChild);
    }

    // Wait for MediaPipe to be available
    function waitForMediaPipe(maxAttempts = 20) {
        return new Promise((resolve, reject) => {
            let attempts = 0;

            function checkMediaPipe() {
                attempts++;

                if (window.mp) {
                    resolve();
                } else if (attempts >= maxAttempts) {
                    reject(new Error('MediaPipe failed to load after multiple attempts'));
                } else {
                    console.log(`Waiting for MediaPipe to load... (attempt ${attempts}/${maxAttempts})`);
                    setTimeout(checkMediaPipe, 500); // Check every 500ms
                }
            }

            checkMediaPipe();
        });
    }




    // Function to handle tab switching and ensure webcam visibility in both tabs
    function setupWebcamForBothTabs() {
        // Get references to key elements
        const webcamContainer = document.querySelector('.webcam-container');
        const webcamElement = document.getElementById('webcam');
        const poseCanvas = document.getElementById('pose-canvas');
        const tabs = document.querySelectorAll('.tab');

        // Store original parent for the webcam
        const originalParent = webcamContainer.parentNode;

        // Function to move webcam to appropriate container when tab changes
        function moveWebcamToActiveTab() {
            // Find the active tab
            const activeTabId = document.querySelector('.tab.active').getAttribute('data-tab');
            let targetContainer;

            // Ignore if active tab is the connect to device tab
            if (activeTabId !== 'connect_devices') {           // Determine where webcam should be placed based on active tab
                if (activeTabId === 'piano') {
                    // Piano Player tab
                    targetContainer = document.querySelector('#piano-tab .webcam-panel');
                } else if (activeTabId === 'train') {
                    // Train Hand Poses tab
                    targetContainer = document.querySelector('#train-tab .webcam-panel');
                } else {
                    // Default back to original container
                    targetContainer = originalParent;
                }
            }


            // Only move if we found a valid target and it's different from current parent
            if (targetContainer && targetContainer !== webcamContainer.parentNode) {
                // Move the webcam container to the new tab
                targetContainer.appendChild(webcamContainer);

                // Make sure webcam is visible and running
                if (webcamElement && webcamElement.paused) {
                    webcamElement.play().catch(err => console.error('Error playing webcam:', err));
                }

                console.log(`Moved webcam to ${activeTabId} tab`);
            }
        }

        // Add click handlers to tabs to move webcam when tab changes
        tabs.forEach(tab => {
            tab.addEventListener('click', function () {
                // Small delay to ensure DOM has updated with active tab
                setTimeout(moveWebcamToActiveTab, 50);
            });
        });

        // Initial setup - make sure webcam is in the right place
        setTimeout(moveWebcamToActiveTab, 100);
    }

    // Call this function after the app is initialized
    document.addEventListener('DOMContentLoaded', function () {
        // Wait for app initialization
        setTimeout(setupWebcamForBothTabs, 1000);
    });


    // Setup application event handlers
    function setupEventHandlers() {
        console.log('Setting up event handlers...');

        // Add class button
        const addClassBtn = document.getElementById('add-class-btn');
        if (addClassBtn) {
            addClassBtn.addEventListener('click', () => {
                ClassManagerModule.addClass();
            });
        } else {
            console.warn('Add class button not found');
        }

        // Train button
        const trainBtn = document.getElementById('train-btn');
        if (trainBtn) {
            trainBtn.addEventListener('click', async () => {
                UIModule.showLoading('Training model...');

                try {
                    // Start training
                    await ModelTrainerModule.train();

                    // Start prediction
                    PredictionManagerModule.startPredicting();

                    // Update code snippet
                    if (UIModule.updateCodeSnippet && StorageManagerModule.generateCodeSnippet) {
                        UIModule.updateCodeSnippet(StorageManagerModule.generateCodeSnippet());
                    }

                    // Enable save button if it exists
                    if (UIModule.setSaveModelButtonState) {
                        UIModule.setSaveModelButtonState(true);
                    }

                    UIModule.hideLoading();
                    UIModule.showMessage('Model trained successfully!', 'success');
                } catch (error) {
                    console.error('Error training model:', error);
                    UIModule.hideLoading();
                    UIModule.showMessage('Error training model: ' + error.message, 'error');
                }
            });
        } else {
            console.warn('Train button not found');
        }

        // Reset button
        const resetBtn = document.getElementById('reset-btn');
        if (resetBtn) {
            resetBtn.addEventListener('click', async () => {
                const confirmed = await UIModule.confirmDialog('Are you sure you want to reset? This will clear all classes and samples.');

                if (confirmed) {
                    // Stop prediction
                    if (PredictionManagerModule) {
                        PredictionManagerModule.stopPredicting();
                    }

                    // Stop any playing sounds
                    if (window.PianoPlayerModule) {
                        PianoPlayerModule.stopAllSounds();
                    }

                    // Reset model trainer
                    if (ModelTrainerModule) {
                        ModelTrainerModule.reset();
                    }

                    // Reset class manager
                    if (ClassManagerModule) {
                        ClassManagerModule.reset();
                    }

                    // Reset UI
                    if (UIModule) {
                        if (UIModule.setTrainButtonState) {
                            UIModule.setTrainButtonState(false, 'Add at least two classes with samples');
                        }
                        if (UIModule.setSaveModelButtonState) {
                            UIModule.setSaveModelButtonState(false);
                        }
                        if (UIModule.updateCodeSnippet) {
                            UIModule.updateCodeSnippet('// Train your model first to see example code');
                        }
                        UIModule.showMessage('Application reset successfully', 'info');
                    }
                }
            });
        } else {
            console.warn('Reset button not found');
        }

        // Save model button - Check if it exists before adding listener
        const saveModelBtn = document.getElementById('save-model-btn');
        if (saveModelBtn) {
            saveModelBtn.addEventListener('click', async () => {
                if (!ModelTrainerModule.isModelTrained()) {
                    UIModule.showMessage('No trained model to save', 'warning');
                    return;
                }

                // Ask for model name
                const modelName = await UIModule.promptDialog('Enter a name for this model:', 'MyHandPoseModel');

                if (modelName) {
                    UIModule.showLoading('Saving model...');

                    try {
                        // Save model
                        const modelInfo = await StorageManagerModule.saveModel(modelName);

                        UIModule.hideLoading();
                        UIModule.showMessage(`Model "${modelInfo.name}" saved successfully!`, 'success');
                    } catch (error) {
                        console.error('Error saving model:', error);
                        UIModule.hideLoading();
                        UIModule.showMessage('Error saving model: ' + error.message, 'error');
                    }
                }
            });
        } else {
            console.warn('Save model button not found - this is normal if using the new UI');
        }

        // Load model button - Check if it exists before adding listener
        const loadModelBtn = document.getElementById('load-model-btn');
        if (loadModelBtn) {
            loadModelBtn.addEventListener('click', async () => {
                // Get list of saved models
                const savedModels = StorageManagerModule.getSavedModelsList();

                // Show model selection dialog
                const selectedModel = await UIModule.showModelSelectionDialog(savedModels);

                if (selectedModel) {
                    UIModule.showLoading(`Loading model "${selectedModel.name}"...`);

                    try {
                        // Load model
                        await StorageManagerModule.loadModel(selectedModel.name);

                        // Start prediction
                        PredictionManagerModule.startPredicting();

                        // Update code snippet
                        if (UIModule.updateCodeSnippet && StorageManagerModule.generateCodeSnippet) {
                            UIModule.updateCodeSnippet(StorageManagerModule.generateCodeSnippet());
                        }

                        // Enable save button
                        if (UIModule.setSaveModelButtonState) {
                            UIModule.setSaveModelButtonState(true);
                        }

                        UIModule.hideLoading();
                        UIModule.showMessage(`Model "${selectedModel.name}" loaded successfully!`, 'success');
                    } catch (error) {
                        console.error('Error loading model:', error);
                        UIModule.hideLoading();
                        UIModule.showMessage('Error loading model: ' + error.message, 'error');
                    }
                }
            });
        } else {
            console.warn('Load model button not found - this is normal if using the new UI');
        }

        // Add export and import buttons if needed for the new UI
        const addModelManagerButtons = () => {
            const pianoPanel = document.querySelector('.piano-panel');
            if (!pianoPanel) return;

            // Check if buttons already exist
            if (document.getElementById('export-model-btn') || document.getElementById('import-model-btn')) return;

            // Only add if we're in the training tab
            const trainTab = document.getElementById('train-tab');
            if (!trainTab || !trainTab.classList.contains('active')) return;

            // // Create export button
            // const exportBtn = document.createElement('button');
            // exportBtn.id = 'export-model-btn';
            // exportBtn.className = 'btn btn-green';
            // exportBtn.textContent = 'Export Model';
            // exportBtn.style.marginRight = '10px';

            // // Create import button
            // const importBtn = document.createElement('button');
            // importBtn.id = 'import-model-btn';
            // importBtn.className = 'btn';
            // importBtn.textContent = 'Import Model';

            // Create container
            const btnContainer = document.createElement('div');
            btnContainer.className = 'model-btns';
            btnContainer.style.display = 'flex';
            btnContainer.style.justifyContent = 'center';
            btnContainer.style.marginTop = '20px';

            // Add buttons to container
            // btnContainer.appendChild(exportBtn);
            // btnContainer.appendChild(importBtn);

            // Add container to training panel
            pianoPanel.appendChild(btnContainer);

            // Add event listeners
            //     exportBtn.addEventListener('click', async () => {
            //         if (!ModelTrainerModule.isModelTrained()) {
            //             UIModule.showMessage('No trained model to export', 'warning');
            //             return;
            //         }

            //         try {
            //             await StorageManagerModule.exportModel('HandPoseModel');
            //             UIModule.showMessage('Model exported successfully!', 'success');
            //         } catch (error) {
            //             console.error('Error exporting model:', error);
            //             UIModule.showMessage('Error exporting model: ' + error.message, 'error');
            //         }
            //     });

            //     importBtn.addEventListener('click', async () => {
            //         try {
            //             const fileInput = await UIModule.createFileInput('.json');
            //             if (fileInput && fileInput.files.length > 0) {
            //                 UIModule.showLoading('Importing model...');
            //                 const modelInfo = await StorageManagerModule.importModel(fileInput);

            //                 // Start prediction
            //                 PredictionManagerModule.startPredicting();

            //                 // Update code snippet
            //                 if (UIModule.updateCodeSnippet && StorageManagerModule.generateCodeSnippet) {
            //                     UIModule.updateCodeSnippet(StorageManagerModule.generateCodeSnippet());
            //                 }

            //                 UIModule.hideLoading();
            //                 UIModule.showMessage(`Model "${modelInfo.name}" imported successfully!`, 'success');
            //             }
            //         } catch (error) {
            //             console.error('Error importing model:', error);
            //             UIModule.hideLoading();
            //             UIModule.showMessage('Error importing model: ' + error.message, 'error');
            //         }
            //     });
        };

        // Check if we need to add model manager buttons for the new UI
        setTimeout(addModelManagerButtons, 1000);

        // Listen for tab changes to add buttons when switching to train tab
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', function () {
                if (this.getAttribute('data-tab') === 'train') {
                    setTimeout(addModelManagerButtons, 500);
                }
            });
        });

        // Listen for class changes to update train button state
        if (ClassManagerModule && ClassManagerModule.onClassesChanged) {
            ClassManagerModule.onClassesChanged(() => {
                if (!UIModule.setTrainButtonState) return;

                const canTrain = ClassManagerModule.hasEnoughDataForTraining();
                const statusMessage = ClassManagerModule.getTrainingStatusMessage();

                UIModule.setTrainButtonState(canTrain, statusMessage);
            });
        }

        // Model training events
        if (ModelTrainerModule && ModelTrainerModule.onTraining) {
            ModelTrainerModule.onTraining(data => {
                if (!data || !data.status) return;

                switch (data.status) {
                    case 'epoch_begin':
                        console.log(`Starting epoch ${data.epoch}/${data.totalEpochs}`);
                        break;

                    case 'epoch_end':
                        // Update loading message with progress
                        const progress = Math.round((data.epoch / data.totalEpochs) * 100);
                        UIModule.showLoading(`Training model... ${progress}% (Epoch ${data.epoch}/${data.totalEpochs})`);

                        // Log to console
                        console.log(`Epoch ${data.epoch}/${data.totalEpochs}: loss = ${data.loss.toFixed(4)}, accuracy = ${data.accuracy.toFixed(4)}`);
                        break;

                    case 'completed':
                        console.log('Training complete! Final accuracy:', data.accuracy.toFixed(4));
                        break;

                    case 'error':
                        console.error('Training error:', data.error);
                        break;
                }
            });
        }
        // // after you set up all your other listeners:
        // const videoToggle = document.getElementById('toggle-video');
        // if (videoToggle) {
        //         videoToggle.addEventListener('change', () => {
        //         const videoEl = document.getElementById('webcam');
        //         // if checked → show; if unchecked → hide
        //         videoEl.style.opacity = videoToggle.checked ? '1' : '0';
        //         // you could also use visibility or display, but opacity keeps layout
        //     });
        // }           
        // in setupEventHandlers(), after grabbing videoToggle:
        const videoToggle = document.getElementById('toggle-video');
        videoToggle.addEventListener('change', () => {
            const videoEl = document.getElementById('webcam');
            if (!videoEl) return;
            if (videoToggle.checked) {
                // Show clear video
                videoEl.style.filter = 'none';
            } else {
                // Blur instead of hiding
                videoEl.style.filter = 'blur(8px)';
            }
        });



        console.log('Event handlers set up successfully');
    }

})();