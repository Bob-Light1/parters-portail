'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export default function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const isOpen = openId === item.id;
        return (
          <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <button
              onClick={() => setOpenId(isOpen ? null : item.id)}
              aria-expanded={isOpen}
              className="w-full flex items-center justify-between gap-4 text-start px-5 py-4 font-semibold text-[#0f2d5e] hover:bg-gray-50 transition-colors"
            >
              <span>{item.question}</span>
              <ChevronDown
                className={`w-5 h-5 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              />
            </button>
            {isOpen && (
              <div className="px-5 pb-5 text-gray-600 whitespace-pre-line">{item.answer}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}
