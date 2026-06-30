export const appConfig = {
  vaultAddress: import.meta.env.VITE_SAGE_VAULT_ADDRESS as `0x${string}` | undefined,
  rpcUrl: import.meta.env.VITE_CELO_RPC_URL || 'https://forno.celo.org',
  mockMode: import.meta.env.VITE_ENABLE_MOCK_DATA !== 'false'
};
