/**
 * ============================================================
 * NotesController.js
 * ============================================================
 * A JavaScript class for creating and controlling groups of 
 * note sequences in a horizontal slot-based UI, compatible with
 * the piano player system for triggering musical sequences when
 * hand poses are detected.
 *
 * ------------------------------------------------------------
 * OVERVIEW
 * ------------------------------------------------------------
 * This module dynamically builds HTML interfaces for configuring 
 * sequences of musical notes. Each group represents a trained 
 * hand pose class, and each slot contains options for note 
 * selection, duration, and delay toggles.
 *
 * When triggered, the controller compiles the selected values
 * and sends them to the Python audio system via `window.pyPlaySequence`.
 *
 * ------------------------------------------------------------
 * KEY FEATURES
 * ------------------------------------------------------------
 * - Modular design: encapsulated in a class for safety and reuse  
 * - UI generation: horizontal slot layout for intuitive sequencing
 * - Visual feedback: highlights executing sequences
 * - Note testing: individual note playback for each slot
 * - Delay system: configurable pauses between notes
 * - Class-based organization: each ML class gets its own note group
 *
 * ------------------------------------------------------------
 * CLASS: NotesController
 * ------------------------------------------------------------
 * Constructor:
 *   new NotesController(slotCount = 4)
 *
 * Public Methods:
 * - loadGroup(divId, classId, className)          
 *     → Creates note sequence interface for a specific class
 * - compileAndRun(divId)
 *     → Compiles note sequence and triggers playback
 * - addSlot(divId)
 *     → Adds another note slot to the sequence
 * - resetGroup(divId)
 *     → Resets sequence to default configuration
 * - testSequence(divId)
 *     → Tests the sequence without ML prediction trigger
 *
 * Internal Helpers:
 * - createNoteSlot(slotIndex, noteConfig)
 * - createSequenceHeader(classId, className)
 * - updateSlotType(slot, isDelay)
 * - getSequenceConfig(divId)
 * - playNote(note, duration)
 *
 * ------------------------------------------------------------
 * EXAMPLE USAGE
 * ------------------------------------------------------------
 * HTML Structure:
 *
 * <div id="note-group-1"></div>
 * <div id="note-group-2"></div>
 *
 * JS Setup:
 * <script type="module">
 *   import { NotesController } from './notesController.js';
 *   const noteController = new NotesController();
 *   window.noteController = noteController; // expose globally
 * 
 *   // Load note groups for trained classes
 *   noteController.loadGroup('note-group-1', 1, 'Peace Sign');
 *   noteController.loadGroup('note-group-2', 2, 'Thumbs Up');
 *
 *   // Execute when hand pose detected
 *   noteController.compileAndRun('note-group-1');
 * </script>
 *
 * Style Classes (namespaced to avoid conflicts):
 * - nc-sequence-container  → main container
 * - nc-sequence-header     → header with class info and controls
 * - nc-note-section        → section containing note slots
 * - nc-note-slots          → horizontal container for slots
 * - nc-note-slot           → individual note slot
 * - nc-note-select         → note selection dropdown
 * - nc-duration-select     → duration selection dropdown
 * - nc-play-note-btn       → individual note test button
 * - nc-slot-toggle         → delay/note toggle checkbox
 * - nc-executing           → highlight during playback
 *
 * ------------------------------------------------------------
 * DEPENDENCIES
 * ------------------------------------------------------------
 * - Requires Python audio functions:
 *   window.pyPlayNote(note, duration)
 *   window.pyPlaySequence(classId) 
 *
 * ------------------------------------------------------------
 * NOTES
 * ------------------------------------------------------------
 * - Designed to complement MotorGroupController
 * - Follows same loadGroup/compileAndRun API pattern
 * - Maintains elegant horizontal slot UI from original system
 * - Each note group is independent and self-contained
 *
 * ============================================================
 */

export class NotesController {
    constructor(slotCount = 1) {
        this.DEFAULT_SLOT_COUNT = slotCount;
        this.isEnabled = true;

        // Musical notes frequencies (in Hz) - matches piano-player.js
        this.noteFrequencies = {
            'C3': 130.81, 'C#3': 138.59, 'D3': 146.83, 'D#3': 155.56, 'E3': 164.81, 'F3': 174.61,
            'F#3': 185.00, 'G3': 196.00, 'G#3': 207.65, 'A3': 220.00, 'A#3': 233.08, 'B3': 246.94,
            'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'D#4': 311.13, 'E4': 329.63, 'F4': 349.23,
            'F#4': 369.99, 'G4': 392.00, 'G#4': 415.30, 'A4': 440.00, 'A#4': 466.16, 'B4': 493.88,
            'C5': 523.25, 'C#5': 554.37, 'D5': 587.33, 'D#5': 622.25, 'E5': 659.25, 'F5': 698.46,
            'F#5': 739.99, 'G5': 783.99, 'G#5': 830.61, 'A5': 880.00, 'A#5': 932.33, 'B5': 987.77
        };

        // Note duration options (in seconds)
        this.noteDurations = {
            'very short': 0.1,
            'short': 0.2,
            'medium': 0.5,
            'long': 1.0,
            'very long': 2.0
        };

        // Default note configuration
        this.defaultNoteConfig = [
            { note: null, duration: 'short' },
        ];
    }

