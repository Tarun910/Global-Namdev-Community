import { useTranslation } from 'react-i18next';
import PageLayout from '../PageLayout';

interface CookiePageProps {
  onBack: () => void;
}

export default function CookiePage({ onBack }: CookiePageProps) {
  const { t } = useTranslation();

  return (
    <PageLayout title={t('cookieTitle')} subtitle={t('cookieSubtitle')} onBack={onBack}>
      <section className="space-y-3">
        <h2 className="font-sans text-base font-bold text-slate-900">{t('cookieLocalTitle')}</h2>
        <p>{t('cookieLocalBody')}</p>
      </section>

      <section className="space-y-3">
        <h2 className="font-sans text-base font-bold text-slate-900">{t('cookieThirdTitle')}</h2>
        <p>{t('cookieThirdBody')}</p>
      </section>

      <section className="space-y-3">
        <h2 className="font-sans text-base font-bold text-slate-900">{t('cookieManageTitle')}</h2>
        <p>{t('cookieManageBody')}</p>
      </section>
    </PageLayout>
  );
}
