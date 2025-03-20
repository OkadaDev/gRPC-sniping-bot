import { BaseProvider } from "@bloxroute/solana-trader-client-ts";
import { SwapHandle, wallet } from "../Instruction/SwapHandle";
import { logger } from "../utils/logger";
import { Check } from "./check";
import { buyAmount, private_key, slippage, socialCheck, solToken, tokenLockCheck, triggerSOLOrder } from "../helpers/constants";
import { RaydiumPoolReserves } from "./RaydiumPoolReserves";
import { RaydiumSwapStream } from "./RaydiumSwapStream";
import { sleep } from "../utils/utils";

export class RaydiumPoolStream {
    private provider: BaseProvider;
    private handleSwap: SwapHandle;
    constructor(provider: BaseProvider) {
        this.provider = provider;
        this.handleSwap = new SwapHandle(provider);
    }
    public getRaydiumPoolStream = async () => {
        logger.info("Subscribing for new pool transactions in raydium")
        try {
            const req = await this.provider.getNewRaydiumPoolsStream({});
            let count = 0;
            for await (const tr of req) {
                const data = tr.pool;
                const slot = tr.slot;
                const outToken = data?.token1MintAddress !== solToken ? data?.token1MintAddress : data?.token2MintAddress;
                const solReserves = data?.token1MintAddress == solToken ? data?.token1Reserves : data?.token2Reserves;
                
                const amount = buyAmount;

                if (Number(solReserves) > triggerSOLOrder * 1e9 && Number(solReserves) < 650 * 1e9) {
                    logger.info(`Triggering SOLOrder`)
                    await this.handleSwap.swap(solToken, outToken!, slippage, amount);
                    // Get tokens from wallet
                    logger.info(`Successfully bought ${amount} ${outToken} tokens`)
                    let tokenAmount;
                    
                    const swapStream = new RaydiumSwapStream(this.provider);
                    await swapStream.raydiumSwapStream([data?.poolAddress!], outToken!, tokenAmount);
                    break;
                }


            }
        } catch (error) {
            console.error("Error in Raydium pool stream:", error);
        }
    }
}