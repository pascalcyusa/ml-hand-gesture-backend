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

// LWP3 BLE UUIDs (standard LEGO hub firmware — SPIKE 2/3, Technic Hub, etc.)
export const LWP3_SERVICE = '00001623-1212-efde-1623-785feabcd123';
export const LWP3_CHARACTERISTIC = '00001624-1212-efde-1623-785feabcd123';

/**
 * Generate a native LWP3 binary motor command (Uint8Array).
 * Works with standard LEGO hub firmware over BLE — no Python REPL needed.
 * direction: 'clockwise' | 'counterclockwise'
 */
export function generateLWP3MotorCommand(portLabel, action, speed, degrees, direction = 'clockwise') {
    const portId = PORTS[portLabel];
    if (portId === undefined) return null;

    const rawSpd = direction === 'counterclockwise' ? -Math.abs(speed || 0) : Math.abs(speed || 0);
    const spd = Math.max(-100, Math.min(100, rawSpd));
    // Convert signed speed to an unsigned byte (two's complement for negatives)
    const spdByte = spd < 0 ? (256 + spd) : spd;
    const maxPower = 100;  // 0x64
    const endState = 0x7F; // brake
    const profile = 0x03;

    if (action === 'stop') {
        // StartSpeed with speed=0 → brake
        return new Uint8Array([0x0A, 0x00, 0x81, portId, 0x11, 0x01, 0x00, maxPower, endState, profile]);
    }

    if (action === 'run_forever') {
        // StartSpeed
        return new Uint8Array([0x0A, 0x00, 0x81, portId, 0x11, 0x01, spdByte, maxPower, endState, profile]);
    }

    if (action === 'run_degrees') {
        // StartSpeedForDegrees — degrees as little-endian int32
        const absDeg = Math.max(1, Math.abs(degrees || 0));
        const cmd = new Uint8Array(14);
        cmd[0] = 0x0E; // message length
        cmd[1] = 0x00; // hub id
        cmd[2] = 0x81; // Port Output Command
        cmd[3] = portId;
        cmd[4] = 0x11; // Execute immediately, no action on completion
        cmd[5] = 0x0B; // SubCommand: StartSpeedForDegrees
        cmd[6] = (absDeg) & 0xFF;
        cmd[7] = (absDeg >> 8) & 0xFF;
        cmd[8] = (absDeg >> 16) & 0xFF;
        cmd[9] = (absDeg >> 24) & 0xFF;
        cmd[10] = spdByte;
        cmd[11] = maxPower;
        cmd[12] = endState;
        cmd[13] = profile;
        return cmd;
    }

    return null;
}

/**
 * Generate a MicroPython motor command string (for REPL / USB connections).
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
 * Generate a SPIKE 3 async Python program for motor commands.
 * SPIKE 3 firmware requires runloop + await for motor.run_for_degrees/run_for_time.
 * Without await, the program exits immediately and motors don't complete.
 *
 * @param {Array} configs - Array of { port, action, speed, degrees, direction }
 * @returns {string} Complete Python program ready for SPIKE 3 upload
 */
export function generateSpike3MotorScript(configs) {
    if (!configs || configs.length === 0) return null;

    const lines = [];
    let needsAwait = false;
    let needsSleep = false;

    for (const m of configs) {
        const port = PORTS[m.port];
        if (port === undefined) continue;

        const rawSpd = m.direction === 'counterclockwise' ? -Math.abs(m.speed || 0) : Math.abs(m.speed || 0);
        const spd = Math.max(-100, Math.min(100, rawSpd));
        const pyPort = `port.${m.port}`;

        if (m.action === 'stop') {
            lines.push(`    motor.stop(${pyPort})`);
        } else if (m.action === 'run_forever') {
            lines.push(`    motor.run(${pyPort}, ${spd})`);
            needsSleep = true;
        } else if (m.action === 'run_degrees') {
            const absDeg = Math.abs(m.degrees || 0);
            lines.push(`    await motor.run_for_degrees(${pyPort}, ${absDeg}, ${spd})`);
            needsAwait = true;
        }
    }

    if (lines.length === 0) return null;

    // run_forever needs the program to stay alive
    if (needsSleep) {
        lines.push(`    await runloop.sleep_ms(10000)`);
        needsAwait = true;
    }

    if (needsAwait) {
        return [
            'import runloop',
            'import motor',
            'from hub import port',
            '',
            'async def main():',
            ...lines,
            '',
            'runloop.run(main())',
        ].join('\n') + '\n';
    }

    // No awaitable calls (e.g., all stops) — simple synchronous script
    return [
        'import motor',
        'from hub import port',
        '',
        ...lines.map(l => l.trimStart()),
    ].join('\n') + '\n';
}

/**
 * Generate a SPIKE 3 stop-all script.
 */
export function generateSpike3StopScript() {
    const ports = ['A', 'B', 'C', 'D', 'E', 'F'];
    const stopLines = ports.map(p => `motor.stop(port.${p})`).join('\n    ');
    return `import motor\nfrom hub import port\ntry:\n    ${stopLines}\nexcept:\n    pass\n`;
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
            const dir = m.direction === 'counterclockwise' ? '↺' : '↻';
            if (m.action === 'run_forever') return `Port ${m.port}: run @ ${m.speed}% ${dir}`;
            if (m.action === 'run_degrees') return `Port ${m.port}: ${m.degrees}° @ ${m.speed}% ${dir}`;
            return null;
        })
        .filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'all stop';
}

/**
 * Helper to encode a string to Uint8Array for REPL write
 */
export function encodeCommand(cmdString) {
    const encoder = new TextEncoder();
    return encoder.encode(cmdString);
}
