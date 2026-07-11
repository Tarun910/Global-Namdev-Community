import { useTranslation } from 'react-i18next';
import PageLayout from '../PageLayout';

interface GuidelinesPageProps {
  onBack: () => void;
}

export default function GuidelinesPage({ onBack }: GuidelinesPageProps) {
  const { t } = useTranslation();

  return (
    <PageLayout title={t('guidelinesTitle')} subtitle={t('guidelinesSubtitle')} onBack={onBack}>
      <section className="space-y-3">
        <h2 className="font-sans text-base font-bold text-slate-900">{t('guidelinesRespectTitle')}</h2>
        <p>{t('guidelinesRespectBody')}</p>
      </section>

      <section className="space-y-3">
        <h2 className="font-sans text-base font-bold text-slate-900">{t('guidelinesAccurateTitle')}</h2>
        <p>{t('guidelinesAccurateBody')}</p>
      </section>

      <section className="space-y-3">
        <h2 className="font-sans text-base font-bold text-slate-900">{t('guidelinesPrivacyTitle')}</h2>
        <p>{t('guidelinesPrivacyBody')}</p>
      </section>

      <section className="space-y-3">
        <h2 className="font-sans text-base font-bold text-slate-900">{t('guidelinesReportTitle')}</h2>
        <p>{t('guidelinesReportBody')}</p>
      </section>
    </PageLayout>
  );
}
