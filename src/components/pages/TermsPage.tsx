import { useTranslation } from 'react-i18next';
import PageLayout from '../PageLayout';

interface TermsPageProps {
  onBack: () => void;
}

export default function TermsPage({ onBack }: TermsPageProps) {
  const { t } = useTranslation();

  return (
    <PageLayout title={t('termsTitle')} subtitle={t('termsSubtitle')} onBack={onBack}>
      <section className="space-y-3">
        <h2 className="font-sans text-base font-bold text-slate-900">{t('termsSec1Title')}</h2>
        <p>{t('termsSec1Body')}</p>
      </section>

      <section className="space-y-3">
        <h2 className="font-sans text-base font-bold text-slate-900">{t('termsSec2Title')}</h2>
        <p>{t('termsSec2Body')}</p>
      </section>

      <section className="space-y-3">
        <h2 className="font-sans text-base font-bold text-slate-900">{t('termsSec3Title')}</h2>
        <p>{t('termsSec3Body')}</p>
      </section>

      <section className="space-y-3">
        <h2 className="font-sans text-base font-bold text-slate-900">{t('termsSec4Title')}</h2>
        <p>{t('termsSec4Body')}</p>
      </section>

      <section className="space-y-3">
        <h2 className="font-sans text-base font-bold text-slate-900">{t('termsSec5Title')}</h2>
        <p>{t('termsSec5Body')}</p>
      </section>
    </PageLayout>
  );
}
