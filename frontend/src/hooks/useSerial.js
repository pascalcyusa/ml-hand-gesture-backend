import { useState, useCallback, useRef, useMemo } from 'react';

export function useSerial() {
    const [device, setDevice] = useState(null);
    const portRef = useRef(null);
    const writerRef = useRef(null);
    const readerRef = useRef(null);
    const notificationCallbackRef = useRef(null);
    const keepReadingRef = useRef(false);

    const isSupported = typeof navigator !== 'undefined' && !!navigator.serial;

    const connect = useCallback(async () => {
        if (!isSupported) {
            setDevice({ error: 'Web Serial not supported in this browser', status: 'unsupported' });
            return { success: false, error: 'Web Serial not supported in this browser' };
        }

        setDevice({ connecting: true, error: null, status: 'requesting' });

        try {
            const port = await navigator.serial.requestPort();
            portRef.current = port;

            setDevice(prev => ({ ...prev, status: 'connecting_port', name: 'SPIKE Hub (Serial)' }));
            
            await port.open({ baudRate: 115200 });

            setDevice(prev => ({ ...prev, status: 'initializing_repl' }));

            // For simplicity in a REPL, raw writing/reading without TextEncoderStream 
            // is often safer if we are dealing with raw Uint8Arrays
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
                            notificationCallbackRef.current(value); // already Uint8Array
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
            } catch (err) {
                console.warn('Could not send init Ctrl-C', err);
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
    }, [isSupported]);

    const write = useCallback(async (data) => {
        if (!writerRef.current) {
            console.error('Serial: not connected');
            return false;
        }
        try {
            // data is expected to be Uint8Array (from encodeCommand)
            // But we should use the paste mode for MicroPython REPL to ensure 
            // commands execute reliably
            const ctrlE = new Uint8Array([0x05]); // Enter Paste Mode
            const ctrlD = new Uint8Array([0x04]); // Execute Paste Mode
            
            // Combine them into one buffer: Ctrl-E + Data + Ctrl-D
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
