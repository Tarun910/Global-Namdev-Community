import { Mail, MessageSquare, User, Github, Clock, Heart } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import PageLayout from '../PageLayout';

interface SupportPageProps {
  onBack: () => void;
}

export default function SupportPage({ onBack }: SupportPageProps) {
  const { t } = useTranslation();

  return (
    <PageLayout title={t('supportTitle')} subtitle={t('supportSubtitle')} onBack={onBack}>
      <p>{t('supportIntro')}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            <User className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-[10px] font-geist font-bold uppercase tracking-wider text-slate-400">
              {t('supportDevLabel')}
            </p>
            <h3 className="font-sans text-base font-bold text-slate-900">{t('supportTeamName')}</h3>
            <p className="text-xs text-slate-500 mt-1">{t('supportTeamDesc')}</p>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center">
            <Mail className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <p className="text-[10px] font-geist font-bold uppercase tracking-wider text-slate-400">
              {t('supportEmailLabel')}
            </p>
            <a
              href="mailto:support@globalnamdevcommunity.org?subject=GNC%20Suggestion%20or%20Feedback"
              className="font-sans text-sm font-bold text-primary hover:underline"
            >
              support@globalnamdevcommunity.org
            </a>
            <p className="text-xs text-slate-500 mt-1">{t('supportEmailDesc')}</p>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center">
            <MessageSquare className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-[10px] font-geist font-bold uppercase tracking-wider text-slate-400">
              {t('supportWhatLabel')}
            </p>
            <ul className="text-xs text-slate-600 space-y-1 mt-1 list-disc pl-4">
              <li>{t('supportWhatItem1')}</li>
              <li>{t('supportWhatItem2')}</li>
              <li>{t('supportWhatItem3')}</li>
              <li>{t('supportWhatItem4')}</li>
            </ul>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center">
            <Clock className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <p className="text-[10px] font-geist font-bold uppercase tracking-wider text-slate-400">
              {t('supportResponseLabel')}
            </p>
            <p className="font-sans text-sm font-bold text-slate-900">{t('supportResponseTime')}</p>
            <p className="text-xs text-slate-500 mt-1">{t('supportResponseNote')}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <a
          href="mailto:support@globalnamdevcommunity.org?subject=GNC%20Suggestion"
          className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-primary text-white text-xs font-bold rounded-xl shadow-md hover:bg-orange-600 transition-colors"
        >
          <Mail className="w-4 h-4" />
          {t('supportSendBtn')}
        </a>
        <a
          href="https://github.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50 transition-colors"
        >
          <Github className="w-4 h-4" />
          {t('supportGithubBtn')}
        </a>
      </div>

      <div className="flex items-center gap-2 text-xs text-slate-500 pt-2 border-t border-slate-100">
        <Heart className="w-4 h-4 text-primary" />
        {t('supportFooter')}
      </div>
    </PageLayout>
  );
}
