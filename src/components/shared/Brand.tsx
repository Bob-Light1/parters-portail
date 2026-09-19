'use client';

/**
 * @file Brand.tsx
 * @description Configured portal identity with a resilient, neutral logo fallback.
 */
import { useState } from 'react';
import { GraduationCap } from 'lucide-react';
import { BRAND_NAME, BRAND_LOGO } from '@/lib/brand';

/** Preserve readable establishment identity if its optional image fails. */
export default function Brand() {
  const [failed, setFailed] = useState(false);
  return <span className="inline-flex items-center gap-2">
    {BRAND_LOGO && !failed
      // Deployment assets may use any HTTPS host; avoid a hardcoded optimizer allowlist.
      // eslint-disable-next-line @next/next/no-img-element
      ? <img src={BRAND_LOGO} alt="" width={32} height={32} className="h-8 w-8 shrink-0 object-contain" onError={() => setFailed(true)} />
      : <GraduationCap className="h-6 w-6 shrink-0" aria-hidden="true" />}
    <span className="break-words">{BRAND_NAME}</span>
  </span>;
}
