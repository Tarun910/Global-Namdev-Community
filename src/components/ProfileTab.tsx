import { useEffect, useState, type FormEvent } from 'react';
import { Save, LogOut, Download, Pencil, X, FileText } from 'lucide-react';
import { Registration } from '../types';
import { clearSession } from '../lib/demoAuth';
import { getTranslations } from '../lib/translations';
import { Language } from '../lib/languages';
import { formatDisplayMobile, getDialCodeForCountry } from '../lib/countries';
import { validateRegistrationFields } from '../lib/validateRegistration';
import { downloadIdCardPdf, downloadIdCardPng } from '../lib/idCardDownload';
import RegistrationDetailsForm, { RegistrationFormValues } from './RegistrationDetailsForm';
import IdCardPreview from './IdCardPreview';

interface ProfileTabProps {
  member: Registration;
  onUpdate: (updated: Registration) => void;
  onLogout: () => void;
  language: Language;
}

export default function ProfileTab({ member, onUpdate, onLogout, language }: ProfileTabProps) {
  const t = getTranslations(language);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<Registration>({ ...member });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isRendering, setIsRendering] = useState(false);

  useEffect(() => {
    setForm({ ...member });
  }, [member]);

  const previewMember = isEditing ? form : member;

  const updateField = <K extends keyof RegistrationFormValues>(
    key: K,
    value: RegistrationFormValues[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleCountryChange = (country: string) => {
    setForm((prev) => ({
      ...prev,
      country,
      state: '',
      mobileCountryCode: getDialCodeForCountry(country),
    }));
  };

  const handleStartEditing = () => {
    setForm({ ...member });
    setErrors({});
    setSaveMessage(null);
    setIsEditing(true);
  };

  const handleCancelEditing = () => {
    setForm({ ...member });
    setErrors({});
    setIsEditing(false);
  };

  const handleSave = (e: FormEvent) => {
    e.preventDefault();
    const validationErrors = validateRegistrationFields(form);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setIsSaving(true);
    setTimeout(() => {
      onUpdate(form);
      setIsSaving(false);
      setIsEditing(false);
      setSaveMessage(t.profileSaveSuccess);
    }, 400);
  };

  const handleLogout = () => {
    clearSession();
    onLogout();
  };

  const handleDownloadPng = () => {
    setIsRendering(true);
    void downloadIdCardPng(previewMember).finally(() => setIsRendering(false));
  };

  const handleDownloadPdf = () => {
    setIsRendering(true);
    void downloadIdCardPdf(previewMember).finally(() => setIsRendering(false));
  };

  return (
    <div className="w-full max-w-4xl mx-auto min-w-0 py-6 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-sans text-2xl md:text-3xl font-bold text-slate-900">{t.profileTitle}</h2>
          <p className="text-xs text-slate-500 mt-1">
            {isEditing ? t.profileEditSub : t.profileViewSub}
          </p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          {t.profileLogout}
        </button>
      </div>

      {saveMessage && !isEditing && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          {saveMessage}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start min-w-0">
        <div className="space-y-4 min-w-0">
          {!isEditing ? (
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 md:p-8 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <h3 className="font-sans text-xl font-bold text-slate-900">{member.fullName}</h3>
                {member.isVerified && (
                  <span className="text-[10px] font-geist font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full shrink-0">
                    {t.profileVerified}
                  </span>
                )}
              </div>

              <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-4">
                <p className="text-[10px] font-geist font-bold uppercase tracking-widest text-slate-400">
                  {t.permanentCommunityId}
                </p>
                <p className="mt-1 font-mono text-lg font-bold text-primary tracking-wide break-all">
                  {member.communityId}
                </p>
              </div>

              <button
                type="button"
                onClick={handleStartEditing}
                className="mt-6 w-full py-3 bg-primary text-white font-geist text-sm font-bold rounded-xl shadow-md hover:opacity-90 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Pencil className="w-4 h-4" />
                {t.profileEditDetails}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSave} className="bg-white border border-slate-200/80 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
              <RegistrationDetailsForm
                values={form}
                onChange={updateField}
                errors={errors}
                t={t}
                mobileDisplay={formatDisplayMobile(
                  form.mobileCountryCode ?? '+91',
                  form.mobileNumber
                )}
                communityId={form.communityId}
                onCountryChange={handleCountryChange}
                showOtpVerifiedBadge={member.isVerified}
              />

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-3 bg-primary text-white font-geist text-sm font-bold rounded-xl shadow-md hover:opacity-90 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? t.profileSaving : t.profileSave}
                </button>
                <button
                  type="button"
                  onClick={handleCancelEditing}
                  disabled={isSaving}
                  className="flex-1 py-3 border border-slate-200 text-slate-600 font-geist text-sm font-bold rounded-xl hover:bg-slate-50 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  <X className="w-4 h-4" />
                  {t.profileCancel}
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="space-y-4 min-w-0">
          <p className="text-[10px] font-geist text-slate-400 uppercase tracking-widest text-center font-bold">
            {t.profilePreviewLabel}
          </p>
          <IdCardPreview member={previewMember} />
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={handleDownloadPng}
              disabled={isRendering}
              className="flex-1 py-3 bg-primary text-white font-geist text-xs font-bold rounded-xl shadow-md hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
            >
              <Download className="w-4 h-4 text-white" />
              {isRendering ? t.profilePreparing : t.downloadPngCard}
            </button>
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isRendering}
              className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-geist text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
            >
              <FileText className="w-4 h-4 text-primary" />
              {t.downloadPdfCard}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
