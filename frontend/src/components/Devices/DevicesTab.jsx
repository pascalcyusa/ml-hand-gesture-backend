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
    BoltIcon,
    ComputerDesktopIcon // using standard outline icons available
} from '@heroicons/react/24/outline';
import { Button } from '../ui/button.jsx';
import { Card } from '../ui/card.jsx';
import { Badge } from '../ui/badge.jsx';
import './DevicesTab.css';

export default function DevicesTab({ showToast, ble }) {
    // 'ble' prop is actually the useSpikeDevice hook from App.jsx

    const handleConnectUSB = useCallback(async () => {
        const result = await ble.connectUSB();
        if (result.success) {
            showToast('LEGO Spike Prime connected via USB!', 'success');
        } else if (!result.isCancellation && result.error) {
            showToast(`USB Connection failed: ${result.error}`, 'error');
        }
    }, [ble, showToast]);

    const handleConnectBLE = useCallback(async () => {
        const result = await ble.connectBLE();
        if (result.success) {
            showToast('LEGO Spike Prime connected via Bluetooth!', 'success');
        } else if (!result.isCancellation && result.error) {
            showToast(`Bluetooth Connection failed: ${result.error}`, 'error');
        }
    }, [ble, showToast]);

    const handleDisconnect = useCallback(() => {
        ble.disconnect();
        showToast('Device disconnected', 'info');
    }, [ble, showToast]);

    // Map the internal serial status to user-friendly messages
    const getStatusMessage = () => {
        if (!ble.device?.connecting) return 'Select your Hub in the popup';
        switch (ble.device?.status) {
            case 'requesting': return 'Waiting for device selection...';
            case 'connecting_port': return 'Opening Serial Port...';
            case 'connecting_gatt': return 'Connecting to GATT Server...';
            case 'discovering_services': return 'Discovering LEGO services...';
            case 'initializing_repl': return 'Initializing Python REPL...';
            default: return 'Connecting...';
        }
    };

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
                        <SignalIcon className="h-6 w-6 text-[var(--gold)]" />
                        Connect LEGO Spike Prime
                    </h2>
                </div>
            </div>

            {!ble.isSerialSupported && !ble.isBLESupported && (
                <Card className="flex items-start gap-4 border-[var(--gold-dim)]">
                    <ExclamationTriangleIcon className="h-6 w-6 text-[var(--gold)] shrink-0 mt-0.5" />
                    <div>
                        <strong>Web Serial & Web Bluetooth Not Available</strong>
                        <p className="text-sm text-[var(--fg-dim)] mt-1">
                            Your browser doesn't support Web Serial or Web Bluetooth. Try Chrome or Edge on desktop.
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
                            <span className="status-text text-[var(--gold)]">Connected</span>
                            <span className="device-name">{ble.device.name}</span>
                        </>
                    ) : ble.device?.connecting ? (
                        <>
                            <span className="status-text text-[var(--gold-dim)]">Connecting...</span>
                            <span className="text-sm text-[var(--fg-muted)]">{getStatusMessage()}</span>
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
                    <div className="flex flex-col sm:flex-row items-center gap-3 mt-2">
                        <Button
                            variant="primary"
                            size="lg"
                            className="connect-btn-lg flex-1"
                            onClick={handleConnectUSB}
                            disabled={!ble.isSerialSupported || ble.device?.connecting}
                        >
                            <ComputerDesktopIcon className="h-5 w-5" />
                            Connect via USB
                        </Button>
                        <Button
                            variant="primary"
                            size="lg"
                            className="connect-btn-lg flex-1"
                            onClick={handleConnectBLE}
                            disabled={!ble.isBLESupported || ble.device?.connecting}
                        >
                            <SignalIcon className="h-5 w-5" />
                            Connect via BLE
                        </Button>
                    </div>
                )}

                {ble.device?.error && (
                    <p className="text-[var(--gold)] text-sm mt-4 bg-[var(--gold-dim)]/10 px-3 py-1 rounded-full border border-[var(--gold)]/20">
                        {ble.device.error}
                    </p>
                )}
            </Card>
        </div>
    );
}
