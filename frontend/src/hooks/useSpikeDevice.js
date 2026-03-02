import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { LWP3_SERVICE, LWP3_CHARACTERISTIC } from '../utils/spikeProtocol.js';

export function useSpikeDevice() {
    const [device, setDevice] = useState({
        connected: false,
        connecting: false,
        name: 'Device',
        status: 'idle',
        error: null,
        type: null,     // 'usb' | 'ble' | null
        protocol: null, // 'repl' | 'lwp3' | null
    });

    const activeType = useRef(null);
    const bleProtocolRef = useRef(null); // 'repl' | 'lwp3'
    const notificationCallbackRef = useRef(null);

    // --- USB (Serial) Refs ---
    const portRef = useRef(null);
    const writerRef = useRef(null);
    const readerRef = useRef(null);
    const keepReadingRef = useRef(false);

    // --- BLE REPL Refs (NUS / Pybricks) ---
    const bleDeviceRef = useRef(null);
    const bleWriteCharRef = useRef(null);
    const bleNotifyCharRef = useRef(null);

    // --- BLE LWP3 Ref (standard LEGO firmware) ---
    const lwp3CharRef = useRef(null);

    const isSerialSupported = typeof navigator !== 'undefined' && !!navigator.serial;
    const isBLESupported = typeof navigator !== 'undefined' && !!navigator.bluetooth;

    // --- SHARED DISCONNECT ---
    const disconnect = useCallback(async () => {
        setDevice({
            connected: false,
            connecting: false,
            name: 'Device',
            status: 'disconnected',
            type: null,
            protocol: null,
            error: null
        });

        const typeToDisconnect = activeType.current;
        activeType.current = null;
        bleProtocolRef.current = null;

        if (typeToDisconnect === 'usb') {
            keepReadingRef.current = false;
            if (readerRef.current) {
                try { await readerRef.current.cancel(); readerRef.current.releaseLock(); } catch { /* ignore */ }
            }
            if (writerRef.current) {
                try { await writerRef.current.close(); writerRef.current.releaseLock(); } catch { /* ignore */ }
            }
            if (portRef.current) {
                try { await portRef.current.close(); } catch { /* ignore */ }
            }
            portRef.current = null;
            writerRef.current = null;
            readerRef.current = null;
        } else if (typeToDisconnect === 'ble') {
            if (bleDeviceRef.current?.gatt?.connected) {
                try { bleDeviceRef.current.gatt.disconnect(); } catch { /* ignore */ }
            }
            bleDeviceRef.current = null;
            bleWriteCharRef.current = null;
            bleNotifyCharRef.current = null;
            lwp3CharRef.current = null;
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
                type: 'usb',
                protocol: 'repl',
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
    const _doConnectBLE = useCallback(async (requestOptions) => {
        const replProfiles = [
            { // Nordic UART — SPIKE Prime / Robot Inventor with MicroPython REPL (SPIKE 3 / Pybricks)
                service: '6e400001-b5a3-f393-e0a9-e50e24dcca9e',
                write:   '6e400002-b5a3-f393-e0a9-e50e24dcca9e',
                notify:  '6e400003-b5a3-f393-e0a9-e50e24dcca9e'
            },
            { // Pybricks
                service: 'c5f50001-8280-46da-89f4-6d8051e4aeef',
                write:   'c5f50002-8280-46da-89f4-6d8051e4aeef',
                notify:  'c5f50003-8280-46da-89f4-6d8051e4aeef'
            }
        ];

        let server = null;
        try {
            const btDevice = await navigator.bluetooth.requestDevice({
                ...requestOptions,
                optionalServices: [...replProfiles.map(p => p.service), LWP3_SERVICE],
            });

            setDevice(prev => ({ ...prev, status: 'connecting_gatt', name: btDevice.name || 'LEGO Hub (BLE)' }));
            server = await btDevice.gatt.connect();
            bleDeviceRef.current = btDevice;

            setDevice(prev => ({ ...prev, status: 'discovering_services' }));

            // --- Try REPL profiles first (NUS / Pybricks) ---
            let replService = null, writeChar = null, notifyChar = null;
            for (const profile of replProfiles) {
                try {
                    replService = await server.getPrimaryService(profile.service);
                    writeChar   = await replService.getCharacteristic(profile.write);
                    notifyChar  = await replService.getCharacteristic(profile.notify);
                    break;
                } catch { replService = null; }
            }

            if (replService) {
                // ── REPL (NUS / Pybricks) connection ──
                bleWriteCharRef.current = writeChar;
                bleNotifyCharRef.current = notifyChar;
                activeType.current = 'ble';
                bleProtocolRef.current = 'repl';

                setDevice(prev => ({ ...prev, status: 'initializing_repl' }));
                await notifyChar.startNotifications();
                notifyChar.addEventListener('characteristicvaluechanged', (event) => {
                    const data = new Uint8Array(event.target.value.buffer);
                    if (notificationCallbackRef.current) notificationCallbackRef.current(data);
                });

                try {
                    const ctrlC = new Uint8Array([0x03, 0x0D, 0x0A]);
                    if (writeChar.properties.writeWithoutResponse) await writeChar.writeValueWithoutResponse(ctrlC);
                    else await writeChar.writeValue(ctrlC);
                } catch (err) { console.warn('Could not send init Ctrl-C over BLE', err); }

            } else {
                // --- Try LWP3 (standard LEGO hub firmware) ---
                let lwp3Service = null, lwp3Char = null;
                try {
                    lwp3Service = await server.getPrimaryService(LWP3_SERVICE);
                    lwp3Char    = await lwp3Service.getCharacteristic(LWP3_CHARACTERISTIC);
                } catch { lwp3Service = null; }

                if (!lwp3Service) {
                    try { server.disconnect(); } catch { /* ignore */ }
                    throw new Error(
                        'No compatible hub service found. ' +
                        'Make sure the hub is turned on and NOT connected to the SPIKE app.'
                    );
                }

                // ── LWP3 connection ──
                lwp3CharRef.current = lwp3Char;
                activeType.current = 'ble';
                bleProtocolRef.current = 'lwp3';

                setDevice(prev => ({ ...prev, status: 'initializing_repl' }));
                try {
                    await lwp3Char.startNotifications();
                    lwp3Char.addEventListener('characteristicvaluechanged', (event) => {
                        const data = new Uint8Array(event.target.value.buffer);
                        if (notificationCallbackRef.current) notificationCallbackRef.current(data);
                    });
                } catch (err) { console.warn('Could not start LWP3 notifications', err); }
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
                type: 'ble',
                protocol: bleProtocolRef.current,
            });

            console.debug(`BLE connected via ${bleProtocolRef.current} protocol`);
            return { success: true };

        } catch (err) {
            console.error('BLE connect error:', err);
            let errorMessage = err.message;
            if (err.name === 'NotFoundError') errorMessage = 'Pairing cancelled.';
            else if (err.name === 'NetworkError') errorMessage = 'Failed to connect. Is the hub already connected to another device or the SPIKE app?';

            const isCancellation = err.name === 'NotFoundError' || err.message?.includes('User cancelled');

            setDevice(prev => ({
                ...prev,
                connecting: false,
                error: isCancellation ? null : errorMessage,
                status: isCancellation ? 'idle' : 'error',
                type: null,
                protocol: null,
            }));
            return { success: false, error: isCancellation ? null : errorMessage, isCancellation };
        }
    }, [disconnect]);

    // Standard connect — shows all devices (acceptAllDevices) so any hub name works,
    // exactly matching the original working behaviour from commit 061083a.
    const connectBLE = useCallback(async () => {
        if (!isBLESupported) {
            return { success: false, error: 'Web Bluetooth not supported' };
        }
        setDevice(prev => ({ ...prev, connecting: true, error: null, status: 'requesting', type: 'ble' }));
        return _doConnectBLE({ acceptAllDevices: true });
    }, [isBLESupported, _doConnectBLE]);

    // Alias kept for any callers that reference connectBLEAdvanced directly
    const connectBLEAdvanced = connectBLE;

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
        const DEBUG = true;
        if (!activeType.current) {
            if (DEBUG) console.debug('Device write aborted: no activeType');
            return false;
        }

        // ── LWP3 BLE: raw bytes, no paste-mode wrapper ──
        if (activeType.current === 'ble' && bleProtocolRef.current === 'lwp3') {
            if (!lwp3CharRef.current) return false;
            try {
                const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
                if (DEBUG) {
                    const preview = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join(' ');
                    console.debug(`LWP3 write length=${bytes.length}: ${preview}`);
                }
                if (lwp3CharRef.current.properties.writeWithoutResponse) {
                    await lwp3CharRef.current.writeValueWithoutResponse(bytes);
                } else {
                    await lwp3CharRef.current.writeValue(bytes);
                }
                return true;
            } catch (err) {
                console.error('LWP3 write error:', err);
                return false;
            }
        }

        // ── USB / BLE REPL: wrap in MicroPython paste-mode ──
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
                console.debug(`REPL write (type=${activeType.current}) length=${combined.length} preview=${preview}`);
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
                if (DEBUG) console.debug(`BLE REPL write succeeded, chunks=${chunkCount}`);
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
