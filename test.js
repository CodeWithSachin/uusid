
// test.js - Test suite
const { uusid, uusidBatch, createGenerator, isValid, parse } = require('./index');

console.log('🧪 Testing UUSID Package\n');

// Basic generation test
console.log('1. Basic Generation:');
for (let i = 0; i < 5; i++) {
    const id = uusid();
    console.log(`   ${id} (valid: ${isValid(id)})`);
}

// Batch generation test
console.log('\n2. Batch Generation:');
const batch = uusidBatch(3);
batch.forEach((id, i) => {
    console.log(`   ${i + 1}. ${id}`);
});

// Custom generator test
console.log('\n3. Custom Generator:');
const customGen = createGenerator({ nodeId: 'aabbccddeeff' });
console.log(`   Custom: ${customGen.generate()}`);

// Collision test
console.log('\n4. Collision Test:');
const ids = new Set();
const testCount = 100000;
console.log(`   Generating ${testCount} IDs...`);

const startTime = Date.now();
for (let i = 0; i < testCount; i++) {
    ids.add(uusid());
}
const endTime = Date.now();

console.log(`   Generated: ${ids.size} unique IDs`);
console.log(`   Collisions: ${testCount - ids.size}`);
console.log(`   Time taken: ${endTime - startTime}ms`);
console.log(`   Rate: ${Math.round(testCount / (endTime - startTime) * 1000)} IDs/sec`);

// Parse test
console.log('\n5. Parse Test:');
const testId = uusid();
console.log(`   ID: ${testId}`);
try {
    const parsed = parse(testId);
    console.log(`   Timestamp: ${parsed.timestamp.toISOString()}`);
    console.log(`   Clock Seq: ${parsed.clockSeq}`);
    console.log(`   Node: ${parsed.node}`);
    console.log(`   Version: ${parsed.version}`);
} catch (error) {
    console.log(`   Parse error: ${error.message}`);
}

console.log('\n✅ All tests completed!');
