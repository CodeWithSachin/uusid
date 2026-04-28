// Browser-entry smoke test. Run on Node 18+ (globalThis.crypto is built in)
// or any environment that exposes Web Crypto.
//
// Verifies the /browser entry has no dependency on Node's `os`, `crypto`,
// `Buffer`, or `process.memoryUsage`, and that its async surface works.

import {
    uusid,
    uusidBatch,
    UUSIDGenerator,
    PrefixedGenerator,
    EncryptedGenerator,
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
    fromContent
} from './browser.mjs';

let passed = 0;
let failed = 0;
const fail = (msg) => { failed++; console.error('  FAIL:', msg); };
const ok = (msg) => { passed++; console.log('  ok  :', msg); };
const assert = (cond, msg) => cond ? ok(msg) : fail(msg);

console.log('\n=== browser entry smoke test ===\n');

// --- core sync surface ---
const id = uusid();
assert(typeof id === 'string' && id.length === 36, `uusid() returns 36-char id (${id})`);

const v = validate(id);
assert(v.valid && v.isValid, `validate() accepts uusid() output`);

const ts = extractTimestamp(id);
assert(typeof ts === 'number' && Math.abs(ts - Date.now()) < 5000, `extractTimestamp() returns recent timestamp`);

const batch = uusidBatch(50);
assert(batch.length === 50 && new Set(batch).size === 50, `uusidBatch(50) returns 50 unique ids`);

const a = analyze(batch);
assert(a.valid === 50 && a.duplicates === 0, `analyze() reports all 50 valid, no dupes`);

assert(typeof base32() === 'string', `base32() returns string`);
assert(typeof urlSafe() === 'string', `urlSafe() returns string`);
assert(typeof compact() === 'string' && !compact().includes('-'), `compact() has no separators`);
assert(hierarchical().split('.').length === 3, `hierarchical() returns 3-level dotted id`);

assert(isInTimeRange(id, new Date(Date.now() - 60000), new Date(Date.now() + 60000)), `isInTimeRange() accepts current id`);

const m = getMetrics();
assert(typeof m.totalGenerated === 'number' && m.totalGenerated > 0, `getMetrics() reports generation count`);
assert(!('memoryUsage' in m), `getMetrics() omits memoryUsage on browser entry`);

// --- async surface ---
const contentId = await fromContent('hello@example.com');
assert(typeof contentId === 'string' && contentId.length === 36, `fromContent() (async) returns 36-char id`);

const contentId2 = await fromContent('hello@example.com');
assert(contentId === contentId2, `fromContent() is deterministic for same input`);

// --- prefixed ---
const pgen = new PrefixedGenerator('user');
const pid = pgen.generate();
assert(pid.startsWith('user_'), `PrefixedGenerator emits prefixed id (${pid})`);

// --- encrypted (async on browser) ---
const enc = new EncryptedGenerator({ secretKey: 'browser-test-key-1234567890abcdef' });
const encId = await enc.generate();
assert(typeof encId === 'string' && encId.includes(':'), `EncryptedGenerator.generate() returns iv:ct (${encId.slice(0, 40)}...)`);

const decoded = await enc.decrypt(encId);
const decValidation = enc.validate(decoded);
assert(decValidation.valid, `decrypt() round-trips to a valid uusid`);

// --- health check ---
const hc = await healthCheck();
assert(hc.healthy === true || hc.healthy === false, `healthCheck() returns boolean healthy field`);
assert(!('memoryUsage' in (hc.metrics || {})), `healthCheck() omits memoryUsage on browser entry`);

// --- guarantee no Node-only globals reached ---
const src = await (await import('node:fs/promises')).readFile(new URL('./browser.mjs', import.meta.url), 'utf8');
assert(!/require\(['"]crypto['"]\)|require\(['"]os['"]\)|process\.memoryUsage|Buffer\./.test(src),
    `browser.mjs source contains no require('crypto'|'os'), Buffer., or process.memoryUsage`);

console.log(`\n=== ${passed} passed, ${failed} failed ===`);
process.exit(failed === 0 ? 0 : 1);
