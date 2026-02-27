/**
 * useBLE — React hook for Web Bluetooth device management
 * 
 * Modified for single-device connection (LEGO Spike Prime).
 * Simplifies API to connect/disconnect a single hub.
 */

import { useState, useCallback, useRef, useMemo } from 'react';

export function useBLE() {
    const [device, setDevice] = useState(null); // { id, name, connected, connecting, error }
    const deviceRef = useRef({
        device: null,
        server: null,
        service: null,
        writeChar: null,
        notifyChar: null,
    });
    const notificationCallbackRef = useRef(null);

    // Check if Web Bluetooth is available
    const isSupported = typeof navigator !== 'undefined' && !!navigator.bluetooth;

    // Connect to a device
    const connect = useCallback(async (defaultServiceUUID, defaultWriteUUID, defaultNotifyUUID) => {
        if (!isSupported) {
            setDevice({ error: 'Web Bluetooth not supported in this browser', status: 'unsupported' });
            return { success: false, error: 'Web Bluetooth not supported in this browser' };
        }

        setDevice({ connecting: true, error: null, status: 'requesting' });

        // A list of known SPIKE Prime / Pybricks BLE profiles
        const knownProfiles = [
            { // Provided default (typically Nordic UART)
                service: defaultServiceUUID,
                write: defaultWriteUUID,
                notify: defaultNotifyUUID
            },
            { // Pybricks Custom UART Profile
                service: 'c5f50001-8280-46da-89f4-6d8051e4aeef',
                write: 'c5f50002-8280-46da-89f4-6d8051e4aeef',
                notify: 'c5f50003-8280-46da-89f4-6d8051e4aeef'
            },
            { // Standard LEGO LWP3
                service: '00001623-1212-efde-1623-785feabcd123',
                write: '00001624-1212-efde-1623-785feabcd123',
                notify: '00001624-1212-efde-1623-785feabcd123'
            }
        ];

        try {
            const bleDevice = await navigator.bluetooth.requestDevice({
                acceptAllDevices: true,
                optionalServices: knownProfiles.map(p => p.service),
            });

            setDevice(prev => ({ ...prev, status: 'connecting_gatt', name: bleDevice.name || 'LEGO Hub' }));
            const server = await bleDevice.gatt.connect();
            
            setDevice(prev => ({ ...prev, status: 'discovering_services' }));
            let service = null;
            let writeChar = null;
            let notifyChar = null;

            // Find the correct active profile
            for (const profile of knownProfiles) {
                try {
                    service = await server.getPrimaryService(profile.service);
                    writeChar = await service.getCharacteristic(profile.write);
                    notifyChar = await service.getCharacteristic(profile.notify);
                    break; // Successfully got the characteristics
                } catch {
                    service = null; // Try the next one
                }
            }

            if (!service) {
                throw new Error("No compatible LEGO services found on this device. Please check the hub firmware.");
            }

            setDevice(prev => ({ ...prev, status: 'initializing_repl' }));
            // Start notifications
            await notifyChar.startNotifications();
            notifyChar.addEventListener('characteristicvaluechanged', (event) => {
                const data = new Uint8Array(event.target.value.buffer);
                if (notificationCallbackRef.current) {
                    notificationCallbackRef.current(data);
                }
            });

            // Send Ctrl-C to interrupt any running program and enter REPL
            try {
                const ctrlC = new Uint8Array([0x03, 0x0D, 0x0A]); // Ctrl-C + CRLF
                if (writeChar.properties && writeChar.properties.writeWithoutResponse) {
                    await writeChar.writeValueWithoutResponse(ctrlC);
                } else {
                    await writeChar.writeValue(ctrlC);
                }
            } catch (err) {
                console.warn('Could not send init Ctrl-C', err);
            }

            // Handle disconnection
            bleDevice.addEventListener('gattserverdisconnected', () => {
                setDevice({
                    connected: false,
                    connecting: false,
                    name: bleDevice.name || 'Device',
                    status: 'disconnected'
                });
                deviceRef.current = {
                    device: null, server: null, service: null, writeChar: null, notifyChar: null,
                };
            });

            // Store refs
            deviceRef.current = { device: bleDevice, server, service, writeChar, notifyChar };

            setDevice({
                id: bleDevice.id,
                name: bleDevice.name || 'LEGO Spike Prime',
                connected: true,
                connecting: false,
                error: null,
                status: 'connected'
            });

            return { success: true };
        } catch (err) {
            console.error('BLE connect error:', err);
            
            let errorMessage = err.message;
            if (err.name === 'NotFoundError') errorMessage = 'Device pairing cancelled or device not found.';
            else if (err.name === 'SecurityError') errorMessage = 'Bluetooth pairing requires a secure context (HTTPS) or user gesture.';
            else if (err.name === 'NetworkError') errorMessage = 'Failed to establish a GATT connection to the device.';
            
            const isCancellation = err.message === 'User cancelled the requestDevice() chooser.' || err.name === 'NotFoundError';

            setDevice({
                connecting: false,
                error: isCancellation ? null : errorMessage,
                status: isCancellation ? 'idle' : 'error'
            });
            return { success: false, error: isCancellation ? null : errorMessage, isCancellation };
        }
    }, [isSupported]);

    // Write data to the connected device
    const write = useCallback(async (data) => {
        const ref = deviceRef.current;
        if (!ref?.writeChar) {
            console.error('BLE: not connected');
            return false;
        }
        try {
            const bytes = new Uint8Array(data);
            const CHUNK_SIZE = 20;
            
            for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
                const chunk = bytes.slice(i, i + CHUNK_SIZE);
                if (ref.writeChar.properties && ref.writeChar.properties.writeWithoutResponse) {
                    await ref.writeChar.writeValueWithoutResponse(chunk);
                } else {
                    await ref.writeChar.writeValue(chunk);
                }
                // small delay between chunks to help the Hub process them
                await new Promise(r => setTimeout(r, 15)); 
            }
            return true;
        } catch (err) {
            console.error('BLE write error:', err);
            return false;
        }
    }, []);

    // Disconnect
    const disconnect = useCallback(() => {
        const ref = deviceRef.current;
        if (ref?.device?.gatt?.connected) {
            ref.device.gatt.disconnect();
        }
        deviceRef.current = {
            device: null, server: null, service: null, writeChar: null, notifyChar: null,
        };
        setDevice(null);
    }, []);

    // Register a notification callback
    const onNotify = useCallback((callback) => {
        notificationCallbackRef.current = callback;
    }, []);

    return useMemo(() => ({
        device,
        isSupported,
        connect,
        write,
        disconnect,
        onNotify,
    }), [device, isSupported, connect, write, disconnect, onNotify]);
}
