import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import BackButton from './BackButton';

interface PageLayoutProps {
  title: string;
  subtitle?: string;
  onBack: () => void;
  children: ReactNode;
}

export default function PageLayout({ title, subtitle, onBack, children }: PageLayoutProps) {
  const { t } = useTranslation();

  return (
    <div className="max-w-3xl mx-auto py-8 space-y-8">
      <BackButton onClick={onBack} label={t('pageBackHome')} />

      <div className="space-y-2">
        <h1 className="font-sans text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 leading-relaxed">{subtitle}</p>}
      </div>

      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 md:p-8 shadow-sm space-y-5 text-sm text-slate-600 leading-relaxed">
        {children}
      </div>
    </div>
  );
}
