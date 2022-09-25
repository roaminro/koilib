"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Serializer = void 0;
/* eslint-disable @typescript-eslint/require-await */
const light_1 = require("protobufjs/light");
const utils_1 = require("./utils");
const OP_BYTES_1 = "(btype)";
const OP_BYTES_2 = "(koinos.btype)";
const nativeTypes = [
    "double",
    "float",
    "int32",
    "int64",
    "uint32",
    "uint64",
    "sint32",
    "sint64",
    "fixed32",
    "fixed64",
    "sfixed32",
    "sfixed64",
    "bool",
    "string",
    "bytes",
];
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
class Serializer {
    constructor(types, opts) {
        /**
         * Preformat bytes for base64url, base58 or hex string
         */
        this.bytesConversion = true;
        this.types = types;
        this.root = light_1.Root.fromJSON(this.types);
        if (opts === null || opts === void 0 ? void 0 : opts.defaultTypeName)
            this.defaultType = this.root.lookupType(opts.defaultTypeName);
        if (opts && typeof opts.bytesConversion !== "undefined")
            this.bytesConversion = opts.bytesConversion;
    }
    btypeDecode(valueBtypeEncoded, protobufType) {
        const valueBtypeDecoded = {};
        Object.keys(protobufType.fields).forEach((fieldName) => {
            // @ts-ignore
            const { options, name, type, rule } = protobufType.fields[fieldName];
            if (!valueBtypeEncoded[name])
                return;
            const typeField = { type };
            if (options) {
                if (options[OP_BYTES_1])
                    typeField.btype = options[OP_BYTES_1];
                else if (options[OP_BYTES_2])
                    typeField.btype = options[OP_BYTES_2];
            }
            // arrays
            if (rule === "repeated") {
                valueBtypeDecoded[name] = valueBtypeEncoded[name].map((itemEncoded) => {
                    // custom objects
                    if (!nativeTypes.includes(type)) {
                        try {
                            const protoBuf = this.root.lookupType(type);
                            return this.btypeDecode(itemEncoded, protoBuf);
                        }
                        catch (error) {
                            return itemEncoded;
                        }
                    }
                    // native types
                    return (0, utils_1.btypeDecodeValue)(itemEncoded, typeField);
                });
                return;
            }
            // custom objects
            if (!nativeTypes.includes(type)) {
                try {
                    const protoBuf = this.root.lookupType(type);
                    valueBtypeDecoded[name] = this.btypeDecode(valueBtypeEncoded[name], protoBuf);
                }
                catch (error) {
                    valueBtypeDecoded[name] = valueBtypeEncoded[name];
                }
                return;
            }
            // native types
            valueBtypeDecoded[name] = (0, utils_1.btypeDecodeValue)(valueBtypeEncoded[name], typeField);
        });
        return valueBtypeDecoded;
    }
    btypeEncode(valueBtypeDecoded, protobufType) {
        const valueBtypeEncoded = {};
        Object.keys(protobufType.fields).forEach((fieldName) => {
            // @ts-ignore
            const { options, name, type, rule } = protobufType.fields[fieldName];
            if (!valueBtypeDecoded[name])
                return;
            const typeField = { type };
            if (options) {
                if (options[OP_BYTES_1])
                    typeField.btype = options[OP_BYTES_1];
                else if (options[OP_BYTES_2])
                    typeField.btype = options[OP_BYTES_2];
            }
            // arrays
            if (rule === "repeated") {
                valueBtypeEncoded[name] = valueBtypeDecoded[name].map((itemDecoded) => {
                    // custom objects
                    if (!nativeTypes.includes(type)) {
                        try {
                            const protoBuf = this.root.lookupType(type);
                            return this.btypeEncode(itemDecoded, protoBuf);
                        }
                        catch (error) {
                            return itemDecoded;
                        }
                    }
                    // native types
                    return (0, utils_1.btypeEncodeValue)(itemDecoded, typeField);
                });
                return;
            }
            // custom objects
            if (!nativeTypes.includes(type)) {
                try {
                    const protoBuf = this.root.lookupType(type);
                    valueBtypeEncoded[name] = this.btypeEncode(valueBtypeDecoded[name], protoBuf);
                }
                catch (error) {
                    console.error(error);
                    valueBtypeEncoded[name] = valueBtypeDecoded[name];
                }
                return;
            }
            // native types
            valueBtypeEncoded[name] = (0, utils_1.btypeEncodeValue)(valueBtypeDecoded[name], typeField);
        });
        return valueBtypeEncoded;
    }
    /**
     * Function to encode a type using the protobuffer definitions
     * It also prepares the bytes for special cases (base58, hex string)
     * when bytesConversion param is true.
     */
    async serialize(valueDecoded, typeName, opts) {
        const protobufType = this.defaultType || this.root.lookupType(typeName);
        let object = {};
        const bytesConversion = (opts === null || opts === void 0 ? void 0 : opts.bytesConversion) === undefined
            ? this.bytesConversion
            : opts.bytesConversion;
        if (bytesConversion) {
            object = this.btypeDecode(valueDecoded, protobufType);
        }
        else {
            object = valueDecoded;
        }
        const message = protobufType.create(object);
        const buffer = protobufType.encode(message).finish();
        return buffer;
    }
    /**
     * Function to decode bytes using the protobuffer definitions
     * It also encodes the bytes for special cases (base58, hex string)
     * when bytesConversion param is true.
     */
    async deserialize(valueEncoded, typeName, opts) {
        const valueBuffer = typeof valueEncoded === "string"
            ? (0, utils_1.decodeBase64url)(valueEncoded)
            : valueEncoded;
        const protobufType = this.defaultType || this.root.lookupType(typeName);
        const message = protobufType.decode(valueBuffer);
        const object = protobufType.toObject(message, {
            longs: String,
            defaults: true,
        });
        const bytesConversion = (opts === null || opts === void 0 ? void 0 : opts.bytesConversion) === undefined
            ? this.bytesConversion
            : opts.bytesConversion;
        if (bytesConversion) {
            return this.btypeEncode(object, protobufType);
        }
        return object;
    }
}
exports.Serializer = Serializer;
exports.default = Serializer;
//# sourceMappingURL=Serializer.js.map