/**
 * ============================================================
 * MotorGroupController.js
 * ============================================================
 * A JavaScript class for creating and controlling groups of 
 * motor commands in a table-based UI, compatible with the 
 * PyREPL interface for sending Python code to connected hardware.
 *
 * ------------------------------------------------------------
 * OVERVIEW
 * ------------------------------------------------------------
 * This module dynamically builds HTML tables for configuring 
 * sequences of motor actions. Each row in the table represents
 * a step in the sequence, and each cell contains options for 
 * motor function (e.g., run, stop), direction, degrees, and wait time.
 *
 * When triggered, the controller compiles the selected values
 * into Python code and sends it to the PyREPL interface 
 * (e.g., LEGO SPIKE Prime) via `window.pyrepl.write`.
 *
 * ------------------------------------------------------------
 * KEY FEATURES
 * ------------------------------------------------------------
 * - Modular design: encapsulated in a class for safety and reuse  
 * - UI generation: tables for A/B/C motors + wait control  
 * - Visual feedback: highlights executing rows in yellow  
 * - Serialized output: avoids overlapping serial writes  
 * - Delete functionality: remove individual motor actions
 * - Test sequences: test motor sequences without ML predictions
 * - Supports SPIKE Prime motor functions:
 *     → stop, run forever, run for degrees  
 *
 * ------------------------------------------------------------
 * CLASS: MotorGroupController
 * ------------------------------------------------------------
 * Constructor:
 *   new MotorGroupController(defaultVelocity = 750)
 *
 * Public Methods:
 * - loadGroup(divId)          
 *     → Dynamically creates the motor control table in a div  
 * - addActionRow(containerId)
 *     → Adds another row (action step) to the specified table  
 * - compileAndRun(divId)
 *     → Compiles table into Python commands and runs sequence  
 * - testSequence(divId)
 *     → Tests the motor sequence (same as compileAndRun)
 * - runCode(command)
 *     → Pushes raw command into the serialized write queue  
 *
 * Internal Helpers:
 * - updateCellControls(cell)          
 *     → Updates dropdowns based on selected function  
 * - createMotorCell(groupIndex, port) 
 *     → Creates a single motor control cell (with dropdowns)  
 * - createWaitCell()                  
 *     → Creates dropdown for wait time  
 * - createGroupRow(index)            
 *     → Builds a full row of controls for a new action  
 * - deleteActionRow(row)
 *     → Deletes a motor action row with confirmation
 * - updateActionLabels(tbody)
 *     → Updates row labels after deletion
 * - getCommand(func, port, dir, amt) 
 *     → Translates dropdown values to Python command  
 * - processQueue()
 *     → Ensures only one write is sent at a time to hardware  
 *
 * ------------------------------------------------------------
 * EXAMPLE USAGE
 * ------------------------------------------------------------
 * HTML Structure:
 *
 * <div id="motor-group1"></div>
 * <button onclick="mgc.loadGroup('motor-group1')">LOAD</button>
 * <button onclick="mgc.compileAndRun('motor-group1')">RUN</button>
 *
 * JS Setup:
 * <script type="module">
 *   import { MotorGroupController } from './motorGroupController.js';
 *   const mgc = new MotorGroupController();
 *   window.mgc = mgc; // expose globally for button onclicks
 * </script>
 *
 * Style Classes (namespaced to avoid conflicts):
 * - mgc-motor-table     → the table element
 * - mgc-motor-cell      → motor A/B/C cells with dropdowns
 * - mgc-wait-cell       → final cell in each row (wait time)
 * - mgc-group-label     → row label ("Action 1", "Action 2", etc)
 * - mgc-executing       → row highlight during execution
 * - mgc-function        → dropdown for stop/forever/degrees
 * - mgc-direction       → dropdown for CW/CCW
 * - mgc-amount          → dropdown for degrees
 * - mgc-wait-select     → dropdown for wait delay
 * - mgc-delete-action-btn → delete button for removing actions
 *
 * ------------------------------------------------------------
 * DEPENDENCIES
 * ------------------------------------------------------------
 * - Requires PyREPL active on the page:
 *   <script defer src="https://cdn.jsdelivr.net/gh/gabrielsessions/pyrepl-js/build/main.js"></script>
 *
 * ------------------------------------------------------------
 * NOTES
 * ------------------------------------------------------------
 * - You can create multiple motor group divs on a single page  
 *   (e.g., motor-group1, motor-group2, etc)  
 * - The UI is entirely generated at runtime via JavaScript  
 * - All serial writes are buffered with a 100ms delay  
 * - Delete buttons prevent deletion of the last remaining action
 * - Intended for educational robotics, but flexible for other uses
 *
 * ============================================================
 */

