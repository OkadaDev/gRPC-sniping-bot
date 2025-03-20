import { BaseProvider } from "@bloxroute/solana-trader-client-ts";
import { Keypair } from "@solana/web3.js";
import base58 from "bs58";
import { SOLANA_RPC, buyAmount, private_key } from "../helpers/constants";
import { ComputeBudgetProgram } from "@solana/web3.js";
import { Transaction } from "@solana/web3.js";
import { Connection } from "@solana/web3.js";
import { logger } from "../utils/logger";
import { loadListingOperation } from "@metaplex-foundation/js";

export const wallet = Keypair.fromSecretKey(base58.decode(private_key));
const connection = new Connection(SOLANA_RPC, "processed");


export class SwapHandle {
    private provider: BaseProvider;
    constructor(
        provider: BaseProvider,
    ) {
        this.provider = provider;
    }
    public swap = async (inToken: string, outToken: string, slippage: number, amount: number) => {
        try {
            logger.info(`OutToken : ${outToken}`)
            logger.info(`amount : ${amount}`)
            const computePrice = ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 1000000 })
            const buyTxResp = await this.provider.postTradeSwap({
                computeLimit: Number(1000000),
                computePrice: computePrice.toString(),
                inAmount: amount,
                inToken,
                outToken,
                ownerAddress: wallet.publicKey.toString(),
                project: "P_RAYDIUM",
                slippage: Number(slippage),
                tip: "1000000",
            })
            
            const res = await this.executeTx(buyTxResp);
            return res;
        } catch (error) {
            console.log("Buy Transaction-->", error)
            throw new Error("Buy error")
        }
    }
    public executeTx = async (transaction: Transaction) => {
        try {
            transaction.partialSign(wallet);

            const encodedTx: any = bufferTx.toString("base64");
            logger.info("Submitting transaction to bloXroute...");
            const request: any = {
                transaction: { content: encodedTx, isCleanup: false },
                frontRunningProtection: false,
                useStakedRPCs: true, // comment this line if you don't want to directly send txn to current blockleader
            }
            console.log(request);
            const response = await this.provider.postSubmit(request);
            if (response.signature) {

                logger.info(`✅ txn landed successfully\nSignature: https://solscan.io/tx/${response.signature}`)
            } else {
                console.log("❌ Transaction failed");
            }
            return response.signature
        } catch (error) {
            logger.info('Error during transaction execution', error);
            throw new Error("error during Tx execution");
        }
    }

}