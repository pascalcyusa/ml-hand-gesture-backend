import { useState, useCallback, useRef, useMemo, useEffect } from 'react';

export function useSpikeDevice() {
    const [device, setDevice] = useState({
        connected: false,
        connecting: false,
        name: 'Device',
        status: 'idle',
        error: null,
        type: null // 'usb' | 'ble' | null
    });

    const activeType = useRef(null);
    const notificationCallbackRef = useRef(null);

    // --- USB (Serial) Refs ---
    const portRef = useRef(null);
    const writerRef = useRef(null);
    const readerRef = useRef(null);
    const keepReadingRef = useRef(false);

    // --- BLE Refs ---
    const bleDeviceRef = useRef(null);
    const bleWriteCharRef = useRef(null);
    const bleNotifyCharRef = useRef(null);

    const isSerialSupported = typeof navigator !== 'undefined' && !!navigator.serial;
    const isBLESupported = typeof navigator !== 'undefined' && !!navigator.bluetooth;

    // --- SHARED DISCONNECT ---
    const disconnect = useCallback(async () => {
        // 1. Optimistic UI update for immediate feedback
        setDevice({
            connected: false,
            connecting: false,
            name: 'Device',
            status: 'disconnected',
            type: null,
            error: null
        });

        const typeToDisconnect = activeType.current;
        activeType.current = null;

        // 2. Background cleanup
        if (typeToDisconnect === 'usb') {
            keepReadingRef.current = false;
            
            if (readerRef.current) {
                try {
                    await readerRef.current.cancel();
                    readerRef.current.releaseLock();
                } catch { /* ignore */ }
            }
            if (writerRef.current) {
                try {
                    await writerRef.current.close();
                    writerRef.current.releaseLock();
                } catch { /* ignore */ }
            }
            if (portRef.current) {
                try {
                    await portRef.current.close();
                } catch { /* ignore */ }
            }

            portRef.current = null;
            writerRef.current = null;
            readerRef.current = null;
        } else if (typeToDisconnect === 'ble') {
            if (bleDeviceRef.current?.gatt?.connected) {
                try {
                    bleDeviceRef.current.gatt.disconnect();
                } catch { /* ignore */ }
            }
            bleDeviceRef.current = null;
            bleWriteCharRef.current = null;
            bleNotifyCharRef.current = null;
        }
    }, []);

    // --- USB LOGIC ---
    const setupUSBConnection = useCallback(async (port) => {
        try {
            portRef.current = port;
            setDevice(prev => ({ ...prev, status: 'connecting_port', name: 'SPIKE Hub (USB)', connecting: true, type: 'usb' }));
            
            await port.open({ baudRate: 115200 });

            setDevice(prev => ({ ...prev, status: 'initializing_repl' }));

            const writer = port.writable.getWriter();
            writerRef.current = writer;

            const reader = port.readable.getReader();
            readerRef.current = reader;
            keepReadingRef.current = true;
            activeType.current = 'usb';

            // Start reading in background
            (async () => {
                try {
                    while (keepReadingRef.current && port.readable) {
                        const { value, done } = await readerRef.current.read();
                        if (done) break;
                        if (value && notificationCallbackRef.current) {
                            notificationCallbackRef.current(value);
                        }
                    }
                } catch (err) {
                    console.error('Serial read error:', err);
                } finally {
                    try { readerRef.current?.releaseLock(); } catch { /* ignore */ }
                }
            })();

            // Send Ctrl-C (0x03) to interrupt any running program
            try {
                const ctrlC = new Uint8Array([0x03, 0x0D, 0x0A]);
                await writer.write(ctrlC);
            } catch (err) {
                console.warn('Could not send init Ctrl-C', err);
            }

            setDevice({
                id: 'usb-port',
                name: 'LEGO Hub (USB)',
                connected: true,
                connecting: false,
                error: null,
                status: 'connected',
                type: 'usb'
            });

            return { success: true };
        } catch (err) {
            console.error('Serial connect error:', err);
            let errorMessage = err.message;
            if (err.name === 'NotFoundError') errorMessage = 'Port selection cancelled.';
            else if (err.name === 'SecurityError') errorMessage = 'Connection requires HTTPS or user gesture.';
            else if (err.name === 'NetworkError') errorMessage = 'Failed to open port. Is it in use?';
            
            const isCancellation = err.name === 'NotFoundError' || err.message?.includes('No port selected');

            setDevice({
                connecting: false,
                error: isCancellation ? null : errorMessage,
                status: isCancellation ? 'idle' : 'error',
                type: null,
                connected: false
            });
            return { success: false, error: isCancellation ? null : errorMessage, isCancellation };
        }
    }, []);

    const connectUSB = useCallback(async () => {
        if (!isSerialSupported) {
            return { success: false, error: 'Web Serial not supported in this browser' };
        }
        setDevice(prev => ({ ...prev, connecting: true, error: null, status: 'requesting', type: 'usb' }));
        try {
            const port = await navigator.serial.requestPort();
            return await setupUSBConnection(port);
        } catch (err) {
            const isCancellation = err.name === 'NotFoundError' || err.message?.includes('No port selected');
            setDevice(prev => ({
                ...prev,
                connecting: false,
                error: isCancellation ? null : err.message,
                status: isCancellation ? 'idle' : 'error',
                type: null
            }));
            return { success: false, error: isCancellation ? null : err.message, isCancellation };
        }
    }, [isSerialSupported, setupUSBConnection]);

    // --- BLE LOGIC ---
    // Shared internals used by both connectBLE and connectBLEAdvanced
    const _doConnectBLE = useCallback(async (requestOptions) => {
        const knownProfiles = [
            { // Nordic UART — SPIKE Prime / Robot Inventor running MicroPython REPL (SPIKE 3 firmware)
                service: '6e400001-b5a3-f393-e0a9-e50e24dcca9e',
                write: '6e400002-b5a3-f393-e0a9-e50e24dcca9e',
                notify: '6e400003-b5a3-f393-e0a9-e50e24dcca9e'
            },
            { // Pybricks
                service: 'c5f50001-8280-46da-89f4-6d8051e4aeef',
                write: 'c5f50002-8280-46da-89f4-6d8051e4aeef',
                notify: 'c5f50003-8280-46da-89f4-6d8051e4aeef'
            }
        ];

        // LWP3 = LEGO Wireless Protocol 3 used by SPIKE 2 / EV3 / older hubs.
        // We cannot send Python via this, but we can detect it to give a clear error.
        const LWP3_SERVICE = '00001623-1212-efde-1623-785feabcd123';

        let server = null;
        try {
            const btDevice = await navigator.bluetooth.requestDevice({
                ...requestOptions,
                optionalServices: [...knownProfiles.map(p => p.service), LWP3_SERVICE],
            });

            setDevice(prev => ({ ...prev, status: 'connecting_gatt', name: btDevice.name || 'LEGO Hub (BLE)' }));
            server = await btDevice.gatt.connect();
            bleDeviceRef.current = btDevice;

            setDevice(prev => ({ ...prev, status: 'discovering_services' }));
            let service = null;
            let writeChar = null;
            let notifyChar = null;

            for (const profile of knownProfiles) {
                try {
                    service = await server.getPrimaryService(profile.service);
                    writeChar = await service.getCharacteristic(profile.write);
                    notifyChar = await service.getCharacteristic(profile.notify);
                    break;
                } catch {
                    service = null;
                }
            }

            if (!service) {
                // Detect if hub is using the older LWP3 protocol (SPIKE 2 firmware)
                let hasLWP3 = false;
                try {
                    await server.getPrimaryService(LWP3_SERVICE);
                    hasLWP3 = true;
                } catch { /* not LWP3 either */ }

                // Close GATT before throwing so we don't leave a dangling connection
                try { server.disconnect(); } catch { /* ignore */ }

                if (hasLWP3) {
                    throw new Error(
                        'Hub is using SPIKE 2 / LWP3 firmware which does not support a Python REPL over BLE. ' +
                        'Please update your hub to SPIKE 3 firmware via the SPIKE app, then try again. ' +
                        'Alternatively, use USB to connect.'
                    );
                }
                throw new Error(
                    'Hub connected but no MicroPython REPL service found. ' +
                    'Make sure the hub is running SPIKE 3 / Pybricks firmware and is NOT connected to the SPIKE app.'
                );
            }

            bleWriteCharRef.current = writeChar;
            bleNotifyCharRef.current = notifyChar;
            activeType.current = 'ble';

            setDevice(prev => ({ ...prev, status: 'initializing_repl' }));

            await notifyChar.startNotifications();
            notifyChar.addEventListener('characteristicvaluechanged', (event) => {
                const data = new Uint8Array(event.target.value.buffer);
                if (notificationCallbackRef.current) notificationCallbackRef.current(data);
            });

            // Send Ctrl-C to interrupt any running program and enter REPL
            try {
                const ctrlC = new Uint8Array([0x03, 0x0D, 0x0A]);
                if (writeChar.properties.writeWithoutResponse) await writeChar.writeValueWithoutResponse(ctrlC);
                else await writeChar.writeValue(ctrlC);
            } catch (err) {
                console.warn('Could not send init Ctrl-C over BLE', err);
            }

            btDevice.addEventListener('gattserverdisconnected', () => {
                if (activeType.current === 'ble') disconnect();
            });

            setDevice({
                id: btDevice.id,
                name: btDevice.name || 'LEGO Hub (BLE)',
                connected: true,
                connecting: false,
                error: null,
                status: 'connected',
                type: 'ble'
            });

            return { success: true };
        } catch (err) {
            console.error('BLE connect error:', err);
            let errorMessage = err.message;
            if (err.name === 'NotFoundError') errorMessage = 'Pairing cancelled.';
            else if (err.name === 'NetworkError') errorMessage = 'Failed to establish GATT connection. Is the hub already connected to another device or the SPIKE app?';

            const isCancellation = err.name === 'NotFoundError' || err.message?.includes('User cancelled');

            setDevice(prev => ({
                ...prev,
                connecting: false,
                error: isCancellation ? null : errorMessage,
                status: isCancellation ? 'idle' : 'error',
                type: null
            }));
            return { success: false, error: isCancellation ? null : errorMessage, isCancellation };
        }
    }, [disconnect]);

    // Standard connect — filters picker to known LEGO hub name prefixes only.
    // (Service-based filters are intentionally omitted: LEGO hubs do NOT advertise
    //  their service UUIDs in their BLE advertisement packet, so those filters
    //  would cause no devices to appear.)
    const connectBLE = useCallback(async () => {
        if (!isBLESupported) {
            return { success: false, error: 'Web Bluetooth not supported' };
        }
        setDevice(prev => ({ ...prev, connecting: true, error: null, status: 'requesting', type: 'ble' }));
        return _doConnectBLE({
            filters: [
                { namePrefix: 'LEGO Hub' },
                { namePrefix: 'SPIKE' },
                { namePrefix: 'Technic Hub' },
                { namePrefix: 'Robot Inventor' },
                { namePrefix: 'City Hub' },
                { namePrefix: 'MINDSTORMS' },
            ],
        });
    }, [isBLESupported, _doConnectBLE]);

    // Advanced connect — shows ALL nearby devices (for renamed / custom-name hubs).
    const connectBLEAdvanced = useCallback(async () => {
        if (!isBLESupported) {
            return { success: false, error: 'Web Bluetooth not supported' };
        }
        setDevice(prev => ({ ...prev, connecting: true, error: null, status: 'requesting', type: 'ble' }));
        return _doConnectBLE({ acceptAllDevices: true });
    }, [isBLESupported, _doConnectBLE]);

    // --- AUTO-RECONNECT (USB ONLY) ---
    useEffect(() => {
        if (!isSerialSupported) return;
        const autoConnect = async () => {
            try {
                const ports = await navigator.serial.getPorts();
                if (ports.length > 0) {
                    await setupUSBConnection(ports[0]);
                }
            } catch (err) {
                console.warn('Auto-reconnect failed', err);
            }
        };
        autoConnect();

        const handleDisconnect = (e) => {
            if (e.target === portRef.current) disconnect();
        };

        navigator.serial.addEventListener('disconnect', handleDisconnect);
        return () => navigator.serial.removeEventListener('disconnect', handleDisconnect);
    }, [isSerialSupported, setupUSBConnection, disconnect]);

    // --- SHARED WRITE ---
    const write = useCallback(async (data) => {
        const DEBUG = true; // toggle for quick debug output
        if (!activeType.current) {
            if (DEBUG) console.debug('Device write aborted: no activeType');
            return false;
        }

        try {
            const ctrlE = new Uint8Array([0x05]); // Paste Mode Enter
            const ctrlD = new Uint8Array([0x04]); // Paste Mode Execute
            
            const combined = new Uint8Array(data.length + 2);
            combined[0] = ctrlE[0];
            combined.set(new Uint8Array(data), 1);
            combined[combined.length - 1] = ctrlD[0];

            if (DEBUG) {
                const previewLen = Math.min(64, combined.length);
                const preview = Array.from(combined.slice(0, previewLen))
                    .map(b => b.toString(16).padStart(2, '0')).join(' ');
                console.debug(`Device write (type=${activeType.current}) length=${combined.length} preview=${preview}`);
            }

            if (activeType.current === 'usb' && writerRef.current) {
                await writerRef.current.write(combined);
                if (DEBUG) console.debug('USB write succeeded');
                return true;
            } 
            
            if (activeType.current === 'ble' && bleWriteCharRef.current) {
                const CHUNK_SIZE = 20;
                let chunkCount = 0;
                for (let i = 0; i < combined.length; i += CHUNK_SIZE) {
                    const chunk = combined.slice(i, i + CHUNK_SIZE);
                    if (bleWriteCharRef.current.properties.writeWithoutResponse) {
                        await bleWriteCharRef.current.writeValueWithoutResponse(chunk);
                    } else {
                        await bleWriteCharRef.current.writeValue(chunk);
                    }
                    chunkCount++;
                    await new Promise(r => setTimeout(r, 15));
                }
                if (DEBUG) console.debug(`BLE write succeeded, chunks=${chunkCount}`);
                return true;
            }

            if (DEBUG) console.debug('Device write failed: no writer/char for activeType', activeType.current);
            return false;
        } catch (err) {
            console.error('Device write error:', err);
            return false;
        }
    }, []);

    const onNotify = useCallback((callback) => {
        notificationCallbackRef.current = callback;
    }, []);

    return useMemo(() => ({
        device,
        isSerialSupported,
        isBLESupported,
        connectUSB,
        connectBLE,
        connectBLEAdvanced,
        write,
        disconnect,
        onNotify,
    }), [device, isSerialSupported, isBLESupported, connectUSB, connectBLE, connectBLEAdvanced, write, disconnect, onNotify]);
}
