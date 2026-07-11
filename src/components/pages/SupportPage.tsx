import { Mail, MessageSquare, User, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  SUPPORT_EMAIL,
  SUPPORT_MAILTO_FEEDBACK,
  SUPPORT_MAILTO_SUGGESTION,
} from '../../lib/contact';
import WhatsAppChannelLink from '../WhatsAppChannelLink';
import PageLayout from '../PageLayout';

interface SupportPageProps {
  onBack: () => void;
}

export default function SupportPage({ onBack }: SupportPageProps) {
  const { t } = useTranslation();

  return (
    <PageLayout title={t('supportTitle')} subtitle={t('supportSubtitle')} onBack={onBack}>
      <p>{t('supportIntro')}</p>

      <WhatsAppChannelLink
        title={t('whatsappChannelTitle')}
        description={t('whatsappChannelDesc')}
        ctaLabel={t('whatsappChannelCta')}
      />

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

        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-3 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center">
            <Mail className="w-6 h-6 text-emerald-600" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-geist font-bold uppercase tracking-wider text-slate-400">
              {t('supportEmailLabel')}
            </p>
            <a
              href={SUPPORT_MAILTO_FEEDBACK}
              className="font-sans text-[11px] sm:text-xs font-bold text-primary hover:underline break-all leading-snug block mt-0.5"
            >
              {SUPPORT_EMAIL}
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

      <div className="pt-2">
        <a
          href={SUPPORT_MAILTO_SUGGESTION}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-primary text-white text-xs font-bold rounded-xl shadow-md hover:bg-orange-600 transition-colors"
        >
          <Mail className="w-4 h-4" />
          {t('supportSendBtn')}
        </a>
      </div>
    </PageLayout>
  );
}
