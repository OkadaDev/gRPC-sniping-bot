import { Connection } from "@solana/web3.js";
import { endpoint, tokenDelayTime } from "../helpers/constants";
import { commitmentLevel } from "../utils/utils";
import { Metaplex } from "@metaplex-foundation/js";
import { PublicKey } from "@solana/web3.js";
import { Token } from "../utils/types";
import { LIQUIDITY_STATE_LAYOUT_V4 } from "@raydium-io/raydium-sdk";

const connection = new Connection(endpoint, commitmentLevel);
const metaplex = Metaplex.make(connection);

export class Check {
    constructor() {

    }
    public socialCheck = async (mint: PublicKey) => {
        try {
            const token = await metaplex.nfts().findByMint({ mintAddress: mint }) as Token;
            let socials = {};
            if (token.json?.createdOn == "https://pump.fun") {
                socials = {
                    website: token.json?.website || '',
                    telegram: token.json?.telegram || '',
                    twitter: token.json?.twitter || '',
                };
            } else if (token.json?.extensions) {
                socials = {
                    website: token.json.extensions?.website || '',
                    telegram: token.json.extensions?.telegram || '',
                    twitter: token.json.extensions?.twitter || '',
                };
            }
            return socials;
        } catch (error) {
            throw new Error("error");
        }
    }
    public LPCheck = async (lpMint: PublicKey, poolAddress: PublicKey) => {
        try {
            await sleep(parseInt(tokenDelayTime));
            const acc = await connection.getMultipleAccountsInfo([poolAddress]);

            // Make sure accounts were found
            if (!acc || acc.length === 0 || !acc[0]?.data) {
                console.error(`No account info found for pool address: ${poolAddress}`);
                return;
            }

            // Decode the liquidity state
            const parsed = acc.map((v) => {
                if (!v || !v.data) return null;
                return LIQUIDITY_STATE_LAYOUT_V4.decode(v.data);
            }).filter(Boolean);

            if (parsed.length === 0 || parsed[0] == null) {
                console.error('No valid liquidity state found.');
                return;
            }
            const lpReserve = parsed[0].lpReserve;

            const accInfo = await connection.getParsedAccountInfo(lpMint);

            if (!accInfo || !accInfo.value) {
                console.error(`No account information found for mint: ${lpMint}`);
                return;
            }

            const accountData = accInfo.value.data;

            // Verify that accountData is of type ParsedAccountData
            if ('parsed' in accountData) {
                const mintInfo = accountData.parsed?.info;

                if (!mintInfo) {
                    console.error(`Parsed info not found in account information for mint: ${lpMint}`);
                    return;
                }
                const reserveLp = lpReserve / Math.pow(10, mintInfo.decimals);
                const actualSupply = mintInfo.supply / Math.pow(10, mintInfo.decimals);

                // Calculate burn percentage
                const maxLpSupply = Math.max(actualSupply, reserveLp - 1);
                const burnAmt = reserveLp - actualSupply;


                // Avoid division by zero for burn percentage calculation
                const burnPct = reserveLp > 0 ? (burnAmt / reserveLp) * 100 : 0;

                console.log(`${burnPct.toFixed(2)}% LP burned`); // Format the percentage to 2 decimal places

                // Proceed with using mintInfo
                console.log("Mint Info:", mintInfo);
                return burnPct;
            } else {
                console.error(`Expected parsed account data, but received raw buffer data for mint: ${lpMint}`);
                throw new Error("Expected parsed account data")
            }

        } catch (error) {

        }
    }


}

export const sleep = (ms: number) => {
    return new Promise(resolve => setTimeout(resolve, ms));
}