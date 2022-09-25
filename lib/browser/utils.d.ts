import { Abi, TypeField } from "./interface";
/**
 * Converts an hex string to Uint8Array
 */
export declare function toUint8Array(hex: string): Uint8Array;
/**
 * Converts Uint8Array to hex string
 */
export declare function toHexString(buffer: Uint8Array): string;
/**
 * Encodes an Uint8Array in base58
 */
export declare function encodeBase58(buffer: Uint8Array): string;
/**
 * Decodes a buffer formatted in base58
 */
export declare function decodeBase58(bs58: string): Uint8Array;
/**
 * Encodes an Uint8Array in base64url
 */
export declare function encodeBase64url(buffer: Uint8Array): string;
/**
 * Decodes a buffer formatted in base64url
 */
export declare function decodeBase64url(bs64url: string): Uint8Array;
/**
 * Encodes an Uint8Array in base64
 */
export declare function encodeBase64(buffer: Uint8Array): string;
export declare function multihash(buffer: Uint8Array, code?: string): Uint8Array;
/**
 * Decodes a buffer formatted in base64
 */
export declare function decodeBase64(bs64: string): Uint8Array;
/**
 * Calculates the merkle root of sha256 hashes
 */
export declare function calculateMerkleRoot(hashes: Uint8Array[]): Uint8Array;
/**
 * Encodes a public or private key in base58 using
 * the bitcoin format (see [Bitcoin Base58Check encoding](https://en.bitcoin.it/wiki/Base58Check_encoding)
 * and [Bitcoin WIF](https://en.bitcoin.it/wiki/Wallet_import_format)).
 *
 * For private keys this encode is also known as
 * wallet import format (WIF).
 */
export declare function bitcoinEncode(buffer: Uint8Array, type: "public" | "private", compressed?: boolean): string;
/**
 * Decodes a public or private key formatted in base58 using
 * the bitcoin format (see [Bitcoin Base58Check encoding](https://en.bitcoin.it/wiki/Base58Check_encoding)
 * and [Bitcoin WIF](https://en.bitcoin.it/wiki/Wallet_import_format)).
 *
 * For private keys this encode is also known as
 * wallet import format (WIF).
 */
export declare function bitcoinDecode(value: string): Uint8Array;
/**
 * Computes a bitcoin address, which is the format used in Koinos
 *
 * address = bitcoinEncode( ripemd160 ( sha256 ( publicKey ) ) )
 */
export declare function bitcoinAddress(publicKey: Uint8Array): string;
/**
 * Function to format a number in a decimal point number
 * @example
 * ```js
 * const amount = formatUnits("123456", 8);
 * console.log(amount);
 * // '0.00123456'
 * ```
 */
export declare function formatUnits(value: string | number | bigint, decimals: number): string;
/**
 * Function to format a decimal point number in an integer
 * @example
 * ```js
 * const amount = parseUnits("0.00123456", 8);
 * console.log(amount);
 * // '123456'
 * ```
 */
export declare function parseUnits(value: string, decimals: number): string;
export declare function btypeDecodeValue(valueEncoded: unknown, typeField: TypeField): unknown;
export declare function btypeEncodeValue(valueDecoded: unknown, typeField: TypeField): unknown;
export declare function btypeDecode(valueEncoded: Record<string, unknown> | unknown[], fields: Record<string, TypeField>): Record<string, unknown>;
export declare function btypeEncode(valueDecoded: Record<string, unknown> | unknown[], fields: Record<string, TypeField>): Record<string, unknown>;
/**
 * ABI for tokens
 */
export declare const tokenAbi: Abi;