    // Create a table row for a note
    createNoteRow(index, noteConfig) {
        const row = document.createElement('tr');
        const isDelay = !noteConfig.note;

        const label = document.createElement('td');
        label.className = 'nc-group-label';
        label.innerText = `Note ${index + 1}`;
        row.appendChild(label);

        // Note cell
        const noteCell = document.createElement('td');
        const noteOptions = Object.keys(this.noteFrequencies).map(note =>
            `<option value="${note}" ${noteConfig.note === note ? 'selected' : ''}>${note}</option>`
        ).join('');

        noteCell.innerHTML = `
            <select class="nc-note-select">
                <option value="">Delay</option>
                ${noteOptions}
            </select>
        `;
        row.appendChild(noteCell);

        // Duration cell
        const durationCell = document.createElement('td');
        const durationOptions = Object.keys(this.noteDurations).map(duration =>
            `<option value="${duration}" ${noteConfig.duration === duration ? 'selected' : ''}>${duration}</option>`
        ).join('');

        durationCell.innerHTML = `
            <select class="nc-duration-select">
                ${durationOptions}
            </select>
        `;
        row.appendChild(durationCell);

        // Test button cell
        const testCell = document.createElement('td');
        testCell.innerHTML = `
            <button class="nc-test-note-btn btn btn-small" ${isDelay ? 'disabled' : ''}>▶</button>
        `;
        row.appendChild(testCell);

        // Delete button cell
        const deleteCell = document.createElement('td');
        deleteCell.innerHTML = `
            <button class="nc-delete-note-btn btn btn-small btn-red" title="Delete this note">×</button>
        `;
        row.appendChild(deleteCell);

        // Add event listeners
        this.addRowEventListeners(row);

        return row;
    }

    // Add event listeners to a table row
    addRowEventListeners(row) {
        const noteSelect = row.querySelector('.nc-note-select');
        const durationSelect = row.querySelector('.nc-duration-select');
        const testBtn = row.querySelector('.nc-test-note-btn');
        const deleteBtn = row.querySelector('.nc-delete-note-btn');

        // Note selection change
        noteSelect.addEventListener('change', () => {
            const isDelay = !noteSelect.value;
            testBtn.disabled = isDelay;
        });

        // Test button
        testBtn.addEventListener('click', () => {
            const note = noteSelect.value;
            const duration = durationSelect.value;
            if (note && duration) {
                this.playNote(note, duration);
            }
        });

        // Delete button
        deleteBtn.addEventListener('click', () => {
            this.deleteNoteRow(row);
        });
    }

    // Load a note group for a specific class
    loadGroup(divId, classId, className) {
        const container = document.getElementById(divId);
        if (!container || container.querySelector('table')) return;

        container.dataset.classId = classId;

        // Create collapsible header
        const header = document.createElement('div');
        header.className = 'notes-section-header';
        header.innerHTML = `
            <div class="notes-section-title">Note Sequence</div>
            <button class="collapse-toggle" title="Collapse/Expand Notes">▼</button>
        `;
        container.appendChild(header);

        // Create collapsible container for the table and buttons
        const tableContainer = document.createElement('div');
        tableContainer.className = 'notes-table-container';

        const table = document.createElement('table');
        table.className = 'nc-note-table';

        const thead = document.createElement('thead');
        thead.innerHTML = `
            <tr>
                <th></th>
                <th>Note</th>
                <th>Duration</th>
                <th>Test</th>
                <th>Del</th>
            </tr>
        `;
        table.appendChild(thead);

        const tbody = document.createElement('tbody');
        this.defaultNoteConfig.forEach((noteConfig, index) => {
            tbody.appendChild(this.createNoteRow(index, noteConfig));
        });
        table.appendChild(tbody);

        tableContainer.appendChild(table);

        // Create button container
        const buttonContainer = document.createElement('div');
        buttonContainer.style.marginTop = '10px';

        const addButton = document.createElement('button');
        addButton.className = 'btn';
        addButton.innerText = "Add Note";
        addButton.onclick = () => this.addNote(divId);
        buttonContainer.appendChild(addButton);

        const testButton = document.createElement('button');
        testButton.className = 'btn btn-green';
        testButton.innerText = "Test Sequence";
        testButton.style.marginLeft = '10px';
        testButton.onclick = () => this.testSequence(divId);
        buttonContainer.appendChild(testButton);

        tableContainer.appendChild(buttonContainer);
        container.appendChild(tableContainer);

        // Add collapse functionality
        this.addCollapseListeners(header, tableContainer);
    }

