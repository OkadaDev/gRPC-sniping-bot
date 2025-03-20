import { PublicKey } from "@solana/web3.js"
import { buyAmount, slippage, solToken, stoploss, takeprofit, targetWallet } from "../helpers/constants";
import { BaseProvider } from "@bloxroute/solana-trader-client-ts";
import { logger } from "../utils/logger";
import { SwapHandle } from "../Instruction/SwapHandle";

export class RaydiumPoolReserves {
    private provider: BaseProvider;
    private handleSwap: SwapHandle;
    private solTrigger: number;
    constructor(provider: BaseProvider, solTrigger: number) {
        this.provider = provider;
        this.handleSwap = new SwapHandle(provider);
        this.solTrigger = solTrigger;
    }
    public PoolReserves = async (pool: string, amount: number) => {
        try {
            logger.info(`${pool}`)
            const req = await this.provider.getPoolReservesStream({ projects: ["P_RAYDIUM"], pools: [pool] });
            for await (const tr of req) {
                const data = tr.reserves
                const outToken = data?.token1Address !== solToken ? data?.token1Address : data?.token2Address;

                if (data?.token1Address == solToken) {
                    if (Number(data.token1Reserves) > stoploss || Number(data.token1Reserves) < takeprofit) continue;
                } else {
                    if (Number(data?.token2Reserves) > stoploss || Number(data?.token2Reserves) < takeprofit) continue;
                }
                // Sell token 
                this.handleSwap.swap(outToken!, solToken, slippage, amount)
                break;
            }
        } catch (error) {
            throw new Error("PoolReserves Error")
        }
    }
    
}