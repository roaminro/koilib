"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.tokenAbi = exports.btypeEncode = exports.btypeDecode = exports.btypeEncodeValue = exports.btypeDecodeValue = exports.parseUnits = exports.formatUnits = exports.bitcoinAddress = exports.bitcoinDecode = exports.bitcoinEncode = exports.calculateMerkleRoot = exports.decodeBase64 = exports.multihash = exports.encodeBase64 = exports.decodeBase64url = exports.encodeBase64url = exports.decodeBase58 = exports.encodeBase58 = exports.toHexString = exports.toUint8Array = void 0;
const multibase = __importStar(require("multibase"));
const sha256_1 = require("@noble/hashes/sha256");
const ripemd160_1 = require("@noble/hashes/ripemd160");
const token_proto_json_1 = __importDefault(require("./jsonDescriptors/token-proto.json"));
/**
 * Converts an hex string to Uint8Array
 */
function toUint8Array(hex) {
    const pairs = hex.match(/[\dA-F]{2}/gi);
    if (!pairs)
        throw new Error("Invalid hex");
    return new Uint8Array(pairs.map((s) => parseInt(s, 16)) // convert to integers
    );
}
exports.toUint8Array = toUint8Array;
/**
 * Converts Uint8Array to hex string
 */
function toHexString(buffer) {
    return Array.from(buffer)
        .map((n) => `0${Number(n).toString(16)}`.slice(-2))
        .join("");
}
exports.toHexString = toHexString;
/**
 * Encodes an Uint8Array in base58
 */
function encodeBase58(buffer) {
    return new TextDecoder().decode(multibase.encode("z", buffer)).slice(1);
}
exports.encodeBase58 = encodeBase58;
/**
 * Decodes a buffer formatted in base58
 */
function decodeBase58(bs58) {
    return multibase.decode(`z${bs58}`);
}
exports.decodeBase58 = decodeBase58;
/**
 * Encodes an Uint8Array in base64url
 */
function encodeBase64url(buffer) {
    return new TextDecoder().decode(multibase.encode("U", buffer)).slice(1);
}
exports.encodeBase64url = encodeBase64url;
/**
 * Decodes a buffer formatted in base64url
 */
function decodeBase64url(bs64url) {
    return multibase.decode(`U${bs64url}`);
}
exports.decodeBase64url = decodeBase64url;
/**
 * Encodes an Uint8Array in base64
 */
function encodeBase64(buffer) {
    return new TextDecoder().decode(multibase.encode("M", buffer)).slice(1);
}
exports.encodeBase64 = encodeBase64;
function multihash(buffer, code = "sha2-256") {
    switch (code) {
        case "sha2-256": {
            return new Uint8Array([18, buffer.length, ...buffer]);
        }
        default:
            throw new Error(`multihash code ${code} not supported`);
    }
}
exports.multihash = multihash;
/**
 * Decodes a buffer formatted in base64
 */
function decodeBase64(bs64) {
    return multibase.decode(`M${bs64}`);
}
exports.decodeBase64 = decodeBase64;
/**
 * Calculates the merkle root of sha256 hashes
 */
function calculateMerkleRoot(hashes) {
    if (!hashes.length)
        return (0, sha256_1.sha256)(new Uint8Array());
    while (hashes.length > 1) {
        for (let i = 0; i < hashes.length; i += 2) {
            if (i + 1 < hashes.length) {
                const leftHash = hashes[i];
                const rightHash = hashes[i + 1];
                const sumHash = (0, sha256_1.sha256)(new Uint8Array([...leftHash, ...rightHash]));
                hashes[i / 2] = new Uint8Array(sumHash);
            }
            else {
                hashes[i / 2] = hashes[i];
            }
        }
        hashes = hashes.slice(0, Math.ceil(hashes.length / 2));
    }
    return hashes[0];
}
exports.calculateMerkleRoot = calculateMerkleRoot;
/**
 * Encodes a public or private key in base58 using
 * the bitcoin format (see [Bitcoin Base58Check encoding](https://en.bitcoin.it/wiki/Base58Check_encoding)
 * and [Bitcoin WIF](https://en.bitcoin.it/wiki/Wallet_import_format)).
 *
 * For private keys this encode is also known as
 * wallet import format (WIF).
 */
