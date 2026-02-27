import { useState, useCallback, useRef, useMemo, useEffect } from 'react';

export function useSerial() {
    const [device, setDevice] = useState(null);
    const portRef = useRef(null);
    const writerRef = useRef(null);
    const readerRef = useRef(null);
    const notificationCallbackRef = useRef(null);
    const keepReadingRef = useRef(false);

    const isSupported = typeof navigator !== 'undefined' && !!navigator.serial;

    const setupConnection = useCallback(async (port) => {
        try {
            portRef.current = port;

            setDevice(prev => ({ ...prev, status: 'connecting_port', name: 'SPIKE Hub (Serial)', connecting: true }));
            
            await port.open({ baudRate: 115200 });

            setDevice(prev => ({ ...prev, status: 'initializing_repl' }));

            const writer = port.writable.getWriter();
            writerRef.current = writer;

            const reader = port.readable.getReader();
            readerRef.current = reader;
            keepReadingRef.current = true;

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

            // Send Ctrl-C (0x03) to interrupt any running program and enter REPL
            try {
                const ctrlC = new Uint8Array([0x03, 0x0D, 0x0A]);
                await writer.write(ctrlC);
                
                // wait a tiny bit for REPL to be ready
                await new Promise(r => setTimeout(r, 100));

                // Import necessary modules for motor control
                const imports = "import hub\nimport motor\nfrom hub import port\n";
                const initCmd = new Uint8Array([0x05, ...new TextEncoder().encode(imports), 0x04]);
                await writer.write(initCmd);
            } catch (err) {
                console.warn('Could not initialize REPL', err);
            }

            setDevice({
                id: 'serial-port',
                name: 'LEGO SPIKE Hub',
                connected: true,
                connecting: false,
                error: null,
                status: 'connected'
            });

            return { success: true };
        } catch (err) {
            console.error('Serial connect error:', err);
            
            let errorMessage = err.message;
            if (err.name === 'NotFoundError') errorMessage = 'Port selection cancelled.';
            else if (err.name === 'SecurityError') errorMessage = 'Serial connection requires a secure context (HTTPS) or user gesture.';
            else if (err.name === 'NetworkError') errorMessage = 'Failed to open the serial port. It might be in use by another program.';
            
            const isCancellation = err.name === 'NotFoundError' || err.message.includes('No port selected');

            setDevice({
                connecting: false,
                error: isCancellation ? null : errorMessage,
                status: isCancellation ? 'idle' : 'error'
            });
            return { success: false, error: isCancellation ? null : errorMessage, isCancellation };
        }
    }, []);

    const connect = useCallback(async () => {
        if (!isSupported) {
            setDevice({ error: 'Web Serial not supported in this browser', status: 'unsupported' });
            return { success: false, error: 'Web Serial not supported in this browser' };
        }

        setDevice({ connecting: true, error: null, status: 'requesting' });

        try {
            const port = await navigator.serial.requestPort();
            return await setupConnection(port);
        } catch (err) {
            console.error('Serial request error:', err);
            const isCancellation = err.name === 'NotFoundError' || err.message.includes('No port selected');
            setDevice({
                connecting: false,
                error: isCancellation ? null : err.message,
                status: isCancellation ? 'idle' : 'error'
            });
            return { success: false, error: isCancellation ? null : err.message, isCancellation };
        }
    }, [isSupported, setupConnection]);

    const disconnect = useCallback(async () => {
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

        setDevice({
            connected: false,
            connecting: false,
            name: 'Device',
            status: 'disconnected'
        });
    }, []);

    // Auto-reconnect on load if ports were previously granted
    useEffect(() => {
        if (!isSupported) return;

        const autoConnect = async () => {
            try {
                const ports = await navigator.serial.getPorts();
                if (ports.length > 0) {
                    console.log('Found previously granted serial ports, attempting auto-reconnect...');
                    setDevice({ connecting: true, error: null, status: 'requesting' });
                    // Try to connect to the first available port
                    await setupConnection(ports[0]);
                }
            } catch (err) {
                console.warn('Auto-reconnect failed', err);
            }
        };

        autoConnect();

        // Listen for disconnect events (e.g., USB unplugged or Bluetooth lost)
        const handleDisconnect = (e) => {
            if (e.target === portRef.current) {
                console.log('Serial device disconnected unexpectedly');
                disconnect();
            }
        };

        navigator.serial.addEventListener('disconnect', handleDisconnect);
        return () => {
            navigator.serial.removeEventListener('disconnect', handleDisconnect);
        };
    }, [isSupported, setupConnection, disconnect]);

    const write = useCallback(async (data) => {
        if (!writerRef.current) {
            console.error('Serial: not connected');
            return false;
        }
        try {
            const ctrlE = new Uint8Array([0x05]); // Enter Paste Mode
            const ctrlD = new Uint8Array([0x04]); // Execute Paste Mode
            
            const combined = new Uint8Array(data.length + 2);
            combined[0] = ctrlE[0];
            combined.set(new Uint8Array(data), 1);
            combined[combined.length - 1] = ctrlD[0];

            await writerRef.current.write(combined);
            return true;
        } catch (err) {
            console.error('Serial write error:', err);
            return false;
        }
    }, []);

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
