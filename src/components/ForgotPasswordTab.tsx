import { useState, type FormEvent } from 'react';
import { motion } from 'motion/react';
import { KeyRound, ShieldCheck } from 'lucide-react';
import { Registration } from '../types';
import { findRegistrationByMobile, isValidLocalMobile } from '../lib/demoAuth';
import { resetMemberPassword } from '../lib/memberAuth';
import { isSupabaseConfigured } from '../lib/supabase/client';
import { validateForgotPasswordFields } from '../lib/validateForms';
import MobileWithCountryCode from './MobileWithCountryCode';
import BackButton from './BackButton';
import DobOrAgeField from './DobOrAgeField';
import { Language } from '../lib/languages';
import { getTranslations } from '../lib/translations';
import { pageEnter, tapScale } from '../lib/motionPresets';

interface ForgotPasswordTabProps {
  registrations: Registration[];
  language: Language;
  onNavigateLogin: () => void;
}

export default function ForgotPasswordTab({
  registrations,
  language,
  onNavigateLogin,
}: ForgotPasswordTabProps) {
  const t = getTranslations(language);
  const [dialCode, setDialCode] = useState('+91');
  const [mobile, setMobile] = useState('');
  const [dobOrAge, setDobOrAge] = useState('');
  const [fathersName, setFathersName] = useState('');
  const [communityId, setCommunityId] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    const errors = validateForgotPasswordFields(
      mobile,
      dobOrAge,
      fathersName,
      communityId,
      password,
      passwordConfirm,
    );
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const member = findRegistrationByMobile(registrations, dialCode, mobile);
    if (!member) {
      setError(t.forgotPasswordNoMember);
      return;
    }

    setIsSubmitting(true);
    try {
      const ok = await resetMemberPassword(
        registrations,
        {
          dialCode,
          mobile,
          dobOrAge,
          fathersName,
          communityId,
          newPassword: password,
        },
        isSupabaseConfigured(),
      );

      if (!ok) {
        setError(t.forgotPasswordMismatch);
        return;
      }

      setSuccess(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <motion.div {...pageEnter} className="max-w-md mx-auto py-10 text-center space-y-4">
        <div className="w-16 h-16 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-full flex items-center justify-center mx-auto">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h2 className="font-sans text-2xl font-bold text-slate-900">{t.forgotPasswordSuccessTitle}</h2>
        <p className="text-xs text-slate-500">{t.forgotPasswordSuccessSub}</p>
        <button
          type="button"
          onClick={onNavigateLogin}
          className="px-6 py-3 bg-primary text-white text-sm font-bold rounded-xl cursor-pointer"
        >
          {t.forgotPasswordGoLogin}
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div {...pageEnter} className="w-full max-w-md mx-auto min-w-0 py-6 space-y-6">
      <BackButton onClick={onNavigateLogin} label={t.forgotPasswordBackLogin} />

      <div className="text-center space-y-2">
        <div className="w-14 h-14 bg-orange-50 border border-orange-100 rounded-2xl flex items-center justify-center mx-auto">
          <KeyRound className="w-7 h-7 text-primary" />
        </div>
        <h2 className="font-sans text-2xl font-bold text-slate-900">{t.forgotPasswordTitle}</h2>
        <p className="text-xs text-slate-500">{t.forgotPasswordSub}</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4">
        <MobileWithCountryCode
          dialCode={dialCode}
          onDialCodeChange={setDialCode}
          mobile={mobile}
          onMobileChange={(value) => {
            setMobile(value);
            setFieldErrors((prev) => {
              const next = { ...prev };
              delete next.mobile;
              return next;
            });
          }}
          error={fieldErrors.mobile}
          language={language}
        />

        <div className="space-y-1">
          <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
            {t.formDobAge}
          </label>
          <DobOrAgeField
            value={dobOrAge}
            onChange={setDobOrAge}
            error={fieldErrors.dobOrAge}
            inputClassName={`${
              fieldErrors.dobOrAge ? 'border-red-400' : 'border-slate-200'
            } bg-slate-50`}
          />
        </div>

        <div className="space-y-1">
          <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
            {t.formFathersName}
          </label>
          <input
            type="text"
            value={fathersName}
            onChange={(e) => setFathersName(e.target.value)}
            className={`w-full bg-slate-50 border rounded-xl px-3.5 py-2.5 text-xs ${
              fieldErrors.fathersName ? 'border-red-400' : 'border-slate-200'
            }`}
          />
          {fieldErrors.fathersName && (
            <p className="text-[10px] text-red-500">{fieldErrors.fathersName}</p>
          )}
        </div>

        <div className="space-y-1">
          <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
            {t.loginIdentifierLabel}
          </label>
          <input
            type="text"
            value={communityId}
            onChange={(e) => setCommunityId(e.target.value)}
            placeholder="GNC-2026-000101"
            className={`w-full bg-slate-50 border rounded-xl px-3.5 py-2.5 text-xs ${
              fieldErrors.communityId ? 'border-red-400' : 'border-slate-200'
            }`}
          />
          {fieldErrors.communityId && (
            <p className="text-[10px] text-red-500">{fieldErrors.communityId}</p>
          )}
        </div>

        <div className="space-y-1">
          <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
            {t.registerPasswordLabel}
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`w-full bg-slate-50 border rounded-xl px-3.5 py-2.5 text-xs ${
              fieldErrors.password ? 'border-red-400' : 'border-slate-200'
            }`}
          />
          {fieldErrors.password && (
            <p className="text-[10px] text-red-500">{fieldErrors.password}</p>
          )}
        </div>

        <div className="space-y-1">
          <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
            {t.registerPasswordConfirmLabel}
          </label>
          <input
            type="password"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            className={`w-full bg-slate-50 border rounded-xl px-3.5 py-2.5 text-xs ${
              fieldErrors.passwordConfirm ? 'border-red-400' : 'border-slate-200'
            }`}
          />
          {fieldErrors.passwordConfirm && (
            <p className="text-[10px] text-red-500">{fieldErrors.passwordConfirm}</p>
          )}
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}

        <motion.button
          type="submit"
          disabled={isSubmitting}
          {...tapScale}
          className="w-full py-3 bg-primary text-white font-geist text-sm font-bold rounded-xl disabled:opacity-50 cursor-pointer"
        >
          {isSubmitting ? t.forgotPasswordSaving : t.forgotPasswordSubmit}
        </motion.button>
      </form>
    </motion.div>
  );
}
