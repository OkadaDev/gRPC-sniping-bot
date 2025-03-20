import { PublicKey } from "@solana/web3.js"
import { buyAmount, slippage, solToken, targetWallet } from "../helpers/constants";
import { BaseProvider } from "@bloxroute/solana-trader-client-ts";
import { logger } from "../utils/logger";
import { logError } from "@metaplex-foundation/js";
import { SwapHandle } from "../Instruction/SwapHandle";
import { sleep } from "../utils/utils";

export class RaydiumSwapStream {
    private targetWallet: string;
    private provider: BaseProvider;
    private handleSwap: SwapHandle;
    private isStreamig: boolean = false;
    constructor(provider: BaseProvider) {
        this.provider = provider;
        this.targetWallet = targetWallet;
        this.handleSwap = new SwapHandle(provider);
    }
    public raydiumSwapStream = async (pools: string[], inToken: string, amount: number) => {
        try {
            logger.info(`Subscribing for raydium swap transactions`)
            await sleep(10000);
            // logger.info(`Target Wallet : ${this.targetWallet}`)
            const req = await this.provider.getSwapsStream({
                projects: ["P_RAYDIUM"],
                pools,
                includeFailed: false
            });
            let count = 0;
            for await (const tr of req) {
                if (this.isStreamig) break;
                const data = tr.swap
                // console.log(data)
                // logger.info(`Pool Address : ${data?.poolAddress}`);
                // logger.info(`Buyer : ${data?.ownerAccount}`);
                logger.info(`Amount : ${data?.inTokenAddress}--->${data?.inAmount}`);
                if (count % 3 == 0) {
                    await this.sellTrigerSOL(inToken, amount);
                }
                count++;
            }
        } catch (error) {
            throw new Error("CopyTraidng Error")
        }
    }
    public sellTrigerSOL = async (inToken: string, amount: number) => {
        const req = await this.provider.getQuotes({
            inToken,
            outToken: solToken,
            inAmount: amount,
            slippage: slippage,
            limit: 1,
            projects: ["P_RAYDIUM"],
        })
        logger.info(`Quote : ${req.quotes[0].routes[0].outAmount}`)
        const quote = req.quotes[0];
        // await sleep(2000);
        // await this.handleSwap.swap(inToken, solToken, slippage, amount)
        // this.isStreamig = true;
        if (quote.routes[0].outAmount > buyAmount + 0.01 || quote.routes[0].outAmount < buyAmount - 0.005) {
            logger.info("Selling Triggered")
            await this.handleSwap.swap(inToken, solToken, slippage, amount)
            this.isStreamig = true;
        }
    }
}