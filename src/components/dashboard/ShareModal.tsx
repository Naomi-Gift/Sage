import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Copy, Download, Link2, X } from 'lucide-react';
import {
  copyToClipboard,
  makeReferralUrl,
  makePlatformUrl,
  nativeShare,
  type ShareContext,
  type SharePlatform,
} from '../../lib/shareLinks';

/* ── Platform button metadata ─────────────────────────────── */
type PlatformMeta = {
  id: SharePlatform | 'native' | 'download';
  label: string;
  color: string;
  bg: string;
  icon: React.ReactNode;
};

const TwitterIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622Zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const TelegramIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M11.944 0A12 12 0 1 0 12 24 12 12 0 0 0 11.944 0Zm3.992 8.284-1.903 8.977c-.14.634-.52.79-.99.49l-2.74-2.02-1.32 1.27c-.145.146-.268.268-.55.268l.196-2.78 5.06-4.57c.22-.196-.048-.305-.34-.11l-6.253 3.935-2.692-.84c-.586-.183-.598-.586.123-.866l10.52-4.058c.487-.177.913.11.889.304Z"/>
  </svg>
);

const WhatsAppIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
  </svg>
);

const WarpcastIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M11.998 0C5.374 0 0 5.373 0 12s5.374 12 11.998 12C18.626 24 24 18.627 24 12S18.626 0 11.998 0Zm5.06 7.444-1.754 8.21-3.3-5.583-3.3 5.583L6.95 7.444h2.042l1.014 4.765 2.3-3.893h1.4l2.3 3.893 1.014-4.765h2.038Z"/>
  </svg>
);

function getPlatforms(hasNativeShare: boolean): PlatformMeta[] {
  const platforms: PlatformMeta[] = [
    {
      id:    'twitter',
      label: 'X / Twitter',
      color: '#fff',
      bg:    '#000',
      icon:  <TwitterIcon />,
    },
    {
      id:    'telegram',
      label: 'Telegram',
      color: '#fff',
      bg:    '#26A5E4',
      icon:  <TelegramIcon />,
    },
    {
      id:    'whatsapp',
      label: 'WhatsApp',
      color: '#fff',
      bg:    '#25D366',
      icon:  <WhatsAppIcon />,
    },
    {
      id:    'warpcast',
      label: 'Warpcast',
      color: '#fff',
      bg:    '#7C3AED',
      icon:  <WarpcastIcon />,
    },
  ];

  if (hasNativeShare) {
    platforms.unshift({
      id:    'native',
      label: 'More…',
      color: '#fff',
      bg:    'var(--grad-brand)',
      icon:  <Link2 size={18} />,
    });
  }

  return platforms;
}

/* ── Component ────────────────────────────────────────────── */
type ShareModalProps = {
  open: boolean;
  imageDataUrl: string;
  ctx: ShareContext;
  imageFile?: File;
  onClose: () => void;
};