function bitcoinEncode(buffer, type, compressed = false) {
    let bufferCheck;
    let prefixBuffer;
    let offsetChecksum;
    if (type === "public") {
        bufferCheck = new Uint8Array(25);
        prefixBuffer = new Uint8Array(21);
        bufferCheck[0] = 0;
        prefixBuffer[0] = 0;
        offsetChecksum = 21;
    }
    else {
        if (compressed) {
            bufferCheck = new Uint8Array(38);
            prefixBuffer = new Uint8Array(34);
            offsetChecksum = 34;
            bufferCheck[33] = 1;
            prefixBuffer[33] = 1;
        }
        else {
            bufferCheck = new Uint8Array(37);
            prefixBuffer = new Uint8Array(33);
            offsetChecksum = 33;
        }
        bufferCheck[0] = 128;
        prefixBuffer[0] = 128;
    }
    prefixBuffer.set(buffer, 1);
    const firstHash = (0, sha256_1.sha256)(prefixBuffer);
    const doubleHash = (0, sha256_1.sha256)(firstHash);
    const checksum = new Uint8Array(4);
    checksum.set(doubleHash.slice(0, 4));
    bufferCheck.set(buffer, 1);
    bufferCheck.set(checksum, offsetChecksum);
    return encodeBase58(bufferCheck);
}
exports.bitcoinEncode = bitcoinEncode;
/**
 * Decodes a public or private key formatted in base58 using
 * the bitcoin format (see [Bitcoin Base58Check encoding](https://en.bitcoin.it/wiki/Base58Check_encoding)
 * and [Bitcoin WIF](https://en.bitcoin.it/wiki/Wallet_import_format)).
 *
 * For private keys this encode is also known as
 * wallet import format (WIF).
 */
function bitcoinDecode(value) {
    const buffer = decodeBase58(value);
    const privateKey = new Uint8Array(32);
    const checksum = new Uint8Array(4);
    // const prefix = buffer[0];
    privateKey.set(buffer.slice(1, 33));
    if (value[0] !== "5") {
        // compressed
        checksum.set(buffer.slice(34, 38));
    }
    else {
        checksum.set(buffer.slice(33, 37));
    }
    // TODO: verify prefix and checksum
    return privateKey;
}
exports.bitcoinDecode = bitcoinDecode;
/**
 * Computes a bitcoin address, which is the format used in Koinos
 *
 * address = bitcoinEncode( ripemd160 ( sha256 ( publicKey ) ) )
 */
function bitcoinAddress(publicKey) {
    const hash = (0, sha256_1.sha256)(publicKey);
    const hash160 = (0, ripemd160_1.ripemd160)(hash);
    return bitcoinEncode(hash160, "public");
}
exports.bitcoinAddress = bitcoinAddress;
/**
 * Function to format a number in a decimal point number
 * @example
 * ```js
 * const amount = formatUnits("123456", 8);
 * console.log(amount);
 * // '0.00123456'
 * ```
 */
function formatUnits(value, decimals) {
    let v = typeof value === "string" ? value : BigInt(value).toString();
    const sign = v[0] === "-" ? "-" : "";
    v = v.replace("-", "").padStart(decimals + 1, "0");
    const integerPart = v
        .substring(0, v.length - decimals)
        .replace(/^0+(?=\d)/, "");
    const decimalPart = v.substring(v.length - decimals);
    return `${sign}${integerPart}.${decimalPart}`.replace(/(\.0+)?(0+)$/, "");
}
exports.formatUnits = formatUnits;
/**
 * Function to format a decimal point number in an integer
 * @example
 * ```js
 * const amount = parseUnits("0.00123456", 8);
 * console.log(amount);
 * // '123456'
 * ```
 */
function parseUnits(value, decimals) {
    const sign = value[0] === "-" ? "-" : "";
    // eslint-disable-next-line prefer-const
    let [integerPart, decimalPart] = value
        .replace("-", "")
        .replace(",", ".")
        .split(".");
    if (!decimalPart)
        decimalPart = "";
    decimalPart = decimalPart.padEnd(decimals, "0");
    return `${sign}${`${integerPart}${decimalPart}`.replace(/^0+(?=\d)/, "")}`;
}
exports.parseUnits = parseUnits;
/**
 * Makes a copy of a value. The returned value can be modified
 * without altering the original one. Although this is not needed
 * for strings or numbers and only needed for objects and arrays,
 * all these options are covered in a single function
 *
 * It is assumed that the argument is number, string, or contructions
 * of these types inside objects or arrays.
 */
