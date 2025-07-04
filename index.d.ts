// index.d.ts - TypeScript definitions for UUSID

/**
 * Configuration options for UUSID generator
 */
interface UUSIDOptions {
	/** Custom node ID (12-character hex string representing MAC address) */
	nodeId?: string;
	/** Custom clock sequence (14-bit number) */
	clockSeq?: number;
}

/**
 * Parsed components of a UUSID
 */
interface UUSIDParseResult {
	/** Generation timestamp */
	timestamp: Date;
	/** Clock sequence used during generation */
	clockSeq: number;
	/** Node identifier (MAC address or random) */
	node: string;
	/** UUSID version */
	version: string;
}

/**
 * UUSID Generator class
 */
declare class UUSIDGenerator {
	constructor(options?: UUSIDOptions);

	/** Generate a single UUSID */
	generate(): string;

	/** Generate multiple UUSIDs in batch */
	generateBatch(count?: number): string[];

	/** Validate UUSID format (static method) */
	static isValid(uusid: string): boolean;

	/** Parse UUSID into components (static method) */
	static parse(uusid: string): UUSIDParseResult;
}

/**
 * Generate a single UUSID
 * @returns A UUSID string in standard UUID format
 */
declare function uusid(): string;

/**
 * Generate multiple UUSIDs in a single call
 * @param count Number of UUSIDs to generate (default: 10)
 * @returns Array of UUSID strings
 */
declare function uusidBatch(count?: number): string[];

/**
 * Create a custom UUSID generator with specific options
 * @param options Generator configuration options
 * @returns UUSIDGenerator instance
 */
declare function createGenerator(options?: UUSIDOptions): UUSIDGenerator;

/**
 * Validate whether a string is a properly formatted UUSID
 * @param uusid String to validate
 * @returns True if valid UUSID format
 */
declare function isValid(uusid: string): boolean;

/**
 * Parse a UUSID string into its component parts
 * @param uusid Valid UUSID string
 * @returns Parsed UUSID components
 * @throws Error if UUSID format is invalid
 */
declare function parse(uusid: string): UUSIDParseResult;

// Named exports
export {
	uusid,
	uusidBatch,
	createGenerator,
	isValid,
	parse,
	UUSIDGenerator,
	UUSIDOptions,
	UUSIDParseResult,
};

// Default export
export default uusid;
