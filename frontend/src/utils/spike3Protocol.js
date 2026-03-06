/**
 * SPIKE 3 BLE Protocol
 *
 * The LEGO SPIKE Prime (SPIKE 3 firmware) uses a custom binary protocol over
 * BLE service 0xFD02. Messages are COBS-encoded, XOR-masked, and delimited.
 *
 * Reference: https://github.com/LEGO/spike-prime-docs
 * Adapted from tuftsceeo/wildcat-code (MIT License)
 */

// ─── COBS Encoding / Decoding ───────────────────────────────────────────────

const DELIMITER = 0x02;
const NO_DELIMITER = 0xff;
const COBS_CODE_OFFSET = DELIMITER;
const MAX_BLOCK_SIZE = 84;
const XOR = 3;

function cobsEncode(data) {
  const buffer = [];
  let codeIndex = 0;
  let block = 0;

  function beginBlock() {
    codeIndex = buffer.length;
    buffer.push(NO_DELIMITER);
    block = 1;
  }

  beginBlock();

  for (const byte of data) {
    if (byte > DELIMITER) {
      buffer.push(byte);
      block++;
    }
    if (byte <= DELIMITER || block > MAX_BLOCK_SIZE) {
      if (byte <= DELIMITER) {
        buffer[codeIndex] = byte * MAX_BLOCK_SIZE + block + COBS_CODE_OFFSET;
      }
      beginBlock();
    }
  }

  buffer[codeIndex] = block + COBS_CODE_OFFSET;
  return new Uint8Array(buffer);
}

function cobsDecode(data) {
  const buffer = [];

  function unescape(code) {
    if (code === 0xff) return { value: null, block: MAX_BLOCK_SIZE + 1 };
    let value = Math.floor((code - COBS_CODE_OFFSET) / MAX_BLOCK_SIZE);
    let block = (code - COBS_CODE_OFFSET) % MAX_BLOCK_SIZE;
    if (block === 0) { block = MAX_BLOCK_SIZE; value -= 1; }
    return { value, block };
  }

  let { value, block } = unescape(data[0]);
  let i = 1;

  while (i < data.length) {
    block -= 1;
    if (block > 0) { buffer.push(data[i++]); continue; }
    if (value !== null) buffer.push(value);
    ({ value, block } = unescape(data[i++]));
  }

  return new Uint8Array(buffer);
}

export function cobsPack(data) {
  const encoded = cobsEncode(data);
  const packed = new Uint8Array(encoded.length + 1);
  for (let i = 0; i < encoded.length; i++) packed[i] = encoded[i] ^ XOR;
  packed[encoded.length] = DELIMITER;
  return packed;
}

export function cobsUnpack(data) {
  let start = 0;
  if (data[0] === 0x01) start++;
  if (data[data.length - 1] !== DELIMITER) throw new Error('Missing delimiter');
  const unframed = new Uint8Array(data.slice(start, -1));
  for (let i = 0; i < unframed.length; i++) unframed[i] ^= XOR;
  return cobsDecode(unframed);
}

// ─── CRC32 ──────────────────────────────────────────────────────────────────

const CRC32_TABLE = (() => {
  const table = new Int32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = c & 1 ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    table[i] = c;
  }
  return table;
})();

