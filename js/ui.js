/**
 * UI Module
 * Handles UI interactions and elements
 */

const UIModule = (function () {
    // Private variables
    let loadingElement = null;
    let tabButtons = null;
    let tabContents = null;
    let trainButton = null;
    let resetButton = null;
    let addClassButton = null;
    let saveModelButton = null;
    let loadModelButton = null;
    let modelStatusElement = null;
    let codeSnippetElement = null;

    // Initialize UI module
    function init() {
        console.log('Initializing UI module...');

        try {
            // Get UI elements
            loadingElement = document.getElementById('loading');
            if (!loadingElement) console.warn('Loading element not found');

            tabButtons = document.querySelectorAll('.tab');
            if (tabButtons.length === 0) console.warn('Tab buttons not found');

            tabContents = document.querySelectorAll('.tab-content');
            if (tabContents.length === 0) console.warn('Tab contents not found');

            trainButton = document.getElementById('train-btn');
            if (!trainButton) console.warn('Train button not found');

            resetButton = document.getElementById('reset-btn');
            if (!resetButton) console.warn('Reset button not found');

            addClassButton = document.getElementById('add-class-btn');
            if (!addClassButton) console.warn('Add class button not found');

            saveModelButton = document.getElementById('save-model-btn');
            if (!saveModelButton) console.warn('Save model button not found');

            loadModelButton = document.getElementById('load-model-btn');
            if (!loadModelButton) console.warn('Load model button not found');

            modelStatusElement = document.getElementById('model-status');
            if (!modelStatusElement) console.warn('Model status element not found');

            codeSnippetElement = document.getElementById('code-snippet');
            if (!codeSnippetElement) console.warn('Code snippet element not found');

            // Setup tab navigation
            tabButtons.forEach(tab => {
                tab.addEventListener('click', function () {
                    switchTab(this.getAttribute('data-tab'));
                });
            });

            console.log('UI module initialized successfully');
        } catch (error) {
            console.error('Error initializing UI module:', error);
        }

        return this;
    }

    // Show loading screen
    function showLoading(message = 'Loading...') {
        if (loadingElement) {
            loadingElement.querySelector('div:last-child').textContent = message;
            loadingElement.classList.remove('hidden');
        }
    }

    // Hide loading screen
    function hideLoading() {
        if (loadingElement) {
            loadingElement.classList.add('hidden');
        }
    }

    // Switch active tab
    function switchTab(tabId) {
        // Remove active class from all tabs and content
        tabButtons.forEach(tab => tab.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));

        // Add active class to selected tab
        const activeTab = document.querySelector(`.tab[data-tab="${tabId}"]`);
        if (activeTab) {
            activeTab.classList.add('active');
        }

        // Show corresponding content
        const activeContent = document.getElementById(`${tabId}-tab`);
        if (activeContent) {
            activeContent.classList.add('active');
        }
    }

    // Set train button state
    function setTrainButtonState(enabled, statusMessage = null) {
        if (trainButton) {
            trainButton.disabled = !enabled;
        }

        if (statusMessage && modelStatusElement) {
            modelStatusElement.textContent = statusMessage;

            // Update color based on message
            if (statusMessage.includes('Ready')) {
                modelStatusElement.style.color = '#155724';
            } else if (statusMessage.includes('Error')) {
                modelStatusElement.style.color = '#721c24';
            } else {
                modelStatusElement.style.color = '#333';
            }
        }
    }

    // Set save model button state
    function setSaveModelButtonState(enabled) {
        if (saveModelButton) {
            saveModelButton.disabled = !enabled;
        }
    }

    // Update code snippet
    function updateCodeSnippet(code) {
        if (codeSnippetElement) {
            codeSnippetElement.textContent = code;
        }
    }

    // Show a message dialog
    function showMessage(message, type = 'info') {
        // Create message element
        const messageElement = document.createElement('div');
        messageElement.className = 'message';
        messageElement.style.position = 'fixed';
        messageElement.style.top = '20px';
        messageElement.style.left = '50%';
        messageElement.style.transform = 'translateX(-50%)';
        messageElement.style.padding = '15px 20px';
        messageElement.style.borderRadius = '5px';
        messageElement.style.zIndex = '1000';
        messageElement.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
        messageElement.style.transition = 'opacity 0.3s';

        // Style based on message type
        switch (type) {
            case 'success':
                messageElement.style.backgroundColor = '#d4edda';
                messageElement.style.color = '#155724';
                break;
            case 'error':
                messageElement.style.backgroundColor = '#f8d7da';
                messageElement.style.color = '#721c24';
                break;
            case 'warning':
                messageElement.style.backgroundColor = '#fff3cd';
                messageElement.style.color = '#856404';
                break;
            default: // info
                messageElement.style.backgroundColor = '#d1ecf1';
                messageElement.style.color = '#0c5460';
        }

        // Set message text
        messageElement.textContent = message;

        // Add to document
        document.body.appendChild(messageElement);

        // Auto remove after 3 seconds
        setTimeout(() => {
            messageElement.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(messageElement);
            }, 300);
        }, 3000);
    }

    // Confirm dialog (returns a promise)
    function confirmDialog(message) {
        return new Promise((resolve) => {
            // Use browser's confirm dialog
            const result = confirm(message);
            resolve(result);
        });
    }

    // Prompt dialog (returns a promise)
    function promptDialog(message, defaultValue = '') {
        return new Promise((resolve) => {
            // Use browser's prompt dialog
            const result = prompt(message, defaultValue);
            resolve(result);
        });
    }

    // Create a modal dialog
    function createModalDialog(title, content, buttons) {
        // Create modal container
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.position = 'fixed';
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.width = '100%';
        modal.style.height = '100%';
        modal.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        modal.style.display = 'flex';
        modal.style.justifyContent = 'center';
        modal.style.alignItems = 'center';
        modal.style.zIndex = '1001';

        // Create modal content
        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content';
        modalContent.style.backgroundColor = 'white';
        modalContent.style.borderRadius = '5px';
        modalContent.style.padding = '20px';
        modalContent.style.width = '80%';
        modalContent.style.maxWidth = '500px';
        modalContent.style.maxHeight = '80vh';
        modalContent.style.overflow = 'auto';
        modalContent.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';

        // Add title
        const modalTitle = document.createElement('h3');
        modalTitle.textContent = title;
        modalTitle.style.marginTop = '0';
        modalContent.appendChild(modalTitle);

        // Add content
        if (typeof content === 'string') {
            const contentElement = document.createElement('div');
            contentElement.innerHTML = content;
            modalContent.appendChild(contentElement);
        } else if (content instanceof HTMLElement) {
            modalContent.appendChild(content);
        }

        // Add buttons
        const buttonContainer = document.createElement('div');
        buttonContainer.style.marginTop = '20px';
        buttonContainer.style.textAlign = 'right';

        // Process buttons
        buttons.forEach(button => {
            const buttonElement = document.createElement('button');
            buttonElement.className = `btn ${button.className || ''}`;
            buttonElement.textContent = button.text;
            buttonElement.style.marginLeft = '10px';

            // Add button click handler
            buttonElement.addEventListener('click', () => {
                if (button.callback) {
                    button.callback();
                }
                document.body.removeChild(modal);
            });

            buttonContainer.appendChild(buttonElement);
        });

        modalContent.appendChild(buttonContainer);
        modal.appendChild(modalContent);

        // Add to document
        document.body.appendChild(modal);

        // Return modal element for further manipulation
        return modal;
    }

    // Create a file input dialog
    function createFileInput(accept = '.json', multiple = false) {
        return new Promise((resolve) => {
            // Create file input
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = accept;
            fileInput.multiple = multiple;
            fileInput.style.display = 'none';

            // Add to document
            document.body.appendChild(fileInput);

            // Add change event
            fileInput.addEventListener('change', () => {
                resolve(fileInput);
            });

            // Add cancel event
            fileInput.addEventListener('cancel', () => {
                document.body.removeChild(fileInput);
                resolve(null);
            });

            // Trigger click
            fileInput.click();
        });
    }

    // Show a list of saved models for selection
    function showModelSelectionDialog(models) {
        return new Promise((resolve) => {
            // Create content element
            const content = document.createElement('div');

            if (models.length === 0) {
                content.innerHTML = '<p>No saved models found.</p>';

                // Show modal
                createModalDialog('Saved Models', content, [
                    {
                        text: 'Close',
                        className: 'btn-red',
                        callback: () => resolve(null)
                    }
                ]);

                return;
            }

            // Create list of models
            const listElement = document.createElement('ul');
            listElement.style.listStyle = 'none';
            listElement.style.padding = '0';

            models.forEach(model => {
                const date = new Date(model.timestamp);
                const dateString = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();

                const listItem = document.createElement('li');
                listItem.style.padding = '10px';
                listItem.style.margin = '5px 0';
                listItem.style.backgroundColor = '#f8f9fa';
                listItem.style.borderRadius = '5px';
                listItem.style.cursor = 'pointer';

                listItem.innerHTML = `
                    <strong>${model.name}</strong><br>
                    <small>Saved on: ${dateString}</small><br>
                    <small>Classes: ${model.classes.map(c => c.name).join(', ')}</small>
                `;

                // Add click handler
                listItem.addEventListener('click', () => {
                    // Remove selected class from all items
                    listElement.querySelectorAll('li').forEach(item => {
                        item.style.backgroundColor = '#f8f9fa';
                    });

                    // Add selected class to this item
                    listItem.style.backgroundColor = '#e2e6ea';

                    // Store selected model
                    listElement.selectedModel = model;
                });

                listElement.appendChild(listItem);
            });

            content.appendChild(listElement);

            // Show modal
            createModalDialog('Select a Model', content, [
                {
                    text: 'Cancel',
                    className: 'btn-red',
                    callback: () => resolve(null)
                },
                {
                    text: 'Load',
                    className: 'btn-green',
                    callback: () => resolve(listElement.selectedModel || null)
                }
            ]);
        });
    }

    // Public API
    return {
        init,
        showLoading,
        hideLoading,
        switchTab,
        setTrainButtonState,
        setSaveModelButtonState,
        updateCodeSnippet,
        showMessage,
        confirmDialog,
        promptDialog,
        createModalDialog,
        createFileInput,
        showModelSelectionDialog
    };
})();

// Export the module
window.UIModule = UIModule;