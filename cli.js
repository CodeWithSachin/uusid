#!/usr/bin/env node

const {
    uusid,
    uusidBatch,
    createGenerator,
    createPrefixedGenerator,
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

const fs = require('fs');
const path = require('path');

// CLI version
const version = require('./package.json').version;

// Command-line argument parsing
const args = process.argv.slice(2);
const command = args[0];

function showHelp() {
    console.log(`
🚀 UUSID CLI v${version} - Ultra Unique Secure ID Generator

USAGE:
  uusid [command] [options]

COMMANDS:
  generate, gen     Generate one or more UUSIDs
  validate, val     Validate UUSID format
  analyze          Analyze batch of UUSIDs from file
  benchmark        Run performance benchmarks
  health           Check generator health
  metrics          Show performance metrics
  help, --help     Show this help message
  version          Show version information

GENERATE OPTIONS:
  --count, -c      Number of IDs to generate (default: 1)
  --format, -f     Output format: standard|base32|url-safe|compact (default: standard)
  --prefix, -p     Add prefix to generated IDs
  --separator, -s  Custom separator character (default: -)
  --batch          Generate as batch (faster for multiple IDs)
  --hierarchical   Generate hierarchical ID
  --content        Generate content-based ID from input
  --output, -o     Output to file

EXAMPLES:
  uusid generate                           # Generate single UUSID
  uusid gen -c 10                         # Generate 10 UUSIDs
  uusid gen -c 5 -f base32                # Generate 5 base32 UUSIDs
  uusid gen -p usr -c 3                   # Generate 3 prefixed user IDs
  uusid gen --content "user@example.com"  # Generate content-based ID
  uusid validate 550e8400-e29b-41d4-...   # Validate UUSID
  uusid analyze ids.txt                   # Analyze IDs from file
  uusid benchmark                         # Run performance test
  uusid health                            # Check system health
`);
}

function showVersion() {
    console.log(`UUSID CLI v${version}`);
    console.log(`Node.js ${process.version}`);
    console.log(`Platform: ${process.platform} ${process.arch}`);
}

async function generateCommand() {
    let count = 1;
    let format = 'standard';
    let prefix = null;
    let separator = '-';
    let batch = false;
    let hierarchical_mode = false;
    let content = null;
    let output = null;

    // Parse options
    for (let i = 1; i < args.length; i++) {
        const arg = args[i];
        const next = args[i + 1];

        switch (arg) {
            case '--count':
            case '-c':
                count = parseInt(next);
                i++;
                break;
            case '--format':
            case '-f':
                format = next;
                i++;
                break;
            case '--prefix':
            case '-p':
                prefix = next;
                i++;
                break;
            case '--separator':
            case '-s':
                separator = next;
                i++;
                break;
            case '--batch':
                batch = true;
                break;
            case '--hierarchical':
                hierarchical_mode = true;
                break;
            case '--content':
                content = next;
                i++;
                break;
            case '--output':
            case '-o':
                output = next;
                i++;
                break;
        }
    }

    let generator;
    if (prefix) {
        generator = createPrefixedGenerator(prefix, { separator });
    } else {
        generator = createGenerator({ separator });
    }

    let ids = [];

    if (content) {
        // Content-based ID
        const id = fromContent(content);
        ids = [id];
        console.log(`Content-based ID for "${content}": ${id}`);
    } else if (hierarchical_mode) {
        // Hierarchical IDs
        for (let i = 0; i < count; i++) {
            const id = hierarchical();
            ids.push(id);
        }
    } else if (batch && count > 1) {
        // Batch generation
        if (prefix) {
            for (let i = 0; i < count; i++) {
                ids.push(generator.generate());
            }
        } else {
            ids = uusidBatch(count);
        }
    } else {
        // Individual generation
        for (let i = 0; i < count; i++) {
            let id;

            switch (format) {
                case 'base32':
                    id = prefix ? generator.base32() : base32();
                    break;
                case 'url-safe':
                    id = prefix ? generator.urlSafe() : urlSafe();
                    break;
                case 'compact':
                    id = prefix ? generator.compact() : compact();
                    break;
                default:
                    id = prefix ? generator.generate() : uusid();
            }

            ids.push(id);
        }
    }

    if (output) {
        // Write to file
        fs.writeFileSync(output, ids.join('\n') + '\n');
        console.log(`Generated ${ids.length} UUSIDs and saved to ${output}`);
    } else {
        // Print to console
        ids.forEach(id => console.log(id));
    }
}

function validateCommand() {
    const id = args[1];
    if (!id) {
        console.error('Error: Please provide a UUSID to validate');
        process.exit(1);
    }

    const result = validate(id);

    console.log(`UUSID: ${id}`);
    console.log(`Valid: ${result.isValid ? '✅' : '❌'}`);

    if (result.isValid) {
        console.log(`Version: ${result.version}`);
        console.log(`Timestamp: ${result.timestamp.toISOString()}`);
        console.log(`Entropy: ${(result.entropy * 100).toFixed(1)}%`);
        console.log(`Collision Probability: ${result.collisionProbability.toExponential(2)}`);

        try {
            const timestamp = extractTimestamp(id);
            const age = Date.now() - timestamp;
            console.log(`Age: ${formatDuration(age)}`);
        } catch (error) {
            // Skip age calculation if extraction fails
        }
    }

    if (result.warnings.length > 0) {
        console.log('Warnings:');
        result.warnings.forEach(warning => console.log(`  ⚠️  ${warning}`));
    }
}

async function analyzeCommand() {
    const filename = args[1];
    if (!filename) {
        console.error('Error: Please provide a file containing UUSIDs to analyze');
        process.exit(1);
    }

    if (!fs.existsSync(filename)) {
        console.error(`Error: File ${filename} does not exist`);
        process.exit(1);
    }

    const content = fs.readFileSync(filename, 'utf8');
    const ids = content.split('\n').filter(line => line.trim());

    console.log(`Analyzing ${ids.length} UUSIDs from ${filename}...\n`);

    const result = analyze(ids);

    console.log('📊 Analysis Results:');
    console.log(`Total IDs: ${result.totalIds}`);
    console.log(`Unique IDs: ${result.uniqueIds}`);
    console.log(`Duplicates: ${result.duplicates}`);
    console.log(`Valid IDs: ${result.validIds}`);
    console.log(`Invalid IDs: ${result.invalidIds}`);
    console.log(`Time Span: ${result.timeSpan}`);
    console.log(`Generation Rate: ${result.generationRate}`);

    if (result.duplicates > 0) {
        console.log(`\n⚠️  Warning: ${result.duplicates} duplicate IDs found!`);
    }

    if (result.invalidIds > 0) {
        console.log(`\n❌ Warning: ${result.invalidIds} invalid IDs found!`);
    }
}

async function benchmarkCommand() {
    console.log('🔥 Running UUSID benchmarks...\n');

    const iterations = 10000;

    // Basic generation benchmark
    console.time('Basic Generation');
    for (let i = 0; i < iterations; i++) {
        uusid();
    }
    console.timeEnd('Basic Generation');

    // Batch generation benchmark
    console.time('Batch Generation');
    uusidBatch(iterations);
    console.timeEnd('Batch Generation');

    // Format benchmarks
    console.time('Base32 Format');
    for (let i = 0; i < iterations / 4; i++) {
        base32();
    }
    console.timeEnd('Base32 Format');

    // Validation benchmark
    const testId = uusid();
    console.time('Validation');
    for (let i = 0; i < iterations; i++) {
        validate(testId);
    }
    console.timeEnd('Validation');

    console.log(`\n✅ Benchmark complete! (${iterations} iterations each)`);
}

async function healthCommand() {
    console.log('🏥 Checking UUSID generator health...\n');

    const health = await healthCheck();
    const metrics = getMetrics();

    console.log('Health Status:', health.status === 'healthy' ? '✅ Healthy' : '❌ Unhealthy');
    console.log('Entropy:', health.entropy === 'good' ? '✅ Good' : '⚠️  Low');
    console.log('Performance:', health.performance);
    console.log('Memory:', health.memory);
    console.log('Last Generated:', health.lastGenerated);
    console.log('Check Time:', health.timestamp);

    console.log('\n📊 Metrics:');
    console.log(`Total Generated: ${metrics.totalGenerated.toLocaleString()}`);
    console.log(`Average Rate: ${metrics.averageRate.toLocaleString()} ops/sec`);
    console.log(`Peak Rate: ${metrics.peakRate.toLocaleString()} ops/sec`);
    console.log(`Current Rate: ${metrics.currentRate.toLocaleString()} ops/sec`);
    console.log(`Uptime: ${metrics.uptime}`);
    console.log(`Memory Usage: ${metrics.memoryUsage}`);
    console.log(`Collisions: ${metrics.collisions}`);
}

function metricsCommand() {
    const metrics = getMetrics();

    console.log('📊 UUSID Generator Metrics\n');
    console.log(`Total Generated: ${metrics.totalGenerated.toLocaleString()}`);
    console.log(`Average Rate: ${metrics.averageRate.toLocaleString()} ops/sec`);
    console.log(`Peak Rate: ${metrics.peakRate.toLocaleString()} ops/sec`);
    console.log(`Current Rate: ${metrics.currentRate.toLocaleString()} ops/sec`);
    console.log(`Uptime: ${metrics.uptime}`);
    console.log(`Memory Usage: ${metrics.memoryUsage}`);
    console.log(`Collisions: ${metrics.collisions}`);
}

function formatDuration(ms) {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${Math.round(ms / 1000)}s`;
    if (ms < 3600000) return `${Math.round(ms / 60000)}m`;
    return `${Math.round(ms / 3600000)}h`;
}

// Main command router
async function main() {
    if (args.length === 0 || command === 'help' || command === '--help') {
        showHelp();
        return;
    }

    switch (command) {
        case 'version':
        case '--version':
            showVersion();
            break;
        case 'generate':
        case 'gen':
            await generateCommand();
            break;
        case 'validate':
        case 'val':
            validateCommand();
            break;
        case 'analyze':
            await analyzeCommand();
            break;
        case 'benchmark':
            await benchmarkCommand();
            break;
        case 'health':
            await healthCommand();
            break;
        case 'metrics':
            metricsCommand();
            break;
        default:
            console.error(`Unknown command: ${command}`);
            console.error('Run "uusid help" for usage information');
            process.exit(1);
    }
}

// Handle errors gracefully
process.on('uncaughtException', (error) => {
    console.error('Error:', error.message);
    process.exit(1);
});

process.on('unhandledRejection', (error) => {
    console.error('Error:', error.message);
    process.exit(1);
});

// Run the CLI
main().catch((error) => {
    console.error('Error:', error.message);
    process.exit(1);
});
