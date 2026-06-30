import { createPublicClient, createWalletClient } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { chain, config, transport } from './config';
import { goodDollarUbiAbi, sageVaultAbi } from './abis';

const account = privateKeyToAccount(config.agentPrivateKey);
const publicClient = createPublicClient({ chain, transport });
const walletClient = createWalletClient({ account, chain, transport });

console.log(`Sage agent online on ${chain.name}`);
console.log(`Watching claims at ${config.goodDollarUbiContract}`);

publicClient.watchContractEvent({
  address: config.goodDollarUbiContract,
  abi: goodDollarUbiAbi,
  eventName: 'Claimed',
  onLogs: async (logs) => {
    for (const log of logs) {
      const claimer = log.args.claimer;
      const amount = log.args.amount;
      if (!claimer || !amount) continue;

      try {
        const [percentBps, , active] = await publicClient.readContract({
          address: config.sageVaultAddress,
          abi: sageVaultAbi,
          functionName: 'instructions',
          args: [claimer]
        });

        if (!active || percentBps === 0n) continue;

        const hash = await walletClient.writeContract({
          account,
          chain,
          address: config.sageVaultAddress,
          abi: sageVaultAbi,
          functionName: 'executeSaving',
          args: [claimer, amount],
          ...(config.feeCurrency ? { feeCurrency: config.feeCurrency } : {})
        });

        console.log(`Executed saving for ${claimer}: ${hash}`);
      } catch (error) {
        console.warn(`executeSaving failed for ${claimer}; will retry on a future claim`, error);
      }
    }
  }
});
