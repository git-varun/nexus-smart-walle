import {config} from "../config";
import {baseSepolia} from "viem/chains";
import {createPublicClient, hexToBytes, http} from "viem";
import {privateKeyToAccount} from "viem/accounts";
import {createBundlerClient} from "viem/account-abstraction";
import {toLightSmartAccount} from "permissionless/accounts";


function getBundlerRPCURL(bundler: string, chainId: number) {
    if (bundler === 'PIMLICO') return `https://api.pimlico.io/v1/${chainId}/rpc?apikey=${config.pimlico.apiKey}`;
    return `https://base-sepolia.g.alchemy.com/v2/${config.alchemy.apiKey}`
}

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
async function getAccount(accountType: string, owner, client) {
    // if (accountType === 'LIGHT ACCOUNT') {
    return await toLightSmartAccount({
        client,
        owner: owner,
        version: '2.0.0',
    })
    // }
}

// export async function signMessage(hash) {
//     const account = privateKeyToAccount(config.centralWallet.privateKey as `0x{}`);
//     return account.signMessage({message: hash});
// }

export async function signMessage(hash: `0x${string}`) {
    const account = privateKeyToAccount(config.centralWallet.privateKey as `0x${string}`);

    // Interpret Alchemy's "raw" as bytes to mimic personal_sign
    const messageBytes = hexToBytes(hash);

    const signature = await account.signMessage({
        message: {raw: messageBytes}  // ensures Viem treats as raw binary data
    });

    return signature;
}

export async function publicClient(bundler: string, chainId: number) {
    return createPublicClient({
        chain: baseSepolia,
        transport: http(getBundlerRPCURL(bundler, chainId))
    });
}

export async function bundlerClient(bundler: string, chainId: number, accountType: string) {
    const owner = privateKeyToAccount(`${config.centralWallet.privateKey}` as `0x${string}`);

    const client = createPublicClient({
        chain: baseSepolia,
        transport: http()
    });

    const transport = getBundlerRPCURL(bundler, chainId);
    const account = await getAccount(accountType, owner, client)

    return createBundlerClient({
        account,
        client,
        transport: http(transport),
    })
}
