/**
 * Share link generation for Sage.
 *
 * All share text is kept here so it's easy to update copy in one place.
 * Platform URLs are constructed from the encoded text + optional image URL.
 */

const APP_URL = (import.meta.env.VITE_APP_URL as string | undefined) || 'https://sageapp.xyz';

// ─── Referral ─────────────────────────────────────────────────────────────────

/**
 * Returns a referral URL that pre-populates `?ref=<shortRef>` on the landing
 * page. `shortRef` is the first 8 chars of the wallet address (no 0x prefix)
 * so it's readable but not the full address.
 */
export function makeReferralUrl(address?: string): string {
  if (!address) return APP_URL;
  const ref = address.replace(/^0x/i, '').slice(0, 8).toLowerCase();
  return `${APP_URL}?ref=${ref}`;
}

// ─── Share text templates ──────────────────────────────────────────────────────

export type ShareContext = {
  streak: number;
  savedAmountGD: number;
  apy: number;
  goalLabel?: string;
  address?: string;
};

function shareText(ctx: ShareContext): string {
  const amount = Math.round(ctx.savedAmountGD).toLocaleString();
  const goal   = ctx.goalLabel?.trim() ? ` toward my ${ctx.goalLabel.trim()}` : '';
  return (
    `${ctx.streak} day streak 🔥 — G$ ${amount} saved & growing${goal}.\n\n` +
    `My G$ earns ${ctx.apy}% APY automatically with Sage — no effort needed.\n\n` +
    `Try it free 👇`
  );
}

function shortShareText(ctx: ShareContext): string {
  const amount = Math.round(ctx.savedAmountGD).toLocaleString();
  return `${ctx.streak}🔥 streak · G$ ${amount} saved · ${ctx.apy}% APY via @SageApp`;
}

// ─── Platform URLs ─────────────────────────────────────────────────────────────

export type SharePlatform = 'twitter' | 'telegram' | 'whatsapp' | 'warpcast' | 'copy';

export function makePlatformUrl(platform: SharePlatform, ctx: ShareContext): string {
  const refUrl = makeReferralUrl(ctx.address);
  const text   = shareText(ctx);
  const short  = shortShareText(ctx);

  switch (platform) {
    case 'twitter':
      return (
        'https://twitter.com/intent/tweet?' +
        `text=${encodeURIComponent(`${short}\n\n${refUrl}`)}`
      );

    case 'telegram':
      return (
        'https://t.me/share/url?' +
        `url=${encodeURIComponent(refUrl)}&` +
        `text=${encodeURIComponent(text)}`
      );

    case 'whatsapp':
      return (
        'https://wa.me/?' +
        `text=${encodeURIComponent(`${text}\n\n${refUrl}`)}`
      );

    case 'warpcast':
      // Warpcast compose endpoint
      return (
        'https://warpcast.com/~/compose?' +
        `text=${encodeURIComponent(`${short}\n\n${refUrl}`)}`
      );

    default:
      return refUrl;
  }
}

// ─── Native share (Web Share API) ─────────────────────────────────────────────

export async function nativeShare(ctx: ShareContext, imageFile?: File): Promise<boolean> {
  if (!navigator.share) return false;

  const shareData: ShareData = {
    title: 'My Sage glow-up',
    text:  shareText(ctx),
    url:   makeReferralUrl(ctx.address),
  };

  if (imageFile && navigator.canShare?.({ files: [imageFile] })) {
    (shareData as ShareData & { files: File[] }).files = [imageFile];
  }

  try {
    await navigator.share(shareData);
    return true;
  } catch {
    // User cancelled or unsupported — not an error
    return false;
  }
}

// ─── Copy to clipboard ────────────────────────────────────────────────────────

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers
    const el = document.createElement('textarea');
    el.value = text;
    el.style.position = 'fixed';
    el.style.opacity  = '0';
    document.body.appendChild(el);
    el.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(el);
    return ok;
  }
}
