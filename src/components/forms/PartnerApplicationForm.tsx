'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { CheckCircle, AlertCircle } from 'lucide-react';

interface PartnerApplicationFormProps {
  campusSlug?: string;
}

const inputClass =
  'w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 ' +
  'placeholder:text-gray-400 bg-white ' +
  'focus:outline-none focus:ring-2 focus:ring-[#0f2d5e] focus:border-transparent ' +
  'transition-colors';

export default function PartnerApplicationForm({ campusSlug }: PartnerApplicationFormProps) {
  const t = useTranslations('partner_apply');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const schema = useMemo(
    () =>
      z.object({
        firstName: z.string().min(2, t('v_name_min')),
        lastName: z.string().min(2, t('v_name_min')),
        email: z.email(t('v_email')),
        phone: z.string().optional(),
        commercialType: z.enum(['influencer', 'church_leader', 'student_leader', 'teacher', 'parent', 'other']),
        channelType: z.enum(['online', 'offline', 'hybrid']),
        message: z.string().optional(),
        honeypot: z.literal(''),
      }),
    [t],
  );

  type FormValues = z.infer<typeof schema>;

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { commercialType: 'other', channelType: 'hybrid', honeypot: '' },
  });

  const onSubmit = async (data: FormValues) => {
    setStatus('loading');
    try {
      const res = await fetch('/api/partner-application', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone || undefined,
          commercialType: data.commercialType,
          channelType: data.channelType,
          message: data.message || undefined,
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

      {/* Partnership type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('type')} <span className="text-red-500">*</span>
        </label>
        <select {...register('commercialType')} className={`${inputClass} appearance-none cursor-pointer`}>
          <option value="influencer">{t('type_influencer')}</option>
          <option value="church_leader">{t('type_church_leader')}</option>
          <option value="student_leader">{t('type_student_leader')}</option>
          <option value="teacher">{t('type_teacher')}</option>
          <option value="parent">{t('type_parent')}</option>
          <option value="other">{t('type_other')}</option>
        </select>
      </div>

      {/* Channel */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('channel')} <span className="text-red-500">*</span>
        </label>
        <select {...register('channelType')} className={`${inputClass} appearance-none cursor-pointer`}>
          <option value="online">{t('channel_online')}</option>
          <option value="offline">{t('channel_offline')}</option>
          <option value="hybrid">{t('channel_hybrid')}</option>
        </select>
      </div>

      {/* Motivation */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{t('message')}</label>
        <textarea
          {...register('message')}
          rows={4}
          className={`${inputClass} resize-none`}
          placeholder={t('message_ph')}
        />
      </div>

      {status === 'error' && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {t('error_generic')}
        </div>
      )}

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
