/**
 * Browser entry for @code_with_sachin/uusid
 *
 * Uses Web Crypto (`globalThis.crypto`) instead of Node's `crypto`/`os`/`Buffer`.
 * Surface mirrors the server entry, with three differences:
 *   - fromContent / encrypt / decrypt are async (Promise<string>)
 *   - WorkerPool is not exported (no Web Workers port yet)
 *   - getMetrics()/healthCheck() omit memoryUsage (no browser equivalent)
 *
 * Encrypted IDs use AES-256-GCM here; the server uses AES-256-CBC.
 * Cross-entry encryption interop is NOT supported.
 */

const subtle = globalThis.crypto?.subtle;
if (!globalThis.crypto || !subtle) {
    throw new Error(
        '@code_with_sachin/uusid/browser requires Web Crypto (globalThis.crypto.subtle). ' +
        'Use a modern browser or Node 18+.'
    );
}

const randomBytes = (n) => globalThis.crypto.getRandomValues(new Uint8Array(n));

const bytesToHex = (bytes) => {
    let s = '';
    for (let i = 0; i < bytes.length; i++) s += bytes[i].toString(16).padStart(2, '0');
    return s;
};

const hexToBytes = (hex) => {
    const out = new Uint8Array(hex.length / 2);
    for (let i = 0; i < out.length; i++) {
        out[i] = parseInt(hex.substr(i * 2, 2), 16);
    }
    return out;
};

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const UUID_EPOCH = new Date('1582-10-15').getTime();

