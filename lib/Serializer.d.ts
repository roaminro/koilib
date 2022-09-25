import { Root, Type, INamespace } from "protobufjs/light";
/**
 * The serializer class serialize and deserialize data using
 * protocol buffers.
 *
 * NOTE: This class uses the [protobufjs/light](https://www.npmjs.com/package/protobufjs)
 * library internally, which uses reflection (use of _eval_
 * and _new Function_) for the construction of the types.
 * This could cause issues in environments where _eval_ is not
 * allowed, like in browser extensions. In such cases, this class
 * must be confined in a [sandbox environment](https://developer.chrome.com/docs/apps/app_external/#sandboxing)
 * where _eval_ is allowed. This is the principal reason of
 * having the serializer in a separate class.
 *
 * @example
 *
 * ```ts
 * const descriptorJson = {
 *   nested: {
 *     awesomepackage: {
 *       nested: {
 *         AwesomeMessage: {
 *           fields: {
 *             awesomeField: {
 *               type: "string",
 *               id: 1
 *             }
 *           }
 *         }
 *       }
 *     }
 *   }
 * }
 * const serializer = new Serializer(descriptorJson)
 * ```
 */
export declare class Serializer {
    /**
     * Protobuffers descriptor in JSON format.
     * See https://www.npmjs.com/package/protobufjs#using-json-descriptors
     */
    types: INamespace;
    /**
     * Protobuffer definitions
     */
    root: Root;
    /**
     * Default type for all serializations
     */
    defaultType?: Type;
    /**
     * Preformat bytes for base64url, base58 or hex string
     */
    bytesConversion: boolean;
    constructor(types: INamespace, opts?: {
        /**
         * Default type name. Use this option when you
         * always want to serialize/deserialize the same type
         */
        defaultTypeName?: string;
        /**
         * Bytes conversion. Option to preformat bytes
         * when "(koinos_bytes_type)" is defined in the type
         * definitions. By default it is true.
         */
        bytesConversion?: boolean;
    });
    btypeDecode(valueBtypeEncoded: Record<string, unknown> | unknown[], protobufType: Type): Record<string, unknown>;
    btypeEncode(valueBtypeDecoded: Record<string, unknown> | unknown[], protobufType: Type): Record<string, unknown>;
    /**
     * Function to encode a type using the protobuffer definitions
     * It also prepares the bytes for special cases (base58, hex string)
     * when bytesConversion param is true.
     */
    serialize(valueDecoded: Record<string, unknown>, typeName?: string, opts?: {
        bytesConversion?: boolean;
    }): Promise<Uint8Array>;
    /**
     * Function to decode bytes using the protobuffer definitions
     * It also encodes the bytes for special cases (base58, hex string)
     * when bytesConversion param is true.
     */
    deserialize<T = Record<string, unknown>>(valueEncoded: string | Uint8Array, typeName?: string, opts?: {
        bytesConversion?: boolean;
    }): Promise<T>;
}
export default Serializer;
