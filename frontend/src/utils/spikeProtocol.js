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
    const pyPort = `port.${portLabel}`;

    if (action === 'stop') {
        return `try:\n    motor.stop(${pyPort})\nexcept:\n    pass\n`;
    }

    if (action === 'run_forever') {
        return `try:\n    motor.run(${pyPort}, ${spd})\nexcept:\n    pass\n`;
    }

    if (action === 'run_degrees') {
        return `try:\n    motor.run_for_degrees(${pyPort}, ${degrees}, ${spd})\nexcept:\n    pass\n`;
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
