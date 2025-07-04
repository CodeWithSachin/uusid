const { uusid, uusidBatch, createGenerator } = require('./index');

console.log('🏃 UUSID Benchmark\n');

// Single generation benchmark
console.log('1. Single Generation Speed:');
const iterations = 100000;
const startTime = Date.now();

for (let i = 0; i < iterations; i++) {
    uusid();
}

const endTime = Date.now();
const duration = endTime - startTime;
const rate = Math.round(iterations / duration * 1000);

console.log(`   Generated ${iterations} IDs in ${duration}ms`);
console.log(`   Rate: ${rate.toLocaleString()} IDs/second\n`);

// Batch generation benchmark
console.log('2. Batch Generation Speed:');
const batchStart = Date.now();
const batch = uusidBatch(10000);
const batchEnd = Date.now();
const batchRate = Math.round(10000 / (batchEnd - batchStart) * 1000);

console.log(`   Generated 10,000 IDs in ${batchEnd - batchStart}ms`);
console.log(`   Rate: ${batchRate.toLocaleString()} IDs/second\n`);

// Memory usage test
console.log('3. Memory Usage:');
const memBefore = process.memoryUsage().heapUsed / 1024 / 1024;
const largeSet = new Set();

for (let i = 0; i < 50000; i++) {
    largeSet.add(uusid());
}

const memAfter = process.memoryUsage().heapUsed / 1024 / 1024;
console.log(`   Memory before: ${memBefore.toFixed(2)} MB`);
console.log(`   Memory after: ${memAfter.toFixed(2)} MB`);
console.log(`   Memory per ID: ${((memAfter - memBefore) / 50000 * 1024).toFixed(2)} bytes\n`);

// Collision test
console.log('4. Collision Test:');
const collisionTest = new Set();
const testSize = 1000000;
console.log(`   Testing ${testSize.toLocaleString()} IDs for collisions...`);

const collisionStart = Date.now();
for (let i = 0; i < testSize; i++) {
    collisionTest.add(uusid());
}
const collisionEnd = Date.now();

console.log(`   Generated: ${collisionTest.size.toLocaleString()} unique IDs`);
console.log(`   Collisions: ${testSize - collisionTest.size}`);
console.log(`   Time: ${collisionEnd - collisionStart}ms`);
console.log(`   Success Rate: ${(collisionTest.size / testSize * 100).toFixed(6)}%`);