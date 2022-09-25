"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Contract = void 0;
const Serializer_1 = require("./Serializer");
const utils_1 = require("./utils");
/**
 * The contract class contains the contract ID and contract entries
 * definition needed to encode/decode operations during the
 * interaction with the user and the communication with the RPC node.
 *
 * @example
 *
 * ```ts
 * const { Contract, Provider, Signer, utils } = require("koilib");
 * const rpcNodes = ["http://api.koinos.io:8080"];
 * const privateKey = "f186a5de49797bfd52dc42505c33d75a46822ed5b60046e09d7c336242e20200";
 * const provider = new Provider(rpcNodes);
 * const signer = new Signer({ privateKey, provider });
 * const koinContract = new Contract({
 *   id: "19JntSm8pSNETT9aHTwAUHC5RMoaSmgZPJ",
 *   abi: utils.tokenAbi,
 *   provider,
 *   signer,
 * });
 * const koin = koinContract.functions;
 *
 * // optional: preformat argument/return
 * koinContract.abi.methods.balanceOf.preformat_argument = (owner) =>
 *   ({ owner });
 * koinContract.abi.methods.balanceOf.preformat_return = (res) =>
 *   utils.formatUnits(res.value, 8);
 * koinContract.abi.methods.transfer.preformat_argument = (arg) => ({
 *   from: signer.getAddress(),
 *   to: arg.to,
 *   value: utils.parseUnits(arg.value, 8),
 * });
 *
 * async funtion main() {
 *   // Get balance
 *   const { result } = await koin.balanceOf("12fN2CQnuJM8cMnWZ1hPtM4knjLME8E4PD");
 *   console.log(result)
 *
 *   // Transfer
 *   const { transaction, receipt } = await koin.transfer({
 *     to: "172AB1FgCsYrRAW5cwQ8KjadgxofvgPFd6",
 *     value: "10.0001",
 *   });
 *   console.log(`Transaction id ${transaction.id} submitted. Receipt:`);
 *   console.log(receipt);
 *
 *   if (receipt.logs) {
 *     console.log(`Transfer failed. Logs: ${receipt.logs.join(",")}`);
 *   }
 *
 *   // wait to be mined
 *   const blockNumber = await transaction.wait();
 *   console.log(`Transaction mined. Block number: ${blockNumber}`);
 * }
 *
 * main();
 * ```
 */
