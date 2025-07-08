const crypto = require('crypto');
const os = require('os');

/**
 * Enhanced UUSID Generator with multiple formats and advanced features
 */
class UUSIDGenerator {
    constructor(options = {}) {
        this.nodeId = options.nodeId || this.generateNodeId();
        this.clockSeq = options.clockSeq || this.generateClockSeq();
        this.lastTimestamp = 0;
        this.sequenceCounter = 0;
        this.version = '@code_with_sachin/uusid';
        this.prefix = options.prefix || null;
        this.separator = options.separator || '-';
        this.validAfter = options.validAfter ? new Date(options.validAfter).getTime() : null;
        this.validBefore = options.validBefore ? new Date(options.validBefore).getTime() : null;
        this.secretKey = options.secretKey || null;
        this.metrics = {
            totalGenerated: 0,
            startTime: Date.now(),
            collisions: 0,
            peakRate: 0,
            currentRate: 0,
            rateSamples: []
        };
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
        if (now === this.lastTimestamp) {
            this.sequenceCounter++;
            if (this.sequenceCounter > 0xffff) {
                // Wait for next millisecond
                while (Date.now() === this.lastTimestamp) {
                    // Busy wait
                }
                this.sequenceCounter = 0;
                this.lastTimestamp = Date.now();
            }
        } else {
            this.sequenceCounter = 0;
            this.lastTimestamp = now;
        }

        // UUID epoch is October 15, 1582
        const uuidEpoch = new Date('1582-10-15').getTime();
        const timestamp = (this.lastTimestamp - uuidEpoch) * 10000;
        return { timestamp, sequence: this.sequenceCounter };
    }

    // Core generation method
    generate() {
        const { timestamp, sequence } = this.getTimestamp();

        // Update metrics
        this.updateMetrics();

        // Time-based validation
        if (this.validAfter && Date.now() < this.validAfter) {
            throw new Error('Generation not allowed: Current time is before valid-after time');
        }
        if (this.validBefore && Date.now() > this.validBefore) {
            throw new Error('Generation not allowed: Current time is after valid-before time');
        }

        // Build UUID components in standard UUID format (8-4-4-4-12)
        // Incorporate sequence into clockSeq for uniqueness
        const absTimestamp = Math.abs(timestamp);
        const timeLow = ((absTimestamp & 0xffffffff) >>> 0).toString(16).padStart(8, '0');
        const timeMid = (Math.floor(absTimestamp / 0x100000000) & 0xffff).toString(16).padStart(4, '0');
        const timeHigh = ((Math.floor(absTimestamp / 0x1000000000000) & 0x0fff) | 0x1000).toString(16).padStart(4, '0');
        const clockSeqWithSeq = ((this.clockSeq + sequence) & 0xffff);
        const clockSeqHigh = ((clockSeqWithSeq >> 8) | 0x80).toString(16).padStart(2, '0');
        const clockSeqLow = (clockSeqWithSeq & 0xff).toString(16).padStart(2, '0');
        const node = this.nodeId.padStart(12, '0');

        const uuid = `${timeLow}${this.separator}${timeMid}${this.separator}${timeHigh}${this.separator}${clockSeqHigh}${clockSeqLow}${this.separator}${node}`;

        return this.prefix ? `${this.prefix}${this.separator}${uuid}` : uuid;
    }

    // Generate multiple IDs efficiently
    generateBatch(count) {
        const batch = [];
        for (let i = 0; i < count; i++) {
            batch.push(this.generate());
        }
        return batch;
    }

    // Generate sorted batch (chronologically ordered)
    generateSortedBatch(count) {
        const batch = this.generateBatch(count);
        return batch.sort((a, b) => {
            const timestampA = this.extractTimestamp(a);
            const timestampB = this.extractTimestamp(b);
            return timestampA - timestampB;
        });
    }

    // Alternative format: Base32
    base32() {
        const uuid = this.generate();
        // Convert to hex string (remove separators) then to buffer for Base32 encoding
        const hexString = uuid.replace(new RegExp(this.separator.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), '');
        const buffer = Buffer.from(hexString, 'hex');
        return this.toBase32(buffer);
    }

    // Alternative format: URL-safe
    urlSafe() {
        const uuid = this.generate();
        return uuid.replace(new RegExp(this.separator.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), '').toLowerCase();
    }

    // Alternative format: Compact
    compact() {
        const uuid = this.generate();
        return uuid.replace(new RegExp(this.separator.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), '');
    }