    // Delete a note row
    deleteNoteRow(row) {
        const table = row.closest('table');
        const tbody = table.querySelector('tbody');
        const rows = tbody.querySelectorAll('tr');

        // Don't allow deleting the last remaining row
        if (rows.length <= 1) {
            alert('Cannot delete the last note. At least one note is required.');
            return;
        }

        // Confirm deletion
        if (confirm('Delete this note?')) {
            row.remove();
            this.updateRowLabels(tbody);
        }
    }

    // Update row labels after deletion
    updateRowLabels(tbody) {
        const rows = tbody.querySelectorAll('tr');
        rows.forEach((row, index) => {
            const label = row.querySelector('.nc-group-label');
            if (label) {
                label.textContent = `Note ${index + 1}`;
            }
        });
    }

    // Add a new note to existing group
    addNote(divId) {
        const container = document.getElementById(divId);
        if (!container) return;

        const table = container.querySelector('table');
        const tbody = table.querySelector('tbody');
        const rowCount = tbody.querySelectorAll('tr').length;
        const newRow = this.createNoteRow(rowCount, { note: 'C4', duration: 'short' });
        tbody.appendChild(newRow);
    }

    // Reset group to default configuration
    resetGroup(divId) {
        const container = document.getElementById(divId);
        if (!container) return;

        const classId = container.dataset.classId;

        // Clear and reload
        container.innerHTML = '';
        this.loadGroup(divId, classId, `Class ${classId}`);
    }

    // Get current sequence configuration from DOM
    getSequenceConfig(divId) {
        const container = document.getElementById(divId);
        if (!container) return null;

        const classId = parseInt(container.dataset.classId);
        const rows = container.querySelectorAll('tbody tr');
        const notes = [];

        rows.forEach(row => {
            const noteSelect = row.querySelector('.nc-note-select');
            const durationSelect = row.querySelector('.nc-duration-select');

            notes.push({
                note: noteSelect.value || null,
                duration: durationSelect.value || 'medium'
            });
        });

        return {
            classId,
            enabled: true, // Always enabled in simple version
            notes
        };
    }

    // Test sequence playback
    async testSequence(divId) {
        const config = this.getSequenceConfig(divId);
        if (!config) return;

        const container = document.getElementById(divId);
        const rows = container.querySelectorAll('tbody tr');

        for (const row of rows) {
            row.classList.add('nc-executing');

            const noteSelect = row.querySelector('.nc-note-select');
            const durationSelect = row.querySelector('.nc-duration-select');
            const note = noteSelect.value;
            const duration = durationSelect.value;

            if (note) {
                this.playNote(note, duration);
            }

            // Wait for note duration + small gap
            await new Promise(resolve =>
                setTimeout(resolve, (this.noteDurations[duration] + 0.05) * 1000)
            );

            row.classList.remove('nc-executing');
        }
    }

    // Compile and run sequence (main execution method)
    async compileAndRun(divId) {
        if (!this.isEnabled) return;

        const config = this.getSequenceConfig(divId);
        if (!config) return;

        try {
            if (window.pyPlaySequence) {
                await window.pyPlaySequence(config.classId);
            } else {
                console.warn('pyPlaySequence not available, playing notes individually');
                await this.testSequence(divId);
            }
        } catch (error) {
            console.error('Error executing note sequence:', error);
        }
    }

    // Add collapse/expand functionality
    addCollapseListeners(header, tableContainer) {
        const toggleButton = header.querySelector('.collapse-toggle');

        header.addEventListener('click', () => {
            const isCollapsed = tableContainer.classList.contains('collapsed');

            if (isCollapsed) {
                // Expand
                tableContainer.classList.remove('collapsed');
                toggleButton.classList.remove('collapsed');
                toggleButton.textContent = '▼';
                toggleButton.title = 'Collapse Notes';
            } else {
                // Collapse
                tableContainer.classList.add('collapsed');
                toggleButton.classList.add('collapsed');
                toggleButton.textContent = '▶';
                toggleButton.title = 'Expand Notes';
            }
        });
    }

    // Play individual note
    playNote(note, durationLabel) {
        const duration = this.noteDurations[durationLabel] || 0.5;

        if (window.pyPlayNote) {
            window.pyPlayNote(note, durationLabel);
        } else {
            console.warn(`Playing ${note} for ${duration}s (pyPlayNote not available)`);
        }
    }

    // Enable/disable the controller
    setEnabled(enabled) {
        this.isEnabled = enabled;

        // Update all existing groups
        document.querySelectorAll('.nc-note-table').forEach(table => {
            const container = table.closest('div');
            const controls = container.querySelectorAll('select, button');
            controls.forEach(control => {
                control.disabled = !enabled;
            });
        });
    }

    // Get all current sequence configurations
    getAllSequenceConfigs() {
        const configs = [];
        document.querySelectorAll('[data-class-id]').forEach(container => {
            if (container.querySelector('.nc-note-table')) {
                const config = this.getSequenceConfig(container.id);
                if (config) {
                    configs.push(config);
                }
            }
        });
        return configs;
    }
}