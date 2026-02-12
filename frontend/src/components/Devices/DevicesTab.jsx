/**
 * DevicesTab — BLE device connection management
 * 
 * Ported from: js/ble.js + the Devices section of index.html
 * 
 * Shows 4 device slots that can each connect to a BLE peripheral.
 * Devices are used by the MotorSequencer in the Piano tab.
 */

import { useCallback } from 'react';
import { useBLE } from '../../hooks/useBLE.js';
import './DevicesTab.css';

// Default SPIKE Prime / LEGO Hub UUIDs (from original ble.js usage)
const DEFAULT_SERVICE_UUID = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
const DEFAULT_WRITE_UUID = '6e400002-b5a3-f393-e0a9-e50e24dcca9e';
const DEFAULT_NOTIFY_UUID = '6e400003-b5a3-f393-e0a9-e50e24dcca9e';

export default function DevicesTab({ showToast }) {
    const ble = useBLE();

    const handleConnect = useCallback(async (slotIndex) => {
        const success = await ble.connect(
            slotIndex,
            DEFAULT_SERVICE_UUID,
            DEFAULT_WRITE_UUID,
            DEFAULT_NOTIFY_UUID
        );
        if (success) {
            showToast(`Device ${slotIndex + 1} connected!`, 'success');
        }
    }, [ble, showToast]);

    const handleDisconnect = useCallback((slotIndex) => {
        ble.disconnect(slotIndex);
        showToast(`Device ${slotIndex + 1} disconnected`, 'info');
    }, [ble, showToast]);

    return (
        <div className="devices-tab animate-fade-in">
            <div className="devices-header">
                <div className="devices-header-text">
                    <h2>📡 Connect Devices</h2>
                    <p className="devices-subtitle">
                        Pair BLE devices (LEGO SPIKE Prime, micro:bit, etc.) to control motors with hand gestures.
                    </p>
                </div>
                <div className="devices-status">
                    <span className={`devices-count ${ble.connectedCount > 0 ? 'active' : ''}`}>
                        {ble.connectedCount}/{ble.devices.length} Connected
                    </span>
                    {ble.connectedCount > 0 && (
                        <button className="btn btn-danger btn-sm" onClick={ble.disconnectAll}>
                            Disconnect All
                        </button>
                    )}
                </div>
            </div>

            {!ble.isSupported && (
                <div className="devices-warning card">
                    <span className="devices-warning-icon">⚠️</span>
                    <div>
                        <strong>Web Bluetooth Not Available</strong>
                        <p>
                            Your browser doesn't support Web Bluetooth. Try Chrome, Edge, or Opera
                            on desktop, or Chrome on Android.
                        </p>
                    </div>
                </div>
            )}

            <div className="devices-grid">
                {ble.devices.map((device, i) => (
                    <div
                        key={device.id}
                        className={`device-card card ${device.connected ? 'connected' : ''} ${device.connecting ? 'connecting' : ''}`}
                    >
                        <div className="device-card-header">
                            <span className="device-slot-label">Slot {i + 1}</span>
                            <span className={`device-status-dot ${device.connected ? 'on' : 'off'}`} />
                        </div>

                        <div className="device-card-body">
                            {device.connected ? (
                                <>
                                    <span className="device-name">{device.name}</span>
                                    <span className="device-state">Connected</span>
                                </>
                            ) : device.connecting ? (
                                <>
                                    <span className="device-name">Searching...</span>
                                    <span className="device-state connecting">Pairing</span>
                                </>
                            ) : (
                                <>
                                    <span className="device-name idle">No Device</span>
                                    <span className="device-state">Idle</span>
                                </>
                            )}
                        </div>

                        {device.error && (
                            <p className="device-error">{device.error}</p>
                        )}

                        <div className="device-card-footer">
                            {device.connected ? (
                                <button
                                    className="btn btn-danger btn-sm device-btn"
                                    onClick={() => handleDisconnect(i)}
                                >
                                    Disconnect
                                </button>
                            ) : (
                                <button
                                    className="btn btn-primary btn-sm device-btn"
                                    onClick={() => handleConnect(i)}
                                    disabled={!ble.isSupported || device.connecting}
                                >
                                    {device.connecting ? '⏳ Pairing...' : '🔗 Connect'}
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <div className="devices-info card">
                <h4>How It Works</h4>
                <ol className="devices-steps">
                    <li>Connect your BLE device using one of the slots above</li>
                    <li>Go to the <strong>Piano</strong> tab and enable <strong>Motors</strong></li>
                    <li>Configure motor actions for each gesture class</li>
                    <li>Train your model in the <strong>Train</strong> tab</li>
                    <li>When a gesture is detected, the assigned motor actions execute automatically</li>
                </ol>
            </div>
        </div>
    );
}
