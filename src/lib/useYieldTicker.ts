import { useState, useEffect, useRef } from 'react';

/**
 * Calculates continuous real-time compounding yield.
 * Formula: Accrued Yield = Principal * (APY_rate / (365.25 * 86400)) * elapsed_seconds
 */
export function useYieldTicker(
  principalGD: number,
  baseYieldGD: number,
  effectiveApyPercent: number
): { displayYieldGD: number; displayYieldFormatted: string } {
  const [accumulatedOffset, setAccumulatedOffset] = useState(0);
  const startTimeRef = useRef<number>(Date.now());
  const initialYieldRef = useRef<number>(baseYieldGD);

  // Reset clock whenever base on-chain yield updates
  useEffect(() => {
    initialYieldRef.current = baseYieldGD;
    startTimeRef.current = Date.now();
    setAccumulatedOffset(0);
  }, [baseYieldGD, principalGD, effectiveApyPercent]);

  useEffect(() => {
    if (principalGD <= 0) {
      setAccumulatedOffset(0);
      return;
    }

    const apyDecimal = effectiveApyPercent / 100;
    const secondsInYear = 365.25 * 86400;
    const yieldPerMillisecond = (principalGD * apyDecimal) / (secondsInYear * 1000);

    const interval = setInterval(() => {
      const elapsedMs = Date.now() - startTimeRef.current;
      setAccumulatedOffset(elapsedMs * yieldPerMillisecond);
    }, 60); // 60ms for silky smooth 16fps micro-ticks

    return () => clearInterval(interval);
  }, [principalGD, effectiveApyPercent]);

  const totalYield = initialYieldRef.current + accumulatedOffset;

  return {
    displayYieldGD: totalYield,
    displayYieldFormatted: totalYield.toFixed(4),
  };
}
