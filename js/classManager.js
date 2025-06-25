/**
 * Class Manager Module for Hand Poses
 * Handles hand pose classes, samples collection and management
 */

const ClassManagerModule = (function () {
    // Private variables
    let classes = [];
    let containerElement = null;
    let handDetectionModule = null;
    let classChangeCallbacks = [];

    // Initialize class manager
    function init(containerElementId, detectionModule) {
        containerElement = document.getElementById(containerElementId);
        if (!containerElement) {
            throw new Error(`Class container element with ID '${containerElementId}' not found`);
        }

        handDetectionModule = detectionModule;

        return this;
    }

    // Add a new class
    function addClass(className) {
        // If no class name provided, ask user
        if (!className) {
            className = prompt('Enter name for this hand pose class:');
            if (!className) return null; // User cancelled
        }

        // Trim whitespace and validate the name
        className = className.trim();

        // Check if name is empty after trimming
        if (!className) {
            alert('Class name cannot be empty!');
            return null;
        }

        // Check for duplicate names (case-insensitive)
        const existingNames = classes.map(c => c.name.toLowerCase());
        if (existingNames.includes(className.toLowerCase())) {
            alert(`A class named "${className}" already exists! Please choose a different name.`);
            return null;
        }

        const classId = classes.length;

        // Create class object
        const newClass = {
            id: classId,
            name: className,
            samples: []
        };

        // Add to collection
        classes.push(newClass);

        // Create UI for the class
        createClassUI(newClass);

        // Notify all callbacks about class changes
        notifyClassChangeCallbacks();

        return newClass;
    }

    // Create UI for a class
    function createClassUI(classObj) {
        const classCard = document.createElement('div');
        classCard.className = 'class-card';
        classCard.id = `class-${classObj.id}`;

        classCard.innerHTML = `
            <h3>${classObj.name}</h3>
            <button class="btn btn-green collect-btn" data-class="${classObj.id}">Collect</button>
            <div class="samples-grid" id="samples-${classObj.id}"></div>
            <div><span id="sample-count-${classObj.id}">0</span> samples</div>
        `;

        containerElement.appendChild(classCard);

        // Add event listener to collect button
        const collectBtn = classCard.querySelector('.collect-btn');
        collectBtn.addEventListener('click', function () {
            collectSample(classObj.id);
        });
    }

    // Collect a sample for a class
    function collectSample(classId) {
        const currentHand = handDetectionModule.getCurrentHand();

        if (!currentHand) {
            alert('No hand detected. Make sure your hand is visible in the camera.');
            return false;
        }

        // Extract hand features
        const features = handDetectionModule.extractHandFeatures(currentHand);
        const hand_landmarks = currentHand;

        if (!features) {
            alert('Could not extract hand features. Please try again.');
            return false;
        }

        // Add to class samples
        classes[classId].samples.push({
            features: features,
            landmarks: hand_landmarks,
            timestamp: Date.now()
        });

        // Update UI
        updateSamplesUI(classId);

        // Notify all callbacks about class changes
        notifyClassChangeCallbacks();

        return true;
    }

    // Update the samples UI for a class
    function updateSamplesUI(classId) {
        const samplesGrid = document.getElementById(`samples-${classId}`);
        const sampleCountElement = document.getElementById(`sample-count-${classId}`);
        const samples = classes[classId].samples;

        // Clear existing samples
        samplesGrid.innerHTML = '';

        // Add sample thumbnails
        samples.forEach((sample, index) => {
            const sampleElement = document.createElement('div');
            sampleElement.className = 'sample';
            sampleElement.setAttribute('data-sample-index', index);

            // Add delete functionality with double click
            sampleElement.addEventListener('dblclick', function () {
                deleteSample(classId, index);
            });

            // Add tooltip
            sampleElement.title = `Sample ${index + 1} - Double-click to delete`;

            // make a tiny canvas
            const thumb = document.createElement('canvas');
            thumb.width = 90;
            thumb.height = 90;

            console.log("Landmarks that will be plotted: ", sample.landmarks);
            // draw the skeleton on the canvas with scaled points
            HandDetectionModule.drawHandSkeletonToCanvas(thumb, sample.landmarks);

            // stick it into the tile
            sampleElement.appendChild(thumb);
            samplesGrid.appendChild(sampleElement);
        });

        // Update count
        sampleCountElement.textContent = samples.length;
    }

    // Delete a specific sample
    function deleteSample(classId, sampleIndex) {
        if (confirm('Delete this sample?')) {
            classes[classId].samples.splice(sampleIndex, 1);
            updateSamplesUI(classId);
            notifyClassChangeCallbacks();
        }
    }

    // Generate a random color for sample visualization
    function getRandomColor() {
        const hue = Math.floor(Math.random() * 360);
        return `hsl(${hue}, 70%, 80%)`;
    }

    // Get all classes
    function getAllClasses() {
        return classes;
    }

    // Get a specific class
    function getClass(classId) {
        return classes[classId] || null;
    }

    // Get all samples from all classes
    function getAllSamples() {
        const allSamples = {
            features: [],
            labels: []
        };

        classes.forEach((classObj, classIndex) => {
            classObj.samples.forEach(sample => {
                allSamples.features.push(sample.features);

                // One-hot encoded label
                const label = Array(classes.length).fill(0);
                label[classIndex] = 1;
                allSamples.labels.push(label);
            });
        });

        return allSamples;
    }

    // Register for class change events
    function onClassesChanged(callback) {
        if (typeof callback === 'function') {
            classChangeCallbacks.push(callback);
        }
    }

    // Remove class change callback
    function offClassesChanged(callback) {
        const index = classChangeCallbacks.indexOf(callback);
        if (index !== -1) {
            classChangeCallbacks.splice(index, 1);
        }
    }

    // Notify all registered callbacks about class changes
    function notifyClassChangeCallbacks() {
        classChangeCallbacks.forEach(callback => {
            try {
                callback(classes);
            } catch (error) {
                console.error('Error in class change callback:', error);
            }
        });
    }

    // Check if we have enough data for training
    function hasEnoughDataForTraining() {
        // We need at least 2 classes with samples
        const classesWithSamples = classes.filter(c => c.samples.length > 0);
        return classesWithSamples.length >= 2;
    }

    // Get training status message
    function getTrainingStatusMessage() {
        const classesWithSamples = classes.filter(c => c.samples.length > 0);

        if (classesWithSamples.length >= 2) {
            return 'Ready to train!';
        } else {
            const remaining = 2 - classesWithSamples.length;
            return `Add ${remaining} more class${remaining === 1 ? '' : 'es'} with samples`;
        }
    }

    // Set classes data (used when loading saved model)
    function setClasses(classesData) {
        classes = classesData;

        // Rebuild UI
        containerElement.innerHTML = '';
        classes.forEach(classObj => {
            createClassUI(classObj);
            updateSamplesUI(classObj.id);
        });

        notifyClassChangeCallbacks();
    }

    // Reset all classes
    function reset() {
        classes = [];
        containerElement.innerHTML = '';
        notifyClassChangeCallbacks();
    }

    // Public API
    return {
        init,
        addClass,
        collectSample,
        getAllClasses,
        getClass,
        getAllSamples,
        onClassesChanged,
        offClassesChanged,
        hasEnoughDataForTraining,
        getTrainingStatusMessage,
        setClasses,
        reset
    };
})();

// Export the module
window.ClassManagerModule = ClassManagerModule;