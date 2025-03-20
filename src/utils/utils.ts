import { Metaplex } from "@metaplex-foundation/js";
import { Connection, clusterApiUrl } from "@solana/web3.js";
import { PublicKey } from "@solana/web3.js";
import { Token, holderInfo } from "./types";
import { LIQUIDITY_STATE_LAYOUT_V4 } from "@raydium-io/raydium-sdk";
import { SOLANA_RPC } from "../helpers/constants";

export const commitmentLevel = "processed";
export const endpoint = process.env.SOLANA_RPC || clusterApiUrl("devnet");
export const connection = new Connection(endpoint, commitmentLevel);

const metaplex = Metaplex.make(connection);

export const socialCheckFunc = async (mint: PublicKey) => {
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

export const lockCheckFunc = async (mint: PublicKey, poolAddress: PublicKey) => {
    try {
        // Fetch account info for the pool address
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

        const accInfo = await connection.getParsedAccountInfo(mint);

        if (!accInfo || !accInfo.value) {
            console.error(`No account information found for mint: ${mint}`);
            return;
        }

        const accountData = accInfo.value.data;

        // Verify that accountData is of type ParsedAccountData
        if ('parsed' in accountData) {
            const mintInfo = accountData.parsed?.info;

            if (!mintInfo) {
                console.error(`Parsed info not found in account information for mint: ${mint}`);
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
            console.error(`Expected parsed account data, but received raw buffer data for mint: ${mint}`);
        }
    } catch (error) {
        console.error("Error fetching liquidity info:", error);
    }

}

// ================== Get Holders ===========================
export const findHolders = async (mint: PublicKey) => {
    // Pagination logic
    let page = 1;
    // allOwners will store all the addresses that hold the token
    let allOwners: holderInfo[] = [];
  
    while (true) {
      const response = await fetch(SOLANA_RPC, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'getTokenAccounts',
          id: 'helius-test',
          params: {
            page: page,
            limit: 1000,
            displayOptions: {},
            mint: mint
          }
        })
      });
      const data = await response.json();
      // Pagination logic.
      if (!data.result || data.result.token_accounts.length === 0) {
        break;
      }
      // Adding unique owners to a list of token owners.
      data.result.token_accounts.forEach((account: any) => {
        allOwners.push({ name: account.owner.slice(0, 3) + `...` + account.owner.slice(-4), owner: account.owner, amount: account.amount });
      });
      page++;
    }
  
    return allOwners;
  };


export const sleep = (ms: number) => {
    return new Promise(resolve => setTimeout(resolve, ms));
}