/**
 * LEGO Spike Prime Protocol (LWP3) Helper
 * 
 * Generates byte commands for the LEGO Spike Prime Hub.
 * Reference: https://lego.github.io/lego-ble-wireless-protocol-docs/
 */

// Port mapping
export const PORTS = {
    'A': 0,
    'B': 1,
    'C': 2,
    'D': 3,
    'E': 4,
    'F': 5,
};

/**
 * Generate a motor command to run for a duration or degrees.
 * 
 * Note: This is a simplified implementation. Secure/Checksums might be needed depending on mode.
 * Using "Direct Command" format without checksum for simplicity if supported, 
 * or adhering to LWP3.
 * 
 * For this implementation, we will use a Python script string if we were using PyScript,
 * but since we are using raw BLE, we need binary.
 * 
 * Structure (Simplified):
 * [Len, 0x00, Command, Port, ...]
 */
export function generateMotorCommand(portLabel, action, speed, degrees) {
    const port = PORTS[portLabel];
    if (port === undefined) return null;

    // Constrain speed -100 to 100
    const spd = Math.max(-100, Math.min(100, speed));

    // START SPEED (0x07) or START SPEED FOR DEGREES (0x09) or SIMILAR?
    // LWP3 is complex. Let's use a common "Port Output Command" structure.
    // Opcode 0x81 (Port Output Command), PortID, Startup/Completion (0x11), SubCommand (0x07 - Start Speed)

    // 0x04 (Len), 0x00 (HubID), 0x81 (Cmd), Port, 0x11 (Exec), 0x51 (WriteDirect), 0x00 (Mode/Profile), Speed

    // However, often simpler: sending text commands via REPL if the characteristic supports it (Nordic UART).
    // The `useBLE` connects to `6e400001` which is Nordic UART Service.
    // This implies we are sending **string python commands** to the REPL, NOT binary LWP3 packets!
    // The previous `useBLE` code used `6e40...` UUIDs which are standard for Nordic UART.
    // So we should send Python code strings!

    // "import hub; hub.port.A.motor.run_at_speed(50)"

    // Let's assume we are talking to the MicroPython REPL on the hub.

    if (action === 'stop') {
        return `hub.port.${portLabel}.motor.brake()\r\n`;
    }

    if (action === 'run_forever') {
        return `hub.port.${portLabel}.motor.run_at_speed(${spd})\r\n`;
    }

    if (action === 'run_degrees') {
        return `hub.port.${portLabel}.motor.run_for_degrees(${degrees}, ${spd})\r\n`;
    }

    return null;
}

/**
 * Helper to encode string string to Uint8Array/ArrayBuffer for BLE write
 */
export function encodeCommand(cmdString) {
    const encoder = new TextEncoder();
    return encoder.encode(cmdString);
}
