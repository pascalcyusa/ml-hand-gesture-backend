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
/**
 * Generate a MicroPython motor command string.
 * direction: 'clockwise' (positive speed) | 'counterclockwise' (negative speed)
 */
export function generateMotorCommand(portLabel, action, speed, degrees, direction = 'clockwise') {
    const port = PORTS[portLabel];
    if (port === undefined) return null;

    // Apply direction before clamping: CCW = negative speed
    const rawSpd = direction === 'counterclockwise' ? -Math.abs(speed || 0) : Math.abs(speed || 0);
    // Constrain to valid hub range (-100 to 100)
    const spd = Math.max(-100, Math.min(100, rawSpd));
    const pyPort = `port.${portLabel}`;

    if (action === 'stop') {
        return `try:\n    motor.stop(${pyPort})\nexcept:\n    try:\n        from pybricks.pupdevices import Motor\n        from pybricks.parameters import Port\n        _m = Motor(getattr(Port, '${portLabel}'))\n        _m.stop()\n    except:\n        pass\n`;
    }

    if (action === 'run_forever') {
        return `try:\n    motor.run(${pyPort}, ${spd})\nexcept:\n    try:\n        from pybricks.pupdevices import Motor\n        from pybricks.parameters import Port\n        _m = Motor(getattr(Port, '${portLabel}'))\n        _m.run(${spd})\n    except:\n        pass\n`;
    }

    if (action === 'run_degrees') {
        // degrees is always positive; direction is encoded in speed sign
        const absDeg = Math.abs(degrees || 0);
        return `try:\n    motor.run_for_degrees(${pyPort}, ${absDeg}, ${spd})\nexcept:\n    try:\n        from pybricks.pupdevices import Motor\n        from pybricks.parameters import Port\n        _m = Motor(getattr(Port, '${portLabel}'))\n        try:\n            _m.run_angle(${spd}, ${absDeg})\n        except:\n            try:\n                _m.run_angle(${absDeg}, ${spd})\n            except:\n                pass\n    except:\n        pass\n`;
    }

    return null;
}

/**
 * Build a short human-readable summary of a motor config array.
 * e.g. "Port A: 90° @ 50% CW, Port B: run @ 30% CCW"
 */
export function describeMotorConfig(config) {
    if (!config || config.length === 0) return 'no motors configured';
    const parts = config
        .filter(m => m.action !== 'stop')
        .map(m => {
            const dir = m.direction === 'counterclockwise' ? 'CCW' : 'CW';
            if (m.action === 'run_forever') return `Port ${m.port}: run @ ${m.speed}% ${dir}`;
            if (m.action === 'run_degrees') return `Port ${m.port}: ${m.degrees}° @ ${m.speed}% ${dir}`;
            return null;
        })
        .filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'all stop';
}

/**
 * Helper to encode string string to Uint8Array/ArrayBuffer for BLE write
 */
export function encodeCommand(cmdString) {
    const encoder = new TextEncoder();
    return encoder.encode(cmdString);
}
