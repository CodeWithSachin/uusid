const crypto = require('crypto');
const os = require('os');

class UUSIDGenerator {
    constructor(options = {}) {
        this.nodeId = options.nodeId || this.generateNodeId();
        this.clockSeq = options.clockSeq || this.generateClockSeq();
        this.lastTimestamp = 0;
        this.sequenceCounter = 0;
        this.version = '@code_with_sachin/uusid';
    }

    // Generate MAC address-based node ID (like UUID1)
    generateNodeId() {
        const networkInterfaces = os.networkInterfaces();
        for (const name of Object.keys(networkInterfaces)) {
            for (const iface of networkInterfaces[name]) {
                if (!iface.internal && iface.mac && iface.mac !== '00:00:00:00:00:00') {
                    return iface.mac.replace(/:/g, '').toLowerCase();
                }
            }
        }
        // Fallback to random node ID with multicast bit set
        const randomBytes = crypto.randomBytes(6);
        randomBytes[0] |= 0x01; // Set multicast bit
        return randomBytes.toString('hex');
    }

    // Generate random clock sequence
    generateClockSeq() {
        return crypto.randomBytes(2).readUInt16BE(0) & 0x3fff;
    }

    // Get timestamp in 100-nanosecond intervals since UUID epoch
    getTimestamp() {
        const now = Date.now();
        const uuidEpoch = new Date('1582-10-15T00:00:00.000Z').getTime();
        return (now - uuidEpoch) * 10000; // Convert to 100-nanosecond intervals
    }

    // Generate UUSID combining UUID1 and UUID4 features
    generate() {
        const timestamp = this.getTimestamp();

        // Handle clock regression or same timestamp
        if (timestamp < this.lastTimestamp) {
            this.clockSeq = (this.clockSeq + 1) & 0x3fff;
        } else if (timestamp === this.lastTimestamp) {
            this.sequenceCounter++;
        } else {
            this.sequenceCounter = 0;
        }

        this.lastTimestamp = timestamp;

        // Split timestamp into parts (like UUID1)
        const timeLow = (timestamp & 0xffffffff) >>> 0; // Ensure unsigned 32-bit
        const timeMid = (timestamp >>> 32) & 0xffff;
        const timeHiAndVersion = ((timestamp >>> 48) & 0x0fff) | 0x1000; // Version 1 for time part

        // Add random component (like UUID4)
        const randomBytes = crypto.randomBytes(8);

        // Combine sequence counter with random for extra uniqueness
        const enhancedRandom = Buffer.alloc(8);
        enhancedRandom.writeUInt32BE(this.sequenceCounter, 0);
        enhancedRandom.writeUInt32BE(randomBytes.readUInt32BE(0), 4);

        // Enhanced clock sequence with random component
        const enhancedClockSeq = (this.clockSeq | (randomBytes[6] << 14)) & 0x3fff;

        // Build the UUSID
        const buffer = Buffer.alloc(16);

        // Time components (UUID1 style)
        buffer.writeUInt32BE(timeLow, 0);
        buffer.writeUInt16BE(timeMid, 4);
        buffer.writeUInt16BE(timeHiAndVersion, 6);

        // Enhanced clock sequence and node (hybrid approach)
        buffer.writeUInt16BE(enhancedClockSeq | 0x8000, 8); // Set variant bits

        // Node ID with random enhancement
        const nodeBytes = Buffer.from(this.nodeId, 'hex');
        for (let i = 0; i < 6; i++) {
            buffer[10 + i] = nodeBytes[i] ^ randomBytes[i % 8]; // XOR with random
        }

        return this.formatUUSID(buffer);
    }

    // Format as UUSID string
    formatUUSID(buffer) {
        const hex = buffer.toString('hex');
        return [
            hex.slice(0, 8),
            hex.slice(8, 12),
            hex.slice(12, 16),
            hex.slice(16, 20),
            hex.slice(20, 32)
        ].join('-');
    }

    // Generate multiple UUSIDs
    generateBatch(count = 10) {
        const batch = [];
        for (let i = 0; i < count; i++) {
            batch.push(this.generate());
        }
        return batch;
    }

    // Validate UUSID format
    static isValid(uusid) {
        const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        return regex.test(uusid);
    }

    // Parse UUSID components
    static parse(uusid) {
        if (!UUSIDGenerator.isValid(uusid)) {
            throw new Error('Invalid UUSID format');
        }

        const hex = uusid.replace(/-/g, '');
        const buffer = Buffer.from(hex, 'hex');

        const timeLow = buffer.readUInt32BE(0);
        const timeMid = buffer.readUInt16BE(4);
        const timeHiAndVersion = buffer.readUInt16BE(6);
        const clockSeq = buffer.readUInt16BE(8) & 0x3fff;
        const node = buffer.slice(10, 16).toString('hex');

        // Reconstruct timestamp
        const timestamp = (BigInt(timeHiAndVersion & 0x0fff) << 48n) |
            (BigInt(timeMid) << 32n) |
            BigInt(timeLow);

        const uuidEpoch = new Date('1582-10-15T00:00:00.000Z').getTime();
        const jsTimestamp = Number(timestamp / 10000n) + uuidEpoch;

        return {
            timestamp: new Date(jsTimestamp),
            clockSeq,
            node,
            version: '@code_with_sachin/uusid'
        };
    }
}

// Singleton instance for convenience
const defaultGenerator = new UUSIDGenerator();

// Main API functions
function uusid() {
    return defaultGenerator.generate();
}

function uusidBatch(count) {
    return defaultGenerator.generateBatch(count);
}

function createGenerator(options) {
    return new UUSIDGenerator(options);
}

// Export everything
module.exports = {
    uusid,
    uusidBatch,
    createGenerator,
    UUSIDGenerator,
    isValid: UUSIDGenerator.isValid,
    parse: UUSIDGenerator.parse
};

// For ES6 imports
module.exports.default = uusid;