class UUSIDGenerator {
    constructor(options = {}) {
        this.nodeId = options.nodeId || this.generateNodeId();
        this.clockSeq = options.clockSeq ?? this.generateClockSeq();
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

    generateNodeId() {
        const bytes = randomBytes(6);
        bytes[0] |= 0x01;
        return bytesToHex(bytes);
    }

    generateClockSeq() {
        const bytes = randomBytes(2);
        return ((bytes[0] << 8) | bytes[1]) & 0x3fff;
    }

    getTimestamp() {
        const now = Date.now();
        if (now === this.lastTimestamp) {
            this.sequenceCounter++;
            if (this.sequenceCounter > 0xffff) {
                while (Date.now() === this.lastTimestamp) { /* busy wait */ }
                this.sequenceCounter = 0;
                this.lastTimestamp = Date.now();
            }
        } else {
            this.sequenceCounter = 0;
            this.lastTimestamp = now;
        }
        const timestamp = (this.lastTimestamp - UUID_EPOCH) * 10000;
        return { timestamp, sequence: this.sequenceCounter };
    }

    generate() {
        const { timestamp, sequence } = this.getTimestamp();
        this.updateMetrics();

        if (this.validAfter && Date.now() < this.validAfter) {
            throw new Error('Generation not allowed: Current time is before valid-after time');
        }
        if (this.validBefore && Date.now() > this.validBefore) {
            throw new Error('Generation not allowed: Current time is after valid-before time');
        }

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

    generateBatch(count) {
        const batch = [];
        for (let i = 0; i < count; i++) batch.push(this.generate());
        return batch;
    }

    generateSortedBatch(count) {
        return this.generateBatch(count).sort((a, b) => this.extractTimestamp(a) - this.extractTimestamp(b));
    }

    base32() {
        const uuid = this.generate();
        const sep = new RegExp(escapeRegex(this.separator), 'g');
        const hex = uuid.replace(sep, '');
        return this.toBase32(hexToBytes(hex));
    }

    urlSafe() {
        const sep = new RegExp(escapeRegex(this.separator), 'g');
        return this.generate().replace(sep, '').toLowerCase();
    }

    compact() {
        const sep = new RegExp(escapeRegex(this.separator), 'g');
        return this.generate().replace(sep, '');
    }

    hierarchical(options = {}) {
        const { levels = 3, separator = '.', parent = null } = options;
        const sep = new RegExp(escapeRegex(this.separator), 'g');
        const id = this.generate().replace(sep, '');

        if (parent) {
            return `${parent}${separator}${id.substring(0, 10)}`;
        }
        const parts = [];
        const partLength = Math.floor(id.length / levels);
        for (let i = 0; i < levels; i++) {
            const start = i * partLength;
            const end = i === levels - 1 ? id.length : start + partLength;
            parts.push(id.substring(start, end));
        }
        return parts.join(separator);
    }

    async fromContent(content, options = {}) {
        const { namespace = 'default', algorithm = 'SHA-256' } = options;
        const data = new TextEncoder().encode(namespace + content);
        const digest = new Uint8Array(await subtle.digest(algorithm, data));
        const hex = bytesToHex(digest);
        return [
            hex.substring(0, 8),
            hex.substring(8, 12),
            hex.substring(12, 16),
            hex.substring(16, 20),
            hex.substring(20, 32)
        ].join(this.separator);
    }

    async _importKey(usages) {
        const padded = this.secretKey.padEnd(32, '0').substring(0, 32);
        const keyBytes = new TextEncoder().encode(padded);
        return subtle.importKey('raw', keyBytes, { name: 'AES-GCM' }, false, usages);
    }

    async encrypt(data) {
        if (!this.secretKey) throw new Error('Secret key required for encryption');
        const key = await this._importKey(['encrypt']);
        const iv = randomBytes(12);
        const ct = new Uint8Array(
            await subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(data))
        );
        return bytesToHex(iv) + ':' + bytesToHex(ct);
    }

    async decrypt(encryptedData) {
        if (!this.secretKey) throw new Error('Secret key required for decryption');
        const parts = encryptedData.split(':');
        if (parts.length !== 2) throw new Error('Invalid encrypted data format');
        const key = await this._importKey(['decrypt']);
        const iv = hexToBytes(parts[0]);
        const ct = hexToBytes(parts[1]);
        const pt = await subtle.decrypt({ name: 'AES-GCM', iv }, key, ct);
        return new TextDecoder().decode(pt);
    }

    validate(id, options = {}) {
        const { allowPrefix = true } = options;
        let cleanId = id;
        if (allowPrefix && this.prefix && id.startsWith(`${this.prefix}${this.separator}`)) {
            cleanId = id.substring(this.prefix.length + 1);
        }
        const escapedSeparator = escapeRegex(this.separator);
        const uuidRegex = new RegExp(
            `^[0-9a-f]{8}${escapedSeparator}[0-9a-f]{4}${escapedSeparator}[0-9a-f]{4}${escapedSeparator}[0-9a-f]{4}${escapedSeparator}[0-9a-f]{12}$`,
            'i'
        );

        if (!uuidRegex.test(cleanId)) {
            return { valid: false, isValid: false, reason: 'Invalid format', version: null, entropy: 0 };
        }

        const hexString = cleanId.replace(new RegExp(escapedSeparator, 'g'), '');
        const entropy = hexString.split('').reduce((acc, char, i, arr) => {
            const charCount = arr.filter(c => c === char).length;
            const probability = charCount / arr.length;
            return acc - probability * Math.log2(probability);
        }, 0);

        try {
            const timestamp = this.extractTimestamp(cleanId);
            if (this.validAfter && timestamp < this.validAfter) {
                return { valid: false, isValid: false, reason: 'Before valid range', version: 'uusid', entropy };
            }
            if (this.validBefore && timestamp > this.validBefore) {
                return { valid: false, isValid: false, reason: 'After valid range', version: 'uusid', entropy };
            }
        } catch {
            return { valid: false, isValid: false, reason: 'Invalid timestamp', version: 'uusid', entropy };
        }

        return { valid: true, isValid: true, version: 'uusid', entropy };
    }

    extractTimestamp(id) {
        const escapedSeparator = escapeRegex(this.separator);
        const cleanId = id.replace(new RegExp(escapedSeparator, 'g'), '').replace(/\./g, '');
        if (cleanId.length < 32) throw new Error('Invalid ID format for timestamp extraction');

        const timeLow = parseInt(cleanId.substring(0, 8), 16);
        const timeMid = parseInt(cleanId.substring(8, 12), 16);
        const timeHigh = parseInt(cleanId.substring(12, 16), 16) & 0x0fff;
        const timestamp = (timeHigh * 0x1000000000000) + (timeMid * 0x100000000) + timeLow;
        return UUID_EPOCH + (timestamp / 10000);
    }

    isInTimeRange(id, start, end) {
        try {
            const ts = this.extractTimestamp(id);
            return ts >= new Date(start).getTime() && ts <= new Date(end).getTime();
        } catch {
            return false;
        }
    }

    analyze(idArray) {
        const analysis = {
            total: idArray.length,
            totalIds: idArray.length,
            valid: 0,
            invalid: 0,
            duplicates: 0,
            uniqueIds: 0,
            timeRange: { earliest: null, latest: null },
            formats: { standard: 0, prefixed: 0, custom: 0 },
            errors: []
        };
        const seen = new Set();
        const timestamps = [];

        for (const id of idArray) {
            if (seen.has(id)) { analysis.duplicates++; continue; }
            seen.add(id);
            const v = this.validate(id);
            if (v.valid) {
                analysis.valid++;
                if (this.prefix && id.startsWith(`${this.prefix}${this.separator}`)) analysis.formats.prefixed++;
                else if (id.includes(this.separator)) analysis.formats.standard++;
                else analysis.formats.custom++;
                try { timestamps.push(this.extractTimestamp(id)); }
                catch (e) { analysis.errors.push(`Timestamp extraction failed for ${id}: ${e.message}`); }
            } else {
                analysis.invalid++;
                analysis.errors.push(`Invalid ID ${id}: ${v.reason}`);
            }
        }
        if (timestamps.length > 0) {
            timestamps.sort((a, b) => a - b);
            analysis.timeRange.earliest = new Date(timestamps[0]);
            analysis.timeRange.latest = new Date(timestamps[timestamps.length - 1]);
        }
        analysis.uniqueIds = seen.size;
        return analysis;
    }

    parseHierarchy(id, options = {}) {
        const { separator = '.' } = options;
        const parts = id.split(separator);
        const depth = Math.max(0, parts.length - 3);
        return {
            depth,
            parts,
            parent: parts.length > 3 ? parts.slice(0, -1).join(separator) : null,
            root: parts.slice(0, 3).join(separator),
            leaf: parts[parts.length - 1]
        };
    }

    updateMetrics() {
        this.metrics.totalGenerated++;
        const now = Date.now();
        this.metrics.rateSamples.push(now);
        const cutoff = now - 10000;
        this.metrics.rateSamples = this.metrics.rateSamples.filter(t => t > cutoff);
        if (this.metrics.rateSamples.length > 1) {
            const span = now - this.metrics.rateSamples[0];
            if (span > 0) {
                this.metrics.currentRate = Math.round((this.metrics.rateSamples.length - 1) / (span / 1000));
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
            collisions: this.metrics.collisions
        };
    }

    async healthCheck() {
        const start = Date.now();
        try {
            const testIds = this.generateBatch(100);
            const allValid = testIds.every(id => this.validate(id).valid);
            const noDuplicates = new Set(testIds).size === testIds.length;
            const generationTime = Date.now() - start;
            const rate = 100 / Math.max(generationTime / 1000, 0.0001);
            return {
                healthy: allValid && noDuplicates && rate > 10,
                checks: { validation: allValid, uniqueness: noDuplicates, performance: rate > 10 },
                metrics: { generationTime: `${generationTime}ms`, rate: `${Math.round(rate)} IDs/sec` },
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return { healthy: false, error: error.message, timestamp: new Date().toISOString() };
        }
    }

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
        if (bits > 0) result += alphabet[(value << (5 - bits)) & 31];
        return result;
    }

    formatDuration(ms) {
        if (ms < 1000) return `${ms}ms`;
        if (ms < 60000) return `${Math.round(ms / 1000)}s`;
        if (ms < 3600000) return `${Math.round(ms / 60000)}m`;
        return `${Math.round(ms / 3600000)}h`;
    }
}

class PrefixedGenerator extends UUSIDGenerator {
    constructor(prefix, options = {}) {
        super({ ...options, prefix, separator: '_' });
    }
}

class EncryptedGenerator extends UUSIDGenerator {
    constructor(options = {}) {
        if (!options.secretKey) throw new Error('Secret key required for encrypted generator');
        super(options);
    }
    async generate() {
        return this.encrypt(super.generate());
    }
}

const defaultGenerator = new UUSIDGenerator();

function uusid(options) {
    return options ? new UUSIDGenerator(options).generate() : defaultGenerator.generate();
}

function uusidBatch(count, options) {
    return options ? new UUSIDGenerator(options).generateBatch(count) : defaultGenerator.generateBatch(count);
}

const createGenerator = (options) => new UUSIDGenerator(options);
const createPrefixedGenerator = (prefix, options) => new PrefixedGenerator(prefix, options);
const createEncryptedGenerator = (options) => new EncryptedGenerator(options);

const validate = (id, options) => defaultGenerator.validate(id, options);
const extractTimestamp = (id) => defaultGenerator.extractTimestamp(id);
const isInTimeRange = (id, start, end) => defaultGenerator.isInTimeRange(id, start, end);
const analyze = (idArray) => defaultGenerator.analyze(idArray);
const getMetrics = () => defaultGenerator.getMetrics();
const healthCheck = () => defaultGenerator.healthCheck();

const base32 = () => defaultGenerator.base32();
const urlSafe = () => defaultGenerator.urlSafe();
const compact = () => defaultGenerator.compact();
const hierarchical = (options) => defaultGenerator.hierarchical(options);
const fromContent = (content, options) => defaultGenerator.fromContent(content, options);

export {
    uusid,
    uusidBatch,
    UUSIDGenerator,
    PrefixedGenerator,
    EncryptedGenerator,
    createGenerator,
    createPrefixedGenerator,
    createEncryptedGenerator,
    validate,
    extractTimestamp,
    isInTimeRange,
    analyze,
    getMetrics,
    healthCheck,
    base32,
    urlSafe,
    compact,
    hierarchical,
    fromContent,
    defaultGenerator
};

export default uusid;