    // Alternative format: Hierarchical
    hierarchical(options = {}) {
        const { levels = 3, separator = '.', parent = null } = options;

        if (parent) {
            // Generate child ID based on parent - add only one level
            const uuid = this.generate();
            const id = uuid.replace(new RegExp(this.separator.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), '');
            const childPart = id.substring(0, 10); // Take first 10 chars as child identifier
            return `${parent}${separator}${childPart}`;
        } else {
            // Generate root hierarchical ID
            const uuid = this.generate();
            const id = uuid.replace(new RegExp(this.separator.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), '');
            const parts = [];
            const partLength = Math.floor(id.length / levels);

            for (let i = 0; i < levels; i++) {
                const start = i * partLength;
                const end = i === levels - 1 ? id.length : start + partLength;
                parts.push(id.substring(start, end));
            }

            return parts.join(separator);
        }
    }

    // Content-based (deterministic) ID generation
    fromContent(content, options = {}) {
        const { namespace = 'default', algorithm = 'sha256' } = options;
        const hash = crypto.createHash(algorithm);
        hash.update(namespace);
        hash.update(content);
        const digest = hash.digest('hex');

        // Format as UUID-like structure
        return [
            digest.substring(0, 8),
            digest.substring(8, 12),
            digest.substring(12, 16),
            digest.substring(16, 20),
            digest.substring(20, 32)
        ].join(this.separator);
    }

    // Encryption support
    encrypt(data) {
        if (!this.secretKey) {
            throw new Error('Secret key required for encryption');
        }

        const key = Buffer.from(this.secretKey.padEnd(32, '0').substring(0, 32));
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
        let encrypted = cipher.update(data, 'utf8', 'hex');
        encrypted += cipher.final('hex');

        return iv.toString('hex') + ':' + encrypted;
    }

    decrypt(encryptedData) {
        if (!this.secretKey) {
            throw new Error('Secret key required for decryption');
        }

        const parts = encryptedData.split(':');
        if (parts.length !== 2) {
            throw new Error('Invalid encrypted data format');
        }

        const key = Buffer.from(this.secretKey.padEnd(32, '0').substring(0, 32));
        const iv = Buffer.from(parts[0], 'hex');
        const encrypted = parts[1];

        const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    }

    // Validation methods
    validate(id, options = {}) {
        const { strict = false, allowPrefix = true } = options;

        let cleanId = id;

        // Handle prefixed IDs
        if (allowPrefix && this.prefix && id.startsWith(`${this.prefix}${this.separator}`)) {
            cleanId = id.substring(this.prefix.length + 1);
        }

        // Create dynamic regex based on current separator
        const escapedSeparator = this.separator.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const uuidRegex = new RegExp(`^[0-9a-f]{8}${escapedSeparator}[0-9a-f]{4}${escapedSeparator}[0-9a-f]{4}${escapedSeparator}[0-9a-f]{4}${escapedSeparator}[0-9a-f]{12}$`, 'i');

        if (!uuidRegex.test(cleanId)) {
            return {
                valid: false,
                isValid: false,
                reason: 'Invalid format',
                version: null,
                entropy: 0
            };
        }

        // Calculate entropy (approximate)
        const hexString = cleanId.replace(new RegExp(escapedSeparator, 'g'), '');
        const entropy = hexString.split('').reduce((acc, char, i, arr) => {
            const charCount = arr.filter(c => c === char).length;
            const probability = charCount / arr.length;
            return acc - probability * Math.log2(probability);
        }, 0);

        // Time range validation
        try {
            const timestamp = this.extractTimestamp(cleanId);
            if (this.validAfter && timestamp < this.validAfter) {
                return {
                    valid: false,
                    isValid: false,
                    reason: 'Before valid range',
                    version: 'uusid',
                    entropy: entropy
                };
            }
            if (this.validBefore && timestamp > this.validBefore) {
                return {
                    valid: false,
                    isValid: false,
                    reason: 'After valid range',
                    version: 'uusid',
                    entropy: entropy
                };
            }
        } catch (error) {
            return {
                valid: false,
                isValid: false,
                reason: 'Invalid timestamp',
                version: 'uusid',
                entropy: entropy
            };
        }

        return {
            valid: true,
            isValid: true,
            version: 'uusid',
            entropy: entropy
        };
    }

    // Extract timestamp from ID
    extractTimestamp(id) {
        // Remove separators (handle both custom separator and dots from hierarchical IDs)
        const escapedSeparator = this.separator.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const cleanId = id.replace(new RegExp(escapedSeparator, 'g'), '').replace(/\./g, '');

        if (cleanId.length < 32) {
            throw new Error('Invalid ID format for timestamp extraction');
        }

        const timeLow = parseInt(cleanId.substring(0, 8), 16);
        const timeMid = parseInt(cleanId.substring(8, 12), 16);
        const timeHigh = parseInt(cleanId.substring(12, 16), 16) & 0x0fff;

        const timestamp = (timeHigh * 0x1000000000000) + (timeMid * 0x100000000) + timeLow;
        const uuidEpoch = new Date('1582-10-15').getTime();

        // Convert from 100-nanosecond intervals to milliseconds
        return uuidEpoch + (timestamp / 10000);
    }