// motorGroupController class
export class MotorGroupController {
    constructor(defaultVelocity = 750) {
        this.DEFAULT_VELOCITY = defaultVelocity;
        this.bufferDelay = 200;
        this.writeQueue = [];
        this.isWriting = false;
    }

    updateCellControls(cell) {
        const func = cell.querySelector('.mgc-function').value;
        const dir = cell.querySelector('.mgc-direction');
        const amt = cell.querySelector('.mgc-amount');

        if (func === "stop") {
            dir.disabled = true;
            amt.disabled = true;
            amt.innerHTML = "";
        } else if (func === "forever") {
            dir.disabled = false;
            amt.disabled = true;
            dir.innerHTML = '<option value="CW">CW</option><option value="CCW">CCW</option>';
            amt.innerHTML = "";
        } else if (func === "degrees") {
            dir.disabled = false;
            amt.disabled = false;
            dir.innerHTML = '<option value="CW">CW</option><option value="CCW">CCW</option>';
            amt.innerHTML = `
				<option value="45">45</option>
				<option value="90">90</option>
				<option value="180">180</option>
				<option value="360">360</option>
			`;
        }
    }

    createMotorCell(groupIndex, motorPort) {
        const cell = document.createElement('td');
        cell.className = 'mgc-motor-cell';
        cell.dataset.port = motorPort;
        cell.dataset.group = groupIndex;

        cell.innerHTML = `
			<select class="mgc-function" onchange="this.closest('.mgc-motor-cell').controller.updateCellControls(this.closest('.mgc-motor-cell'))">
				<option value="stop">Stop</option>
				<option value="forever">Run Forever</option>
				<option value="degrees">Run Degrees</option>
			</select><br>
			<select class="mgc-direction" disabled>
				<option value="CW">CW</option>
				<option value="CCW">CCW</option>
			</select><br>
			<select class="mgc-amount" disabled></select>
		`;
        cell.controller = this;
        return cell;
    }

    createWaitCell() {
        const cell = document.createElement('td');
        cell.className = 'mgc-wait-cell';
        cell.innerHTML = `
			<select class="mgc-wait-select">
				<option value="100">None</option>
				<option value="500">0.5 seconds</option>
				<option value="1000">1 second</option>
				<option value="2000">2 seconds</option>
				<option value="5000">5 seconds</option>
			</select>
		`;
        return cell;
    }

    createGroupRow(index) {
        const row = document.createElement('tr');

        // Action label
        const label = document.createElement('td');
        label.className = 'mgc-group-label';
        label.innerText = `Action ${index + 1}`;
        row.appendChild(label);

        // Motor cells for A, B, C
        for (const port of ['A', 'B', 'C']) {
            row.appendChild(this.createMotorCell(index, port));
        }

        // Wait cell
        row.appendChild(this.createWaitCell());

        // Delete button cell
        const deleteCell = document.createElement('td');
        deleteCell.innerHTML = `
			<button class="mgc-delete-action-btn btn btn-small btn-red" title="Delete this action">×</button>
		`;
        row.appendChild(deleteCell);

        // Add delete button event listener
        const deleteBtn = deleteCell.querySelector('.mgc-delete-action-btn');
        deleteBtn.addEventListener('click', () => {
            this.deleteActionRow(row);
        });

        return row;
    }

    addActionRow(containerId) {
        const container = document.getElementById(containerId);
        const table = container.querySelector('table');
        const tbody = table.querySelector('tbody');
        const rowCount = tbody.querySelectorAll('tr').length;
        const newRow = this.createGroupRow(rowCount);
        tbody.appendChild(newRow);
    }

    deleteActionRow(row) {
        const table = row.closest('table');
        const tbody = table.querySelector('tbody');
        const rows = tbody.querySelectorAll('tr');

        // Don't allow deleting the last remaining row
        if (rows.length <= 1) {
            alert('Cannot delete the last action. At least one action is required.');
            return;
        }

        // Confirm deletion
        if (confirm('Delete this motor action?')) {
            row.remove();
            this.updateActionLabels(tbody);
        }
    }

