/**
 * Output Manager Module
 * Handles creative outputs based on pose predictions
 */

const OutputManagerModule = (function () {
    // Private variables
    let outputElement = null;
    let predictionManager = null;
    let classManager = null;
    let currentOutputMode = 'default';

    // Available output modes
    const outputModes = {
        default: {
            name: 'Default',
            handler: defaultOutputHandler
        },
        colors: {
            name: 'Color Generator',
            handler: colorOutputHandler
        },
        shapes: {
            name: 'Shape Generator',
            handler: shapeOutputHandler
        },
        sounds: {
            name: 'Sound Effects',
            handler: soundOutputHandler
        },
        text: {
            name: 'Text Generator',
            handler: textOutputHandler
        }
    };

    // Initialize output manager
    function init(outputElementId, predictionManagerModule, classManagerModule) {
        console.log('Initializing Output Manager module...');

        // Find output element with more flexible approach
        outputElement = document.getElementById(outputElementId);
        if (!outputElement) {
            console.warn(`Output element with ID '${outputElementId}' not found, using fallback approach`);

            // Try to find a suitable container as fallback
            const webcamPanel = document.querySelector('.webcam-panel');
            if (webcamPanel) {
                // Add the ID to the existing element
                webcamPanel.id = outputElementId;
                outputElement = webcamPanel;
                console.log('Using webcam-panel as fallback output element');
            } else {
                // Create a new element as last resort
                console.log('Creating new element as fallback');
                outputElement = document.createElement('div');
                outputElement.id = outputElementId;

                // Append to webcam container if it exists
                const webcamContainer = document.querySelector('.webcam-container');
                if (webcamContainer) {
                    webcamContainer.appendChild(outputElement);
                } else {
                    // Append to body if no webcam container
                    document.body.appendChild(outputElement);
                }
            }
        }

        predictionManager = predictionManagerModule;
        classManager = classManagerModule;

        // Register for prediction events if prediction manager is available
        if (predictionManager && predictionManager.onPrediction) {
            predictionManager.onPrediction(handlePrediction);
        } else {
            console.warn('Prediction manager not available or missing onPrediction method');
        }

        console.log('Output Manager module initialized');
        return this;
    }

    // Handle prediction and route to appropriate output handler
    function handlePrediction(predictionData) {
        if (!predictionData) return;

        // Get the current output mode handler
        const handler = outputModes[currentOutputMode].handler;

        // Call the handler
        try {
            handler(predictionData, outputElement);
        } catch (error) {
            console.error('Error in output handler:', error);
            // Fall back to default handler if custom handler fails
            if (currentOutputMode !== 'default') {
                defaultOutputHandler(predictionData, outputElement);
            }
        }
    }

    // Default output handler
    function defaultOutputHandler(predictionData, element) {
        if (!element) return;

        const className = predictionData.className;
        const confidence = predictionData.confidence * 100;

        // Simple text output
        element.innerHTML = `
            <div style="
                padding: 20px; 
                color: white; 
                font-size: 24px; 
                text-align: center;
                height: 100%;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                background-color: ${getRandomColor()}
            ">
                <h2>${className} detected!</h2>
                <p>Confidence: ${confidence.toFixed(1)}%</p>
            </div>
        `;
    }

    // Color output handler
    function colorOutputHandler(predictionData, element) {
        if (!element) return;

        const className = predictionData.className;
        const confidence = predictionData.confidence;

        // Create a color based on class and confidence
        const hue = (predictionData.classId * 137) % 360; // Distribute colors evenly
        const saturation = Math.min(100, 50 + confidence * 50);
        const lightness = Math.max(30, 70 - confidence * 30);

        const color = `hsl(${hue}, ${saturation}%, ${lightness}%)`;

        element.innerHTML = `
            <div style="
                height: 100%;
                width: 100%;
                background-color: ${color};
                display: flex;
                justify-content: center;
                align-items: center;
                color: white;
                text-shadow: 1px 1px 3px rgba(0,0,0,0.7);
                font-size: 24px;
            ">
                <div>${className}</div>
            </div>
        `;
    }

    // Shape output handler
    function shapeOutputHandler(predictionData, element) {
        if (!element) return;

        const className = predictionData.className;
        const classId = predictionData.classId;
        const confidence = predictionData.confidence;

        // Choose a shape based on class ID
        const shapes = ['circle', 'square', 'triangle', 'star', 'hexagon'];
        const shape = shapes[classId % shapes.length];

        // Calculate size based on confidence
        const size = 40 + confidence * 120;

        // Generate a color
        const hue = (classId * 137) % 360;
        const color = `hsl(${hue}, 70%, 60%)`;

        // Clear previous content
        element.innerHTML = '';

        // Create container
        const container = document.createElement('div');
        container.style.width = '100%';
        container.style.height = '100%';
        container.style.display = 'flex';
        container.style.justifyContent = 'center';
        container.style.alignItems = 'center';
        container.style.backgroundColor = '#222';

        // Create shape element
        const shapeElement = document.createElement('div');

        // Style based on shape
        switch (shape) {
            case 'circle':
                shapeElement.style.width = `${size}px`;
                shapeElement.style.height = `${size}px`;
                shapeElement.style.borderRadius = '50%';
                shapeElement.style.backgroundColor = color;
                break;
            case 'square':
                shapeElement.style.width = `${size}px`;
                shapeElement.style.height = `${size}px`;
                shapeElement.style.backgroundColor = color;
                break;
            case 'triangle':
                shapeElement.style.width = '0';
                shapeElement.style.height = '0';
                shapeElement.style.borderLeft = `${size / 2}px solid transparent`;
                shapeElement.style.borderRight = `${size / 2}px solid transparent`;
                shapeElement.style.borderBottom = `${size}px solid ${color}`;
                break;
            case 'star':
                // Stars are complex, use a simple substitute for now
                shapeElement.style.width = `${size}px`;
                shapeElement.style.height = `${size}px`;
                shapeElement.style.backgroundColor = color;
                shapeElement.style.clipPath = 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)';
                break;
            case 'hexagon':
                shapeElement.style.width = `${size}px`;
                shapeElement.style.height = `${size}px`;
                shapeElement.style.backgroundColor = color;
                shapeElement.style.clipPath = 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)';
                break;
        }

        // Add animation
        shapeElement.style.animation = 'pulse 1.5s infinite';

        // Add class name
        const label = document.createElement('div');
        label.style.position = 'absolute';
        label.style.bottom = '10px';
        label.style.color = 'white';
        label.style.fontSize = '18px';
        label.textContent = className;

        // Add to container
        container.appendChild(shapeElement);
        container.appendChild(label);
        element.appendChild(container);
    }

    // Sound output handler
    function soundOutputHandler(predictionData, element) {
        if (!element) return;

        const className = predictionData.className;
        const classId = predictionData.classId;
        const confidence = predictionData.confidence;

        // Create an audio context if needed
        if (!window.audioContext) {
            try {
                window.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            } catch (error) {
                console.error('Web Audio API not supported', error);
                // Fallback to default handler
                defaultOutputHandler(predictionData, element);
                return;
            }
        }

        // Create a simple oscillator sound
        const oscillator = window.audioContext.createOscillator();
        const gainNode = window.audioContext.createGain();

        // Set frequency based on class ID (different note for each class)
        const baseFrequency = 220; // A3
        const notes = [0, 2, 4, 5, 7, 9, 11, 12]; // Major scale intervals
        const noteIndex = classId % notes.length;
        const frequency = baseFrequency * Math.pow(2, notes[noteIndex] / 12);

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(frequency, window.audioContext.currentTime);

        // Set volume based on confidence
        gainNode.gain.setValueAtTime(0, window.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.5 * confidence, window.audioContext.currentTime + 0.01);
        gainNode.gain.linearRampToValueAtTime(0, window.audioContext.currentTime + 0.5);

        // Connect nodes
        oscillator.connect(gainNode);
        gainNode.connect(window.audioContext.destination);

        // Start and stop
        oscillator.start();
        oscillator.stop(window.audioContext.currentTime + 0.5);

        // Visual feedback
        element.innerHTML = `
            <div style="
                height: 100%;
                width: 100%;
                background-color: #333;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                color: white;
                font-size: 20px;
            ">
                <div style="font-size: 24px; margin-bottom: 10px;">${className}</div>
                <div style="width: 80%; height: 40px; background-color: #222; border-radius: 20px; overflow: hidden; position: relative;">
                    <div style="
                        position: absolute;
                        height: 100%;
                        width: ${confidence * 100}%;
                        background-color: #4c84ff;
                        border-radius: 20px;
                    "></div>
                </div>
                <div style="margin-top: 10px;">Note: ${getNoteName(frequency)}</div>
            </div>
        `;
    }

    // Get musical note name from frequency
    function getNoteName(frequency) {
        const noteNames = ['A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#'];
        const a4 = 440;
        const halfStepsFromA4 = Math.round(12 * Math.log2(frequency / a4));
        const octave = Math.floor(Math.log2(frequency / 27.5) + 0.5);
        const noteIndex = (halfStepsFromA4 + 9) % 12;
        return noteNames[noteIndex] + octave;
    }

    // Text output handler
    function textOutputHandler(predictionData, element) {
        if (!element) return;

        const className = predictionData.className;
        const classId = predictionData.classId;
        const confidence = predictionData.confidence;

        // Generate fun messages based on the detected class
        const messages = [
            `Detected ${className} with ${(confidence * 100).toFixed(1)}% confidence!`,
            `Wow! That's a perfect ${className} pose!`,
            `${className} identified! Great job!`,
            `You're mastering the ${className} pose!`,
            `That's definitely ${className}!`
        ];

        // Choose a random message
        const message = messages[Math.floor(Math.random() * messages.length)];

        // Generate a fun fact about poses or ML
        const facts = [
            "Did you know? Hand detection can identify 21 different landmark points on each hand.",
            "Machine learning models improve with more training data!",
            "Hand pose detection is used in many video games and interactive art installations.",
            "Computers can identify poses even when different people perform them.",
            "AI can learn to recognize complex movements and gestures."
        ];

        const fact = facts[Math.floor(Math.random() * facts.length)];

        // Create a text-based output
        element.innerHTML = `
            <div style="
                height: 100%;
                width: 100%;
                background-color: #333;
                color: white;
                padding: 20px;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                text-align: center;
                font-size: 18px;
            ">
                <h2 style="color: #4CAF50; margin-bottom: 15px;">${message}</h2>
                <p style="font-style: italic; color: #ccc; margin-top: 20px;">${fact}</p>
            </div>
        `;
    }

    // Generate a random color for visualization
    function getRandomColor() {
        const hue = Math.floor(Math.random() * 360);
        return `hsl(${hue}, 70%, 60%)`;
    }

    // Set the current output mode
    function setOutputMode(mode) {
        if (outputModes[mode]) {
            currentOutputMode = mode;
            return true;
        }
        return false;
    }

    // Get the current output mode
    function getOutputMode() {
        return {
            id: currentOutputMode,
            name: outputModes[currentOutputMode].name
        };
    }

    // Get all available output modes
    function getAvailableOutputModes() {
        const modes = [];
        for (const [id, mode] of Object.entries(outputModes)) {
            modes.push({
                id: id,
                name: mode.name
            });
        }
        return modes;
    }

    // Add a custom output mode
    function addOutputMode(id, name, handler) {
        if (typeof handler !== 'function') {
            throw new Error('Output handler must be a function');
        }

        outputModes[id] = {
            name: name,
            handler: handler
        };

        return true;
    }

    // Public API
    return {
        init,
        setOutputMode,
        getOutputMode,
        getAvailableOutputModes,
        addOutputMode
    };
})();

// Export the module
window.OutputManagerModule = OutputManagerModule;