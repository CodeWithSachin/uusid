const {
    uusid,
    uusidBatch,
    createGenerator,
    createPrefixedGenerator,
    createEncryptedGenerator,
    createWorkerPool,
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
    UUSIDGenerator
} = require('./index.js');

console.log('🧪 Enhanced UUSID Test Suite\n');

// Test counter
let tests = 0;
let passed = 0;

function test(name, fn) {
    tests++;
    try {
        console.log(`⚡ ${name}`);
        fn();
        console.log('  ✅ PASS\n');
        passed++;
    } catch (error) {
        console.log(`  ❌ FAIL: ${error.message}\n`);
    }
}

// Basic Generation Tests
test('Basic UUSID Generation', () => {
    const id = uusid();
    console.log(`  Generated: ${id}`);

    if (!id || typeof id !== 'string') {
        throw new Error('Should generate a string');
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
        throw new Error('Should match UUID format');
    }
});

test('Batch Generation', () => {
    const batch = uusidBatch(5);
    console.log(`  Generated batch: ${batch.length} IDs`);

    if (batch.length !== 5) {
        throw new Error('Should generate exactly 5 IDs');
    }

    const uniqueIds = new Set(batch);
    if (uniqueIds.size !== 5) {
        throw new Error('All IDs should be unique');
    }
});

// Enhanced Format Tests
test('Base32 Format', () => {
    const id = base32();
    console.log(`  Base32 ID: ${id}`);

    if (!id || typeof id !== 'string') {
        throw new Error('Should generate base32 string');
    }

    if (!/^[A-Z2-7]+$/.test(id)) {
        throw new Error('Should contain only base32 characters');
    }
});

test('URL-Safe Format', () => {
    const id = urlSafe();
    console.log(`  URL-Safe ID: ${id}`);

    if (!id || typeof id !== 'string') {
        throw new Error('Should generate URL-safe string');
    }

    if (id.includes('-') || id.includes('+') || id.includes('/')) {
        throw new Error('Should not contain URL-unsafe characters');
    }
});

test('Compact Format', () => {
    const id = compact();
    console.log(`  Compact ID: ${id}`);

    if (!id || typeof id !== 'string') {
        throw new Error('Should generate compact string');
    }

    if (id.includes('-')) {
        throw new Error('Should not contain separators');
    }

    if (id.length !== 32) {
        throw new Error('Should be 32 characters long');
    }
});

// Prefixed Generator Tests
test('Prefixed Generator', () => {
    const userGen = createPrefixedGenerator('usr');
    const ordGen = createPrefixedGenerator('ord');

    const userId = userGen.generate();
    const orderId = ordGen.generate();

    console.log(`  User ID: ${userId}`);
    console.log(`  Order ID: ${orderId}`);

    if (!userId.startsWith('usr_')) {
        throw new Error('User ID should start with usr_');
    }

    if (!orderId.startsWith('ord_')) {
        throw new Error('Order ID should start with ord_');
    }
});

// Hierarchical ID Tests
test('Hierarchical IDs', () => {
    const parentId = hierarchical();
    const childId = hierarchical({ parent: parentId });
    const grandChildId = hierarchical({ parent: childId });

    console.log(`  Parent: ${parentId}`);
    console.log(`  Child: ${childId}`);
    console.log(`  GrandChild: ${grandChildId}`);

    const generator = createGenerator();
    const childInfo = generator.parseHierarchy(childId);
    const grandChildInfo = generator.parseHierarchy(grandChildId);

    if (childInfo.depth !== 1) {
        throw new Error('Child should have depth 1');
    }

    if (grandChildInfo.depth !== 2) {
        throw new Error('GrandChild should have depth 2');
    }
});

// Content-Based ID Tests
test('Content-Based IDs', () => {
    const email = 'user@example.com';
    const id1 = fromContent(email);
    const id2 = fromContent(email);
    const id3 = fromContent('different@example.com');

    console.log(`  Email ID 1: ${id1}`);
    console.log(`  Email ID 2: ${id2}`);
    console.log(`  Different Email ID: ${id3}`);

    if (id1 !== id2) {
        throw new Error('Same content should generate same ID');
    }

    if (id1 === id3) {
        throw new Error('Different content should generate different IDs');
    }
});

// Encryption Tests
test('Encrypted Generator', () => {
    const secretKey = 'my-super-secret-key-32-characters';
    const encGen = createEncryptedGenerator({ secretKey });

    const encryptedId = encGen.generate();
    console.log(`  Encrypted ID: ${encryptedId}`);

    if (!encryptedId.includes(':')) {
        throw new Error('Encrypted ID should contain auth tag separator');
    }

    const decryptedId = encGen.decrypt(encryptedId);
    console.log(`  Decrypted ID: ${decryptedId}`);

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(decryptedId)) {
        throw new Error('Decrypted ID should be valid UUSID');
    }
});

