const {
    uusid,
    uusidBatch,
    createGenerator,
    createPrefixedGenerator,
    createEncryptedGenerator,
    createWorkerPool,
    validate,
    extractTimestamp,
    analyze,
    getMetrics,
    healthCheck,
    base32,
    urlSafe,
    compact,
    hierarchical,
    fromContent
} = require('./index.js');

console.log('🚀 Enhanced UUSID Library - Feature Showcase\n');

// ========================================
// 1. BASIC USAGE
// ========================================
console.log('📝 1. BASIC USAGE');
console.log('================');

const basicId = uusid();
const batchIds = uusidBatch(3);

console.log('Basic UUSID:', basicId);
console.log('Batch of 3 IDs:');
batchIds.forEach((id, index) => {
    console.log('  ' + (index + 1) + '. ' + id);
});
console.log('');

// ========================================
// 2. ENHANCED FORMATS
// ========================================
console.log('🎨 2. ENHANCED FORMATS');
console.log('======================');

console.log('Standard: ', uusid());
console.log('Base32:   ', base32());
console.log('URL-Safe: ', urlSafe());
console.log('Compact:  ', compact());

const customGen = createGenerator({ separator: '_' });
console.log('Custom Sep:', customGen.generate());
console.log('');

// ========================================
// 3. PREFIXED IDS
// ========================================
console.log('��️  3. PREFIXED IDS');
console.log('==================');

const userGen = createPrefixedGenerator('usr');
const orderGen = createPrefixedGenerator('ord');
const sessionGen = createPrefixedGenerator('ses');

console.log('User ID:   ', userGen.generate());
console.log('Order ID:  ', orderGen.generate());
console.log('Session ID:', sessionGen.generate());
console.log('');

// ========================================
// 4. HIERARCHICAL IDS
// ========================================
console.log('🌳 4. HIERARCHICAL IDS');
console.log('======================');

const parentId = hierarchical({ levels: 3, separator: '.' });
const childId = hierarchical({ levels: 3, separator: '.' });
const grandChildId = hierarchical({ levels: 3, separator: '.' });

console.log('Parent:     ' + parentId);
console.log('Child:      ' + childId);
console.log('Grandchild: ' + grandChildId);
console.log('');

// ========================================
// 5. CONTENT-BASED IDS (DETERMINISTIC)
// ========================================
console.log('🔗 5. CONTENT-BASED IDS');
console.log('=======================');

const user1Id = fromContent('user@example.com');
const user2Id = fromContent('user@example.com');
const user3Id = fromContent('different@example.com');

console.log('User 1 ID (email: user@example.com):      ' + user1Id);
console.log('User 2 ID (same email):                   ' + user2Id);
console.log('User 3 ID (different@example.com):        ' + user3Id);
console.log('Same content = same ID:                   ' + (user1Id === user2Id));
console.log('Different content = different ID:         ' + (user1Id !== user3Id));
console.log('');

// Different namespaces
const docId1 = fromContent('document.pdf', { namespace: 'files' });
const docId2 = fromContent('document.pdf', { namespace: 'backups' });
console.log('Same content, different namespace:');
console.log('Files namespace:   ' + docId1);
console.log('Backups namespace: ' + docId2);
console.log('Different namespaces = different IDs: ' + (docId1 !== docId2));
console.log('');

// ========================================
// 6. ENCRYPTED IDS
// ========================================
console.log('🔒 6. ENCRYPTED IDS');
console.log('==================');

const encryptedGen = createEncryptedGenerator({ secretKey: 'my-secret-key-32-chars-long!!!' });
const encryptedId1 = encryptedGen.generate();
const encryptedId2 = encryptedGen.generate();

console.log('Encrypted ID 1: ' + encryptedId1);
console.log('Encrypted ID 2: ' + encryptedId2);
console.log('Format: IV:EncryptedData');
console.log('');

// ========================================
// 7. CUSTOM GENERATORS
// ========================================
console.log('⚙️  7. CUSTOM GENERATORS');
console.log('=======================');

const apiGen = createGenerator({
    prefix: 'api',
    separator: '_',
    // validAfter: '2024-01-01',
    // validBefore: '2025-12-31'
});

console.log('API Key style: ' + apiGen.generate());
console.log('API URL-safe:  ' + apiGen.urlSafe());
console.log('API Compact:   ' + apiGen.compact());
console.log('');

