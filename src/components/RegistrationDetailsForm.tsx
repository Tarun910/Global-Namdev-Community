import {
  User, BookOpen, Briefcase, MapPin, Phone, Mail,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Registration } from '../types';
import { TranslationStrings } from '../lib/translations';
import { COUNTRY_NAMES } from '../lib/countries';
import { getStatesForCountryAsync } from '../lib/regions';
import MemberPhotoUpload from './MemberPhotoUpload';

export type RegistrationFormValues = Pick<
  Registration,
  | 'fullName'
  | 'fathersName'
  | 'mothersName'
  | 'gender'
  | 'dobOrAge'
  | 'email'
  | 'gotra'
  | 'education'
  | 'occupation'
  | 'country'
  | 'state'
  | 'district'
  | 'city'
  | 'village'
  | 'relationship'
  | 'photoUrl'
>;

interface RegistrationDetailsFormProps {
  values: RegistrationFormValues;
  onChange: <K extends keyof RegistrationFormValues>(
    key: K,
    value: RegistrationFormValues[K]
  ) => void;
  errors: Record<string, string>;
  t: TranslationStrings;
  mobileDisplay: string;
  communityId?: string;
  onCountryChange?: (country: string) => void;
}

const inputClass = (hasError: boolean) =>
  `w-full bg-white border ${
    hasError ? 'border-red-400 focus:ring-red-300' : 'border-slate-200 focus:ring-primary'
  } rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1`;