// Validation Tests
test('Enhanced Validation', () => {
    const id = uusid();
    const validation = validate(id);

    console.log(`  Validation result:`, validation);

    if (!validation.isValid) {
        throw new Error('Valid ID should pass validation');
    }

    if (validation.version !== 'uusid') {
        throw new Error('Should identify as uusid version');
    }

    if (validation.entropy <= 0) {
        throw new Error('Should have positive entropy');
    }
});

// Timestamp Extraction Tests
test('Timestamp Extraction', () => {
    const beforeTime = Date.now();
    const id = uusid();
    const afterTime = Date.now();

    const extractedTime = extractTimestamp(id);
    console.log(`  Extracted timestamp: ${new Date(extractedTime)}`);

    if (extractedTime < beforeTime || extractedTime > afterTime) {
        throw new Error('Extracted timestamp should be within generation window');
    }
});

// Time Range Tests
test('Time Range Validation', () => {
    const id = uusid();
    const oneHourAgo = new Date(Date.now() - 3600000);
    const oneHourLater = new Date(Date.now() + 3600000);

    const isInRange = isInTimeRange(id, oneHourAgo, oneHourLater);
    console.log(`  ID in time range: ${isInRange}`);

    if (!isInRange) {
        throw new Error('Current ID should be in recent time range');
    }
});

// Analysis Tests
test('Batch Analysis', () => {
    const batch = uusidBatch(100);
    const analysis = analyze(batch);

    console.log(`  Analysis result:`, analysis);

    if (analysis.totalIds !== 100) {
        throw new Error('Should analyze all 100 IDs');
    }

    if (analysis.uniqueIds !== 100) {
        throw new Error('All 100 IDs should be unique');
    }

    if (analysis.duplicates !== 0) {
        throw new Error('Should have no duplicates');
    }
});

// Metrics Tests
test('Generator Metrics', () => {
    const metrics = getMetrics();
    console.log(`  Metrics:`, metrics);

    if (metrics.totalGenerated <= 0) {
        throw new Error('Should have generated some IDs');
    }

    if (typeof metrics.uptime !== 'string') {
        throw new Error('Uptime should be a string');
    }
});

// Health Check Tests
test('Health Check', async () => {
    const health = await healthCheck();
    console.log(`  Health check:`, health);

    if (health.status !== 'healthy') {
        throw new Error('Generator should be healthy');
    }

    if (!health.lastGenerated) {
        throw new Error('Should have last generated ID');
    }
});

// Worker Pool Tests
test('Worker Pool Generation', async () => {
    const pool = createWorkerPool({ workers: 2, batchSize: 50 });
    const largeBatch = await pool.generateBatch(200);

    console.log(`  Worker pool generated: ${largeBatch.length} IDs`);

    if (largeBatch.length !== 200) {
        throw new Error('Should generate exactly 200 IDs');
    }

    const uniqueIds = new Set(largeBatch);
    if (uniqueIds.size !== 200) {
        throw new Error('All IDs should be unique');
    }
});

// Time Restriction Tests
test('Time Restrictions', () => {
    const futureTime = new Date(Date.now() + 86400000); // Tomorrow
    const restrictedGen = createGenerator({
        validBefore: futureTime
    });

    const id = restrictedGen.generate();
    console.log(`  Time-restricted ID: ${id}`);

    if (!id) {
        throw new Error('Should generate ID within valid time');
    }

    // Test past restriction
    const pastGen = createGenerator({
        validAfter: new Date(Date.now() + 86400000) // Tomorrow
    });

    try {
        pastGen.generate();
        throw new Error('Should not generate ID outside valid time');
    } catch (error) {
        if (!error.message.includes('not allowed')) {
            throw error;
        }
        console.log(`  ✓ Correctly rejected past generation`);
    }
});

// Custom Separator Tests
test('Custom Separators', () => {
    const generator = createGenerator({ separator: '_' });
    const id = generator.generate();

    console.log(`  Custom separator ID: ${id}`);

    if (!id.includes('_')) {
        throw new Error('Should use custom separator');
    }

    if (id.includes('-')) {
        throw new Error('Should not contain default separator');
    }
});

// Performance Test
test('Performance Benchmark', () => {
    const count = 1000;
    const startTime = Date.now();

    for (let i = 0; i < count; i++) {
        uusid();
    }

    const endTime = Date.now();
    const duration = endTime - startTime;
    const rate = Math.round(count / (duration / 1000));

    console.log(`  Generated ${count} IDs in ${duration}ms`);
    console.log(`  Rate: ${rate} IDs/second`);

    if (rate < 1000) {
        console.log(`  ⚠️  Warning: Generation rate below 1000/sec`);
    }
});

// Summary
console.log(`📊 Test Results: ${passed}/${tests} tests passed`);

if (passed === tests) {
    console.log('🎉 All tests passed! UUSID library is working correctly.');
    process.exit(0);
} else {
    console.log('❌ Some tests failed. Please check the implementation.');
    process.exit(1);
}