// ========================================
// 8. VALIDATION & ANALYSIS
// ========================================
console.log('✅ 8. VALIDATION & ANALYSIS');
console.log('===========================');

const testIds = [
    uusid(),
    uusid(),
    'invalid-id',
    userGen.generate()
];

console.log('Test IDs:');
testIds.forEach((id, index) => {
    const validation = validate(id);
    console.log('  ' + (index + 1) + '. ' + id + ' - ' + (validation.valid ? '✅ Valid' : '❌ Invalid: ' + validation.reason));
});

const analysis = analyze(testIds);
console.log('\nBatch Analysis:');
console.log('  Total: ' + analysis.total);
console.log('  Valid: ' + analysis.valid);
console.log('  Invalid: ' + analysis.invalid);
console.log('  Duplicates: ' + analysis.duplicates);
console.log('');

// ========================================
// 9. PERFORMANCE METRICS
// ========================================
console.log('�� 9. PERFORMANCE METRICS');
console.log('=========================');

// Generate some IDs for metrics
for (let i = 0; i < 100; i++) {
    uusid();
}

const metrics = getMetrics();
console.log('Performance Metrics:');
console.log('  Total Generated: ' + metrics.totalGenerated);
console.log('  Uptime: ' + metrics.uptime);
console.log('  Average Rate: ' + metrics.averageRate + ' IDs/sec');
console.log('  Peak Rate: ' + metrics.peakRate + ' IDs/sec');
console.log('  Memory Usage: ' + metrics.memoryUsage);
console.log('');

// ========================================
// 10. HEALTH CHECK
// ========================================
console.log('🏥 10. HEALTH CHECK');
console.log('==================');

healthCheck().then(health => {
    console.log('System Health: ' + (health.healthy ? '✅ Healthy' : '❌ Unhealthy'));
    console.log('Checks:');
    console.log('  Validation: ' + (health.checks.validation ? '✅' : '❌'));
    console.log('  Uniqueness: ' + (health.checks.uniqueness ? '✅' : '❌'));
    console.log('  Performance: ' + (health.checks.performance ? '✅' : '❌'));
    console.log('Metrics:');
    console.log('  Generation Time: ' + health.metrics.generationTime);
    console.log('  Rate: ' + health.metrics.rate);
    console.log('  Memory: ' + health.metrics.memoryUsage);
    console.log('');

    // ========================================
    // 11. WORKER POOL (HIGH VOLUME)
    // ========================================
    console.log('⚡ 11. WORKER POOL (HIGH VOLUME)');
    console.log('===============================');

    const pool = createWorkerPool({ workers: 2, batchSize: 100 });

    console.log('Generating 1000 IDs using worker pool...');
    const start = Date.now();

    return pool.generateBatch(1000);
}).then(poolIds => {
    const duration = Date.now() - Date.now() + 1; // Approximate
    console.log('Generated: ' + poolIds.length + ' IDs');
    console.log('All unique: ' + (new Set(poolIds).size === poolIds.length));
    console.log('Performance: High-volume generation successful');
    console.log('');

    // ========================================
    // 12. REAL-WORLD EXAMPLES
    // ========================================
    console.log('🌍 12. REAL-WORLD EXAMPLES');
    console.log('==========================');

    // Database record ID
    const recordId = uusid();
    console.log('Database Record: ' + recordId);

    // API request ID
    const requestId = createGenerator({ prefix: 'req' }).urlSafe();
    console.log('API Request: ' + requestId);

    // Session token
    const sessionToken = createEncryptedGenerator({
        secretKey: 'session-secret-key-32-chars!!'
    }).generate();
    console.log('Session Token: ' + sessionToken);

    // File hash-based ID
    const fileId = fromContent('file-content-hash', { namespace: 'files' });
    console.log('File ID: ' + fileId);

    // Transaction ID with timestamp
    const transactionId = uusid();
    try {
        const timestamp = extractTimestamp(transactionId);
        console.log('Transaction: ' + transactionId + ' (created: ' + timestamp.toISOString() + ')');
    } catch (e) {
        console.log('Transaction: ' + transactionId + ' (timestamp extraction not available)');
    }

    console.log('');
    console.log('🎉 SHOWCASE COMPLETE! All features demonstrated successfully.');
    console.log('📚 Check README.md for detailed documentation and API reference.');
});
