import { Signer, SignerInterface } from "./Signer";
import { Provider } from "./Provider";
import { Serializer } from "./Serializer";
import { TransactionJsonWait, Abi, TransactionOptions, DecodedOperationJson, OperationJson, DeployOptions, TransactionReceipt } from "./interface";
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
export declare class Contract {
    /**
     * Contract ID
     */
    id?: Uint8Array;
    /**
     * Set of functions to interact with the smart
     * contract. These functions are automatically generated
     * in the constructor of the class
     *
     * @example
     * ```ts
     * const owner = "1Gvqdo9if6v6tFomEuTuMWP1D7H7U9yksb";
     * await koinContract.functions.balanceOf({ owner });
     * ```
     *
     * @example using options
     * ```ts
     * await koinContract.functions.transfer({
     *   from: "1Gvqdo9if6v6tFomEuTuMWP1D7H7U9yksb",
     *   to: "19JntSm8pSNETT9aHTwAUHC5RMoaSmgZPJ",
     *   value: "1",
     * },{
     *   chainId: "EiB-hw5ABo-EXy6fGDd1Iq3gbAenxQ4Qe60pRbEVMVrR9A==",
     *   rcLimit: "100000000",
     *   nonce: "OAI=",
     *   payer: "19JntSm8pSNETT9aHTwAUHC5RMoaSmgZPJ",
     *   payee: "1Gvqdo9if6v6tFomEuTuMWP1D7H7U9yksb",
     *   signTransaction: true,
     *   sendTransaction: true,
     *   broadcast: true,
     *   sendAbis: true,
     * });
     * ```
     */
    functions: {
        [x: string]: <T = Record<string, unknown>>(args?: unknown, opts?: TransactionOptions) => Promise<{
            operation: OperationJson;
            transaction?: TransactionJsonWait;
            result?: T;
            receipt?: TransactionReceipt;
        }>;
    };
    /**
     * Application Binary Interface
     */
    abi?: Abi;
    /**
     * Signer interacting with the smart contract
     */
    signer?: SignerInterface;
    /**
     * Provider to connect with the blockchain
     */
    provider?: Provider;
    /**
     * Serializer to serialize/deserialize data types
     */
    serializer?: Serializer;
    /**
     * Bytecode. Needed to deploy the smart contract.
     */
    bytecode?: Uint8Array;
    /**
     * Options to apply when creating transactions.
     * By default it set rc_limit to 1e8, sendTransaction true,
     * sendAbis true, and nonce undefined (to get it from the blockchain)
     */
    options: TransactionOptions;
    constructor(c: {
        id?: string;
        abi?: Abi;
        bytecode?: Uint8Array;
        options?: TransactionOptions;
        signer?: Signer;
        provider?: Provider;
        /**
         * Set this option if you can not use _eval_ functions
         * in the current environment. In such cases, the
         * serializer must come from an environment where it
         * is able to use those functions.
         */
        serializer?: Serializer;
    });
    /**
     * Get contract Id
     */
    getId(): string;
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
    deploy(options?: DeployOptions): Promise<{
        operation: OperationJson;
        transaction: TransactionJsonWait;
        receipt?: TransactionReceipt;
    }>;
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
    encodeOperation(op: DecodedOperationJson): Promise<OperationJson>;
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
    decodeOperation(op: OperationJson): Promise<DecodedOperationJson>;
}
export default Contract;
