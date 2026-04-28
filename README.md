# UUSID — Ultra Unique Secure ID

[![NPM Version](https://img.shields.io/npm/v/@code_with_sachin/uusid.svg)](https://www.npmjs.com/package/@code_with_sachin/uusid)
[![License](https://img.shields.io/npm/l/@code_with_sachin/uusid.svg)](LICENSE)
[![Node.js Version](https://img.shields.io/node/v/@code_with_sachin/uusid.svg)](https://nodejs.org)

A modern UUID-shaped ID generator for **Node.js and the browser**, with multiple output formats, AES encryption, deterministic content-based IDs, hierarchical IDs, and zero runtime dependencies.

```js
import { uusid } from '@code_with_sachin/uusid/browser';   // React / Angular / Next client / Vite
// or
const { uusid } = require('@code_with_sachin/uusid');       // Node, plain CommonJS

uusid(); // → "550e8400-e29b-41d4-a716-446655440000"
```

---

## Why UUSID

- **One library, two runtimes.** A Node entry that uses `node:crypto` and a browser entry that uses Web Crypto. Bundlers route automatically.
- **Drop-in UUID v1 layout.** 36-char canonical format — works anywhere a UUID does.
- **Batteries included.** Prefixes, encryption, validation, batch analysis, hierarchical IDs, content-based IDs, metrics, and a CLI.
- **Zero dependencies.** Tiny install, no transitive surprises.
- **TypeScript first.** Full `.d.ts` for both server and browser entries.

---

## Install

```bash
npm install @code_with_sachin/uusid
# or
pnpm add @code_with_sachin/uusid
# or
yarn add @code_with_sachin/uusid
```

---

## Server vs. Browser

Since v3.1.0 the package ships **two explicit subpath entries** plus a backwards-compatible root that points at the server build. The `package.json` `exports` map keeps them isolated, so SSR and CSR code in the same project never cross-contaminate.

| Import | Runtime | Module format | Crypto |
| --- | --- | --- | --- |
| `@code_with_sachin/uusid` (root) | Node ≥ 14 | CJS | `node:crypto` |
| `@code_with_sachin/uusid/server` | Node ≥ 14 | CJS | `node:crypto` |
| `@code_with_sachin/uusid/browser` | All evergreen browsers, Node ≥ 18 | ESM | Web Crypto (`globalThis.crypto`) |

```js
// React / Angular / Next.js client component / Vite / Svelte / Solid
import { uusid, validate } from '@code_with_sachin/uusid/browser';

// Next.js Route Handler / Server Component / Express / plain Node
import { uusid } from '@code_with_sachin/uusid/server';
// equivalent to:
const { uusid } = require('@code_with_sachin/uusid');
```

### What's different on the browser entry

- `fromContent`, `encrypt`, `decrypt`, and `EncryptedGenerator.generate()` are **`async`** (Web Crypto's `subtle.digest` / `subtle.encrypt` / `subtle.decrypt` are Promise-based). Server keeps the synchronous signatures.
- `WorkerPool` and `createWorkerPool` are **not exported** in the browser. Use the server entry for very high-volume generation, or run the browser entry inside a Web Worker yourself.
- `getMetrics()` and `healthCheck()` omit the `memoryUsage` field — there is no `process.memoryUsage` in browsers.
- The browser entry uses **AES-256-GCM** for `encrypt` / `decrypt`. The server entry uses **AES-256-CBC**. **Encrypted IDs are not portable across the two entries** — encrypt and decrypt with the same one.

---

## Framework recipes

### React + Vite

```jsx
// src/UserCard.jsx
import { uusid } from '@code_with_sachin/uusid/browser';

export function UserCard({ name }) {
  const [id] = useState(() => uusid());
  return <div data-id={id}>{name}</div>;
}
```

### Next.js (App Router)

```ts
// app/api/users/route.ts — server, sync
import { uusid } from '@code_with_sachin/uusid/server';
export async function POST(req: Request) {
  const id = uusid();
  return Response.json({ id });
}
```

```tsx
// app/components/Button.tsx — client component
'use client';
import { uusid } from '@code_with_sachin/uusid/browser';
export default function Button() {
  return <button data-trace={uusid()}>Click</button>;
}
```

### Angular

```ts
// src/app/id.service.ts
import { Injectable } from '@angular/core';
import { uusid, fromContent } from '@code_with_sachin/uusid/browser';

@Injectable({ providedIn: 'root' })
export class IdService {
  next() { return uusid(); }
  forContent(content: string) { return fromContent(content); }   // async
}
```

### Express

```js
const express = require('express');
const { uusid } = require('@code_with_sachin/uusid');   // bare = server
const app = express();
app.use((req, _res, next) => { req.requestId = uusid(); next(); });
```

---

## API reference

### Top-level functions

| Export | Server | Browser | Returns |
| --- | --- | --- | --- |
| `uusid(options?)` | sync | sync | `string` |
| `uusidBatch(count, options?)` | sync | sync | `string[]` |
| `validate(id, options?)` | sync | sync | `ValidationResult` |
| `extractTimestamp(id)` | sync | sync | `number` (ms) |
| `isInTimeRange(id, start, end)` | sync | sync | `boolean` |
| `analyze(idArray)` | sync | sync | `AnalysisResult` |
| `getMetrics()` | sync | sync | `Metrics` |
| `healthCheck()` | async | async | `Promise<HealthCheck>` |
| `base32()` | sync | sync | `string` (26 chars) |
| `urlSafe()` | sync | sync | `string` (32 chars, lowercase) |
| `compact()` | sync | sync | `string` (32 chars) |
| `hierarchical(options?)` | sync | sync | `string` (dotted) |
| `fromContent(content, options?)` | **sync** | **async** | `string` / `Promise<string>` |

### Classes

| Export | Notes |
| --- | --- |
| `UUSIDGenerator` | Core class. All instance methods mirror the top-level functions. |
| `PrefixedGenerator(prefix, options?)` | Auto-prefixes every ID. Uses `_` as the separator. |
| `EncryptedGenerator({ secretKey, ... })` | `generate()` returns an encrypted ID. **Async on browser.** |
| `WorkerPool({ workers, batchSize })` | **Server only.** Multi-instance batch generation. |

### Factory helpers

`createGenerator`, `createPrefixedGenerator`, `createEncryptedGenerator`, `createWorkerPool` — thin wrappers that return new class instances.

---

## ID formats

```js
import {
  uusid, base32, urlSafe, compact, hierarchical
} from '@code_with_sachin/uusid/browser';

uusid();          // "550e8400-e29b-41d4-a716-446655440000"  (36 chars, canonical)
compact();        // "550e8400e29b41d4a716446655440000"      (32 chars, no separators)
urlSafe();        // "550e8400e29b41d4a716446655440000"      (lowercased compact)
base32();         // "KRSXG5CTMZRW6Z3JN5XGK4TLAA"            (26 chars)
hierarchical();   // "550e8400e2.9b41d4a716.446655440000"     (3 dotted levels)
hierarchical({ parent: 'org.team' });
                  // "org.team.550e8400e2"                    (child of a parent)
```

> Output values are illustrative — your IDs will differ.

---

## Generators

### Default

```js
import { createGenerator } from '@code_with_sachin/uusid/server';

const gen = createGenerator({
  prefix: 'order',
  separator: '_',
  validAfter:  '2025-01-01',
  validBefore: '2026-12-31',
});

gen.generate();            // "order_550e8400_e29b_41d4_a716_446655440000"
gen.generateBatch(10);     // string[]
gen.generateSortedBatch(10); // chronologically sorted
```

### Prefixed

```js
import { createPrefixedGenerator } from '@code_with_sachin/uusid/server';

const users = createPrefixedGenerator('user');
users.generate();          // "user_550e8400_e29b_41d4_a716_446655440000"
```

> `PrefixedGenerator` always uses `_` as the separator. Use `createGenerator({ prefix, separator })` if you need a different one.

### Encrypted

```js
// Server — sync
import { createEncryptedGenerator } from '@code_with_sachin/uusid/server';
const sec = createEncryptedGenerator({ secretKey: process.env.SECRET });
const ct = sec.generate();              // "ivHex:cipherTextHex"  (AES-256-CBC)
const pt = sec.decrypt(ct);             // recovered uusid

// Browser — async, AES-256-GCM
import { createEncryptedGenerator } from '@code_with_sachin/uusid/browser';
const sec = createEncryptedGenerator({ secretKey: 'k'.repeat(32) });
const ct = await sec.generate();
const pt = await sec.decrypt(ct);
```

### Content-based (deterministic)

Same content → same ID. Useful as a stable derived key.

```js
import { fromContent } from '@code_with_sachin/uusid/server';   // sync
fromContent('user@example.com');                                 // "8c12...-...-...-...-..."
fromContent('user@example.com', { namespace: 'users', algorithm: 'sha256' });
```

```js
import { fromContent } from '@code_with_sachin/uusid/browser';  // async
await fromContent('user@example.com');
await fromContent('user@example.com', { namespace: 'users', algorithm: 'SHA-256' });
```

> Note: server uses Node's algorithm names (`'sha256'`); browser uses Web Crypto names (`'SHA-256'`).

### Worker pool (server only)

```js
const { createWorkerPool } = require('@code_with_sachin/uusid');
const pool = createWorkerPool({ workers: 8, batchSize: 1_000 });
const ids = await pool.generateBatch(50_000);
```

---

## Validation, analysis, metrics

```js
import { validate, analyze, extractTimestamp, isInTimeRange,
         getMetrics, healthCheck, uusid } from '@code_with_sachin/uusid';

const id = uusid();

validate(id);
// { valid: true, isValid: true, version: 'uusid', entropy: 3.7 }

extractTimestamp(id);                                  // 1735689600000 (ms since epoch)
isInTimeRange(id, '2025-01-01', '2026-01-01');         // true / false

analyze([uusid(), uusid(), 'not-an-id']);
// {
//   total: 3, totalIds: 3,
//   valid: 2, invalid: 1, duplicates: 0, uniqueIds: 3,
//   timeRange: { earliest: Date, latest: Date },
//   formats: { standard: 2, prefixed: 0, custom: 0 },
//   errors: ['Invalid ID not-an-id: Invalid format']
// }

getMetrics();
// { totalGenerated, uptime, averageRate, currentRate, peakRate,
//   collisions, memoryUsage }      // memoryUsage is server-only

await healthCheck();
// { healthy: true, checks: { validation, uniqueness, performance },
//   metrics: { generationTime, rate }, timestamp }
```

---

## Hierarchical IDs

```js
import { hierarchical, createGenerator } from '@code_with_sachin/uusid';

const root = hierarchical();                       // "aaaaaaaa.bbbbbbbb.ccccccccdddd"
const child = hierarchical({ parent: root });      // "<root>.eeeeeeeeff"

const gen = createGenerator();
gen.parseHierarchy(child);
// { depth: 1, parts: [...], parent: <root>, root: <first 3 parts>, leaf: 'eeeeeeeeff' }
```

---

## CLI

```bash
npm install -g @code_with_sachin/uusid
```

```bash
# Generate
uusid generate --count 10 --format base32
uusid gen -c 5 -f url-safe --prefix API

# Validate / inspect
uusid validate 550e8400-e29b-41d4-a716-446655440000
uusid analyze ids.txt

# Diagnostics
uusid benchmark --iterations 100000
uusid health
uusid metrics
```

---

## TypeScript

Types ship with the package. Both subpaths have their own `.d.ts`, so the async surface differences on `/browser` are reflected in your editor.

```ts
import { uusid, UUSIDGenerator, ValidationResult } from '@code_with_sachin/uusid/server';

const gen: UUSIDGenerator = new UUSIDGenerator({ prefix: 'usr', separator: '-' });
const id: string = uusid();
const v: ValidationResult = gen.validate(id);
```

```ts
import { fromContent } from '@code_with_sachin/uusid/browser';
const id: string = await fromContent('hello');   // Promise<string> on /browser
```

---

## Performance

Measured locally with `npm run benchmark` on Node 24 / Apple Silicon. Numbers are indicative.

| Operation | Throughput | Notes |
| --- | --- | --- |
| `uusid()` (default generator) | ~6,000–60,000 ops/sec | Single-thread, includes timestamp + clock-seq logic |
| `WorkerPool.generateBatch()` | 60,000+ ops/sec | Multi-instance, server only |
| `validate()` | 10M+ ops/sec | Pure regex + math |
| `fromContent()` (server, SHA-256) | 750k+ ops/sec | One hash per call |
| `EncryptedGenerator.generate()` (server, AES-CBC) | 50k+ ops/sec | Includes encryption |

Memory: ~50 bytes per ID retained, no internal queues, no leaks observed across 500k generations.
Collision resistance: zero collisions across 500k generations in test suite.

---

## Migration

### From `uuid`

```js
// Before
const { v4: uuidv4 } = require('uuid');
const id = uuidv4();

// After
const { uusid } = require('@code_with_sachin/uusid');
const id = uusid();
```

### From `crypto.randomBytes`

```js
// Before
const id = require('crypto').randomBytes(16).toString('hex');

// After — same shape, plus prefixing/encryption/etc when you need them
const { compact } = require('@code_with_sachin/uusid');
const id = compact();
```

### From v3.0.x → v3.1.0

No breaking changes. Existing `require('@code_with_sachin/uusid')` and `import` from the bare path keep working unchanged. The new `/server` and `/browser` subpaths are additive.

---

## Development

```bash
npm test            # 19 server-side tests
npm run test:browser # 20 browser-entry tests (uses globalThis.crypto)
npm run benchmark   # performance numbers
npm run example     # walkthrough of every feature
```

---

## Roadmap

- [x] Browser compatibility (v3.1.0)
- [x] Subpath imports (`/server`, `/browser`)
- [ ] AES-256-GCM on the server entry (cross-runtime encrypted ID interop)
- [ ] Web Worker port of `WorkerPool`
- [ ] Pluggable RNG hooks
- [ ] Optional URL-safe Base64 format

---

## Contributing

Issues and pull requests are welcome at <https://github.com/CodeWithSachin/uusid>. Please run `npm test && npm run test:browser` before submitting.

## License

ISC — see [LICENSE](LICENSE).

## Related

- [`uuid`](https://www.npmjs.com/package/uuid) — RFC-compliant UUID v1/v4/v5
- [`nanoid`](https://www.npmjs.com/package/nanoid) — short URL-safe IDs
- [`cuid2`](https://www.npmjs.com/package/@paralleldrive/cuid2) — collision-resistant IDs

---

Made by [Sachin Singh](https://github.com/CodeWithSachin). If this saves you time, a star on GitHub is appreciated.
