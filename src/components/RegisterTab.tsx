import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Registration } from '../types';
import { 
  ShieldCheck, Award, Download, RefreshCw, FileText 
} from 'lucide-react';
import { getTranslations } from '../lib/translations';
import { Language } from '../lib/languages';
import { normalizeMobile, setSession, findRegistrationByMobile, isValidLocalMobile, AuthSession } from '../lib/demoAuth';
import { resendPhoneOtp, sendPhoneOtp, verifyPhoneOtp } from '../lib/phoneOtp';
import { useOtpMode } from '../hooks/useOtpMode';
import OtpVerificationStep from './OtpVerificationStep';
import Msg91CaptchaMount from './Msg91CaptchaMount';
import IdCardPreview from './IdCardPreview';
import MobileWithCountryCode from './MobileWithCountryCode';
import RegistrationDetailsForm, { RegistrationFormValues } from './RegistrationDetailsForm';
import { downloadIdCardPdf, downloadIdCardPng } from '../lib/idCardDownload';
import { getDialCodeForCountry, formatDisplayMobile } from '../lib/countries';
import { validateRegistrationFields } from '../lib/validateRegistration';
import { validateMemberPasswordFields } from '../lib/validateForms';
import { isOtpFallbackEligible, otpUnavailableMessage } from '../lib/otpFallback';
import { generateNextCommunityId } from '../lib/communityId';

interface RegisterTabProps {
  registerMode: 'self' | 'family';
  onRegisterSubmit: (registration: Registration, password: string) => void | Promise<void>;
  onNavigate: (tab: string) => void;
  onNavigateLogin?: () => void;
  onSessionCreated?: (session: AuthSession) => void;
  registrations: Registration[];
  language: Language;
}

type RegisterStep = 'credentials' | 'otp' | 'form';