export function crc32(data, seed = 0) {
  // Pad to 4-byte alignment
  const rem = data.length % 4;
  const padded = rem === 0 ? data : (() => {
    const p = new Uint8Array(data.length + (4 - rem));
    p.set(data);
    return p;
  })();
  let crc = seed ^ -1;
  for (let i = 0; i < padded.length; i++) crc = CRC32_TABLE[(crc ^ padded[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ -1) >>> 0;
}

// ─── Message IDs ────────────────────────────────────────────────────────────

export const MSG = {
  INFO_REQ:            0x00,
  INFO_RESP:           0x01,
  CLEAR_SLOT_REQ:      0x46,
  CLEAR_SLOT_RESP:     0x47,
  FILE_UPLOAD_REQ:     0x0C,
  FILE_UPLOAD_RESP:    0x0D,
  CHUNK_REQ:           0x10,
  CHUNK_RESP:          0x11,
  PROGRAM_FLOW_REQ:    0x1E,
  PROGRAM_FLOW_RESP:   0x1F,
  PROGRAM_FLOW_NOTIF:  0x20,
  CONSOLE_NOTIF:       0x21,
  DEVICE_NOTIF_REQ:    0x28,
  DEVICE_NOTIF_RESP:   0x29,
  DEVICE_NOTIF:        0x3C,
};

// ─── Message Serialization ──────────────────────────────────────────────────

export function infoRequest() {
  return new Uint8Array([MSG.INFO_REQ]);
}

export function deviceNotificationRequest(intervalMs = 500) {
  const buf = new Uint8Array(3);
  buf[0] = MSG.DEVICE_NOTIF_REQ;
  buf[1] = intervalMs & 0xff;
  buf[2] = (intervalMs >> 8) & 0xff;
  return buf;
}

export function clearSlotRequest(slot) {
  return new Uint8Array([MSG.CLEAR_SLOT_REQ, slot]);
}

export function startFileUploadRequest(fileName, slot, fileCrc) {
  const nameBytes = new TextEncoder().encode(fileName);
  const buf = new Uint8Array(2 + nameBytes.length + 1 + 4);
  buf[0] = MSG.FILE_UPLOAD_REQ;
  buf.set(nameBytes, 1);
  buf[1 + nameBytes.length] = 0x00; // null terminator
  buf[2 + nameBytes.length] = slot;
  const crcOffset = 3 + nameBytes.length;
  buf[crcOffset]     = fileCrc & 0xff;
  buf[crcOffset + 1] = (fileCrc >> 8) & 0xff;
  buf[crcOffset + 2] = (fileCrc >> 16) & 0xff;
  buf[crcOffset + 3] = (fileCrc >> 24) & 0xff;
  return buf;
}

export function transferChunkRequest(runningCrc, chunk) {
  const buf = new Uint8Array(7 + chunk.length);
  buf[0] = MSG.CHUNK_REQ;
  buf[1] = runningCrc & 0xff;
  buf[2] = (runningCrc >> 8) & 0xff;
  buf[3] = (runningCrc >> 16) & 0xff;
  buf[4] = (runningCrc >> 24) & 0xff;
  buf[5] = chunk.length & 0xff;
  buf[6] = (chunk.length >> 8) & 0xff;
  buf.set(chunk, 7);
  return buf;
}

export function programFlowRequest(stop, slot) {
  return new Uint8Array([MSG.PROGRAM_FLOW_REQ, stop ? 1 : 0, slot]);
}

// ─── Message Deserialization ────────────────────────────────────────────────

export function parseInfoResponse(data) {
  if (data.length < 17) return null;
  return {
    id: data[0],
    rpcVersion: `${data[1]}.${data[2]}.${data[3] | (data[4] << 8)}`,
    fwVersion: `${data[5]}.${data[6]}.${data[7] | (data[8] << 8)}`,
    maxPacketSize: data[9] | (data[10] << 8),
    maxMessageSize: data[11] | (data[12] << 8),
    maxChunkSize: data[13] | (data[14] << 8),
  };
}

export function parseResponse(data) {
  if (!data || data.length < 1) return null;
  const id = data[0];
  switch (id) {
    case MSG.INFO_RESP: return { id, ...parseInfoResponse(data) };
    case MSG.CLEAR_SLOT_RESP:
    case MSG.FILE_UPLOAD_RESP:
    case MSG.CHUNK_RESP:
    case MSG.PROGRAM_FLOW_RESP:
    case MSG.DEVICE_NOTIF_RESP:
      return { id, success: data.length >= 2 && data[1] === 0x00 };
    case MSG.PROGRAM_FLOW_NOTIF:
      return { id, stopped: data.length >= 2 && data[1] === 1 };
    case MSG.CONSOLE_NOTIF:
      return { id, text: new TextDecoder().decode(data.slice(1).filter(b => b !== 0)) };
    default:
      return { id, raw: data };
  }
}

// ─── High-Level Protocol Helper ─────────────────────────────────────────────

/**
 * Creates a SPIKE 3 protocol session over a BLE write/notify pair.
 */
export function createSpike3Session(writeChar) {
  const pendingResponses = new Map();
  let hubInfo = null;

  // Send a COBS-framed message
  const sendMessage = async (payload) => {
    const frame = cobsPack(payload);
    const packetSize = hubInfo?.maxPacketSize || frame.length;
    for (let i = 0; i < frame.length; i += packetSize) {
      const packet = frame.subarray(i, i + packetSize);
      if (writeChar.properties.writeWithoutResponse) {
        await writeChar.writeValueWithoutResponse(packet);
      } else {
        await writeChar.writeValue(packet);
      }
    }
  };

  // Send a message and wait for specific response type
  const sendRequest = (payload, expectedResponseId, timeoutMs = 5000) => {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        pendingResponses.delete(expectedResponseId);
        reject(new Error(`Timeout waiting for response 0x${expectedResponseId.toString(16)}`));
      }, timeoutMs);

      pendingResponses.set(expectedResponseId, { resolve, reject, timer });
      sendMessage(payload).catch((err) => {
        clearTimeout(timer);
        pendingResponses.delete(expectedResponseId);
        reject(err);
      });
    });
  };

  // Handle incoming notification data
  let rxBuffer = new Uint8Array(0);
  const onNotification = (data) => {
    // Accumulate data until we see the delimiter (0x02)
    const combined = new Uint8Array(rxBuffer.length + data.length);
    combined.set(rxBuffer);
    combined.set(data, rxBuffer.length);
    rxBuffer = combined;

    // Process complete frames
    while (true) {
      const delimIdx = rxBuffer.indexOf(DELIMITER);
      if (delimIdx === -1) break;

      const frame = rxBuffer.slice(0, delimIdx + 1);
      rxBuffer = rxBuffer.slice(delimIdx + 1);

      try {
        const decoded = cobsUnpack(frame);
        const msg = parseResponse(decoded);
        if (!msg) continue;

        console.log(`SPIKE3 RX [0x${msg.id.toString(16)}]:`, msg);

        if (pendingResponses.has(msg.id)) {
          const pending = pendingResponses.get(msg.id);
          clearTimeout(pending.timer);
          pendingResponses.delete(msg.id);
          pending.resolve(msg);
        }
      } catch (e) {
        console.warn('SPIKE3: frame decode error:', e.message);
      }
    }
  };

  // Initialize the connection
  const init = async () => {
    console.log('SPIKE3: sending InfoRequest…');
    const resp = await sendRequest(infoRequest(), MSG.INFO_RESP, 5000);
    hubInfo = resp;
    console.log('SPIKE3: hub info:', resp);

    console.log('SPIKE3: enabling device notifications…');
    const notifResp = await sendRequest(
      deviceNotificationRequest(500),
      MSG.DEVICE_NOTIF_RESP,
      5000
    );
    console.log('SPIKE3: notifications enabled:', notifResp);
    return resp;
  };

  // Mutex: serialize all runProgram calls so they don't race each other
  let programLock = Promise.resolve();
  let programRunning = false;
  let lastProgramCode = null;

  const _doRunProgram = async (pythonCode, slot) => {
    // Skip re-upload if the same program is already running
    if (programRunning && pythonCode === lastProgramCode) {
      console.log('SPIKE3: same program already running, skipping');
      return;
    }

    const program = new TextEncoder().encode(pythonCode);
    const programCrc = crc32(program);

    // Stop currently running program first
    if (programRunning) {
      try {
        await sendRequest(programFlowRequest(true, slot), MSG.PROGRAM_FLOW_RESP, 2000);
      } catch { /* timeout OK — program may have already stopped */ }
      programRunning = false;
    }

    // Clear slot
    const clearResp = await sendRequest(clearSlotRequest(slot), MSG.CLEAR_SLOT_RESP);
    if (!clearResp.success) console.warn('SPIKE3: clear slot failed, continuing…');

    // Start file upload
    const uploadResp = await sendRequest(
      startFileUploadRequest('program.py', slot, programCrc),
      MSG.FILE_UPLOAD_RESP
    );
    if (!uploadResp.success) throw new Error('SPIKE3: file upload rejected');

    // Transfer chunks
    const chunkSize = hubInfo?.maxChunkSize || 512;
    let runningCrc = 0;
    for (let i = 0; i < program.length; i += chunkSize) {
      const chunk = program.subarray(i, i + chunkSize);
      runningCrc = crc32(chunk, runningCrc);
      const chunkResp = await sendRequest(
        transferChunkRequest(runningCrc, chunk),
        MSG.CHUNK_RESP
      );
      if (!chunkResp.success) throw new Error(`SPIKE3: chunk transfer failed at offset ${i}`);
    }

    // Start program
    const startResp = await sendRequest(
      programFlowRequest(false, slot),
      MSG.PROGRAM_FLOW_RESP
    );
    if (!startResp.success) throw new Error('SPIKE3: program start failed');

    programRunning = true;
    lastProgramCode = pythonCode;
    console.log('SPIKE3: program started in slot', slot);
  };

  // Upload and run a Python program (serialized — queued calls wait for previous to finish)
  const runProgram = (pythonCode, slot = 0) => {
    const prev = programLock;
    let resolve;
    programLock = new Promise(r => { resolve = r; });
    return prev
      .then(() => _doRunProgram(pythonCode, slot))
      .finally(() => resolve());
  };

  const stopProgram = async (slot = 0) => {
    try {
      const resp = await sendRequest(
        programFlowRequest(true, slot),
        MSG.PROGRAM_FLOW_RESP,
        3000
      );
      programRunning = false;
      return resp.success;
    } catch {
      programRunning = false;
      return false;
    }
  };

  return { sendMessage, sendRequest, onNotification, init, runProgram, stopProgram };
}
