/**
 * useBLE — React hook for Web Bluetooth device management
 * 
 * Modified for single-device connection (LEGO Spike Prime).
 * Simplifies API to connect/disconnect a single hub.
 */

import { useState, useCallback, useRef } from 'react';

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
    const connect = useCallback(async (serviceUUID, writeUUID, notifyUUID) => {
        if (!isSupported) {
            setDevice({ error: 'Web Bluetooth not supported in this browser' });
            return false;
        }

        setDevice({ connecting: true, error: null });

        try {
            const bleDevice = await navigator.bluetooth.requestDevice({
                filters: [{ services: [serviceUUID] }],
            });

            const server = await bleDevice.gatt.connect();
            const service = await server.getPrimaryService(serviceUUID);
            const writeChar = await service.getCharacteristic(writeUUID);
            const notifyChar = await service.getCharacteristic(notifyUUID);

            // Start notifications
            await notifyChar.startNotifications();
            notifyChar.addEventListener('characteristicvaluechanged', (event) => {
                const data = new Uint8Array(event.target.value.buffer);
                if (notificationCallbackRef.current) {
                    notificationCallbackRef.current(data);
                }
            });

            // Handle disconnection
            bleDevice.addEventListener('gattserverdisconnected', () => {
                setDevice({
                    connected: false,
                    connecting: false,
                    name: bleDevice.name || 'Device',
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
            });

            return true;
        } catch (err) {
            console.error('BLE connect error:', err);
            setDevice({
                connecting: false,
                error: err.message === 'User cancelled the requestDevice() chooser.'
                    ? null  // User just closed the picker — not an error
                    : err.message,
            });
            return false;
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
            await ref.writeChar.writeValue(bytes);
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

    return {
        device,
        isSupported,
        connect,
        write,
        disconnect,
        onNotify,
    };
}
