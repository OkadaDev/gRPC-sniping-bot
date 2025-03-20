import { Connection, PublicKey, clusterApiUrl, Keypair, Transaction } from '@solana/web3.js';
import { getAssociatedTokenAddress, getAccount, createCloseAccountInstruction, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import base58 from "bs58"
import dotenv from 'dotenv';
dotenv.config()
const RPC_ENDPOINT = process.env.SOLANA_RPC;
const RPC_WEBSOCKET_ENDPOINT = process.env.RPC_WEBSOCKET_ENDPOINT;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const connection = new Connection(RPC_ENDPOINT!, { wsEndpoint: RPC_WEBSOCKET_ENDPOINT, commitment: "confirmed" });
const mainKp = Keypair.fromSecretKey(base58.decode(PRIVATE_KEY!))
async function getTokenAccounts(publicKey: PublicKey): Promise<PublicKey[]> {
    const response = await connection.getParsedTokenAccountsByOwner(publicKey, {
        programId: TOKEN_PROGRAM_ID,
    });
    return response.value.map((accountInfo) => accountInfo.pubkey);
}
async function closeTokenAccount(tokenAccount: PublicKey, payer: Keypair) {
    const accountInfo = await getAccount(connection, tokenAccount);
    if (accountInfo.amount > 0) {
        throw new Error(`Cannot close token account ${tokenAccount.toBase58()} because it has a non-zero balance.`);
    }
    const transaction = new Transaction().add(
       // close account instrcution
    );
    const signature = await connection.sendTransaction(transaction, [payer], {
        skipPreflight: false,
        preflightCommitment: 'confirmed',
    });
    console.log(`Closed token account ${tokenAccount.toBase58()}: Transaction signature:`, signature);
}
export const closeAllTokenAccounts = async () => {
    console.log('Closing all token accounts...');
    const tokenAccounts = await getTokenAccounts(mainKp.publicKey);
    for (const tokenAccount of tokenAccounts) {
        try {
            // close account 
        } catch (err) {
            console.error(`Failed to close token account ${tokenAccount.toBase58()}:`, err);
        }
    }
    console.log('All token accounts closed.');
}
