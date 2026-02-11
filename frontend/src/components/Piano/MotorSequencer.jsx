/**
 * MotorSequencer — Per-class motor control configuration
 * 
 * Ported from: js/motorGroupController.js
 * 
 * Configures motor actions for ports A, B, C:
 *  - Stop / Run Forever / Run for Degrees
 *  - Direction (CW / CCW)
 *  - Speed/Degrees values
 * 
 * Motor execution requires BLE connection (Phase 3).
 * For now this builds the config UI.
 */

import { useState, useCallback } from 'react';
import './MotorSequencer.css';

const PORTS = ['A', 'B', 'C'];
const ACTIONS = ['stop', 'run_forever', 'run_degrees'];
const ACTION_LABELS = {
    stop: '⏹ Stop',
    run_forever: '🔄 Run Forever',
    run_degrees: '📐 Run Degrees',
};
const DIRECTIONS = ['clockwise', 'counterclockwise'];

function createDefaultMotorConfig() {
    return PORTS.map((port) => ({
        port,
        action: 'stop',
        direction: 'clockwise',
        speed: 50,
        degrees: 360,
    }));
}

export default function MotorSequencer({
    className,
    classId,
    isConnected = false,
}) {
    const [motors, setMotors] = useState(createDefaultMotorConfig);
    const [collapsed, setCollapsed] = useState(true);

    const updateMotor = useCallback((port, field, value) => {
        setMotors((prev) =>
            prev.map((m) => (m.port === port ? { ...m, [field]: value } : m))
        );
    }, []);

    const resetMotors = useCallback(() => {
        setMotors(createDefaultMotorConfig());
    }, []);

    return (
        <div className={`motor-sequencer ${collapsed ? 'collapsed' : ''}`}>
            <div className="motor-seq-header" onClick={() => setCollapsed(!collapsed)}>
                <div className="motor-seq-title">
                    <span className="motor-seq-icon">⚙️</span>
                    <span className="motor-seq-name">{className}</span>
                    {!isConnected && (
                        <span className="motor-seq-badge">No Device</span>
                    )}
                </div>
                <span className="motor-seq-chevron">{collapsed ? '▸' : '▾'}</span>
            </div>

            {!collapsed && (
                <div className="motor-seq-body animate-fade-in">
                    <div className="motor-grid">
                        {motors.map((motor) => (
                            <div key={motor.port} className="motor-port-card">
                                <div className="motor-port-label">Port {motor.port}</div>

                                <div className="motor-field">
                                    <label className="motor-field-label">Action</label>
                                    <select
                                        className="motor-select"
                                        value={motor.action}
                                        onChange={(e) => updateMotor(motor.port, 'action', e.target.value)}
                                    >
                                        {ACTIONS.map((a) => (
                                            <option key={a} value={a}>{ACTION_LABELS[a]}</option>
                                        ))}
                                    </select>
                                </div>

                                {motor.action !== 'stop' && (
                                    <>
                                        <div className="motor-field">
                                            <label className="motor-field-label">Direction</label>
                                            <select
                                                className="motor-select"
                                                value={motor.direction}
                                                onChange={(e) => updateMotor(motor.port, 'direction', e.target.value)}
                                            >
                                                {DIRECTIONS.map((d) => (
                                                    <option key={d} value={d}>{d === 'clockwise' ? '↻ CW' : '↺ CCW'}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="motor-field">
                                            <label className="motor-field-label">
                                                Speed
                                            </label>
                                            <input
                                                type="range"
                                                min="10"
                                                max="100"
                                                value={motor.speed}
                                                onChange={(e) => updateMotor(motor.port, 'speed', Number(e.target.value))}
                                                className="motor-slider"
                                            />
                                            <span className="motor-value">{motor.speed}%</span>
                                        </div>

                                        {motor.action === 'run_degrees' && (
                                            <div className="motor-field">
                                                <label className="motor-field-label">Degrees</label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max="3600"
                                                    value={motor.degrees}
                                                    onChange={(e) => updateMotor(motor.port, 'degrees', Number(e.target.value))}
                                                    className="motor-input"
                                                />
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="motor-seq-footer">
                        <button className="btn btn-sm" onClick={resetMotors}>↻ Reset</button>
                        {!isConnected && (
                            <span className="motor-hint">
                                Connect a device in the Devices tab to test motors
                            </span>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
