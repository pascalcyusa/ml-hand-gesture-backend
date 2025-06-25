/**
 * Piano Player Module (Refactored)
 * Orchestrates music and motor control based on hand pose predictions
 * Now uses NotesController and MotorGroupController for clean separation
 */

const PianoPlayerModule = (function () {
    // Private variables
    let outputElement = null;
    let predictionManager = null;
    let classManager = null;
    let noteController = null; // Will hold the NotesController instance
    let lastPrediction = null;
    let sequenceContainer = null;
    let testAllBtn = null;
    let stopAllBtn = null;
    let pianoEnabledToggle = null;
    let motorEnabledToggle = null;

    // Initialize piano player
    function init(outputElementId, predictionManagerModule, classManagerModule) {
        console.log('Initializing Piano Player module...');

        // Find or fallback for output element
        outputElement = document.getElementById(outputElementId);
        if (!outputElement) {
            console.warn(`Output element with ID '${outputElementId}' not found, using fallback approach`);

            // Try to find a suitable container as fallback
            const webcamPanel = document.querySelector('.webcam-panel');
            if (webcamPanel) {
                outputElement = webcamPanel;
                console.log('Using webcam-panel as fallback output element');
            }
        }

        // Get UI elements
        sequenceContainer = document.getElementById('sequence-container');
        testAllBtn = document.getElementById('test-all-btn');
        stopAllBtn = document.getElementById('stop-all-btn');
        pianoEnabledToggle = document.getElementById('piano-enabled-toggle');
        motorEnabledToggle = document.getElementById('motor-enabled-toggle');

        if (!sequenceContainer) {
            console.warn('Sequence container element not found');
        }

        predictionManager = predictionManagerModule;
        classManager = classManagerModule;

        // Initialize controllers - expect them to be globally available
        if (window.noteController) {
            noteController = window.noteController;
            console.log('NotesController found and connected');
        } else {
            console.warn('NotesController not found - note sequences will not work');
        }

        // Listen for class changes
        if (classManager && classManager.onClassesChanged) {
            classManager.onClassesChanged(() => {
                console.log('Classes changed, updating sequences');
                setTimeout(updateSequencesForClasses, 500);
            });
        }

        // Check if we already have classes
        if (classManager) {
            const existingClasses = classManager.getAllClasses();
            if (existingClasses && existingClasses.length > 0) {
                console.log('Found existing classes:', existingClasses.length);
                setTimeout(updateSequencesForClasses, 1000);
            }
        }

        // Register for prediction events
        if (predictionManager && predictionManager.onPrediction) {
            predictionManager.onPrediction(handlePrediction);
        }

        // Setup event listeners
        setupEventListeners();

        console.log('Piano Player module initialized');
        return this;
    }

    // Setup event listeners
    function setupEventListeners() {
        // Piano enabled toggle
        if (pianoEnabledToggle) {
            pianoEnabledToggle.addEventListener('change', function () {
                const isEnabled = this.checked;
                console.log('Piano player enabled:', isEnabled);

                // Update note controller
                if (noteController) {
                    noteController.setEnabled(isEnabled);
                }

                // Hide/show note sequence sections
                document.querySelectorAll('.note-section').forEach(section => {
                    section.style.display = isEnabled ? 'block' : 'none';
                });

                // Stop any playing sounds when disabled
                if (!isEnabled) {
                    stopAllSounds();
                }

                // Update UI state
                updateControlsState();
            });
        }

        // Motor enabled toggle
        if (motorEnabledToggle) {
            motorEnabledToggle.addEventListener('change', function () {
                const isEnabled = this.checked;
                console.log('Motor control enabled:', isEnabled);

                // Hide/show motor control sections
                document.querySelectorAll('.motor-section').forEach(section => {
                    section.style.display = isEnabled ? 'block' : 'none';
                });

                if (!isEnabled) {
                    stopAllSounds();
                }

            });
        }

        // Test all sequences button
        if (testAllBtn) {
            testAllBtn.addEventListener('click', function () {
                testAllSequences();
            });
        }

        // Stop all sounds button
        if (stopAllBtn) {
            stopAllBtn.addEventListener('click', function () {
                stopAllSounds();
            });
        }

        // Add listeners to handle window visibility changes
        document.addEventListener('visibilitychange', function () {
            if (document.hidden) {
                stopAllSounds();
            }
        });
    }

    // Update controls state based on current settings
    function updateControlsState() {
        const pianoEnabled = pianoEnabledToggle ? pianoEnabledToggle.checked : false;
        const motorEnabled = motorEnabledToggle ? motorEnabledToggle.checked : false;
        const hasClasses = classManager && classManager.getAllClasses().length > 0;

        // Update buttons
        if (testAllBtn) {
            testAllBtn.disabled = !hasClasses || (!pianoEnabled && !motorEnabled);
        }
        if (stopAllBtn) {
            stopAllBtn.disabled = !hasClasses || (!pianoEnabled && !motorEnabled);
        }
    }

    // Update sequence configurations for trained classes
    function updateSequencesForClasses() {
        console.log('Updating sequences for classes...');

        if (!classManager) {
            console.warn('Class manager not initialized');
            return;
        }

        const classes = classManager.getAllClasses();
        console.log('Found classes:', classes ? classes.length : 0);

        if (!sequenceContainer) {
            console.warn('Sequence container not found, cannot update sequences');
            return;
        }

        // Clear current sequences
        sequenceContainer.innerHTML = '';

        if (!classes || classes.length === 0) {
            sequenceContainer.innerHTML = `
                <div class="no-classes-message">
                    Train a model with classes to configure note sequences and motor controls
                </div>
            `;
            updateControlsState();
            return;
        }

        // Create containers for each class
        classes.forEach((classObj, index) => {
            // Create main container for this class
            const classContainer = document.createElement('div');
            classContainer.className = 'class-sequence-container';
            classContainer.innerHTML = `
                <h3>Class: ${classObj.name}</h3>
                <div class="sequence-sections">
                    <div class="sequence-section note-section">
                        <h4>Note Sequence</h4>
                        <div id="note-group-${index}" class="note-group-container"></div>
                    </div>
                    <div class="sequence-section motor-section">
                        <h4>Motor Controls</h4>
                        <div id="motor-group-${index}" class="motor-group-container"></div>
                    </div>
                </div>
            `;

            sequenceContainer.appendChild(classContainer);

            // Load note controller for this class
            if (noteController) {
                noteController.loadGroup(`note-group-${index}`, classObj.id, classObj.name);
            }

            // Load motor controller for this class
            if (window.mgc) {
                window.mgc.loadGroup(`motor-group-${index}`);
            }

            // Set initial visibility based on current toggle states
            const noteSection = classContainer.querySelector('.note-section');
            const motorSection = classContainer.querySelector('.motor-section');

            const pianoEnabled = pianoEnabledToggle ? pianoEnabledToggle.checked : false;
            const motorEnabled = motorEnabledToggle ? motorEnabledToggle.checked : false;

            noteSection.style.display = pianoEnabled ? 'block' : 'none';
            motorSection.style.display = motorEnabled ? 'block' : 'none';
        });

        // Update controls state
        updateControlsState();
    }

    // Test all sequences
    function testAllSequences() {
        if (!classManager) return;

        const classes = classManager.getAllClasses();
        const pianoEnabled = pianoEnabledToggle ? pianoEnabledToggle.checked : false;
        const motorEnabled = motorEnabledToggle ? motorEnabledToggle.checked : false;

        classes.forEach((classObj, index) => {
            setTimeout(() => {
                console.log(`Testing sequences for class: ${classObj.name}`);

                // Test note sequence if enabled
                if (pianoEnabled && noteController) {
                    noteController.testSequence(`note-group-${index}`);
                }

                // Test motor sequence if enabled
                if (motorEnabled && window.mgc) {
                    window.mgc.compileAndRun(`motor-group-${index}`);
                }
            }, index * 3000); // Stagger tests by 3 seconds
        });
    }

    // Stop all sounds and motors
    function stopAllSounds() {
        console.log('Stopping all sounds and motors');

        // Stop Python audio if available
        if (window.pyStopAll) {
            window.pyStopAll();
        }

        // Stop motors via motor controller if available
        // if (window.pyrepl && window.pyrepl.isActive) {
        //     window.pyrepl.write = 'motor.stop()';
        // }
        window.mgc.stopAll();

        // Remove any execution highlights
        document.querySelectorAll('.nc-executing, .mgc-executing').forEach(element => {
            element.classList.remove('nc-executing', 'mgc-executing');
        });
    }

    // Handle prediction event - much simpler now!
    function handlePrediction(predictionData) {
        if (!predictionData) return;

        // Get current state
        const pianoEnabled = pianoEnabledToggle ? pianoEnabledToggle.checked : false;
        const motorEnabled = motorEnabledToggle ? motorEnabledToggle.checked : false;

        // Skip if both are disabled
        if (!pianoEnabled && !motorEnabled) {
            return;
        }

        // Check for change in predicted class to avoid repeated triggers
        if (lastPrediction && lastPrediction.classId === predictionData.classId) {
            return;
        }

        // Only trigger if confidence is high enough
        if (predictionData.confidence < 0.7) {
            return;
        }

        // Store last prediction
        lastPrediction = predictionData;

        // Find the index of this class
        const classes = classManager ? classManager.getAllClasses() : [];
        const classIndex = classes.findIndex(c => c.id === predictionData.classId);

        if (classIndex === -1) {
            console.warn('Class not found for prediction:', predictionData.classId);
            return;
        }

        console.log(`Detected class: ${classes[classIndex].name} (confidence: ${predictionData.confidence})`);

        const activeTabId = document.querySelector('.tab.active').getAttribute('data-tab');
        if (activeTabId === 'piano') {
            // Trigger note sequence if piano enabled
            if (pianoEnabled && noteController) {
                noteController.compileAndRun(`note-group-${classIndex}`);
            }

            // Trigger motor sequence if motor enabled
            if (motorEnabled && window.mgc) {
                window.mgc.compileAndRun(`motor-group-${classIndex}`);
            }
        }
    }

    // Public API
    return {
        init,
        stopAllSounds,
        updateSequencesForClasses,
        isEnabled: function () {
            return pianoEnabledToggle ? pianoEnabledToggle.checked : false;
        },
        enable: function () {
            if (pianoEnabledToggle) {
                pianoEnabledToggle.checked = true;
            }
            if (noteController) {
                noteController.setEnabled(true);
            }
            updateControlsState();
        },
        disable: function () {
            if (pianoEnabledToggle) {
                pianoEnabledToggle.checked = false;
            }
            if (noteController) {
                noteController.setEnabled(false);
            }
            stopAllSounds();
            updateControlsState();
        },
        testAllSequences
    };

})();

// Export the module
window.PianoPlayerModule = PianoPlayerModule;