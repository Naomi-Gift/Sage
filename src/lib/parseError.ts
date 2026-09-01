/**
 * Universal Web3 Error Parser
 * Converts verbose Viem / MetaMask / RPC error objects into clean, human-readable strings.
 */
export function parseWeb3Error(error: unknown, fallbackMessage = 'Transaction could not be completed'): string {
  if (!error) return fallbackMessage;

  const err = error as {
    shortMessage?: string;
    message?: string;
    code?: number | string;
    details?: string;
    cause?: { message?: string; shortMessage?: string };
  };

  const raw = (err.shortMessage || err.message || err.details || '').toLowerCase();

  // 1. User rejection / cancellation
  if (
    raw.includes('user rejected') ||
    raw.includes('user denied') ||
    raw.includes('rejected the request') ||
    raw.includes('action_rejected') ||
    err.code === 4001 ||
    err.code === 'ACTION_REJECTED'
  ) {
    return 'Transaction was cancelled in your wallet.';
  }

  // 2. Insufficient funds / gas
  if (
    raw.includes('insufficient funds') ||
    raw.includes('exceeds balance') ||
    raw.includes('gas required exceeds allowance')
  ) {
    return 'Insufficient CELO balance to cover the network fee. Please get free testnet CELO from faucet.celo.org.';
  }

  // 3. Chain switch / Network mismatch
  if (raw.includes('chain') && (raw.includes('unsupported') || raw.includes('switch') || raw.includes('mismatch'))) {
    return 'Please switch your wallet network to Celo Sepolia.';
  }

  // 4. Contract execution reverts
  if (err.shortMessage) {
    // If Viem provided a shortMessage, clean out generic prefixes
    return err.shortMessage
      .replace(/^Execution reverted with reason:\s*/i, '')
      .replace(/^The contract function.*?reverted:\s*/i, '')
      .replace(/^User rejected.*?:\s*/i, 'Transaction cancelled: ')
      .trim();
  }

  // 5. General message fallback (trimming long stacktraces to first sentence)
  if (err.message) {
    const firstLine = err.message.split('\n')[0].replace(/Request Arguments:.*/i, '').trim();
    if (firstLine.length > 0 && firstLine.length < 120) {
      return firstLine;
    }
  }

  return fallbackMessage;
}
