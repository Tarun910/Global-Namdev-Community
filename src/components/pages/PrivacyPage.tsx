import { useTranslation } from 'react-i18next';
import PageLayout from '../PageLayout';

interface PrivacyPageProps {
  onBack: () => void;
}

export default function PrivacyPage({ onBack }: PrivacyPageProps) {
  const { t } = useTranslation();

  return (
    <PageLayout title={t('privacyTitle')} subtitle={t('privacySubtitle')} onBack={onBack}>
      <section className="space-y-3">
        <h2 className="font-sans text-base font-bold text-slate-900">{t('privacyCollectTitle')}</h2>
        <p>{t('privacyCollectBody')}</p>
      </section>

      <section className="space-y-3">
        <h2 className="font-sans text-base font-bold text-slate-900">{t('privacyUseTitle')}</h2>
        <p>{t('privacyUseBody')}</p>
      </section>

      <section className="space-y-3">
        <h2 className="font-sans text-base font-bold text-slate-900">{t('privacyStorageTitle')}</h2>
        <p>{t('privacyStorageBody')}</p>
      </section>

      <section className="space-y-3">
        <h2 className="font-sans text-base font-bold text-slate-900">{t('privacyRightsTitle')}</h2>
        <p>{t('privacyRightsBody')}</p>
      </section>

      <section className="space-y-3">
        <h2 className="font-sans text-base font-bold text-slate-900">{t('privacyContactTitle')}</h2>
        <p>{t('privacyContactBody')}</p>
      </section>
    </PageLayout>
  );
}
