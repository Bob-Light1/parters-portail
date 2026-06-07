'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState, useEffect, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { captureTrackingParams, getTrackingContext } from '@/lib/tracking';
import { track } from '@/lib/analytics';
import { postPreRegister } from '@/lib/erp-client';
import WhatsAppButton from '@/components/shared/WhatsAppButton';
import type { TrackingContext } from '@/lib/tracking';

interface PreRegisterFormProps {
  programs: string[];
  campusSlug: string;
  /** partnerCode resolved server-side from `?ref=` (falls back to the cookie). */
  partnerCodeProp?: string;
  /** Pre-selected formation, e.g. from a course-preview CTA `?program=` (spec §4.7). */
  defaultProgram?: string;
}

const inputClass =
  'w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 ' +
  'placeholder:text-gray-400 bg-white ' +
  'focus:outline-none focus:ring-2 focus:ring-[#0f2d5e] focus:border-transparent ' +
  'transition-colors';

export default function PreRegisterForm({ programs, campusSlug, partnerCodeProp, defaultProgram }: PreRegisterFormProps) {
  const t = useTranslations('register');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [tracking, setTracking] = useState<TrackingContext>({ source: 'direct' });

  // Validation messages are localized, so the schema is rebuilt when the locale changes.
  const schema = useMemo(
    () =>
      z.object({
        firstName: z.string().min(2, t('v_name_min')),
        lastName: z.string().min(2, t('v_name_min')),
        email: z.email(t('v_email')),
        phone: z.string().optional(),
        programInterest: z.string().optional(),
        country: z.string().optional(),
        city: z.string().optional(),
        honeypot: z.literal(''),
      }),
    [t],
  );

  type FormValues = z.infer<typeof schema>;

  // Persist attribution params from the landing URL, then read the resolved context.
  useEffect(() => {
    captureTrackingParams(new URLSearchParams(window.location.search));
    const context = getTrackingContext();
    setTracking(partnerCodeProp ? { ...context, partnerCode: partnerCodeProp } : context);
  }, [partnerCodeProp]);

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { honeypot: '', programInterest: defaultProgram ?? '' },
  });

  const onSubmit = async (data: FormValues) => {
    setStatus('loading');
    setErrorMsg('');
    try {
      await postPreRegister({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        programInterest: data.programInterest,
        country: data.country,
        city: data.city,
        partnerCode: tracking.partnerCode,
        // The ERP resolves the campus from the partnerCode; only send the slug for direct visits.
        campusSlug: tracking.partnerCode ? undefined : campusSlug,
        source: tracking.source,
        utmParams: tracking.utmParams,
        honeypot: '',
      });
      setStatus('success');
      track('pre_register_submitted', { source: tracking.source });
    } catch (err: unknown) {
      setStatus('error');
      const httpStatus = (err as { status?: number }).status;
      setErrorMsg(httpStatus === 409 ? t('error_duplicate') : t('error_generic'));
    }
  };

  if (status === 'success') {
    const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
    return (
      <div className="flex flex-col items-center gap-6 text-center py-8">
        <CheckCircle className="w-16 h-16 text-green-500" />
        <h3 className="text-xl font-bold text-gray-900">{t('success_title')}</h3>
        <p className="text-gray-600 max-w-sm">{t('success_message')}</p>
        <WhatsAppButton
          message={t('success_share_message', { url: shareUrl })}
          label={t('success_share')}
          source="pre_register_success"
          size="lg"
        />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {/* Invisible honeypot — traps bots (spec §5.5). */}
      <input {...register('honeypot')} type="text" tabIndex={-1} className="hidden" aria-hidden="true" autoComplete="off" />

      {tracking.partnerCode && (
        <p className="text-xs text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full inline-block">
          {t('partner_ref')} <strong>{tracking.partnerCode}</strong>
        </p>
      )}

      {/* First / last name */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('first_name')} <span className="text-red-500">*</span>
          </label>
          <input {...register('firstName')} className={inputClass} placeholder={t('ph_first_name')} autoComplete="given-name" />
          {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('last_name')} <span className="text-red-500">*</span>
          </label>
          <input {...register('lastName')} className={inputClass} placeholder={t('ph_last_name')} autoComplete="family-name" />
          {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName.message}</p>}
        </div>
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('email')} <span className="text-red-500">*</span>
        </label>
        <input {...register('email')} type="email" className={inputClass} placeholder={t('ph_email')} autoComplete="email" />
        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
      </div>

      {/* Phone */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{t('phone')}</label>
        <input {...register('phone')} type="tel" className={inputClass} placeholder={t('ph_phone')} autoComplete="tel" />
      </div>

      {/* Program (when available) */}
      {programs.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('program')}</label>
          <select {...register('programInterest')} className={`${inputClass} appearance-none cursor-pointer`}>
            <option value="">{t('program_placeholder')}</option>
            {programs.map((program) => (
              <option key={program} value={program}>{program}</option>
            ))}
          </select>
        </div>
      )}

      {/* Country / city */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('country')}</label>
          <input {...register('country')} className={inputClass} placeholder={t('ph_country')} autoComplete="country-name" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('city')}</label>
          <input {...register('city')} className={inputClass} placeholder={t('ph_city')} autoComplete="address-level2" />
        </div>
      </div>

      {/* Submission error */}
      {status === 'error' && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {errorMsg}
        </div>
      )}

      <p className="text-xs text-gray-400">{t('consent')}</p>
      <p className="text-xs text-gray-400">{t('required_fields')}</p>

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