export default function RegistrationDetailsForm({
  values,
  onChange,
  errors,
  t,
  mobileDisplay,
  communityId,
  onCountryChange,
}: RegistrationDetailsFormProps) {
  const [stateOptions, setStateOptions] = useState<string[]>([]);
  const [statesLoading, setStatesLoading] = useState(false);
  const showStateDropdown = stateOptions.length > 0;

  useEffect(() => {
    let cancelled = false;
    setStatesLoading(true);

    void getStatesForCountryAsync(values.country).then((states) => {
      if (!cancelled) {
        setStateOptions(states);
        setStatesLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [values.country]);

  return (
    <div className="space-y-6">
      {communityId && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pb-2 border-b border-slate-100">
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
              {t.formCommunityId}
            </label>
            <input
              type="text"
              value={communityId}
              readOnly
              className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-600 cursor-not-allowed font-geist"
            />
          </div>
        </div>
      )}

      <div className="space-y-4">
        <h3 className="font-sans text-xs font-bold text-primary uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
          <User className="w-3.5 h-3.5" />
          {t.formSectionPersonal}
        </h3>

        <MemberPhotoUpload
          value={values.photoUrl}
          onChange={(photoUrl) => onChange('photoUrl', photoUrl)}
          error={errors.photoUrl}
          label={t.formPhotoLabel}
          hint={t.formPhotoHint}
          takePhotoLabel={t.formPhotoTake}
          uploadPhotoLabel={t.formPhotoUpload}
          removePhotoLabel={t.formPhotoRemove}
          adjustPhotoLabel={t.formPhotoAdjust}
          cameraTitle={t.formPhotoTake}
          cameraCaptureLabel={t.formPhotoCapture}
          adjustTitle={t.formPhotoAdjustTitle}
          adjustHint={t.formPhotoAdjustHint}
          savePhotoLabel={t.formPhotoSave}
          cancelLabel={t.formPhotoCancel}
          cameraFallbackHint={t.formPhotoCameraHint}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">{t.formFullName} *</label>
            <input
              type="text"
              value={values.fullName}
              onChange={(e) => onChange('fullName', e.target.value)}
              placeholder={t.formPhFullName}
              className={inputClass(Boolean(errors.fullName))}
            />
            {errors.fullName && <p className="text-[10px] text-red-500 font-medium">{errors.fullName}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">{t.formFathersName} *</label>
            <input
              type="text"
              value={values.fathersName}
              onChange={(e) => onChange('fathersName', e.target.value)}
              placeholder={t.formPhFathersName}
              className={inputClass(Boolean(errors.fathersName))}
            />
            {errors.fathersName && <p className="text-[10px] text-red-500 font-medium">{errors.fathersName}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">{t.formMothersName}</label>
            <input
              type="text"
              value={values.mothersName ?? ''}
              onChange={(e) => onChange('mothersName', e.target.value || undefined)}
              placeholder={t.formPhMothersName}
              className={inputClass(Boolean(errors.mothersName))}
            />
            {errors.mothersName && <p className="text-[10px] text-red-500 font-medium">{errors.mothersName}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">{t.formGender} *</label>
            <select
              value={values.gender}
              onChange={(e) => onChange('gender', e.target.value as Registration['gender'])}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
            >
              <option value="Male">{t.genderMale}</option>
              <option value="Female">{t.genderFemale}</option>
              <option value="Other">{t.genderOther}</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">{t.formDobAge} *</label>
            <input
              type="text"
              value={values.dobOrAge}
              onChange={(e) => onChange('dobOrAge', e.target.value)}
              placeholder={t.formPhDobAge}
              className={inputClass(Boolean(errors.dobOrAge))}
            />
            {errors.dobOrAge && <p className="text-[10px] text-red-500 font-medium">{errors.dobOrAge}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">{t.formRelationship}</label>
            <select
              value={values.relationship}
              onChange={(e) => onChange('relationship', e.target.value as Registration['relationship'])}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
            >
              <option value="Self">{t.formRelSelf}</option>
              <option value="Father">{t.formRelFather}</option>
              <option value="Mother">{t.formRelMother}</option>
              <option value="Brother">{t.formRelBrother}</option>
              <option value="Sister">{t.formRelSister}</option>
              <option value="Son">{t.formRelSon}</option>
              <option value="Daughter">{t.formRelDaughter}</option>
              <option value="Grandfather">{t.formRelGrandfather}</option>
              <option value="Grandmother">{t.formRelGrandmother}</option>
              <option value="Other">{t.formRelOther}</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">{t.formMobileNumber}</label>
            <div className="relative">
              <Phone className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="tel"
                value={mobileDisplay}
                readOnly
                className="w-full bg-slate-100 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-600 cursor-not-allowed"
              />
            </div>
            <p className="text-[10px] text-emerald-600 font-medium">{t.formVerifiedOtp}</p>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">{t.formEmailOptional}</label>
            <div className="relative">
              <Mail className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                value={values.email ?? ''}
                onChange={(e) => onChange('email', e.target.value || undefined)}
                placeholder={t.formPhEmail}
                className={`${inputClass(Boolean(errors.email))} pl-9`}
              />
            </div>
            {errors.email && <p className="text-[10px] text-red-500 font-medium">{errors.email}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">{t.formGotraOptional}</label>
            <input
              type="text"
              value={values.gotra ?? ''}
              onChange={(e) => onChange('gotra', e.target.value || undefined)}
              placeholder={t.formPhGotra}
              className={inputClass(Boolean(errors.gotra))}
            />
            {errors.gotra && <p className="text-[10px] text-red-500 font-medium">{errors.gotra}</p>}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-sans text-xs font-bold text-primary uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
          <BookOpen className="w-3.5 h-3.5" />
          {t.formSectionAcademic}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">{t.formEducation} *</label>
            <div className="relative">
              <BookOpen className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={values.education}
                onChange={(e) => onChange('education', e.target.value)}
                placeholder={t.formPhEducation}
                className={`${inputClass(Boolean(errors.education))} pl-9`}
              />
            </div>
            {errors.education && <p className="text-[10px] text-red-500 font-medium">{errors.education}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">{t.formOccupationLabel} *</label>
            <div className="relative">
              <Briefcase className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={values.occupation}
                onChange={(e) => onChange('occupation', e.target.value)}
                placeholder={t.formPhOccupation}
                className={`${inputClass(Boolean(errors.occupation))} pl-9`}
              />
            </div>
            {errors.occupation && <p className="text-[10px] text-red-500 font-medium">{errors.occupation}</p>}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-sans text-xs font-bold text-primary uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
          <MapPin className="w-3.5 h-3.5" />
          {t.formSectionGeo}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-1.5 min-w-0">
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">{t.formCountryLabel} *</label>
            <select
              value={values.country}
              onChange={(e) => {
                onChange('country', e.target.value);
                onChange('state', '');
                onCountryChange?.(e.target.value);
              }}
              className={inputClass(Boolean(errors.country))}
            >
              {COUNTRY_NAMES.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
            {errors.country && <p className="text-[10px] text-red-500 font-medium">{errors.country}</p>}
          </div>

          <div className="space-y-1.5 min-w-0">
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">{t.formState} *</label>
            {showStateDropdown ? (
              <select
                value={values.state}
                onChange={(e) => onChange('state', e.target.value)}
                disabled={statesLoading}
                className={inputClass(Boolean(errors.state))}
              >
                <option value="">{statesLoading ? 'Loading states…' : 'Select state'}</option>
                {stateOptions.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={values.state}
                onChange={(e) => onChange('state', e.target.value)}
                placeholder={t.formPhState}
                className={inputClass(Boolean(errors.state))}
              />
            )}
            {errors.state && <p className="text-[10px] text-red-500 font-medium">{errors.state}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">{t.formDistrict} *</label>
            <input
              type="text"
              value={values.district}
              onChange={(e) => onChange('district', e.target.value)}
              placeholder={t.formPhCity}
              className={inputClass(Boolean(errors.district))}
            />
            {errors.district && <p className="text-[10px] text-red-500 font-medium">{errors.district}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">{t.formCity} *</label>
            <input
              type="text"
              value={values.city}
              onChange={(e) => onChange('city', e.target.value)}
              placeholder={t.formPhCity}
              className={inputClass(Boolean(errors.city))}
            />
            {errors.city && <p className="text-[10px] text-red-500 font-medium">{errors.city}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">{t.formVillageOptional}</label>
            <input
              type="text"
              value={values.village ?? ''}
              onChange={(e) => onChange('village', e.target.value || undefined)}
              placeholder={t.formPhVillage}
              className={inputClass(Boolean(errors.village))}
            />
            {errors.village && <p className="text-[10px] text-red-500 font-medium">{errors.village}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