class Contract {
    constructor(c) {
        var _a;
        if (c.id)
            this.id = (0, utils_1.decodeBase58)(c.id);
        this.signer = c.signer;
        this.provider = c.provider || ((_a = c.signer) === null || _a === void 0 ? void 0 : _a.provider);
        this.abi = c.abi;
        this.bytecode = c.bytecode;
        if (c.serializer) {
            this.serializer = c.serializer;
        }
        else if (c.abi && c.abi.koilib_types) {
            this.serializer = new Serializer_1.Serializer(c.abi.koilib_types);
        }
        this.options = {
            signTransaction: true,
            sendTransaction: true,
            broadcast: true,
            sendAbis: true,
            ...c.options,
        };
        this.functions = {};
        if (this.abi && this.abi.methods) {
            Object.keys(this.abi.methods).forEach((name) => {
                this.functions[name] = async (argu = {}, options) => {
                    if (!this.provider)
                        throw new Error("provider not found");
                    if (!this.abi || !this.abi.methods)
                        throw new Error("Methods are not defined");
                    if (!this.abi.methods[name])
                        throw new Error(`Method ${name} not defined in the ABI`);
                    const opts = {
                        ...this.options,
                        ...options,
                    };
                    const { read_only: readOnly, return: output, default_output: defaultOutput, preformat_argument: preformatArgument, preformat_return: preformatReturn, } = this.abi.methods[name];
                    let args;
                    if (typeof preformatArgument === "function") {
                        args = preformatArgument(argu);
                    }
                    else {
                        args = argu;
                    }
                    const operation = await this.encodeOperation({ name, args });
                    if (readOnly) {
                        if (!output)
                            throw new Error(`No output defined for ${name}`);
                        // read contract
                        const { result: resultEncoded } = await this.provider.readContract(operation.call_contract);
                        let result = defaultOutput;
                        if (resultEncoded) {
                            result = await this.serializer.deserialize(resultEncoded, output);
                        }
                        if (typeof preformatReturn === "function") {
                            result = preformatReturn(result);
                        }
                        return { operation, result };
                    }
                    // write contract (sign and send)
                    if (!this.signer)
                        throw new Error("signer not found");
                    let tx = await this.signer.prepareTransaction({
                        header: {
                            ...(opts.chainId && { chain_id: opts.chainId }),
                            ...(opts.rcLimit && { rc_limit: opts.rcLimit }),
                            ...(opts.nonce && { nonce: opts.nonce }),
                            ...(opts.payer && { payer: opts.payer }),
                            ...(opts.payee && { payee: opts.payee }),
                        },
                        operations: [operation],
                    });
                    const optsSend = {
                        broadcast: opts.broadcast,
                        beforeSend: opts.beforeSend,
                    };
                    if (opts.sendAbis) {
                        optsSend.abis = {};
                        const contractId = (0, utils_1.encodeBase58)(this.id);
                        optsSend.abis[contractId] = this.abi;
                    }
                    // return result if the transaction will not be broadcasted
                    if (!opts.sendTransaction) {
                        const noWait = () => {
                            throw new Error("This transaction was not broadcasted");
                        };
                        if (opts.signTransaction)
                            tx = await this.signer.signTransaction(tx, optsSend.abis);
                        return { operation, transaction: { ...tx, wait: noWait } };
                    }
                    const { transaction, receipt } = await this.signer.sendTransaction(tx, optsSend);
                    return { operation, transaction, receipt };
                };
            });
        }
    }
    /**
     * Get contract Id
     */
    getId() {
        if (!this.id)
            throw new Error("id is not defined");
        return (0, utils_1.encodeBase58)(this.id);
    }
    /**
     * Function to deploy a new smart contract.
     * The Bytecode must be defined in the constructor of the class
     * @example
     * ```ts
     * const privateKey = "f186a5de49797bfd52dc42505c33d75a46822ed5b60046e09d7c336242e20200";
     * const provider = new Provider(["http://api.koinos.io:8080"]);
     * const signer = new Signer({ privateKey, provider });
     * const bytecode = new Uint8Array([1, 2, 3, 4]);
     * const contract = new Contract({ signer, provider, bytecode });
     * const { transaction, receipt } = await contract.deploy();
     * console.log(receipt);
     * // wait to be mined
     * const blockNumber = await transaction.wait();
     * console.log(`Contract uploaded in block number ${blockNumber}`);
     * ```
     *
     * @example using options
     * ```ts
     * const { transaction, receipt } = await contract.deploy({
     *   // contract options
     *   abi: "CssCChRrb2lub3Mvb3B0aW9ucy5wc...",
     *   authorizesCallContract: true,
     *   authorizesTransactionApplication: true,
     *   authorizesUploadContract: true,
     *
     *   // transaction options
     *   chainId: "EiB-hw5ABo-EXy6fGDd1Iq3gbAenxQ4Qe60pRbEVMVrR9A==",
     *   rcLimit: "100000000",
     *   nonce: "OAI=",
     *   payer: "19JntSm8pSNETT9aHTwAUHC5RMoaSmgZPJ",
     *   payee: "1Gvqdo9if6v6tFomEuTuMWP1D7H7U9yksb",
     *
     *   // sign and broadcast
     *   signTransaction: true,
     *   sendTransaction: true,
     *   broadcast: true,
     * });
     * console.log(receipt);
     * // wait to be mined
     * const blockNumber = await transaction.wait();
     * console.log(`Contract uploaded in block number ${blockNumber}`);
     * ```
     */
    async deploy(options) {
        if (!this.signer)
            throw new Error("signer not found");
        if (!this.bytecode)
            throw new Error("bytecode not found");
        const opts = {
            ...this.options,
            ...options,
        };
        const contractId = this.id
            ? (0, utils_1.encodeBase58)(this.id)
            : this.signer.getAddress();
        const operation = {
            upload_contract: {
                contract_id: contractId,
                bytecode: (0, utils_1.encodeBase64url)(this.bytecode),
                ...(opts.abi && { abi: opts.abi }),
                ...(opts.authorizesCallContract && {
                    authorizes_call_contract: opts.authorizesCallContract,
                }),
                ...(opts.authorizesTransactionApplication && {
                    authorizes_transaction_application: opts.authorizesTransactionApplication,
                }),
                ...(opts.authorizesUploadContract && {
                    authorizes_upload_contract: opts.authorizesUploadContract,
                }),
            },
        };
        let tx = await this.signer.prepareTransaction({
            header: {
                ...(opts.chainId && { chain_id: opts.chainId }),
                ...(opts.rcLimit && { rc_limit: opts.rcLimit }),
                ...(opts.nonce && { nonce: opts.nonce }),
                ...(opts.payer && { payer: opts.payer }),
                ...(opts.payee && { payee: opts.payee }),
            },
            operations: [operation],
        });
        const optsSend = {
            broadcast: opts.broadcast,
            beforeSend: opts.beforeSend,
        };
        // return result if the transaction will not be broadcasted
        if (!opts.sendTransaction) {
            const noWait = () => {
                throw new Error("This transaction was not broadcasted");
            };
            if (opts.signTransaction)
                tx = await this.signer.signTransaction(tx);
            return { operation, transaction: { ...tx, wait: noWait } };
        }
        const { transaction, receipt } = await this.signer.sendTransaction(tx, optsSend);
        return { operation, transaction, receipt };
    }
    /**
     * Encondes a contract operation using Koinos serialization
     * and taking the contract entries as reference to build it
     * @param op - Operation to encode
     * @returns Operation encoded
     * @example
     * ```ts
     * const opEncoded = contract.encodeOperation({
     *   name: "transfer",
     *   args: {
     *     from: "12fN2CQnuJM8cMnWZ1hPtM4knjLME8E4PD",
     *     to: "172AB1FgCsYrRAW5cwQ8KjadgxofvgPFd6",
     *     value: "1000",
     *   }
     * });
     *
     * console.log(opEncoded);
     * // {
     * //   call_contract: {
     * //     contract_id: "19JntSm8pSNETT9aHTwAUHC5RMoaSmgZPJ",
     * //     entry_point: 670398154,
     * //     args: "ChkAEjl6vrl55V2Oym_rzsnMxIqBoie9PHmMEhkAQgjT1UACatdFY3e5QRkyG7OAzwcCCIylGOgH",
     * //   }
     * // }
     * ```
     */
    async encodeOperation(op) {
        if (!this.abi || !this.abi.methods || !this.abi.methods[op.name])
            throw new Error(`Operation ${op.name} unknown`);
        if (!this.serializer)
            throw new Error("Serializer is not defined");
        if (!this.id)
            throw new Error("Contract id is not defined");
        const method = this.abi.methods[op.name];
        let bufferArguments = new Uint8Array(0);
        if (method.argument) {
            if (!op.args)
                throw new Error(`No arguments defined for type '${method.argument}'`);
            bufferArguments = await this.serializer.serialize(op.args, method.argument);
        }
        return {
            call_contract: {
                contract_id: (0, utils_1.encodeBase58)(this.id),
                entry_point: method.entry_point,
                args: (0, utils_1.encodeBase64url)(bufferArguments),
            },
        };
    }
    /**
     * Decodes a contract operation to be human readable
     * @example
     * ```ts
     * const opDecoded = contract.decodeOperation({
     *   call_contract: {
     *     contract_id: "19JntSm8pSNETT9aHTwAUHC5RMoaSmgZPJ",
     *     entry_point: 0x27f576ca,
     *     args: "ChkAEjl6vrl55V2Oym_rzsnMxIqBoie9PHmMEhkAQgjT1UACatdFY3e5QRkyG7OAzwcCCIylGOgH",
     *   }
     * });
     * console.log(opDecoded);
     * // {
     * //   name: "transfer",
     * //   args: {
     * //     from: "12fN2CQnuJM8cMnWZ1hPtM4knjLME8E4PD",
     * //     to: "172AB1FgCsYrRAW5cwQ8KjadgxofvgPFd6",
     * //     value: "1000",
     * //   },
     * // }
     * ```
     */
    async decodeOperation(op) {
        if (!this.id)
            throw new Error("Contract id is not defined");
        if (!this.abi || !this.abi.methods)
            throw new Error("Methods are not defined");
        if (!this.serializer)
            throw new Error("Serializer is not defined");
        if (!op.call_contract)
            throw new Error("Operation is not CallContractOperation");
        if (op.call_contract.contract_id !== (0, utils_1.encodeBase58)(this.id))
            throw new Error(`Invalid contract id. Expected: ${(0, utils_1.encodeBase58)(this.id)}. Received: ${op.call_contract.contract_id}`);
        for (let i = 0; i < Object.keys(this.abi.methods).length; i += 1) {
            const opName = Object.keys(this.abi.methods)[i];
            const method = this.abi.methods[opName];
            if (op.call_contract.entry_point === method.entry_point) {
                if (!method.argument)
                    return { name: opName };
                return {
                    name: opName,
                    args: await this.serializer.deserialize(op.call_contract.args, method.argument),
                };
            }
        }
        throw new Error(`Unknown method id ${op.call_contract.entry_point}`);
    }
}
exports.Contract = Contract;
exports.default = Contract;
//# sourceMappingURL=Contract.js.map