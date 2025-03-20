import { BaseProvider } from "@bloxroute/solana-trader-client-ts";
import { SwapHandle } from "../Instruction/SwapHandle";
import { logger } from "../utils/logger";
import { buyAmount, slippage, solToken, targetWallet } from "../helpers/constants";
import { PublicKey } from "@solana/web3.js";

export class RaydiumPoolStreamByTx {
    private provider: BaseProvider;
    private handleSwap: SwapHandle;
    private targetWallet: string;
    constructor(provider: BaseProvider) {
        this.provider = provider;
        this.handleSwap = new SwapHandle(provider);
        this.targetWallet = targetWallet;
    }
    public getRaydiumPoolStreamByTx = async () => {
        logger.info("Subscribing for new pool transactions in raydium")
        try {
            const req = await this.provider.getNewRaydiumPoolsByTransactionStream({});
            let count = 0;
            for await (const tr of req) {
                if (this.targetWallet !== tr.poolCreatorWallet) continue;
                const data = tr.pool;
                const slot = tr.slot;
                logger.info(`SLOT : ${slot}`)
                const amount = buyAmount;
                const outToken = data?.token1MintAddress !== solToken ? data?.token1MintAddress : data?.token2MintAddress;
                await this.handleSwap.swap(solToken, outToken!,slippage, amount);
                
            }
        } catch (error) {
            console.error("Error in Raydium pool stream:", error);
        }
    }

}   