    // Time range validation
    isInTimeRange(id, start, end) {
        try {
            const timestamp = this.extractTimestamp(id); // This returns milliseconds
            const startTime = new Date(start).getTime();
            const endTime = new Date(end).getTime();

            return timestamp >= startTime && timestamp <= endTime;
        } catch (error) {
            return false;
        }
    }

    // Batch analysis
    analyze(idArray) {
        const analysis = {
            total: idArray.length,
            totalIds: idArray.length, // For test compatibility
            valid: 0,
            invalid: 0,
            duplicates: 0,
            uniqueIds: 0, // Will be calculated
            timeRange: { earliest: null, latest: null },
            formats: { standard: 0, prefixed: 0, custom: 0 },
            errors: []
        };

        const seen = new Set();
        const timestamps = [];

        for (const id of idArray) {
            // Check for duplicates
            if (seen.has(id)) {
                analysis.duplicates++;
                continue;
            }
            seen.add(id);

            // Validate format
            const validation = this.validate(id);
            if (validation.valid) {
                analysis.valid++;

                // Analyze format
                if (this.prefix && id.startsWith(`${this.prefix}${this.separator}`)) {
                    analysis.formats.prefixed++;
                } else if (id.includes(this.separator)) {
                    analysis.formats.standard++;
                } else {
                    analysis.formats.custom++;
                }

                // Extract timestamp
                try {
                    const timestamp = this.extractTimestamp(id);
                    timestamps.push(timestamp);
                } catch (error) {
                    analysis.errors.push(`Timestamp extraction failed for ${id}: ${error.message}`);
                }
            } else {
                analysis.invalid++;
                analysis.errors.push(`Invalid ID ${id}: ${validation.reason}`);
            }
        }

        // Time range analysis
        if (timestamps.length > 0) {
            timestamps.sort((a, b) => a - b); // timestamps are already numbers
            analysis.timeRange.earliest = new Date(timestamps[0]);
            analysis.timeRange.latest = new Date(timestamps[timestamps.length - 1]);
        }

        // Calculate unique IDs
        analysis.uniqueIds = seen.size;

        return analysis;
    }

    // Parse hierarchical ID structure
    parseHierarchy(id, options = {}) {
        const { separator = '.' } = options;
        const parts = id.split(separator);

        // Calculate depth based on hierarchy: root has 3 parts (depth 0), child has 4 parts (depth 1), etc.
        const depth = Math.max(0, parts.length - 3);

        return {
            depth: depth,
            parts: parts,
            parent: parts.length > 3 ? parts.slice(0, -1).join(separator) : null,
            root: parts.slice(0, 3).join(separator),
            leaf: parts[parts.length - 1]
        };
    }

    // Performance metrics
    updateMetrics() {
        this.metrics.totalGenerated++;
        const now = Date.now();

        // Calculate current rate (IDs per second)
        this.metrics.rateSamples.push(now);

        // Keep only last 10 seconds of samples
        const cutoff = now - 10000;
        this.metrics.rateSamples = this.metrics.rateSamples.filter(time => time > cutoff);

        if (this.metrics.rateSamples.length > 1) {
            const timeSpan = now - this.metrics.rateSamples[0];
            if (timeSpan > 0) {
                this.metrics.currentRate = Math.round((this.metrics.rateSamples.length - 1) / (timeSpan / 1000));
                this.metrics.peakRate = Math.max(this.metrics.peakRate, this.metrics.currentRate);
            }
        }
    }

    getMetrics() {
        const uptime = Date.now() - this.metrics.startTime;
        const avgRate = uptime > 0 ? this.metrics.totalGenerated / (uptime / 1000) : 0;

        return {
            totalGenerated: this.metrics.totalGenerated,
            uptime: this.formatDuration(uptime),
            averageRate: Math.round(avgRate),
            currentRate: this.metrics.currentRate,
            peakRate: this.metrics.peakRate,
            collisions: this.metrics.collisions,
            memoryUsage: this.getMemoryUsage()
        };
    }

