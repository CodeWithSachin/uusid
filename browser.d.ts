/**
 * Browser entry types for @code_with_sachin/uusid.
 *
 * Differs from the server types in three places:
 *   - fromContent / encrypt / decrypt return Promise<string>
 *   - EncryptedGenerator.generate() returns Promise<string>
 *   - WorkerPool / createWorkerPool are not exported
 *   - Metrics has no memoryUsage; HealthCheck has no memory field
 */

export interface UUSIDGeneratorOptions {
    nodeId?: string;
    clockSeq?: number;
    prefix?: string;
    separator?: string;
    validAfter?: Date | string | number;
    validBefore?: Date | string | number;
    secretKey?: string;
}

export interface ValidationResult {
    isValid: boolean;
    valid: boolean;
    version: string | null;
    entropy: number;
    reason?: string;
}

export interface ValidationOptions {
    strict?: boolean;
    allowPrefix?: boolean;
}

export interface Metrics {
    totalGenerated: number;
    averageRate: number;
    peakRate: number;
    currentRate: number;
    collisions: number;
    uptime: string;
}

export interface HealthCheck {
    healthy: boolean;
    checks?: {
        validation: boolean;
        uniqueness: boolean;
        performance: boolean;
    };
    metrics?: {
        generationTime: string;
        rate: string;
    };
    error?: string;
    timestamp: string;
}

export interface AnalysisResult {
    total: number;
    totalIds: number;
    valid: number;
    invalid: number;
    duplicates: number;
    uniqueIds: number;
    timeRange: { earliest: Date | null; latest: Date | null };
    formats: { standard: number; prefixed: number; custom: number };
    errors: string[];
}

export interface HierarchicalOptions {
    levels?: number;
    separator?: string;
    parent?: string;
}

export interface HierarchyInfo {
    depth: number;
    parts: string[];
    parent: string | null;
    root: string;
    leaf: string;
}

export interface ContentOptions {
    namespace?: string;
    /** Web Crypto digest algorithm: 'SHA-256' | 'SHA-384' | 'SHA-512' | 'SHA-1' */
    algorithm?: string;
}

export declare class UUSIDGenerator {
    readonly nodeId: string;
    readonly clockSeq: number;
    readonly version: string;
    readonly prefix: string | null;
    readonly separator: string;

    constructor(options?: UUSIDGeneratorOptions);

    generate(): string;
    base32(): string;
    urlSafe(): string;
    compact(): string;
    generateBatch(count: number): string[];
    generateSortedBatch(count: number): string[];
    hierarchical(options?: HierarchicalOptions): string;
    parseHierarchy(id: string, options?: { separator?: string }): HierarchyInfo;

    /** Async on browser — uses crypto.subtle.encrypt (AES-GCM). */
    encrypt(data: string): Promise<string>;
    /** Async on browser — uses crypto.subtle.decrypt (AES-GCM). */
    decrypt(encryptedData: string): Promise<string>;
    /** Async on browser — uses crypto.subtle.digest. */
    fromContent(content: string, options?: ContentOptions): Promise<string>;

    extractTimestamp(id: string): number;
    validate(id: string, options?: ValidationOptions): ValidationResult;
    isInTimeRange(id: string, start: Date | string, end: Date | string): boolean;
    getMetrics(): Metrics;
    healthCheck(): Promise<HealthCheck>;
    analyze(idArray: string[]): AnalysisResult;
}

export declare class PrefixedGenerator extends UUSIDGenerator {
    constructor(prefix: string, options?: UUSIDGeneratorOptions);
}

export declare class EncryptedGenerator extends UUSIDGenerator {
    constructor(options: UUSIDGeneratorOptions & { secretKey: string });
    /** Async on browser — encrypts with AES-GCM. */
    generate(): Promise<string>;
}

export declare function uusid(options?: UUSIDGeneratorOptions): string;
export declare function uusidBatch(count: number, options?: UUSIDGeneratorOptions): string[];
export declare function createGenerator(options?: UUSIDGeneratorOptions): UUSIDGenerator;
export declare function createPrefixedGenerator(prefix: string, options?: UUSIDGeneratorOptions): PrefixedGenerator;
export declare function createEncryptedGenerator(options: UUSIDGeneratorOptions & { secretKey: string }): EncryptedGenerator;

export declare function validate(id: string, options?: ValidationOptions): ValidationResult;
export declare function extractTimestamp(id: string): number;
export declare function isInTimeRange(id: string, start: Date | string, end: Date | string): boolean;
export declare function analyze(idArray: string[]): AnalysisResult;
export declare function getMetrics(): Metrics;
export declare function healthCheck(): Promise<HealthCheck>;

export declare function base32(): string;
export declare function urlSafe(): string;
export declare function compact(): string;
export declare function hierarchical(options?: HierarchicalOptions): string;
export declare function fromContent(content: string, options?: ContentOptions): Promise<string>;

export declare const defaultGenerator: UUSIDGenerator;

declare const _default: typeof uusid;
export default _default;
