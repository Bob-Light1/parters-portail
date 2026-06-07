'use client';

/**
 * Shareable quiz badge (spec §4.10).
 *
 * Rendered entirely client-side: an on-canvas drawing (logo/brand, pseudonym, score,
 * category, date) plus an embedded QR code pointing back to the portal with the
 * original partnerCode for traceable virality. Exported as a downloadable PNG and
 * shareable on WhatsApp. No ERP dependency — works on slow connections.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Download, Share2 } from 'lucide-react';
import { buildWhatsAppShareUrl, withReferralCode } from '@/lib/whatsapp';
import { track } from '@/lib/analytics';

interface QuizBadgeProps {
  brand: string;
  score: number;
  category: string;
  /** Display name / pseudonym shown on the badge. */
  name: string;
  /** Original partner code, propagated into the embedded QR link. */
  partnerCode?: string;
  /** Pre-translated, ready-to-send WhatsApp message. */
  shareMessage: string;
  labels: {
    title: string;
    download: string;
    share: string;
  };
}

const W = 600;
const H = 360;

export default function QuizBadge({
  brand,
  score,
  category,
  name,
  partnerCode,
  shareMessage,
  labels,
}: QuizBadgeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pngUrl, setPngUrl] = useState<string>('');

  const draw = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background gradient (brand navy → lighter navy)
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, '#0f2d5e');
    grad.addColorStop(1, '#1a4a8f');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Brand
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 26px Arial, sans-serif';
    ctx.textBaseline = 'top';
    ctx.fillText(brand, 36, 34);

    // Title
    ctx.fillStyle = '#facc15';
    ctx.font = 'bold 18px Arial, sans-serif';
    ctx.fillText(labels.title.toUpperCase(), 36, 74);

    // Name
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 30px Arial, sans-serif';
    ctx.fillText(name, 36, 130);

    // Category
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.font = '18px Arial, sans-serif';
    ctx.fillText(category, 36, 172);

    // Score
    ctx.fillStyle = '#facc15';
    ctx.font = 'bold 72px Arial, sans-serif';
    ctx.fillText(String(score), 36, 220);
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = 'bold 26px Arial, sans-serif';
    const scoreWidth = ctx.measureText(String(score)).width;
    ctx.fillText('/100', 36 + scoreWidth + 60, 262);

    // Date
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = '14px Arial, sans-serif';
    ctx.fillText(new Date().toLocaleDateString(), 36, H - 40);

    // QR code → portal with referral code
    try {
      const portalUrl = typeof window !== 'undefined' ? window.location.origin : '';
      const qrTarget = withReferralCode(portalUrl, partnerCode);
      const qrDataUrl = await QRCode.toDataURL(qrTarget, { margin: 1, width: 150 });
      const qrImg = new window.Image();
      await new Promise<void>((resolve, reject) => {
        qrImg.onload = () => resolve();
        qrImg.onerror = reject;
        qrImg.src = qrDataUrl;
      });
      // White rounded backing for contrast
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(W - 176, H - 176, 150, 150);
      ctx.drawImage(qrImg, W - 173, H - 173, 144, 144);
    } catch {
      /* QR generation failed — badge still renders without it. */
    }

    setPngUrl(canvas.toDataURL('image/png'));
  }, [brand, score, category, name, partnerCode, labels.title]);

  useEffect(() => {
    draw();
  }, [draw]);

  const handleDownload = () => {
    if (!pngUrl) return;
    const link = document.createElement('a');
    link.href = pngUrl;
    link.download = `badge-${score}.png`;
    link.click();
    // A download is not a WhatsApp share — don't inflate the share KPI (spec §6.1).
    // The WhatsApp button below fires whatsapp_share_clicked on its own.
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        className="w-full max-w-sm rounded-2xl shadow-lg"
      />
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={handleDownload}
          className="inline-flex items-center gap-2 bg-[#0f2d5e] text-white font-semibold px-5 py-2.5 rounded-full hover:bg-[#0a2347] transition-colors"
        >
          <Download className="w-4 h-4" /> {labels.download}
        </button>
        <a
          href={buildWhatsAppShareUrl(shareMessage)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => track('whatsapp_share_clicked', { source: 'badge_share' })}
          className="inline-flex items-center gap-2 bg-[#25D366] text-white font-semibold px-5 py-2.5 rounded-full hover:bg-[#1dbe58] transition-colors"
        >
          <Share2 className="w-4 h-4" /> {labels.share}
        </a>
      </div>
    </div>
  );
}