    // Health check
    async healthCheck() {
        const start = Date.now();

        try {
            // Generate test IDs
            const testIds = this.generateBatch(100);

            // Validate all test IDs
            const validations = testIds.map(id => this.validate(id));
            const allValid = validations.every(v => v.valid);

            // Check for duplicates
            const uniqueIds = new Set(testIds);
            const noDuplicates = uniqueIds.size === testIds.length;

            // Performance check
            const generationTime = Date.now() - start;
            const rate = 100 / (generationTime / 1000);

            return {
                healthy: allValid && noDuplicates && rate > 10,
                checks: {
                    validation: allValid,
                    uniqueness: noDuplicates,
                    performance: rate > 10
                },
                metrics: {
                    generationTime: `${generationTime}ms`,
                    rate: `${Math.round(rate)} IDs/sec`,
                    memoryUsage: this.getMemoryUsage()
                },
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return {
                healthy: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    // Utility methods
    toBase32(buffer) {
        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        let result = '';
        let bits = 0;
        let value = 0;

        for (let i = 0; i < buffer.length; i++) {
            value = (value << 8) | buffer[i];
            bits += 8;

            while (bits >= 5) {
                result += alphabet[(value >>> (bits - 5)) & 31];
                bits -= 5;
            }
        }

        if (bits > 0) {
            result += alphabet[(value << (5 - bits)) & 31];
        }

        return result;
    }

    formatDuration(ms) {
        if (ms < 1000) return `${ms}ms`;
        if (ms < 60000) return `${Math.round(ms / 1000)}s`;
        if (ms < 3600000) return `${Math.round(ms / 60000)}m`;
        return `${Math.round(ms / 3600000)}h`;
    }

    // Utility: Get memory usage
    getMemoryUsage() {
        const used = process.memoryUsage();
        const mb = Math.round(used.heapUsed / 1024 / 1024);
        return `${mb}MB`;
    }
}

/**
 * Prefixed ID Generator
 */
class PrefixedGenerator extends UUSIDGenerator {
    constructor(prefix, options = {}) {
        super({ ...options, prefix, separator: '_' });
    }
}

/**
 * Encrypted ID Generator
 */
class EncryptedGenerator extends UUSIDGenerator {
    constructor(options = {}) {
        if (!options.secretKey) {
            throw new Error('Secret key required for encrypted generator');
        }
        super(options);
    }

    generate() {
        const id = super.generate();
        return this.encrypt(id);
    }
}

/**
 * Worker Pool for high-volume generation
 */
class WorkerPool {
    constructor(options = {}) {
        this.workers = options.workers || os.cpus().length;
        this.batchSize = options.batchSize || 1000;
        this.generators = [];

        for (let i = 0; i < this.workers; i++) {
            this.generators.push(new UUSIDGenerator());
        }
    }

    async generateBatch(count) {
        const batches = [];
        const batchCount = Math.ceil(count / this.batchSize);

        for (let i = 0; i < batchCount; i++) {
            const generator = this.generators[i % this.workers];
            const batchSize = Math.min(this.batchSize, count - (i * this.batchSize));
            batches.push(generator.generateBatch(batchSize));
        }

        return Promise.all(batches).then(results => results.flat());
    }
}

// Singleton instance for convenience
const defaultGenerator = new UUSIDGenerator();

// Main API functions
function uusid(options) {
    if (options) {
        const generator = new UUSIDGenerator(options);
        return generator.generate();
    }
    return defaultGenerator.generate();
}

function uusidBatch(count, options) {
    if (options) {
        const generator = new UUSIDGenerator(options);
        return generator.generateBatch(count);
    }
    return defaultGenerator.generateBatch(count);
}

function createGenerator(options) {
    return new UUSIDGenerator(options);
}

function createPrefixedGenerator(prefix, options) {
    return new PrefixedGenerator(prefix, options);
}

function createEncryptedGenerator(options) {
    return new EncryptedGenerator(options);
}

function createWorkerPool(options) {
    return new WorkerPool(options);
}

// Utility functions
const validate = (id, options) => defaultGenerator.validate(id, options);
const extractTimestamp = (id) => defaultGenerator.extractTimestamp(id);
const isInTimeRange = (id, start, end) => defaultGenerator.isInTimeRange(id, start, end);
const analyze = (idArray) => defaultGenerator.analyze(idArray);
const getMetrics = () => defaultGenerator.getMetrics();
const healthCheck = () => defaultGenerator.healthCheck();

// Export everything
module.exports = {
    // Main functions
    uusid,
    uusidBatch,

    // Classes
    UUSIDGenerator,
    PrefixedGenerator,
    EncryptedGenerator,
    WorkerPool,

    // Factory functions
    createGenerator,
    createPrefixedGenerator,
    createEncryptedGenerator,
    createWorkerPool,

    // Utility functions
    validate,
    extractTimestamp,
    isInTimeRange,
    analyze,
    getMetrics,
    healthCheck,

    // Convenience methods
    base32: () => defaultGenerator.base32(),
    urlSafe: () => defaultGenerator.urlSafe(),
    compact: () => defaultGenerator.compact(),
    hierarchical: (options) => defaultGenerator.hierarchical(options),
    fromContent: (content, options) => defaultGenerator.fromContent(content, options),

    // Default generator instance
    defaultGenerator
};

// For ES6 imports
module.exports.default = uusid;