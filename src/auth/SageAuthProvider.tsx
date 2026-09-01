import React, { createContext, useContext, useMemo, useCallback } from 'react';
import { PrivyProvider, usePrivy, useWallets, type ConnectedWallet } from '@privy-io/react-auth';
import { createWalletClient, custom, type WalletClient } from 'viem';
import { appChain, supportedChains } from '../config';

export type SageIdentity = {
  ready: boolean;
  authenticated: boolean;
  address?: `0x${string}`;
  wallet?: ConnectedWallet;
  login: () => void;
  logout: () => Promise<void>;
  getWalletClient: () => Promise<WalletClient>;
};

const SageAuthContext = createContext<SageIdentity | null>(null);

/**
 * Deterministic canonical wallet resolution:
 * Prioritize embedded wallet; fallback to active declared primary external wallet.
 */
function resolveCanonicalWallet(
  wallets: ConnectedWallet[],
  primaryAddress?: string
): ConnectedWallet | undefined {
  if (!wallets || wallets.length === 0) return undefined;

  const embeddedWallet = wallets.find((w) => w.walletClientType === 'privy');
  if (embeddedWallet) return embeddedWallet;

  if (primaryAddress) {
    const matched = wallets.find(
      (w) => w.address.toLowerCase() === primaryAddress.toLowerCase()
    );
    if (matched) return matched;
  }

  if (wallets.length === 1) {
    return wallets[0];
  }

  return undefined;
}

/**
 * Inner component active when PrivyProvider is mounted.
 */
function PrivyIdentityBridge({ children }: { children: React.ReactNode }) {
  const { ready, authenticated, user, login, logout } = usePrivy();
  const { wallets } = useWallets();

  const canonicalWallet = useMemo<ConnectedWallet | undefined>(() => {
    if (!ready || !authenticated || !user) return undefined;
    return resolveCanonicalWallet(wallets, user.wallet?.address);
  }, [ready, authenticated, user, wallets]);

  const canonicalAddress = useMemo<`0x${string}` | undefined>(() => {
    if (!ready || !authenticated) return undefined;
    if (canonicalWallet?.address) {
      return canonicalWallet.address as `0x${string}`;
    }
    if (user?.wallet?.address) {
      return user.wallet.address as `0x${string}`;
    }
    return undefined;
  }, [ready, authenticated, canonicalWallet, user]);

  const getWalletClient = useCallback(async (): Promise<WalletClient> => {
    if (!ready || !authenticated || !canonicalWallet || !canonicalAddress) {
      throw new Error('Wallet is not connected or authenticated.');
    }

    try {
      await canonicalWallet.switchChain(appChain.id);
    } catch {
      // Chain switch attempt
    }

    const provider = await canonicalWallet.getEthereumProvider();
    if (!provider) {
      throw new Error('Could not obtain wallet provider from Privy.');
    }

    const walletClient = createWalletClient({
      account: canonicalAddress,
      chain: appChain,
      transport: custom(provider),
    });

    if (
      walletClient.account?.address.toLowerCase() !==
      canonicalAddress.toLowerCase()
    ) {
      throw new Error(
        'Active wallet does not match the authenticated Sage account.'
      );
    }

    return walletClient;
  }, [ready, authenticated, canonicalWallet, canonicalAddress]);

  const value = useMemo<SageIdentity>(() => ({
    ready,
    authenticated,
    address: canonicalAddress,
    wallet: canonicalWallet,
    login,
    logout,
    getWalletClient,
  }), [ready, authenticated, canonicalAddress, canonicalWallet, login, logout, getWalletClient]);

  return (
    <SageAuthContext.Provider value={value}>
      {children}
    </SageAuthContext.Provider>
  );
}

/**
 * Fallback Provider when VITE_PRIVY_APP_ID is not configured.
 * Allows entire app to initialize, render, and preview without crashing.
 */
function FallbackAuthProvider({ children }: { children: React.ReactNode }) {
  const login = useCallback(() => {
    alert(
      'Authentication requires a Privy App ID.\n\nPlease add your VITE_PRIVY_APP_ID in your .env file from https://dashboard.privy.io to enable wallet login.'
    );
  }, []);

  const logout = useCallback(async () => {}, []);

  const getWalletClient = useCallback(async (): Promise<WalletClient> => {
    throw new Error('Authentication is not configured. Add VITE_PRIVY_APP_ID in .env.');
  }, []);

  const value = useMemo<SageIdentity>(() => ({
    ready: true,
    authenticated: false,
    address: undefined,
    wallet: undefined,
    login,
    logout,
    getWalletClient,
  }), [login, logout, getWalletClient]);

  return (
    <SageAuthContext.Provider value={value}>
      {children}
    </SageAuthContext.Provider>
  );
}

/**
 * Master Sage Auth Provider:
 * If a valid Privy App ID is supplied, PrivyProvider is mounted.
 * If not supplied, FallbackAuthProvider is mounted so the app boots seamlessly without needing the App ID upfront!
 */
export function SageAuthProvider({ children }: { children: React.ReactNode }) {
  const rawAppId = import.meta.env.VITE_PRIVY_APP_ID?.trim();
  const isPrivyConfigured = Boolean(
    rawAppId &&
    rawAppId.length > 5 &&
    !rawAppId.startsWith('cl000000000') &&
    (rawAppId.startsWith('cl') || rawAppId.startsWith('cm'))
  );

  if (!isPrivyConfigured) {
    return <FallbackAuthProvider>{children}</FallbackAuthProvider>;
  }

  return (
    <PrivyProvider
      appId={rawAppId!}
      config={{
        defaultChain: appChain,
        supportedChains: [...supportedChains],
        embeddedWallets: {
          ethereum: {
            createOnLogin: 'users-without-wallets',
          },
        },
        appearance: {
          theme: 'dark',
          accentColor: '#10B981',
          logo: '/assets/sage_S_logo_Dark.png',
        },
        loginMethods: ['email', 'wallet'],
      }}
    >
      <PrivyIdentityBridge>{children}</PrivyIdentityBridge>
    </PrivyProvider>
  );
}

export function useSageIdentity(): SageIdentity {
  const context = useContext(SageAuthContext);
  if (!context) {
    throw new Error('useSageIdentity must be used within a SageAuthProvider');
  }
  return context;
}
