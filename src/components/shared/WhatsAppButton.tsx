'use client';

import { MessageCircle } from 'lucide-react';
import { buildWhatsAppShareUrl } from '@/lib/whatsapp';
import { track } from '@/lib/analytics';

interface WhatsAppButtonProps {
  /** Pre-translated, ready-to-send message. The caller is responsible for i18n. */
  message: string;
  /** Pre-translated button label. */
  label: string;
  /** Where the share originates from — sent as an analytics prop. */
  source?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
};

export default function WhatsAppButton({ message, label, source = 'unknown', className = '', size = 'md' }: WhatsAppButtonProps) {
  return (
    <a
      href={buildWhatsAppShareUrl(message)}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => track('whatsapp_share_clicked', { source })}
      className={`inline-flex items-center gap-2 bg-[#25D366] text-white font-semibold rounded-full shadow hover:bg-[#1dbe58] transition-colors ${sizes[size]} ${className}`}
    >
      <MessageCircle className="w-5 h-5 flex-shrink-0" />
      {label}
    </a>
  );
}
