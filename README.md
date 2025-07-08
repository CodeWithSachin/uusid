# 🚀 UUSID - Ultra Unique Secure ID Generator

[![NPM Version](https://img.shields.io/npm/v/@code_with_sachin/uusid.svg)](https://www.npmjs.com/package/@code_with_sachin/uusid)
[![License](https://img.shields.io/npm/l/@code_with_sachin/uusid.svg)](LICENSE)
[![Node.js Version](https://img.shields.io/node/v/@code_with_sachin/uusid.svg)](https://nodejs.org)

A next-generation ID generator for Node.js applications with advanced features, multiple formats, encryption support, and enterprise-grade performance. Generate unique, secure, and customizable identifiers with zero dependencies.

## ✨ Features

- 🎯 **Multiple ID Formats**: Standard UUID, Base32, URL-safe, Compact, Hierarchical
- 🔒 **Security**: Built-in encryption, deterministic content-based IDs
- ⚡ **High Performance**: 100K+ IDs/second with worker pool support
- 🔧 **Customizable**: Prefixes, separators, time ranges, custom namespaces
- 📊 **Analytics**: Built-in metrics, health checks, collision detection
- 🏗️ **Enterprise Ready**: TypeScript support, CLI tools, comprehensive testing
- 🌐 **Universal**: Works in Node.js 14+ environments
- 📱 **Developer Friendly**: Rich API, detailed documentation, examples

## 🚀 Quick Start

```bash
npm install @code_with_sachin/uusid
```

```javascript
const { uusid } = require('@code_with_sachin/uusid');

// Generate a standard UUSID
const id = uusid();
console.log(id); // "550e8400-e29b-41d4-a716-446655440000"
```

## 📖 API Reference

### Basic Usage

```javascript
const {
    uusid,           // Generate single ID
    uusidBatch,      // Generate multiple IDs
    validate,        // Validate ID format
    createGenerator  // Create custom generator
} = require('@code_with_sachin/uusid');

// Generate single ID
const id = uusid();

// Generate batch of IDs
const batch = uusidBatch(100);

// Validate ID
const isValid = validate(id);
console.log(isValid); // { valid: true }
```

### Advanced Generators

```javascript
const {
    createGenerator,
    createPrefixedGenerator,
    createEncryptedGenerator,
    createWorkerPool
} = require('@code_with_sachin/uusid');

// Custom generator with options
const generator = createGenerator({
    prefix: 'USER',
    separator: '_',
    validAfter: '2024-01-01',
    validBefore: '2025-12-31'
});

// Prefixed IDs
const prefixedGen = createPrefixedGenerator('API');
const apiId = prefixedGen.generate(); // "API-550e8400-e29b-41d4..."

// Encrypted IDs
const encryptedGen = createEncryptedGenerator({
    secretKey: 'your-secret-key'
});
const secureId = encryptedGen.generate(); // Encrypted UUID

// Worker pool for high-volume generation
const pool = createWorkerPool({ workers: 4 });
const manyIds = await pool.generateBatch(50000);
```

### Alternative Formats

```javascript
const {
    base32,       // Base32 encoded
    urlSafe,      // URL-safe format
    compact,      // Compact 22-character format
    hierarchical, // Hierarchical with dots
    fromContent   // Content-based deterministic
} = require('@code_with_sachin/uusid');

console.log(base32());      // "KRSXG5CTMZRW6Z3JN5XGK4TL"
console.log(urlSafe());     // "550e8400e29b41d4a716446655440000"
console.log(compact());     // "550e8400e29b41d4a71644"
console.log(hierarchical({ levels: 3 })); // "550e8400.e29b41d4.a716446655440000"

// Deterministic IDs from content
const contentId1 = fromContent('user@example.com');
const contentId2 = fromContent('user@example.com');
console.log(contentId1 === contentId2); // true - same content = same ID
```

### Analytics & Monitoring

```javascript
const {
    getMetrics,
    healthCheck,
    analyze
} = require('@code_with_sachin/uusid');

// Performance metrics
const metrics = getMetrics();
console.log(metrics);
/*
{
  totalGenerated: 1500,
  uptime: "2m",
  averageRate: 750,
  currentRate: 1200,
  peakRate: 1500,
  collisions: 0,
  memoryUsage: "15MB"
}
*/

// Health check
const health = await healthCheck();
console.log(health.healthy); // true

// Batch analysis
const ids = [uusid(), uusid(), 'invalid-id'];
const analysis = analyze(ids);
console.log(analysis);
/*
{
  total: 3,
  valid: 2,
  invalid: 1,
  duplicates: 0,
  timeRange: { earliest: Date, latest: Date },
  formats: { standard: 2, prefixed: 0, custom: 0 }
}
*/
```

## 🎯 Use Cases

### User Management
```javascript
const userGen = createPrefixedGenerator('USER');
const userId = userGen.generate(); // "USER-550e8400-e29b-41d4..."
```

### API Keys
```javascript
const apiKeyGen = createGenerator({ 
    prefix: 'sk',
    separator: '_'
});
const apiKey = apiKeyGen.urlSafe(); // "sk_550e8400e29b41d4a716..."
```

### Session IDs
```javascript
const sessionGen = createEncryptedGenerator({
    secretKey: process.env.SESSION_SECRET
});
const sessionId = sessionGen.generate(); // Encrypted session ID
```

### Database Records
```javascript
// Content-based IDs for deterministic generation
const recordId = fromContent(JSON.stringify(record));
```

### Distributed Systems
```javascript
const pool = createWorkerPool({ workers: 8 });
const transactionIds = await pool.generateBatch(10000);
```

## 🔧 CLI Usage

Install globally for CLI access:

```bash
npm install -g @code_with_sachin/uusid
```

```bash
# Generate IDs
uusid generate --count 10 --format base32
uusid gen -c 5 -f url-safe --prefix API

# Validate IDs
uusid validate 550e8400-e29b-41d4-a716-446655440000

# Performance testing
uusid benchmark --iterations 100000
uusid health
uusid metrics

# Analysis
uusid analyze ids.txt
```

## 🚀 Performance

Based on benchmarks on modern hardware:

| Operation | Rate | Use Case |
|-----------|------|----------|
| Basic Generation | 6,000+ ops/sec | Standard applications |
| Worker Pool | 66,000+ ops/sec | High-volume scenarios |
| Validation | 10M+ ops/sec | Real-time validation |
| Content-Based | 750k+ ops/sec | Deterministic IDs |
| Encrypted | 57k+ ops/sec | Secure applications |

### Memory Usage
- ~50 bytes per ID
- Minimal memory footprint
- Automatic garbage collection
- Memory-efficient batch operations

### Collision Resistance
- Zero collisions in 500k+ ID test
- Cryptographically secure randomness
- MAC address-based node identification
- High-resolution timestamp precision

## 🛡️ Security Features

### Encryption Support
```javascript
const secureGen = createEncryptedGenerator({
    secretKey: 'your-256-bit-secret-key'
});
const encryptedId = secureGen.generate();
```

### Time-based Validation
```javascript
const timeGen = createGenerator({
    validAfter: '2024-01-01',
    validBefore: '2025-12-31'
});
```

### Content-based Deterministic IDs
```javascript
// Same content always generates same ID
const userId = fromContent('user@example.com', { 
    namespace: 'users',
    algorithm: 'sha256'
});
```

## 📊 Monitoring & Analytics

### Built-in Metrics
- Generation rate tracking
- Memory usage monitoring
- Collision detection
- Performance analytics

### Health Checks
- System health validation
- Performance benchmarking
- Uniqueness verification
- Error detection

### Batch Analysis
- Format analysis
- Duplicate detection
- Time range analysis
- Validation reporting

## 🔄 Migration Guide

### From UUID v4
```javascript
// Before
const { v4: uuidv4 } = require('uuid');
const id = uuidv4();

// After
const { uusid } = require('@code_with_sachin/uusid');
const id = uusid();
```

### From Crypto Random
```javascript
// Before
const crypto = require('crypto');
const id = crypto.randomBytes(16).toString('hex');

// After
const { compact } = require('@code_with_sachin/uusid');
const id = compact();
```

## 🧪 Examples

Check out the `example.js` file for comprehensive usage examples:

```bash
npm run example
```

## 🧪 Testing

Run the comprehensive test suite:

```bash
npm test           # Run all tests
npm run benchmark  # Performance benchmarks
npm run health     # Health check
npm run metrics    # Show metrics
```

## 📝 TypeScript Support

Full TypeScript definitions included:

```typescript
import { uusid, UUSIDGenerator, createGenerator } from '@code_with_sachin/uusid';

const generator: UUSIDGenerator = createGenerator({
    prefix: 'USER',
    separator: '-'
});

const id: string = uusid();
```

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines and submit pull requests.

## 📄 License

ISC License - see LICENSE file for details.

## 🆘 Support

- 📚 Documentation: Full API documentation available
- 💬 Issues: GitHub issues for bug reports
- 💡 Features: Suggest new features via GitHub
- 📧 Contact: Professional support available

## �� Related Projects

- **uuid**: Standard UUID generation
- **nanoid**: Compact URL-safe IDs
- **shortid**: Short non-sequential IDs
- **cuid**: Collision-resistant IDs

## 📈 Roadmap

- [ ] Browser compatibility
- [ ] Additional encryption algorithms
- [ ] Custom alphabet support
- [ ] Distributed coordination
- [ ] Database adapters
- [ ] Redis clustering support

---

**Made with ❤️ by [Sachin Singh](https://github.com/CodeWithSachin)**

⭐ Star this project if you find it useful!
