import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  checkIdentityWhitelisted,
  getFaceVerificationUrl,
  getNextUbiResetTime,
  getUbiEntitlement,
} from '../services/goodDollarService';
import { useToast } from '../context/ToastContext';

export function useGoodDollarUbi(connectedAddress?: string) {
  // Starts strictly as false until verified on-chain
  const [isWhitelisted, setIsWhitelisted] = useState<boolean>(false);
  const [loadingWhitelist, setLoadingWhitelist] = useState<boolean>(false);
  const [entitlementGD, setEntitlementGD] = useState<number>(0);
  const [verifying, setVerifying] = useState<boolean>(false);
  const [faceVerificationModalOpen, setFaceVerificationModalOpen] = useState<boolean>(false);
  const [timeUntilReset, setTimeUntilReset] = useState<string>('');

  const toast = useToast();

  // 1. Fetch live on-chain Whitelist & Entitlement
  const refreshStatus = useCallback(async () => {
    if (!connectedAddress) {
      setIsWhitelisted(false);
      setEntitlementGD(0);
      return;
    }
    setLoadingWhitelist(true);
    try {
      const [whitelisted, entitlement] = await Promise.all([
        checkIdentityWhitelisted(connectedAddress),
        getUbiEntitlement(connectedAddress),
      ]);
      setIsWhitelisted(whitelisted);
      setEntitlementGD(entitlement);
    } catch {
      setIsWhitelisted(false);
      setEntitlementGD(0);
    } finally {
      setLoadingWhitelist(false);
    }
  }, [connectedAddress]);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  // 2. Continuous 24h Countdown Timer to Next UBI Reset (12:00 PM UTC)
  useEffect(() => {
    function updateTimer() {
      const resetDate = getNextUbiResetTime();
      const diffMs = resetDate.getTime() - Date.now();
      if (diffMs <= 0) {
        setTimeUntilReset('00h 00m 00s');
        return;
      }
      const totalSec = Math.floor(diffMs / 1000);
      const hours = Math.floor(totalSec / 3600);
      const minutes = Math.floor((totalSec % 3600) / 60);
      const seconds = totalSec % 60;
      setTimeUntilReset(
        `${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`
      );
    }

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  // 3. Official FaceTec 3D Verification Flow with On-Chain Polling
  const startFaceVerification = useCallback(() => {
    if (!connectedAddress) {
      toast.warning('Please connect your wallet first to start GoodID verification');
      return;
    }

    const fvUrl = getFaceVerificationUrl(connectedAddress);
    const popup = window.open(
      fvUrl,
      'GoodID_Verification',
      'width=500,height=700,status=no,menubar=no,toolbar=no'
    );

    setVerifying(true);
    setFaceVerificationModalOpen(true);

    // Auto-polling interval: checks on-chain if relayer whitelisted the address
    let checks = 0;
    const pollTimer = setInterval(async () => {
      checks++;
      const whitelisted = await checkIdentityWhitelisted(connectedAddress);
      if (whitelisted) {
        clearInterval(pollTimer);
        setIsWhitelisted(true);
        setVerifying(false);
        setFaceVerificationModalOpen(false);
        if (popup && !popup.closed) {
          popup.close();
        }
        toast.success(
          'GoodID 3D Face Verification complete! Daily UBI claiming is now unlocked.',
          'GoodID Verified'
        );
      } else if (checks > 120) {
        // Stop polling after 5 minutes
        clearInterval(pollTimer);
        setVerifying(false);
      }
    }, 2500);
  }, [connectedAddress, toast]);

  const fvUrl = useMemo(() => getFaceVerificationUrl(connectedAddress), [connectedAddress]);

  return {
    isWhitelisted,
    loadingWhitelist,
    entitlementGD,
    timeUntilReset,
    verifying,
    faceVerificationModalOpen,
    fvUrl,
    setFaceVerificationModalOpen,
    startFaceVerification,
    refreshStatus,
  };
}
