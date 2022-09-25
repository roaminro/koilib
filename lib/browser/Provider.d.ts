import { BlockJson, TransactionJson, CallContractOperationJson, TransactionReceipt, TransactionJsonWait } from "./interface";
/**
 * Class to connect with the RPC node
 */
export declare class Provider {
    /**
     * Array of URLs of RPC nodes
     */
    rpcNodes: string[];
    /**
     * Function triggered when a node is down. Returns a
     * boolean determining if the call should be aborted.
     *
     * @example
     * ```ts
     * const provider = new Provider([
     *   "http://45.56.104.152:8080",
     *   "http://159.203.119.0:8080"
     * ]);
     *
     * provider.onError = (error, node, newNode) => {
     *   console.log(`Error from node ${node}: ${error.message}`);
     *   console.log(`changing node to ${newNode}`);
     *   const abort = false;
     *   return abort;
     * }
     * ```
     */
    onError: (error: Error, 
    /** node that threw the error */
    currentNode: string, 
    /** node used for the next iteration */
    newNode: string) => boolean;
    /**
     * Index of current node in rpcNodes
     */
    currentNodeId: number;
    /**
     *
     * @param rpcNodes - URL of the rpc node, or array of urls
     * to switch between them when someone is down
     * @example
     * ```ts
     * const provider = new Provider([
     *   "http://45.56.104.152:8080",
     *   "http://159.203.119.0:8080"
     * ]);
     * ```
     */
    constructor(rpcNodes: string | string[]);
    /**
     * Function to make jsonrpc requests to the RPC node
     * @param method - jsonrpc method
     * @param params - jsonrpc params
     * @returns Result of jsonrpc response
     */
    call<T = unknown>(method: string, params: unknown): Promise<T>;
    /**
     * Function to call "chain.get_account_nonce" to return the number of
     * transactions for a particular account. This call is used
     * when creating new transactions.
     * @param account - account address
     * @param deserialize - If set true it will deserialize the nonce
     * and return it as number (default). If set false it will return
     * the nonce encoded as received from the RPC.
     * @returns Nonce
     */
    getNonce(account: string, deserialize?: boolean): Promise<number | string>;
    getAccountRc(account: string): Promise<string>;
    /**
     * Get transactions by id and their corresponding block ids
     */
    getTransactionsById(transactionIds: string[]): Promise<{
        transactions: {
            transaction: TransactionJson;
            containing_blocks: string[];
        }[];
    }>;
    getBlocksById(blockIds: string[]): Promise<{
        block_items: {
            block_id: string;
            block_height: string;
            block: BlockJson;
        }[];
    }>;
    /**
     * Function to get info from the head block in the blockchain
     */
    getHeadInfo(): Promise<{
        head_block_time: string;
        head_topology: {
            id: string;
            height: string;
            previous: string;
        };
        head_state_merkle_root: string;
        last_irreversible_block: string;
    }>;
    /**
     * Function to get the chain
     */
    getChainId(): Promise<string>;
    /**
     * Function to get consecutive blocks in descending order
     * @param height - Starting block height
     * @param numBlocks - Number of blocks to fetch
     * @param idRef - Block ID reference to speed up searching blocks.
     * This ID must be from a greater block height. By default it
     * gets the ID from the block head.
     */
    getBlocks(height: number, numBlocks?: number, idRef?: string): Promise<{
        block_id: string;
        block_height: string;
        block: BlockJson;
        block_receipt: {
            [x: string]: unknown;
        };
    }[]>;
    /**
     * Function to get a block by its height
     */
    getBlock(height: number): Promise<{
        block_id: string;
        block_height: string;
        block: BlockJson;
        block_receipt: {
            [x: string]: unknown;
        };
    }>;
    /**
     * Function to wait for a transaction to be mined.
     * @param txId - transaction id
     * @param type - Type must be "byBlock" (default) or "byTransactionId".
     * _byBlock_ will query the blockchain to get blocks and search for the
     * transaction there. _byTransactionId_ will query the "transaction store"
     * microservice to search the transaction by its id. If non of them is
     * specified the function will use "byBlock" (as "byTransactionId"
     * requires the transaction store, which is an optional microservice).
     *
     * When _byBlock_ is used it returns the block number.
     *
     * When _byTransactionId_ is used it returns the block id.
     *
     * @param timeout - Timeout in milliseconds. By default it is 15000
     * @example
     * ```ts
     * const blockNumber = await provider.wait(txId);
     * // const blockNumber = await provider.wait(txId, "byBlock", 15000);
     * // const blockId = await provider.wait(txId, "byTransactionId", 15000);
     * console.log("Transaction mined")
     * ```
     */
    wait(txId: string, type?: "byTransactionId" | "byBlock", timeout?: number): Promise<{
        blockId: string;
        blockNumber?: number;
    }>;
    /**
     * Function to call "chain.submit_transaction" to send a signed
     * transaction to the blockchain.
     *
     * It also has the option to not broadcast the transaction (to not
     * include the transaction the mempool), which is useful if you
     * want to test the interaction with a contract and check the
     * possible events triggered.
     * @param transaction - Transaction
     * @param broadcast - Option to broadcast the transaction to the
     * whole network. By default it is true.
     * @returns It returns the receipt received from the RPC node
     * and the transaction with the arrow function "wait" (see [[wait]])
     */
    sendTransaction(transaction: TransactionJson | TransactionJsonWait, broadcast?: boolean): Promise<{
        receipt: TransactionReceipt;
        transaction: TransactionJsonWait;
    }>;
    /**
     * Function to call "chain.submit_block" to send a signed
     * block to the blockchain.
     */
    submitBlock(block: BlockJson): Promise<Record<string, never>>;
    /**
     * Function to call "chain.read_contract" to read a contract.
     * This function is used by [[Contract]] class when read methods
     * are invoked.
     */
    readContract(operation: CallContractOperationJson): Promise<{
        result: string;
        logs: string;
    }>;
}
export default Provider;
