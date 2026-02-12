/**
 * useBLE — React hook for Web Bluetooth device management
 * 
 * Ported from: js/ble.js
 * 
 * Manages multiple BLE device connections with connect/write/notify/disconnect.
 * Each device slot stores connection state, device info, and a write function.
 */

import { useState, useCallback, useRef } from 'react';

const MAX_DEVICES = 4;

function createEmptySlot(index) {
    return {
        id: index,
        name: null,
        connected: false,
        connecting: false,
        error: null,
    };
}

export function useBLE() {
    const [devices, setDevices] = useState(() =>
        Array.from({ length: MAX_DEVICES }, (_, i) => createEmptySlot(i))
    );
    const deviceRefs = useRef(Array.from({ length: MAX_DEVICES }, () => ({
        device: null,
        server: null,
        service: null,
        writeChar: null,
        notifyChar: null,
    })));
    const callbacksRef = useRef({});

    // Check if Web Bluetooth is available
    const isSupported = typeof navigator !== 'undefined' && !!navigator.bluetooth;

    // Update a single device slot
    const updateSlot = useCallback((index, updates) => {
        setDevices((prev) =>
            prev.map((d, i) => (i === index ? { ...d, ...updates } : d))
        );
    }, []);

    // Connect a device
    const connect = useCallback(async (slotIndex, serviceUUID, writeUUID, notifyUUID) => {
        if (!isSupported) {
            updateSlot(slotIndex, { error: 'Web Bluetooth not supported in this browser' });
            return false;
        }

        updateSlot(slotIndex, { connecting: true, error: null });

        try {
            const device = await navigator.bluetooth.requestDevice({
                filters: [{ services: [serviceUUID] }],
            });

            const server = await device.gatt.connect();
            const service = await server.getPrimaryService(serviceUUID);
            const writeChar = await service.getCharacteristic(writeUUID);
            const notifyChar = await service.getCharacteristic(notifyUUID);

            // Start notifications
            await notifyChar.startNotifications();
            notifyChar.addEventListener('characteristicvaluechanged', (event) => {
                const data = new Uint8Array(event.target.value.buffer);
                const cb = callbacksRef.current[slotIndex];
                if (cb) cb(data);
            });

            // Handle disconnection
            device.addEventListener('gattserverdisconnected', () => {
                updateSlot(slotIndex, {
                    connected: false,
                    connecting: false,
                    name: device.name || `Device ${slotIndex + 1}`,
                });
                deviceRefs.current[slotIndex] = {
                    device: null, server: null, service: null, writeChar: null, notifyChar: null,
                };
            });

            // Store refs
            deviceRefs.current[slotIndex] = { device, server, service, writeChar, notifyChar };

            updateSlot(slotIndex, {
                connected: true,
                connecting: false,
                name: device.name || `Device ${slotIndex + 1}`,
                error: null,
            });

            return true;
        } catch (err) {
            console.error(`BLE connect error (slot ${slotIndex}):`, err);
            updateSlot(slotIndex, {
                connecting: false,
                error: err.message === 'User cancelled the requestDevice() chooser.'
                    ? null  // User just closed the picker — not an error
                    : err.message,
            });
            return false;
        }
    }, [isSupported, updateSlot]);

    // Write data to a device
    const write = useCallback(async (slotIndex, data) => {
        const ref = deviceRefs.current[slotIndex];
        if (!ref?.writeChar) {
            console.error(`BLE slot ${slotIndex}: not connected`);
            return false;
        }
        try {
            const bytes = new Uint8Array(data);
            await ref.writeChar.writeValue(bytes);
            return true;
        } catch (err) {
            console.error(`BLE write error (slot ${slotIndex}):`, err);
            return false;
        }
    }, []);

    // Disconnect a device
    const disconnect = useCallback((slotIndex) => {
        const ref = deviceRefs.current[slotIndex];
        if (ref?.device?.gatt?.connected) {
            ref.device.gatt.disconnect();
        }
        deviceRefs.current[slotIndex] = {
            device: null, server: null, service: null, writeChar: null, notifyChar: null,
        };
        updateSlot(slotIndex, createEmptySlot(slotIndex));
    }, [updateSlot]);

    // Register a notification callback for a device slot
    const onNotify = useCallback((slotIndex, callback) => {
        callbacksRef.current[slotIndex] = callback;
    }, []);

    // Disconnect all
    const disconnectAll = useCallback(() => {
        for (let i = 0; i < MAX_DEVICES; i++) {
            disconnect(i);
        }
    }, [disconnect]);

    const connectedCount = devices.filter((d) => d.connected).length;

    return {
        devices,
        isSupported,
        connectedCount,
        connect,
        write,
        disconnect,
        disconnectAll,
        onNotify,
    };
}
