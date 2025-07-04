// example.js - Example usage of UUSID library

const { uusid, uusidBatch, createGenerator, isValid, parse } = require('./index');

console.log('🎯 UUSID Library Example Usage\n');

// 1. Basic usage
console.log('1. Basic Generation:');
const id1 = uusid();
const id2 = uusid();
console.log(`   ID 1: ${id1}`);
console.log(`   ID 2: ${id2}`);
console.log(`   Both valid: ${isValid(id1) && isValid(id2)}\n`);

// 2. Batch generation
console.log('2. Batch Generation:');
const batch = uusidBatch(5);
batch.forEach((id, index) => {
    console.log(`   ${index + 1}. ${id}`);
});
console.log();

// 3. Custom generator
console.log('3. Custom Generator:');
const customGenerator = createGenerator({
    nodeId: 'deadbeefcafe',
    clockSeq: 0x1234
});
console.log(`   Custom ID: ${customGenerator.generate()}\n`);

// 4. Parsing components
console.log('4. Parsing Components:');
const testId = uusid();
console.log(`   Original ID: ${testId}`);
try {
    const components = parse(testId);
    console.log(`   Timestamp: ${components.timestamp.toISOString()}`);
    console.log(`   Clock Sequence: ${components.clockSeq}`);
    console.log(`   Node ID: ${components.node}`);
    console.log(`   Version: ${components.version}`);
} catch (error) {
    console.log(`   Error: ${error.message}`);
}
console.log();

// 5. Validation examples
console.log('5. Validation Examples:');
const validExamples = [
    uusid(),
    '123e4567-e89b-12d3-a456-426614174000'
];
const invalidExamples = [
    'not-a-uuid',
    '123e4567-e89b-42d3-a456-426614174000', // wrong version
    '123e4567-e89b-12d3-2456-426614174000'  // wrong variant
];

console.log('   Valid UUIDs:');
validExamples.forEach((id, index) => {
    console.log(`     ${index + 1}. ${id} -> ${isValid(id)}`);
});

console.log('   Invalid UUIDs:');
invalidExamples.forEach((id, index) => {
    console.log(`     ${index + 1}. ${id} -> ${isValid(id)}`);
});

console.log('\n✨ Example completed!');