export function ShareModal({ open, imageDataUrl, ctx, imageFile, onClose }: ShareModalProps) {
  const [copied,          setCopied]         = useState(false);
  const [linkCopied,      setLinkCopied]     = useState(false);
  const [nativeAvailable] = useState(() => Boolean(navigator.share));

  const refUrl   = makeReferralUrl(ctx.address);
  const platforms = getPlatforms(nativeAvailable);

  async function handlePlatform(id: PlatformMeta['id']) {
    if (id === 'native') {
      await nativeShare(ctx, imageFile);
      return;
    }
    if (id === 'download') {
      downloadImage(imageDataUrl);
      return;
    }
    const url = makePlatformUrl(id as SharePlatform, ctx);
    window.open(url, '_blank', 'noopener,noreferrer,width=600,height=520');
  }

  async function handleCopyLink() {
    const ok = await copyToClipboard(refUrl);
    if (ok) {
      setLinkCopied(true);
      window.setTimeout(() => setLinkCopied(false), 2200);
    }
  }

  async function handleCopyImage() {
    try {
      const res  = await fetch(imageDataUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob }),
      ]);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      // Clipboard image API not supported — fall back to download
      downloadImage(imageDataUrl);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="modal-backdrop"
          role="presentation"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{   opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <motion.div
            className="share-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Share your glow-up"
            onClick={(e) => e.stopPropagation()}
            initial={{ y: 64, scale: 0.97, opacity: 0 }}
            animate={{ y: 0,  scale: 1,    opacity: 1 }}
            exit={{   y: 32, scale: 0.98,  opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
          >
            {/* Header */}
            <div className="share-modal-header">
              <h2 className="share-modal-title">Share your glow-up ✨</h2>
              <button className="modal-close" onClick={onClose} aria-label="Close">
                <X size={16} />
              </button>
            </div>

            {/* Card preview */}
            {imageDataUrl && (
              <div className="share-card-preview">
                <img src={imageDataUrl} alt="Your Sage savings card" />
                <div className="share-card-actions">
                  <button
                    className="share-card-action-btn"
                    onClick={handleCopyImage}
                    title="Copy image to clipboard"
                  >
                    <AnimatePresence mode="wait" initial={false}>
                      {copied ? (
                        <motion.span key="ok"  initial={{ scale: 0.7 }} animate={{ scale: 1 }} exit={{ scale: 0.7 }} transition={{ duration: 0.15 }}>
                          <Check size={14} />
                        </motion.span>
                      ) : (
                        <motion.span key="cp" initial={{ scale: 0.7 }} animate={{ scale: 1 }} exit={{ scale: 0.7 }} transition={{ duration: 0.15 }}>
                          <Copy size={14} />
                        </motion.span>
                      )}
                    </AnimatePresence>
                    {copied ? 'Copied!' : 'Copy image'}
                  </button>
                  <button
                    className="share-card-action-btn"
                    onClick={() => downloadImage(imageDataUrl)}
                    title="Download card as PNG"
                  >
                    <Download size={14} />
                    Download
                  </button>
                </div>
              </div>
            )}

            {/* Platform buttons */}
            <div className="share-platforms">
              {platforms.map((p) => (
                <button
                  key={p.id}
                  className="share-platform-btn"
                  style={{ '--platform-bg': p.bg, '--platform-color': p.color } as React.CSSProperties}
                  onClick={() => handlePlatform(p.id)}
                  aria-label={`Share on ${p.label}`}
                >
                  <span className="share-platform-icon">{p.icon}</span>
                  <span className="share-platform-label">{p.label}</span>
                </button>
              ))}
            </div>

            {/* Divider */}
            <div className="share-divider">
              <span>or share your invite link</span>
            </div>

            {/* Referral link */}
            <div className="share-ref-row">
              <div className="share-ref-url" title={refUrl}>
                <Link2 size={13} className="share-ref-icon" />
                <span>{refUrl}</span>
              </div>
              <button
                className={`share-ref-copy-btn ${linkCopied ? 'share-ref-copy-ok' : ''}`}
                onClick={handleCopyLink}
                aria-label="Copy referral link"
              >
                <AnimatePresence mode="wait" initial={false}>
                  {linkCopied ? (
                    <motion.span key="ok" initial={{ scale: 0.7 }} animate={{ scale: 1 }} exit={{ scale: 0.7 }} transition={{ duration: 0.15 }} className="share-ref-copy-inner">
                      <Check size={13} /> Copied!
                    </motion.span>
                  ) : (
                    <motion.span key="cp" initial={{ scale: 0.7 }} animate={{ scale: 1 }} exit={{ scale: 0.7 }} transition={{ duration: 0.15 }} className="share-ref-copy-inner">
                      <Copy size={13} /> Copy link
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            </div>

            <p className="share-ref-note">
              Friends who join through your link start on Sage — and your streak counts as a shared milestone.
            </p>

          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ── Helpers ──────────────────────────────────────────────── */
function downloadImage(dataUrl: string) {
  const a    = document.createElement('a');
  a.href     = dataUrl;
  a.download = 'sage-glow-up.png';
  a.click();
}