function copyValue(value) {
    if (typeof value === "string" || typeof value === "number") {
        return value;
    }
    return JSON.parse(JSON.stringify(value));
}
function btypeDecodeValue(valueEncoded, typeField) {
    // No byte conversion
    if (typeField.type !== "bytes")
        return copyValue(valueEncoded);
    const value = valueEncoded;
    // Default byte conversion
    if (!typeField.btype) {
        return decodeBase64url(value);
    }
    // Specific byte conversion
    switch (typeField.btype) {
        case "BASE58":
        case "CONTRACT_ID":
        case "ADDRESS":
            return decodeBase58(value);
        case "BASE64":
            return decodeBase64url(value);
        case "HEX":
        case "BLOCK_ID":
        case "TRANSACTION_ID":
            return toUint8Array(value.slice(2));
        default:
            throw new Error(`unknown btype ${typeField.btype}`);
    }
}
exports.btypeDecodeValue = btypeDecodeValue;
function btypeEncodeValue(valueDecoded, typeField) {
    // No byte conversion
    if (typeField.type !== "bytes")
        return copyValue(valueDecoded);
    const value = valueDecoded;
    // Default byte conversion
    if (!typeField.btype) {
        return encodeBase64url(value);
    }
    // Specific byte conversion
    switch (typeField.btype) {
        case "BASE58":
        case "CONTRACT_ID":
        case "ADDRESS":
            return encodeBase58(value);
        case "BASE64":
            return encodeBase64url(value);
        case "HEX":
        case "BLOCK_ID":
        case "TRANSACTION_ID":
            return `0x${toHexString(value)}`;
        default:
            throw new Error(`unknown btype ${typeField.btype}`);
    }
}
exports.btypeEncodeValue = btypeEncodeValue;
function btypeDecode(valueEncoded, fields) {
    if (typeof valueEncoded !== "object")
        return valueEncoded;
    const valueDecoded = {};
    Object.keys(fields).forEach((name) => {
        if (!valueEncoded[name])
            return;
        if (fields[name].rule === "repeated")
            valueDecoded[name] = valueEncoded[name].map((itemEncoded) => {
                if (fields[name].subtypes)
                    return btypeDecode(itemEncoded, fields[name].subtypes);
                return btypeDecodeValue(itemEncoded, fields[name]);
            });
        else if (fields[name].subtypes)
            valueDecoded[name] = btypeDecode(valueEncoded[name], fields[name].subtypes);
        else
            valueDecoded[name] = btypeDecodeValue(valueEncoded[name], fields[name]);
    });
    return valueDecoded;
}
exports.btypeDecode = btypeDecode;
function btypeEncode(valueDecoded, fields) {
    if (typeof valueDecoded !== "object")
        return valueDecoded;
    const valueEncoded = {};
    Object.keys(fields).forEach((name) => {
        if (!valueDecoded[name])
            return;
        if (fields[name].rule === "repeated")
            valueEncoded[name] = valueDecoded[name].map((itemDecoded) => {
                if (fields[name].subtypes)
                    return btypeEncode(itemDecoded, fields[name].subtypes);
                return btypeEncodeValue(itemDecoded, fields[name]);
            });
        else if (fields[name].subtypes)
            valueEncoded[name] = btypeEncode(valueDecoded[name], fields[name].subtypes);
        else
            valueEncoded[name] = btypeEncodeValue(valueDecoded[name], fields[name]);
    });
    return valueEncoded;
}
exports.btypeEncode = btypeEncode;
/**
 * ABI for tokens
 */
exports.tokenAbi = {
    methods: {
        name: {
            entry_point: 0x82a3537f,
            argument: "name_arguments",
            return: "name_result",
            read_only: true,
        },
        symbol: {
            entry_point: 0xb76a7ca1,
            argument: "symbol_arguments",
            return: "symbol_result",
            read_only: true,
        },
        decimals: {
            entry_point: 0xee80fd2f,
            argument: "decimals_arguments",
            return: "decimals_result",
            read_only: true,
        },
        totalSupply: {
            entry_point: 0xb0da3934,
            argument: "total_supply_arguments",
            return: "total_supply_result",
            read_only: true,
        },
        balanceOf: {
            entry_point: 0x5c721497,
            argument: "balance_of_arguments",
            return: "balance_of_result",
            read_only: true,
            default_output: { value: "0" },
        },
        transfer: {
            entry_point: 0x27f576ca,
            argument: "transfer_arguments",
            return: "transfer_result",
        },
        mint: {
            entry_point: 0xdc6f17bb,
            argument: "mint_arguments",
            return: "mint_result",
        },
        burn: {
            entry_point: 0x859facc5,
            argument: "burn_arguments",
            return: "burn_result",
        },
    },
    koilib_types: token_proto_json_1.default,
};
//export const ProtocolTypes = protocolJson;
//# sourceMappingURL=utils.js.map