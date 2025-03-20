
import { BaseProvider, GrpcProvider, MAINNET_API_GRPC_PORT, MAINNET_API_NY_GRPC } from "@bloxroute/solana-trader-client-ts";
import { bloXRoute_auth_header, buyAmount, private_key, targetWallet } from "./helpers/constants";
import { callGetNewRaydiumPoolsByTxStream, callGetNewRaydiumPoolsStream } from "./stream/doStream";
import promptSync from "prompt-sync"
import { RaydiumPoolStream } from "./stream/RaydiumPoolStream";
import { SwapHandle, wallet } from "./Instruction/SwapHandle";
import { logger } from "./utils/logger";
import { RaydiumPoolStreamByTx } from "./stream/RaydiumPoolStreamByTx";
import { RaydiumSwapStream } from "./stream/RaydiumSwapStream";
import { closeAllTokenAccounts } from "./Instruction/closeAta";

const prompt = promptSync();
const useTls = true;
const provider = new GrpcProvider(bloXRoute_auth_header || "", private_key, `${MAINNET_API_NY_GRPC}:${MAINNET_API_GRPC_PORT}`, useTls);

async function start() {
    let running = true;

    while (running) {
        logger.info("Starting Trading bot...")
        console.log("\n Menu:");
        console.log("1. Sniper");
        console.log("2. Copy Trading");
        console.log("3. Get Accounts from wallet");
        console.log("4. Close all ata");
        console.log("Type 'exit or q' to quit.");

        const answer = prompt("Choose an option or 'exit': "); // Use prompt-sync for user input

        switch (answer) {
            case "1":
                await sniper();
                break;
            case "2":
                await copyTrading();
                break;
            case "3":
                await getAccount();
                break;
            case "4":
                await closeAta();
                break;
            case "q":
                running = false;
                break;
            case "exit":
                running = false;
                break;
            default:
                logger.info("Invalid option, please choose again.");
        }
    }

    logger.info("Exiting...");
    process.exit(0);
}

const sniper = async () => {
    const radyiumPools = new RaydiumPoolStream(provider)
    await radyiumPools.getRaydiumPoolStream()
}

const copyTrading = async () => {
    // const raydiumSwapStream = new RaydiumSwapStream(provider);
    // await  raydiumSwapStream.raydiumSwapStream();
}
const getAccount = async () => {
    const account = await provider.getAccountBalance({ ownerAddress: wallet.publicKey.toString() });
    console.log(account.tokens)
}
const closeAta = async () => {
    await closeAllTokenAccounts();
}

start().catch((err) => {
    console.error("Error:", err);
});