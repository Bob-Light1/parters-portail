'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { CheckCircle, AlertCircle } from 'lucide-react';

interface ContactFormProps {
  campusSlug?: string;
}

const inputClass =
  'w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 ' +
  'placeholder:text-gray-400 bg-white ' +
  'focus:outline-none focus:ring-2 focus:ring-[#0f2d5e] focus:border-transparent ' +
  'transition-colors';

export default function ContactForm({ campusSlug }: ContactFormProps) {
  const t = useTranslations('contact');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const schema = useMemo(
    () =>
      z
        .object({
          name: z.string().min(2, t('v_name_min')),
          email: z.string().optional(),
          phone: z.string().optional(),
          subject: z.enum(['registration', 'partnership', 'other']),
          message: z.string().min(1),
          honeypot: z.literal(''),
        })
        .refine((d) => (d.email?.trim() || d.phone?.trim()) ? true : false, {
          message: t('v_contact_required'),
          path: ['email'],
        })
        .refine((d) => !d.email?.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email), {
          message: t('v_email_invalid'),
          path: ['email'],
        }),
    [t],
  );

  type FormValues = z.infer<typeof schema>;

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { subject: 'other', honeypot: '' },
  });

  const onSubmit = async (data: FormValues) => {
    setStatus('loading');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          email: data.email || undefined,
          phone: data.phone || undefined,
          subject: data.subject,
          message: data.message,
          campusSlug: campusSlug || undefined,
          honeypot: '',
        }),
      });
      const json = await res.json();
      setStatus(json.success ? 'success' : 'error');
    } catch {
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div className="flex flex-col items-center gap-6 text-center py-8">
        <CheckCircle className="w-16 h-16 text-green-500" />
        <h3 className="text-xl font-bold text-gray-900">{t('success_title')}</h3>
        <p className="text-gray-600 max-w-sm">{t('success_message')}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {/* Honeypot */}
      <input {...register('honeypot')} type="text" tabIndex={-1} className="hidden" aria-hidden="true" autoComplete="off" />

      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('name')} <span className="text-red-500">*</span>
        </label>
        <input {...register('name')} className={inputClass} placeholder={t('ph_name')} autoComplete="name" />
        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('email_or_phone')} <span className="text-red-500">*</span>
        </label>
        <input {...register('email')} type="email" className={inputClass} placeholder={t('ph_email')} autoComplete="email" />
        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
      </div>

      {/* Phone */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{t('phone')}</label>
        <input {...register('phone')} type="tel" className={inputClass} placeholder={t('ph_phone')} autoComplete="tel" />
      </div>

      {/* Subject */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('subject')} <span className="text-red-500">*</span>
        </label>
        <select {...register('subject')} className={`${inputClass} appearance-none cursor-pointer`}>
          <option value="registration">{t('subject_registration')}</option>
          <option value="partnership">{t('subject_partnership')}</option>
          <option value="other">{t('subject_other')}</option>
        </select>
      </div>

      {/* Message */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('message')} <span className="text-red-500">*</span>
        </label>
        <textarea
          {...register('message')}
          rows={5}
          className={`${inputClass} resize-none`}
          placeholder={t('message_ph')}
        />
        {errors.message && <p className="text-red-500 text-xs mt-1">{errors.message.message}</p>}
      </div>

      {status === 'error' && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {t('error_generic')}
        </div>
      )}

      <p className="text-xs text-gray-400">{t('consent')}</p>

      <button
        type="submit"
        disabled={status === 'loading'}
        className="w-full bg-[#0f2d5e] text-white font-bold py-3 rounded-full hover:bg-[#0a2347] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {status === 'loading' ? t('submitting') : t('submit')}
      </button>
    </form>
  );
}
