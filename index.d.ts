/**
 * Enhanced UUSID (Ultra Unique Secure ID) TypeScript Definitions
 * A comprehensive ID generation library with multiple formats and advanced features
 */

/**
 * Generator options for creating custom UUSID generators
 */
export interface UUSIDGeneratorOptions {
    /** Custom node ID (6-byte hex string) */
    nodeId?: string;
    /** Custom clock sequence (14-bit number) */
    clockSeq?: number;
    /** Prefix for generated IDs */
    prefix?: string;
    /** Custom separator character (default: '-') */
    separator?: string;
    /** Earliest allowed generation time */
    validAfter?: Date | string | number;
    /** Latest allowed generation time */
    validBefore?: Date | string | number;
    /** Secret key for encryption features */
    secretKey?: string;
}

/**
 * Validation result with detailed analysis
 */
export interface ValidationResult {
    /** Whether the ID is valid */
    isValid: boolean;
    /** ID format version */
    version: string | null;
    /** Extracted timestamp */
    timestamp: Date | null;
    /** Entropy measure (0-1) */
    entropy: number;
    /** Theoretical collision probability */
    collisionProbability: number;
    /** Array of validation warnings */
    warnings: string[];
}

/**
 * Validation options
 */
export interface ValidationOptions {
    /** Strict validation mode */
    strict?: boolean;
    /** Verify checksums */
    checksum?: boolean;
    /** Valid time range */
    timeRange?: {
        start: Date | string;
        end: Date | string;
    };
}

/**
 * Generator performance metrics
 */
export interface Metrics {
    /** Total IDs generated */
    totalGenerated: number;
    /** Average generation rate per second */
    averageRate: number;
    /** Peak generation rate */
    peakRate: number;
    /** Current generation rate */
    currentRate: number;
    /** Number of collisions detected */
    collisions: number;
    /** Generator uptime */
    uptime: string;
    /** Memory usage */
    memoryUsage: string;
}

/**
 * Health check result
 */
export interface HealthCheck {
    /** Overall health status */
    status: 'healthy' | 'unhealthy';
    /** Entropy quality */
    entropy: 'good' | 'low';
    /** Performance status */
    performance: 'optimal' | 'normal';
    /** Memory status */
    memory: 'normal' | 'high';
    /** Last generated ID */
    lastGenerated: string;
    /** Check timestamp */
    timestamp: string;
}

/**
 * Batch analysis result
 */
export interface AnalysisResult {
    /** Total number of IDs */
    totalIds: number;
    /** Number of unique IDs */
    uniqueIds: number;
    /** Number of duplicate IDs */
    duplicates: number;
    /** Time span covered */
    timeSpan: string;
    /** Number of valid IDs */
    validIds: number;
    /** Number of invalid IDs */
    invalidIds: number;
    /** Generation rate */
    generationRate: string;
}

/**
 * Hierarchical ID options
 */
export interface HierarchicalOptions {
    /** Parent ID for creating child relationships */
    parent?: string;
}

/**
 * Hierarchical ID information
 */
export interface HierarchyInfo {
    /** Depth in hierarchy */
    depth: number;
    /** Parent ID */
    parent: string | null;
    /** Grand parent ID (if applicable) */
    grandParent?: string;
}

/**
 * Worker pool options
 */
export interface WorkerPoolOptions {
    /** Number of worker generators */
    workers?: number;
    /** Batch size per worker */
    batchSize?: number;
}

/**
 * Main UUSID Generator class with all enhanced features
 */
export declare class UUSIDGenerator {
    /** Generator node ID */
    readonly nodeId: string;
    /** Clock sequence */
    readonly clockSeq: number;
    /** Generator version */
    readonly version: string;
    /** ID prefix */
    readonly prefix: string | null;
    /** Separator character */
    readonly separator: string;

    /**
     * Create a new UUSID generator
     * @param options Generator configuration options
     */
    constructor(options?: UUSIDGeneratorOptions);

    /**
     * Generate a single UUSID
     * @returns A new UUSID string
     */
    generate(): string;

    /**
     * Generate base32 encoded ID (shorter format)
     * @returns Base32 encoded ID
     */
    base32(): string;

    /**
     * Generate URL-safe ID (no special characters)
     * @returns URL-safe ID string
     */
    urlSafe(): string;

    /**
     * Generate compact ID (no separators)
     * @returns Compact ID string
     */
    compact(): string;

    /**
     * Generate ID with custom separator
     * @param separator Custom separator character
     * @returns ID with custom separator
     */
    withSeparator(separator: string): string;

    /**
     * Generate multiple UUSIDs
     * @param count Number of IDs to generate
     * @returns Array of UUSID strings
     */
    generateBatch(count: number): string[];

    /**
     * Generate sorted batch (naturally sortable by creation time)
     * @param count Number of IDs to generate
     * @returns Sorted array of UUSID strings
     */
    generateSortedBatch(count: number): string[];

    /**
     * Generate hierarchical ID with parent-child relationships
     * @param options Hierarchical options
     * @returns Hierarchical ID string
     */
    hierarchical(options?: HierarchicalOptions): string;

    /**
     * Parse hierarchical ID information
     * @param hierarchicalId Hierarchical ID to parse
     * @returns Hierarchy information
     */
    parseHierarchy(hierarchicalId: string): HierarchyInfo;

    /**
     * Encrypt an ID
     * @param id ID to encrypt
     * @param secretKey Optional secret key (uses generator key if not provided)
     * @returns Encrypted ID
     */
    encrypt(id: string, secretKey?: string): string;

    /**
     * Decrypt an encrypted ID
     * @param encryptedId Encrypted ID to decrypt
     * @param secretKey Optional secret key (uses generator key if not provided)
     * @returns Decrypted ID
     */
    decrypt(encryptedId: string, secretKey?: string): string;

