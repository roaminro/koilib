"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Provider = void 0;
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const protocol_proto_js_1 = require("./protoModules/protocol-proto.js");
const utils_1 = require("./utils");
/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
async function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
}
/**
 * Class to connect with the RPC node
 */
class Provider {
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
    constructor(rpcNodes) {
        if (Array.isArray(rpcNodes))
            this.rpcNodes = rpcNodes;
        else
            this.rpcNodes = [rpcNodes];
        this.currentNodeId = 0;
        this.onError = () => true;
    }
    /**
     * Function to make jsonrpc requests to the RPC node
     * @param method - jsonrpc method
     * @param params - jsonrpc params
     * @returns Result of jsonrpc response
     */
    async call(method, params) {
        /* eslint-disable no-await-in-loop */
        // eslint-disable-next-line no-constant-condition
        while (true) {
            try {
                const body = {
                    id: Math.round(Math.random() * 1000),
                    jsonrpc: "2.0",
                    method,
                    params,
                };
                const url = this.rpcNodes[this.currentNodeId];
                const response = await fetch(url, {
                    method: "POST",
                    body: JSON.stringify(body),
                });
                const json = (await response.json());
                if (json.result !== undefined)
                    return json.result;
                if (!json.error)
                    throw new Error("undefined error");
                const { message, data } = json.error;
                if (!data)
                    throw new Error(message);
                let dataJson;
                try {
                    dataJson = JSON.parse(data);
                }
                catch (e) {
                    dataJson = { data };
                }
                throw new Error(JSON.stringify({
                    ...(message && { error: message }),
                    ...dataJson,
                }));
            }
            catch (e) {
                const currentNode = this.rpcNodes[this.currentNodeId];
                this.currentNodeId = (this.currentNodeId + 1) % this.rpcNodes.length;
                const newNode = this.rpcNodes[this.currentNodeId];
                const abort = this.onError(e, currentNode, newNode);
                if (abort)
                    throw e;
            }
        }
    }
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
    async getNonce(account, deserialize = true) {
        const { nonce: nonceBase64url } = await this.call("chain.get_account_nonce", { account });
        if (!deserialize) {
            return nonceBase64url;
        }
        const valueBuffer = (0, utils_1.decodeBase64url)(nonceBase64url);
        const message = protocol_proto_js_1.koinos.chain.value_type.decode(valueBuffer);
        const object = protocol_proto_js_1.koinos.chain.value_type.toObject(message, {
            longs: String,
            defaults: true,
        });
        // todo: consider the case where nonce is greater than max safe integer
        return Number(object.uint64_value);
    }
    async getAccountRc(account) {
        const { rc } = await this.call("chain.get_account_rc", {
            account,
        });
        if (!rc)
            return "0";
        return rc;
    }
    /**
     * Get transactions by id and their corresponding block ids
     */
    async getTransactionsById(transactionIds) {
        return this.call("transaction_store.get_transactions_by_id", {
            transaction_ids: transactionIds,
        });
    }
    async getBlocksById(blockIds) {
        return this.call("block_store.get_blocks_by_id", {
            block_ids: blockIds,
            return_block: true,
            return_receipt: false,
        });
    }
    /**
     * Function to get info from the head block in the blockchain
     */
    async getHeadInfo() {
        return this.call("chain.get_head_info", {});
    }
    /**
     * Function to get the chain
     */
    async getChainId() {
        const { chain_id: chainId } = await this.call("chain.get_chain_id", {});
        return chainId;
    }
    /**
     * Function to get consecutive blocks in descending order
     * @param height - Starting block height
     * @param numBlocks - Number of blocks to fetch
     * @param idRef - Block ID reference to speed up searching blocks.
     * This ID must be from a greater block height. By default it
     * gets the ID from the block head.
     */
    async getBlocks(height, numBlocks = 1, idRef) {
        let blockIdRef = idRef;
        if (!blockIdRef) {
            const head = await this.getHeadInfo();
            blockIdRef = head.head_topology.id;
        }
        return (await this.call("block_store.get_blocks_by_height", {
            head_block_id: blockIdRef,
            ancestor_start_height: height,
            num_blocks: numBlocks,
            return_block: true,
            return_receipt: false,
        })).block_items;
    }
    /**
     * Function to get a block by its height
     */
    async getBlock(height) {
        return (await this.getBlocks(height, 1))[0];
    }
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
    async wait(txId, type = "byBlock", timeout = 15000) {
        const iniTime = Date.now();
        if (type === "byTransactionId") {
            while (Date.now() < iniTime + timeout) {
                await sleep(1000);
                const { transactions } = await this.getTransactionsById([txId]);
                if (transactions &&
                    transactions[0] &&
                    transactions[0].containing_blocks)
                    return {
                        blockId: transactions[0].containing_blocks[0],
                    };
            }
            throw new Error(`Transaction not mined after ${timeout} ms`);
        }
        // byBlock
        const findTxInBlocks = async (ini, numBlocks, idRef) => {
            const blocks = await this.getBlocks(ini, numBlocks, idRef);
            let bNum = 0;
            let bId = "";
            blocks.forEach((block) => {
                if (!block ||
                    !block.block ||
                    !block.block_id ||
                    !block.block.transactions)
                    return;
                const tx = block.block.transactions.find((t) => t.id === txId);
                if (tx) {
                    bNum = Number(block.block_height);
                    bId = block.block_id;
                }
            });
            const lastId = blocks[blocks.length - 1].block_id;
            return [bNum, bId, lastId];
        };
        let blockNumber = 0;
        let iniBlock = 0;
        let previousId = "";
        while (Date.now() < iniTime + timeout) {
            await sleep(1000);
            const { head_topology: headTopology } = await this.getHeadInfo();
            if (blockNumber === 0) {
                blockNumber = Number(headTopology.height);
                iniBlock = blockNumber;
            }
            if (Number(headTopology.height) === blockNumber - 1 &&
                previousId &&
                previousId !== headTopology.id) {
                const [bNum, bId, lastId] = await findTxInBlocks(iniBlock, Number(headTopology.height) - iniBlock + 1, headTopology.id);
                if (bNum)
                    return {
                        blockId: bId,
                        blockNumber: bNum,
                    };
                previousId = lastId;
                blockNumber = Number(headTopology.height) + 1;
            }
            // eslint-disable-next-line no-continue
            if (blockNumber > Number(headTopology.height))
                continue;
            const [bNum, bId, lastId] = await findTxInBlocks(blockNumber, 1, headTopology.id);
            if (bNum)
                return {
                    blockId: bId,
                    blockNumber: bNum,
                };
            if (!previousId)
                previousId = lastId;
            blockNumber += 1;
        }
        throw new Error(`Transaction not mined after ${timeout} ms. Blocks checked from ${iniBlock} to ${blockNumber}`);
    }
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
    async sendTransaction(transaction, broadcast = true) {
        const response = await this.call("chain.submit_transaction", { transaction, broadcast });
        transaction.wait = async (type = "byBlock", timeout = 15000) => {
            return this.wait(transaction.id, type, timeout);
        };
        return { ...response, transaction: transaction };
    }
    /**
     * Function to call "chain.submit_block" to send a signed
     * block to the blockchain.
     */
    async submitBlock(block) {
        return this.call("chain.submit_block", { block });
    }
    /**
     * Function to call "chain.read_contract" to read a contract.
     * This function is used by [[Contract]] class when read methods
     * are invoked.
     */
    async readContract(operation) {
        return this.call("chain.read_contract", operation);
    }
}
exports.Provider = Provider;
exports.default = Provider;
//# sourceMappingURL=Provider.js.map