    updateActionLabels(tbody) {
        const rows = tbody.querySelectorAll('tr');
        rows.forEach((row, index) => {
            const label = row.querySelector('.mgc-group-label');
            if (label) {
                label.textContent = `Action ${index + 1}`;
            }
        });
    }

    loadGroup(divId) {
        const container = document.getElementById(divId);
        if (!container || container.querySelector('table')) return;

        const table = document.createElement('table');
        table.className = 'mgc-motor-table';

        // Create table header
        const thead = document.createElement('thead');
        thead.innerHTML = `
			<tr>
				<th></th>
				<th>Motor A</th>
				<th>Motor B</th>
				<th>Motor C</th>
				<th>Wait</th>
				<th>Del</th>
			</tr>
		`;
        table.appendChild(thead);

        // Create table body with first row
        const tbody = document.createElement('tbody');
        tbody.appendChild(this.createGroupRow(0));
        table.appendChild(tbody);
        container.appendChild(table);

        // Create button container for consistent styling
        const buttonContainer = document.createElement('div');
        buttonContainer.style.marginTop = '10px';

        // Add Action button
        const addButton = document.createElement('button');
        addButton.className = 'btn';
        addButton.innerText = "Add Action";
        addButton.onclick = () => this.addActionRow(divId);
        buttonContainer.appendChild(addButton);

        // Test Sequence button
        const testButton = document.createElement('button');
        testButton.className = 'btn btn-green';
        testButton.innerText = "Test Sequence";
        testButton.style.marginLeft = '10px';
        testButton.onclick = () => this.testSequence(divId);
        buttonContainer.appendChild(testButton);

        container.appendChild(buttonContainer);
    }

    testSequence(divId) {
        console.log(`Testing motor sequence for ${divId}`);
        // Use the existing compileAndRun method for testing
        this.compileAndRun(divId);
    }

    getCommand(func, port, direction, amount) {
        const pyPort = `port.${port}`;
        const velocity = (direction === 'CW') ? this.DEFAULT_VELOCITY : -this.DEFAULT_VELOCITY;

        if (func === "stop") return `try:\n    motor.stop(${pyPort})\nexcept:\n    pass`;
        if (func === "forever") return `try:\n    motor.run(${pyPort}, ${velocity})\nexcept:\n    pass`;
        if (func === "degrees") return `try:\n    motor.run_for_degrees(${pyPort}, ${amount}, ${velocity})\nexcept:\n    pass`;

        return '';
    }

    async compileAndRun(divId) {
        if (!window.pyrepl || !window.pyrepl.isActive) {
            console.log('PyREPL not active');
            return;
        }

        const container = document.getElementById(divId);
        const table = container.querySelector('table');
        const rows = table.querySelectorAll('tbody tr');

        for (const row of rows) {
            row.classList.add('mgc-executing');

            const cells = row.querySelectorAll('.mgc-motor-cell');
            let commands = [];

            for (const cell of cells) {
                const port = cell.dataset.port;
                const func = cell.querySelector('.mgc-function').value;
                const dir = cell.querySelector('.mgc-direction').value;
                const amt = cell.querySelector('.mgc-amount')?.value || '';

                const cmd = this.getCommand(func, port, dir, amt);
                if (cmd) commands.push(cmd);
            }

            const modules = ["import motor", "from hub import port"];
            const fullCommand = modules.join('\n') + '\n' + commands.join('\n') + '\n';
            this.runCode(fullCommand);

            const waitValue = row.querySelector('.mgc-wait-select')?.value;
            await new Promise(r => setTimeout(r, parseInt(waitValue)));

            row.classList.remove('mgc-executing');
        }
    }

    runCode(command) {
        this.writeQueue.push(command);
        this.processQueue();
    }

    async processQueue() {
        if (this.isWriting || !this.writeQueue.length) return;

        this.isWriting = true;
        while (this.writeQueue.length > 0) {
            const cmd = this.writeQueue.shift();
            console.log("Serial write:", cmd.trim());
            window.pyrepl.write = cmd;
            await new Promise(r => setTimeout(r, this.bufferDelay));
        }
        this.isWriting = false;
    }

    async stopAll() {
        this.writeQueue = [];
        await new Promise(r => setTimeout(r, this.bufferDelay));
        this.runCode("import motor\nmotor.stop()\n")
    }

}