export default function RegisterTab({
  registerMode,
  onRegisterSubmit,
  onNavigate,
  onNavigateLogin,
  onSessionCreated,
  registrations,
  language,
}: RegisterTabProps) {
  const t = getTranslations(language);
  const { widgetMode } = useOtpMode();

  const [registerStep, setRegisterStep] = useState<RegisterStep>('credentials');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [credentialErrors, setCredentialErrors] = useState<Record<string, string>>({});
  const [otpFallbackNotice, setOtpFallbackNotice] = useState('');
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [mobileError, setMobileError] = useState('');
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpDemoMode, setOtpDemoMode] = useState(false);
  const [otpReqId, setOtpReqId] = useState<string | undefined>();
  const [resendCooldown, setResendCooldown] = useState(0);
  const [mobileVerified, setMobileVerified] = useState(false);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = window.setTimeout(() => setResendCooldown((s) => s - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [resendCooldown]);

  // Form Fields State
  const [fullName, setFullName] = useState('');
  const [fathersName, setFathersName] = useState('');
  const [mothersName, setMothersName] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [dobOrAge, setDobOrAge] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [mobileCountryCode, setMobileCountryCode] = useState('+91');
  const [email, setEmail] = useState('');
  const [gotra, setGotra] = useState('');
  const [education, setEducation] = useState('');
  const [occupation, setOccupation] = useState('');
  const [country, setCountry] = useState('India');
  const [state, setState] = useState('');
  const [district, setDistrict] = useState('');
  const [city, setCity] = useState('');
  const [village, setVillage] = useState('');
  const [relationship, setRelationship] = useState<Registration['relationship'] | ''>(
    () => (registerMode === 'self' ? 'Self' : ''),
  );
  const [registrationKind, setRegistrationKind] = useState<'self' | 'family'>(registerMode);
  const [photoUrl, setPhotoUrl] = useState<string | undefined>();

  useEffect(() => {
    setRegistrationKind(registerMode);
    setRelationship(registerMode === 'self' ? 'Self' : '');
  }, [registerMode]);

  // Success flow state
  const [registeredData, setRegisteredData] = useState<Registration | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Validation state
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMobileError('');
    setCredentialErrors({});
    setOtpFallbackNotice('');

    if (!isValidLocalMobile(mobileNumber)) {
      setMobileError('Enter a valid mobile number.');
      return;
    }

    const passwordErrors = validateMemberPasswordFields(password, passwordConfirm);
    if (Object.keys(passwordErrors).length > 0) {
      setCredentialErrors(passwordErrors);
      return;
    }

    const exists = findRegistrationByMobile(registrations, mobileCountryCode, mobileNumber);
    if (exists) {
      setMobileError('This number is already registered. Please login instead.');
      return;
    }

    setIsSendingOtp(true);
    const result = await sendPhoneOtp(mobileCountryCode, mobileNumber);
    setIsSendingOtp(false);

    setMobileNumber(normalizeMobile(mobileNumber));

    if (!result.success) {
      if (isOtpFallbackEligible(result)) {
        setMobileVerified(false);
        setOtpFallbackNotice(otpUnavailableMessage(language === 'en' ? 'en' : 'hi'));
        setRegisterStep('form');
        return;
      }
      setMobileError(result.message);
      return;
    }

    setOtpDemoMode(result.demo ?? false);
    if (result.reqId) setOtpReqId(result.reqId);
    setResendCooldown(30);
    setRegisterStep('otp');
  };

  const handleResendRegistrationOtp = async () => {
    setOtpError('');
    setIsSendingOtp(true);
    const result = await resendPhoneOtp(mobileCountryCode, mobileNumber, otpReqId);
    setIsSendingOtp(false);

    if (!result.success) {
      setOtpError(result.message);
      return;
    }

    setOtpDemoMode(result.demo ?? false);
    if (result.reqId) setOtpReqId(result.reqId);
    setResendCooldown(30);
    setOtp('');
  };

  const handleVerifyRegistrationOtp = async () => {
    setOtpError('');
    setIsVerifyingOtp(true);

    const result = await verifyPhoneOtp(mobileCountryCode, mobileNumber, otp, otpReqId);
    if (!result.success) {
      setOtpError(result.message || t.loginErrorInvalidOtp);
      setIsVerifyingOtp(false);
      return;
    }

    setMobileVerified(true);
    setIsVerifyingOtp(false);
    setRegisterStep('form');
  };

  // Validate form fields
  const validateForm = () => {
    const tempErrors = validateRegistrationFields({
      fullName,
      fathersName,
      mothersName: mothersName || undefined,
      dobOrAge,
      mobileNumber,
      email: email || undefined,
      education,
      occupation,
      country,
      state,
      district,
      city,
      village: village || undefined,
      gotra: gotra || undefined,
      photoUrl,
    });

    if (registrationKind === 'family' && !relationship) {
      tempErrors.relationship = 'Select your relationship';
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const updateFormField = <K extends keyof RegistrationFormValues>(
    key: K,
    value: RegistrationFormValues[K]
  ) => {
    switch (key) {
      case 'fullName': setFullName(String(value)); break;
      case 'fathersName': setFathersName(String(value)); break;
      case 'mothersName': setMothersName(String(value ?? '')); break;
      case 'gender': setGender(value as Registration['gender']); break;
      case 'dobOrAge': setDobOrAge(String(value)); break;
      case 'email': setEmail(String(value ?? '')); break;
      case 'gotra': setGotra(String(value ?? '')); break;
      case 'education': setEducation(String(value)); break;
      case 'occupation': setOccupation(String(value)); break;
      case 'country': setCountry(String(value)); break;
      case 'state': setState(String(value)); break;
      case 'district': setDistrict(String(value)); break;
      case 'city': setCity(String(value)); break;
      case 'village': setVillage(String(value ?? '')); break;
      case 'relationship': setRelationship(value as Registration['relationship']); break;
      case 'photoUrl': setPhotoUrl(value as string | undefined); break;
    }
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleCountryChange = (nextCountry: string) => {
    setCountry(nextCountry);
    setState('');
    setMobileCountryCode(getDialCodeForCountry(nextCountry));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const registrationYear = new Date().getFullYear();
    const communityId = generateNextCommunityId(registrations, registrationYear);
    const id = `reg-${Date.now()}`;

    const registrationData: Registration = {
      id,
      communityId,
      fullName: fullName.trim(),
      fathersName: fathersName.trim(),
      mothersName: mothersName.trim() || undefined,
      gender,
      dobOrAge: dobOrAge.trim(),
      mobileNumber: mobileNumber.trim(),
      mobileCountryCode,
      email: email.trim() || undefined,
      gotra: gotra.trim() || undefined,
      education: education.trim(),
      occupation: occupation.trim(),
      country,
      state: state.trim(),
      district: district.trim(),
      city: city.trim(),
      village: village.trim() || undefined,
      relationship: registrationKind === 'self' ? 'Self' : (relationship as Registration['relationship']),
      registrationDate: new Date().toISOString().slice(0, 10),
      isVerified: mobileVerified,
      photoUrl,
    };

    await onRegisterSubmit(registrationData, password);

    const authSession: AuthSession = {
      mobileNumber: mobileNumber.trim(),
      mobileCountryCode,
      registrationId: id,
      loggedInAt: new Date().toISOString(),
    };

    setSession(authSession);
    onSessionCreated?.(authSession);

    setRegisteredData(registrationData);
  };

  const generatePngDownload = () => {
    if (!registeredData) return;
    setIsGenerating(true);
    void downloadIdCardPng(registeredData).finally(() => setIsGenerating(false));
  };

  const downloadPdfCard = () => {
    if (!registeredData) return;
    setIsGenerating(true);
    void downloadIdCardPdf(registeredData).finally(() => setIsGenerating(false));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-6">
      {!registeredData ? (
        registerStep === 'credentials' ? (
          <div className="max-w-md mx-auto space-y-4">
            <div className="text-center space-y-1.5">
              <h2 className="font-sans text-xl font-bold text-slate-900">{t.registerCredentialsTitle}</h2>
              <p className="text-xs text-slate-500">{t.registerCredentialsSub}</p>
            </div>
            <form onSubmit={handleCredentialsSubmit} className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm space-y-2.5">
              <MobileWithCountryCode
                dialCode={mobileCountryCode}
                onDialCodeChange={setMobileCountryCode}
                mobile={mobileNumber}
                onMobileChange={setMobileNumber}
                error={mobileError}
                language={language}
              />

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  {t.registerPasswordLabel}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setCredentialErrors((prev) => {
                      const next = { ...prev };
                      delete next.password;
                      return next;
                    });
                  }}
                  className={`w-full bg-slate-50 border rounded-xl px-3.5 py-2.5 text-xs ${
                    credentialErrors.password ? 'border-red-400' : 'border-slate-200'
                  }`}
                />
                {credentialErrors.password && (
                  <p className="text-[10px] text-red-500">{credentialErrors.password}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  {t.registerPasswordConfirmLabel}
                </label>
                <input
                  type="password"
                  value={passwordConfirm}
                  onChange={(e) => {
                    setPasswordConfirm(e.target.value);
                    setCredentialErrors((prev) => {
                      const next = { ...prev };
                      delete next.passwordConfirm;
                      return next;
                    });
                  }}
                  className={`w-full bg-slate-50 border rounded-xl px-3.5 py-2.5 text-xs ${
                    credentialErrors.passwordConfirm ? 'border-red-400' : 'border-slate-200'
                  }`}
                />
                {credentialErrors.passwordConfirm && (
                  <p className="text-[10px] text-red-500">{credentialErrors.passwordConfirm}</p>
                )}
              </div>

              {widgetMode && <Msg91CaptchaMount />}
              <button
                type="submit"
                disabled={isSendingOtp}
                className="w-full py-2.5 bg-primary text-white font-geist text-sm font-bold rounded-xl cursor-pointer disabled:opacity-50"
              >
                {isSendingOtp ? t.otpSending : t.registerContinueBtn}
              </button>
            </form>
            {onNavigateLogin && (
              <p className="text-center text-xs text-slate-500">
                {t.registerAlreadyRegistered}{' '}
                <button type="button" onClick={onNavigateLogin} className="text-primary font-bold cursor-pointer">{t.registerLoginBtn}</button>
              </p>
            )}
          </div>
        ) : registerStep === 'otp' ? (
          <OtpVerificationStep
            mobile={mobileNumber}
            dialCode={mobileCountryCode}
            otp={otp}
            onOtpChange={setOtp}
            onVerify={handleVerifyRegistrationOtp}
            onResend={handleResendRegistrationOtp}
            onBack={() => { setRegisterStep('credentials'); setOtp(''); setOtpReqId(undefined); setOtpError(''); }}
            onSkip={() => {
              setMobileVerified(false);
              setRegisterStep('form');
              setOtpFallbackNotice(t.registerOtpSkipNotice);
            }}
            skipLabel={t.otpNotReceivedPasswordBtn}
            error={otpError}
            isVerifying={isVerifyingOtp}
            isSending={isSendingOtp}
            resendCooldown={resendCooldown}
            demoMode={otpDemoMode && !widgetMode}
            title={t.verifyRegistrationTitle}
            language={language}
          />
        ) : (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-slate-200/80 rounded-3xl p-6 md:p-8 shadow-sm space-y-6"
        >
          {/* Header instructions */}
          <div className="border-b border-slate-100 pb-4 space-y-1">
            <div className="flex items-center gap-2 text-primary font-bold">
              <Award className="w-5 h-5 text-primary" />
              <h2 className="font-sans text-xl font-bold text-slate-900">
                {registrationKind === 'self' ? t.registerSelfTitle : t.registerFamilyTitle}
              </h2>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              {mobileVerified
                ? `Mobile ${formatDisplayMobile(mobileCountryCode, mobileNumber)} verified ✓ Complete your profile below.`
                : `${t.registerPasswordOnlyNotice} ${formatDisplayMobile(mobileCountryCode, mobileNumber)}`}
            </p>
            {otpFallbackNotice && (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                {otpFallbackNotice}
              </p>
            )}
          </div>

          <form onSubmit={handleFormSubmit} className="space-y-6">
            <RegistrationDetailsForm
              values={{
                fullName,
                fathersName,
                mothersName: mothersName || undefined,
                gender,
                dobOrAge,
                email: email || undefined,
                gotra: gotra || undefined,
                education,
                occupation,
                country,
                state,
                district,
                city,
                village: village || undefined,
                relationship: (registrationKind === 'self' ? 'Self' : relationship) as Registration['relationship'],
                photoUrl,
              }}
              onChange={updateFormField}
              errors={errors}
              t={t}
              mobileDisplay={formatDisplayMobile(mobileCountryCode, mobileNumber)}
              onCountryChange={handleCountryChange}
              showRelationshipField={registrationKind === 'family'}
              showOtpVerifiedBadge={mobileVerified}
            />

            {/* Checkbox consent */}
            <div className="flex items-start gap-2.5 pt-2">
              <input type="checkbox" id="consent" required className="mt-1 w-4 h-4 text-primary focus:ring-primary accent-primary cursor-pointer" />
              <label htmlFor="consent" className="text-slate-500 text-[11px] leading-normal cursor-pointer select-none">
                I hereby declare that all the information submitted above is true, and I consent to cataloging this data on the Global Namdev Community member directory. I understand this is for community count and statistics purposes.
              </label>
            </div>

            {/* Submit block */}
            <div className="pt-4">
              <button
                type="submit"
                className="w-full py-3 bg-primary text-white font-geist text-sm font-bold rounded-xl shadow-md hover:opacity-90 active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4 text-white" />
                Submit Registration
              </button>
            </div>

          </form>
        </motion.div>
        )
      ) : (
        /* SUCCESS PAGE & ID CARD */
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-10"
        >
          {/* Congrats banner */}
          <div className="text-center max-w-xl mx-auto space-y-3">
            <div className="w-16 h-16 bg-orange-50 text-primary border border-orange-200 rounded-full flex items-center justify-center mx-auto shadow-sm">
              <ShieldCheck className="w-8 h-8 stroke-2" />
            </div>
            <h2 className="font-sans text-2xl md:text-3xl font-bold text-slate-900">Registration Successful 🎉</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Thank you for registering with the Global Namdev Community. Your entry has been securely logged on our global member directory and verified.
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-50 border border-orange-200 text-primary text-sm font-bold">
              Total community members: {(registrations.length + 1).toLocaleString()}
            </div>
          </div>

          {/* Holographic ID Card Preview */}
          <div className="space-y-4">
            <p className="text-[10px] font-geist text-slate-400 uppercase tracking-widest text-center font-bold">Your Community ID</p>
            
            <div className="max-w-md mx-auto">
              <IdCardPreview member={registeredData} />
            </div>
            <button
              type="button"
              onClick={() => onNavigate('profile')}
              className="w-full max-w-md mx-auto block py-3 bg-slate-900 text-white font-geist text-xs font-bold rounded-xl cursor-pointer"
            >
              Edit My Profile →
            </button>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-3 max-w-md mx-auto">
            <button
              onClick={generatePngDownload}
              disabled={isGenerating}
              className="flex-1 py-3 bg-primary text-white font-geist text-xs font-bold rounded-xl shadow-md hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Download className="w-4 h-4 text-white" />
              {isGenerating ? 'Rendering Image...' : 'Download PNG Card'}
            </button>

            <button
              onClick={downloadPdfCard}
              disabled={isGenerating}
              className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-geist text-xs font-semibold rounded-xl shadow-sm hover:border-slate-300 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <FileText className="w-4 h-4 text-primary" />
              Download PDF
            </button>
          </div>

          <div className="border-t border-slate-100 pt-6 flex flex-col sm:flex-row justify-center gap-4 max-w-md mx-auto">
            <button
              onClick={() => {
                setRegisteredData(null);
                setRegistrationKind('family');
                setRegisterStep('credentials');
                setPassword('');
                setPasswordConfirm('');
                setOtpFallbackNotice('');
                setOtp('');
                setMobileVerified(false);
                setFullName('');
                setFathersName('');
                setMothersName('');
                setDobOrAge('');
                setMobileNumber('');
                setMobileCountryCode('+91');
                setEmail('');
                setGotra('');
                setEducation('');
                setOccupation('');
                setState('');
                setDistrict('');
                setCity('');
                setVillage('');
                setRelationship('');
              }}
              className="text-xs font-geist font-bold text-slate-500 hover:text-primary transition-all text-center cursor-pointer flex items-center justify-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              Register Another Family Member
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
