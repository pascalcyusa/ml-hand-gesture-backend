/**
 * DevicesTab — BLE device connection management
 * 
 * Ported from: js/ble.js + the Devices section of index.html
 * 
 * Shows 4 device slots that can each connect to a BLE peripheral.
 * Devices are used by the MotorSequencer in the Piano tab.
 */

import { useCallback } from 'react';
import {
    SignalIcon,
    ExclamationTriangleIcon,
    LinkIcon,
    SignalSlashIcon,
} from '@heroicons/react/24/outline';
import { useBLE } from '../../hooks/useBLE.js';
import { Button } from '../ui/button.jsx';
import { Card } from '../ui/card.jsx';
import { Badge } from '../ui/badge.jsx';
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
                    <h2 className="flex items-center gap-2 text-xl font-bold">
                        <SignalIcon className="h-6 w-6 text-[var(--blue)]" />
                        Connect Devices
                    </h2>
                    <p className="devices-subtitle">
                        Pair BLE devices (LEGO SPIKE Prime, micro:bit, etc.) to control motors with hand gestures.
                    </p>
                </div>
                <div className="devices-status">
                    <span className={`devices-count ${ble.connectedCount > 0 ? 'active' : ''}`}>
                        {ble.connectedCount}/{ble.devices.length} Connected
                    </span>
                    {ble.connectedCount > 0 && (
                        <Button variant="danger" size="sm" onClick={ble.disconnectAll}>
                            Disconnect All
                        </Button>
                    )}
                </div>
            </div>

            {!ble.isSupported && (
                <Card className="flex items-start gap-4 border-[var(--yellow-dim)]">
                    <ExclamationTriangleIcon className="h-6 w-6 text-[var(--yellow)] shrink-0 mt-0.5" />
                    <div>
                        <strong>Web Bluetooth Not Available</strong>
                        <p className="text-sm text-[var(--fg-dim)] mt-1">
                            Your browser doesn't support Web Bluetooth. Try Chrome, Edge, or Opera
                            on desktop, or Chrome on Android.
                        </p>
                    </div>
                </Card>
            )}

            <div className="devices-grid">
                {ble.devices.map((device, i) => (
                    <Card
                        key={device.id}
                        className={`device-card ${device.connected ? 'connected' : ''} ${device.connecting ? 'connecting' : ''}`}
                    >
                        <div className="device-card-header">
                            <span className="device-slot-label">Slot {i + 1}</span>
                            <span className={`device-status-dot ${device.connected ? 'on' : 'off'}`} />
                        </div>

                        <div className="device-card-body">
                            {device.connected ? (
                                <>
                                    <span className="device-name">{device.name}</span>
                                    <Badge variant="success">Connected</Badge>
                                </>
                            ) : device.connecting ? (
                                <>
                                    <span className="device-name">Searching...</span>
                                    <Badge variant="warning">Pairing</Badge>
                                </>
                            ) : (
                                <>
                                    <span className="device-name idle">No Device</span>
                                    <Badge variant="secondary">Idle</Badge>
                                </>
                            )}
                        </div>

                        {device.error && (
                            <p className="device-error">{device.error}</p>
                        )}

                        <div className="device-card-footer">
                            {device.connected ? (
                                <Button
                                    variant="danger"
                                    size="sm"
                                    className="w-full"
                                    onClick={() => handleDisconnect(i)}
                                >
                                    <SignalSlashIcon className="h-3.5 w-3.5" />
                                    Disconnect
                                </Button>
                            ) : (
                                <Button
                                    variant="primary"
                                    size="sm"
                                    className="w-full"
                                    onClick={() => handleConnect(i)}
                                    disabled={!ble.isSupported || device.connecting}
                                >
                                    <LinkIcon className="h-3.5 w-3.5" />
                                    {device.connecting ? 'Pairing...' : 'Connect'}
                                </Button>
                            )}
                        </div>
                    </Card>
                ))}
            </div>

            <Card>
                <h4 className="font-bold mb-3">How It Works</h4>
                <ol className="devices-steps">
                    <li>Connect your BLE device using one of the slots above</li>
                    <li>Go to the <strong>Piano</strong> tab and enable <strong>Motors</strong></li>
                    <li>Configure motor actions for each gesture class</li>
                    <li>Train your model in the <strong>Train</strong> tab</li>
                    <li>When a gesture is detected, the assigned motor actions execute automatically</li>
                </ol>
            </Card>
        </div>
    );
}
