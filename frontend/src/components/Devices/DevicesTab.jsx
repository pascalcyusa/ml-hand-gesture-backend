/**
 * DevicesTab — BLE device connection management
 *
 * Redesigned for single-device LEGO Spike Prime connection.
 * Features an animated illustration of the hub and simplified flow.
 */

import { useCallback } from 'react';
import {
    SignalIcon,
    ExclamationTriangleIcon,
    LinkIcon,
    SignalSlashIcon,
    BoltIcon, // Using BoltIcon for power/connection
} from '@heroicons/react/24/outline';
import { useBLE } from '../../hooks/useBLE.js';
import { Button } from '../ui/button.jsx';
import { Card } from '../ui/card.jsx';
import { Badge } from '../ui/badge.jsx';
import './DevicesTab.css';

// Default SPIKE Prime UUIDs
const DEFAULT_SERVICE_UUID = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
const DEFAULT_WRITE_UUID = '6e400002-b5a3-f393-e0a9-e50e24dcca9e';
const DEFAULT_NOTIFY_UUID = '6e400003-b5a3-f393-e0a9-e50e24dcca9e';

export default function DevicesTab({ showToast }) {
    const ble = useBLE();

    const handleConnect = useCallback(async () => {
        const success = await ble.connect(
            DEFAULT_SERVICE_UUID,
            DEFAULT_WRITE_UUID,
            DEFAULT_NOTIFY_UUID
        );
        if (success) {
            showToast('LEGO Spike Prime connected!', 'success');
        }
    }, [ble, showToast]);

    const handleDisconnect = useCallback(() => {
        ble.disconnect();
        showToast('Device disconnected', 'info');
    }, [ble, showToast]);

    // Render the 5x5 pixel grid for the hub illustration
    const renderHubPixels = () => {
        // Create a smiley pattern for connected state
        const smileyIndices = [6, 8, 16, 17, 18, 11, 13];
        return Array.from({ length: 25 }).map((_, i) => (
            <div
                key={i}
                className={`hub-pixel ${ble.device?.connected && smileyIndices.includes(i) ? 'lit' : ''}`}
            />
        ));
    };

    return (
        <div className="devices-tab animate-fade-in">
            <div className="devices-header">
                <div className="devices-header-text">
                    <h2 className="flex items-center gap-2">
                        <SignalIcon className="h-6 w-6 text-[var(--blue)]" />
                        Connect LEGO Spike Prime
                    </h2>
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

            {/* Main Connection Card */}
            <Card className={`device-connection-area ${ble.device?.connected ? 'connected' : ''} ${ble.device?.connecting ? 'connecting' : ''}`}>

                {/* Animated Hub Illustration */}
                <div className="spike-hub-illustration">
                    <div className="connection-rings">
                        <div className="ring" />
                        <div className="ring" />
                        <div className="ring" />
                    </div>
                    <div className="hub-body">
                        <div className="hub-matrix">
                            {renderHubPixels()}
                        </div>
                    </div>
                </div>

                {/* Status & Action */}
                <div className="connection-status">
                    {ble.device?.connected ? (
                        <>
                            <span className="status-text text-[var(--green)]">Connected</span>
                            <span className="device-name">{ble.device.name}</span>
                        </>
                    ) : ble.device?.connecting ? (
                        <>
                            <span className="status-text text-[var(--orange)]">Searching...</span>
                            <span className="text-sm text-[var(--fg-muted)]">Select your Hub in the popup</span>
                        </>
                    ) : (
                        <>
                            <span className="text-sm text-[var(--fg-muted)]">Make sure your Hub is turned on</span>
                        </>
                    )}
                </div>

                {ble.device?.connected ? (
                    <Button
                        variant="danger"
                        size="lg"
                        className="connect-btn-lg"
                        onClick={handleDisconnect}
                    >
                        <SignalSlashIcon className="h-5 w-5" />
                        Disconnect
                    </Button>
                ) : (
                    <Button
                        variant="primary"
                        size="lg"
                        className="connect-btn-lg"
                        onClick={handleConnect}
                        disabled={!ble.isSupported || ble.device?.connecting}
                    >
                        {ble.device?.connecting ? (
                            <BoltIcon className="h-5 w-5 animate-pulse" />
                        ) : (
                            <LinkIcon className="h-5 w-5" />
                        )}
                        {ble.device?.connecting ? 'Pairing...' : 'Connect to Hub'}
                    </Button>
                )}

                {ble.device?.error && (
                    <p className="text-[var(--red)] text-sm mt-4 bg-[var(--red-dim)]/10 px-3 py-1 rounded-full border border-[var(--red)]/20">
                        {ble.device.error}
                    </p>
                )}
            </Card>
        </div>
    );
}
