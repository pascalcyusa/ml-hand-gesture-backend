import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { LWP3_SERVICE, LWP3_CHARACTERISTIC } from '../utils/spikeProtocol.js';
import { createSpike3Session } from '../utils/spike3Protocol.js';

// BLE service/characteristic UUIDs
const NUS_SERVICE   = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
const NUS_WRITE     = '6e400002-b5a3-f393-e0a9-e50e24dcca9e';
const NUS_NOTIFY    = '6e400003-b5a3-f393-e0a9-e50e24dcca9e';
const PBX_SERVICE   = 'c5f50001-8280-46da-89f4-6d8051e4aeef';
const PBX_WRITE     = 'c5f50002-8280-46da-89f4-6d8051e4aeef';
const PBX_NOTIFY    = 'c5f50003-8280-46da-89f4-6d8051e4aeef';
const SPIKE3_SERVICE = '0000fd02-0000-1000-8000-00805f9b34fb';

export function useSpikeDevice() {
    const [device, setDevice] = useState({
        connected: false,
        connecting: false,
        name: 'Device',
        status: 'idle',
        error: null,
        type: null,     // 'usb' | 'ble' | null
        protocol: null, // 'repl' | 'lwp3' | 'spike3' | null
    });

    const activeType = useRef(null);
    const bleProtocolRef = useRef(null); // 'repl' | 'lwp3' | 'spike3'
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

    // --- SPIKE 3 protocol session ---
    const spike3SessionRef = useRef(null);

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
            // Clear saved device ID so we don't auto-reconnect to a deliberately disconnected hub
            try { window.sessionStorage.removeItem('ble_device_id'); } catch { /* ignore */ }
            if (bleDeviceRef.current?.gatt?.connected) {
                try { bleDeviceRef.current.gatt.disconnect(); } catch { /* ignore */ }
            }
            bleDeviceRef.current = null;
            bleWriteCharRef.current = null;
            bleNotifyCharRef.current = null;
            lwp3CharRef.current = null;
            spike3SessionRef.current = null;
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
    // LEGO SPIKE 3 firmware uses the 0xFD02 service (LEGO's Bluetooth SIG
    // assigned UUID). Older firmware used NUS (Pybricks) or LWP3.
    // We try all known profiles to support any firmware version.

    // Shared BLE setup — used by both connectBLE (user-initiated) and auto-reconnect
    const setupBLEConnection = useCallback(async (btDevice) => {
            const hubName = btDevice.name;
            console.log(`BLE: selected "${hubName}" (${btDevice.id})`);
            setDevice(prev => ({ ...prev, status: 'connecting_gatt', name: hubName || 'LEGO Hub (BLE)' }));

            const server = await btDevice.gatt.connect();
            bleDeviceRef.current = btDevice;
            console.log('BLE: GATT connected');

            setDevice(prev => ({ ...prev, status: 'discovering_services' }));

            // Enumerate ALL services for debugging
            try {
                const allSvcs = await server.getPrimaryServices();
                console.log('BLE: all services:', allSvcs.map(s => s.uuid));
                for (const svc of allSvcs) {
                    try {
                        const chars = await svc.getCharacteristics();
                        for (const c of chars) {
                            const p = c.properties;
                            const flags = [];
                            if (p.read) flags.push('R');
                            if (p.write) flags.push('W');
                            if (p.writeWithoutResponse) flags.push('Wn');
                            if (p.notify) flags.push('N');
                            if (p.indicate) flags.push('I');
                            console.log(`  ${svc.uuid} → ${c.uuid} [${flags.join(',')}]`);
                        }
                    } catch { /* ignore */ }
                }
            } catch (e) {
                console.warn('BLE: could not enumerate all services:', e.message);
            }

            // --- Try SPIKE 3 (0xFD02) first ---
            let matched = null;
            try {
                const svc = await server.getPrimaryService(SPIKE3_SERVICE);
                console.log('BLE: ✓ found SPIKE 3 service (0xFD02)');

                // Discover all characteristics on this service
                const chars = await svc.getCharacteristics();
                const describeProps = (c) => {
                    const p = c.properties;
                    const flags = [];
                    if (p.read) flags.push('read');
                    if (p.write) flags.push('write');
                    if (p.writeWithoutResponse) flags.push('writeWithoutResponse');
                    if (p.notify) flags.push('notify');
                    if (p.indicate) flags.push('indicate');
                    return flags.join(',') || 'none';
                };
                console.log('BLE: characteristics:', chars.map(c =>
                    `${c.uuid} [${describeProps(c)}]`
                ));

                // Find write and notify characteristics
                let wc = null, nc = null;
                for (const c of chars) {
                    const props = c.properties;
                    if (!nc && (props.notify || props.indicate)) nc = c;
                    if (!wc && (props.write || props.writeWithoutResponse)) wc = c;
                }

                // The 0xFD02 service is a UART-like interface (write+notify),
                // similar to NUS. Use REPL protocol (MicroPython commands).
                if (wc && nc) {
                    console.log(`BLE: write char = ${wc.uuid}, notify char = ${nc.uuid}`);
                    matched = { proto: 'repl', name: 'SPIKE3', wc, nc };
                } else if (wc) {
                    console.log(`BLE: write char = ${wc.uuid} (no separate notify)`);
                    matched = { proto: 'repl', name: 'SPIKE3', wc, nc: wc };
                } else {
                    console.warn('BLE: SPIKE3 service found but no usable characteristics');
                }
            } catch (e) {
                console.log(`BLE: ✗ SPIKE3 — ${e.message}`);
            }

            // --- Fallback: try NUS / Pybricks / LWP3 ---
            if (!matched) {
                const fallbackProfiles = [
                    { service: NUS_SERVICE, write: NUS_WRITE, notify: NUS_NOTIFY, proto: 'repl', name: 'NUS' },
                    { service: PBX_SERVICE, write: PBX_WRITE, notify: PBX_NOTIFY, proto: 'repl', name: 'Pybricks' },
                    { service: LWP3_SERVICE, write: LWP3_CHARACTERISTIC, notify: LWP3_CHARACTERISTIC, proto: 'lwp3', name: 'LWP3' },
                ];
                for (const p of fallbackProfiles) {
                    try {
                        const svc = await server.getPrimaryService(p.service);
                        const wc  = await svc.getCharacteristic(p.write);
                        const nc  = (p.write === p.notify) ? wc : await svc.getCharacteristic(p.notify);
                        console.log(`BLE: ✓ matched ${p.name}`);
                        matched = { ...p, wc, nc };
                        break;
                    } catch {
                        console.log(`BLE: ✗ ${p.name} not found`);
                    }
                }
            }

            if (!matched) {
                try { server.disconnect(); } catch { /* ignore */ }
                throw new Error('Hub connected but no usable characteristics found.');
            }

            // Wire up notifications — add listener BEFORE startNotifications()
            const notifyHandler = (event) => {
                const data = new Uint8Array(event.target.value.buffer);
                // Route to SPIKE3 session if active
                if (spike3SessionRef.current) {
                    spike3SessionRef.current.onNotification(data);
                }
                if (notificationCallbackRef.current) notificationCallbackRef.current(data);
            };
            matched.nc.addEventListener('characteristicvaluechanged', notifyHandler);
            console.log('BLE: listener attached, calling startNotifications()…');
            await matched.nc.startNotifications();
            console.log('BLE: startNotifications() resolved OK');

            let detectedProto = matched.proto;

            if (matched.name === 'SPIKE3') {
                // SPIKE 3 uses COBS-encoded protocol, not raw LWP3 or REPL
                detectedProto = 'spike3';
                const session = createSpike3Session(matched.wc);
                spike3SessionRef.current = session;

                setDevice(prev => ({ ...prev, status: 'initializing_protocol' }));
                try {
                    await session.init();
                    console.log('SPIKE3: protocol initialized successfully');
                } catch (err) {
                    console.error('SPIKE3: init failed:', err);
                    // Fall back to trying as REPL
                    spike3SessionRef.current = null;
                    detectedProto = 'repl';
                }
            }

            if (detectedProto === 'lwp3') {
                lwp3CharRef.current = matched.wc;
            } else if (detectedProto === 'repl') {
                bleWriteCharRef.current = matched.wc;
                bleNotifyCharRef.current = matched.nc;
                try {
                    const ctrlC = new Uint8Array([0x03]);
                    if (matched.wc.properties.writeWithoutResponse) {
                        await matched.wc.writeValueWithoutResponse(ctrlC);
                    } else {
                        await matched.wc.writeValue(ctrlC);
                    }
                } catch (err) { console.warn('Could not send init Ctrl-C', err); }
            }
            // spike3 protocol is handled by the session object

            activeType.current = 'ble';
            bleProtocolRef.current = detectedProto;

            btDevice.addEventListener('gattserverdisconnected', () => {
                if (activeType.current === 'ble') disconnect();
            });

            // Save device ID for auto-reconnect on refresh
            try { window.sessionStorage.setItem('ble_device_id', btDevice.id); } catch { /* ignore */ }

            setDevice({
                id: btDevice.id,
                name: btDevice.name || 'LEGO Hub (BLE)',
                connected: true,
                connecting: false,
                error: null,
                status: 'connected',
                type: 'ble',
                protocol: detectedProto,
            });

            console.log(`BLE: connected via ${matched.name} (${detectedProto})`);
            return { success: true };
    }, [disconnect]);

    const connectBLE = useCallback(async () => {
        if (!isBLESupported) {
            return { success: false, error: 'Web Bluetooth not supported' };
        }
        setDevice(prev => ({ ...prev, connecting: true, error: null, status: 'requesting', type: 'ble' }));

        try {
            const btDevice = await navigator.bluetooth.requestDevice({
                filters: [{ services: [SPIKE3_SERVICE] }],
                optionalServices: [NUS_SERVICE, PBX_SERVICE, LWP3_SERVICE],
            });

            return await setupBLEConnection(btDevice);

        } catch (err) {
            console.error('BLE connect error:', err);
            const isCancellation = err.name === 'NotFoundError' || err.message?.includes('User cancelled');
            let errorMessage = err.message;
            if (err.name === 'NotFoundError') errorMessage = 'Pairing cancelled.';
            else if (err.name === 'NetworkError') errorMessage = 'Connection failed. Is the hub already connected elsewhere?';

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
    }, [isBLESupported, setupBLEConnection]);

    const connectBLEAdvanced = connectBLE;

    // --- AUTO-RECONNECT (USB) ---
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

    // --- AUTO-RECONNECT (BLE) ---
    // Uses navigator.bluetooth.getDevices() to reconnect to a previously
    // paired hub without showing the device picker again.
    useEffect(() => {
        if (!isBLESupported) {
            console.log('BLE auto-reconnect: Web Bluetooth not supported');
            return;
        }
        if (!navigator.bluetooth.getDevices) {
            console.log('BLE auto-reconnect: getDevices() not available — enable chrome://flags/#enable-web-bluetooth-new-permissions-backend');
            return;
        }
        const savedId = window.sessionStorage.getItem('ble_device_id');
        if (!savedId) {
            console.log('BLE auto-reconnect: no saved device ID (connect once first)');
            return;
        }

        const autoReconnectBLE = async () => {
            try {
                const devices = await navigator.bluetooth.getDevices();
                console.log(`BLE auto-reconnect: getDevices() returned ${devices.length} device(s)`, devices.map(d => `${d.name} (${d.id})`));
                const prev = devices.find(d => d.id === savedId);
                if (!prev) {
                    console.log(`BLE auto-reconnect: saved ID "${savedId}" not in granted list`);
                    return;
                }

                console.log(`BLE auto-reconnect: found "${prev.name}" (${prev.id}), connecting…`);
                setDevice(p => ({ ...p, connecting: true, status: 'reconnecting', type: 'ble', name: prev.name || 'LEGO Hub' }));
                await setupBLEConnection(prev);
            } catch (err) {
                console.warn('BLE auto-reconnect failed:', err.message);
                setDevice(p => (p.connecting ? { ...p, connecting: false, status: 'idle', type: null } : p));
            }
        };

        autoReconnectBLE();
    }, [isBLESupported, setupBLEConnection]);

    // --- SHARED WRITE ---
    const write = useCallback(async (data) => {
        const DEBUG = true;
        if (!activeType.current) {
            if (DEBUG) console.debug('Device write aborted: no activeType');
            return false;
        }

        // ── SPIKE3 BLE: upload & run Python program via COBS protocol ──
        if (activeType.current === 'ble' && bleProtocolRef.current === 'spike3') {
            if (!spike3SessionRef.current) return false;
            try {
                // data is a Uint8Array of the Python script (encoded text)
                const pythonCode = typeof data === 'string'
                    ? data
                    : new TextDecoder().decode(data instanceof Uint8Array ? data : new Uint8Array(data));
                if (DEBUG) console.debug(`SPIKE3 write: uploading ${pythonCode.length} char program`);
                await spike3SessionRef.current.runProgram(pythonCode);
                if (DEBUG) console.debug('SPIKE3 write succeeded');
                return true;
            } catch (err) {
                console.error('SPIKE3 write error:', err);
                return false;
            }
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