    /**
     * Generate deterministic ID from content
     * @param content Content to generate ID from
     * @returns Content-based ID
     */
    fromContent(content: string): string;

    /**
     * Extract timestamp from UUSID
     * @param id UUSID to extract timestamp from
     * @returns Timestamp in milliseconds
     */
    extractTimestamp(id: string): number;

    /**
     * Validate UUSID with detailed analysis
     * @param id ID to validate
     * @param options Validation options
     * @returns Detailed validation result
     */
    validate(id: string, options?: ValidationOptions): ValidationResult;

    /**
     * Check if ID was generated within time range
     * @param id ID to check
     * @param startDate Start of time range
     * @param endDate End of time range
     * @returns True if ID is within range
     */
    isInTimeRange(id: string, startDate: Date | string, endDate: Date | string): boolean;

    /**
     * Get generator performance metrics
     * @returns Performance metrics
     */
    getMetrics(): Metrics;

    /**
     * Perform health check on generator
     * @returns Health check result
     */
    healthCheck(): Promise<HealthCheck>;

    /**
     * Analyze batch of IDs
     * @param idArray Array of IDs to analyze
     * @returns Analysis result
     */
    analyze(idArray: string[]): AnalysisResult;
}

/**
 * Prefixed ID Generator - generates IDs with consistent prefix
 */
export declare class PrefixedGenerator extends UUSIDGenerator {
    /**
     * Create a prefixed generator
     * @param prefix Prefix for all generated IDs
     * @param options Additional generator options
     */
    constructor(prefix: string, options?: UUSIDGeneratorOptions);
}

/**
 * Encrypted ID Generator - generates encrypted IDs by default
 */
export declare class EncryptedGenerator extends UUSIDGenerator {
    /**
     * Create an encrypted generator
     * @param options Generator options (secretKey required)
     */
    constructor(options: UUSIDGeneratorOptions & { secretKey: string });

    /**
     * Generate encrypted ID
     * @returns Encrypted ID
     */
    generate(): string;
}

/**
 * Worker Pool for high-volume ID generation
 */
export declare class WorkerPool {
    /** Number of workers */
    readonly workers: number;
    /** Batch size per worker */
    readonly batchSize: number;

    /**
     * Create a worker pool
     * @param options Worker pool configuration
     */
    constructor(options?: WorkerPoolOptions);

    /**
     * Generate large batch of IDs using worker pool
     * @param count Number of IDs to generate
     * @returns Promise resolving to array of IDs
     */
    generateBatch(count: number): Promise<string[]>;
}

/**
 * Generate a single UUSID using default generator
 * @returns A new UUSID string
 */
export declare function uusid(): string;

/**
 * Generate multiple UUSIDs using default generator
 * @param count Number of IDs to generate
 * @returns Array of UUSID strings
 */
export declare function uusidBatch(count: number): string[];

/**
 * Create a new UUSID generator with custom options
 * @param options Generator configuration
 * @returns New generator instance
 */
export declare function createGenerator(options?: UUSIDGeneratorOptions): UUSIDGenerator;

/**
 * Create a prefixed ID generator
 * @param prefix Prefix for generated IDs
 * @param options Additional generator options
 * @returns New prefixed generator
 */
export declare function createPrefixedGenerator(prefix: string, options?: UUSIDGeneratorOptions): PrefixedGenerator;

/**
 * Create an encrypted ID generator
 * @param options Generator options with required secretKey
 * @returns New encrypted generator
 */
export declare function createEncryptedGenerator(options: UUSIDGeneratorOptions & { secretKey: string }): EncryptedGenerator;

/**
 * Create a worker pool for high-volume generation
 * @param options Worker pool configuration
 * @returns New worker pool
 */
export declare function createWorkerPool(options?: WorkerPoolOptions): WorkerPool;

/**
 * Validate UUSID format and extract information
 * @param id UUSID to validate
 * @param options Validation options
 * @returns Validation result
 */
export declare function validate(id: string, options?: ValidationOptions): ValidationResult;

/**
 * Extract timestamp from UUSID
 * @param id UUSID to extract timestamp from
 * @returns Timestamp in milliseconds
 */
export declare function extractTimestamp(id: string): number;

/**
 * Check if ID is within time range
 * @param id ID to check
 * @param start Start of time range
 * @param end End of time range
 * @returns True if within range
 */
export declare function isInTimeRange(id: string, start: Date | string, end: Date | string): boolean;

/**
 * Analyze array of IDs
 * @param idArray Array of IDs to analyze
 * @returns Analysis result
 */
export declare function analyze(idArray: string[]): AnalysisResult;

/**
 * Get metrics from default generator
 * @returns Performance metrics
 */
export declare function getMetrics(): Metrics;

/**
 * Perform health check on default generator
 * @returns Health check result
 */
export declare function healthCheck(): Promise<HealthCheck>;

/**
 * Generate base32 encoded ID using default generator
 * @returns Base32 encoded ID
 */
export declare function base32(): string;

/**
 * Generate URL-safe ID using default generator
 * @returns URL-safe ID
 */
export declare function urlSafe(): string;

/**
 * Generate compact ID using default generator
 * @returns Compact ID
 */
export declare function compact(): string;

/**
 * Generate hierarchical ID using default generator
 * @param options Hierarchical options
 * @returns Hierarchical ID
 */
export declare function hierarchical(options?: HierarchicalOptions): string;

/**
 * Generate content-based ID using default generator
 * @param content Content to generate ID from
 * @returns Content-based ID
 */
export declare function fromContent(content: string): string;

/**
 * Default generator instance
 */
export declare const defaultGenerator: UUSIDGenerator;

/**
 * Default export - main uusid function
 */
declare const _default: typeof uusid;
export default _default;
