import { motion } from 'motion/react';
import { Calendar, CheckCircle2 } from 'lucide-react';
import { CommunityUpdate } from '../../types';
import { Language } from '../../lib/languages';
import { getTranslations } from '../../lib/translations';
import BackButton from '../BackButton';
import BulletinCategoryBadge from '../BulletinCategoryBadge';
import BulletinArticleBody from '../BulletinArticleBody';

interface BulletinDetailPageProps {
  update: CommunityUpdate | null;
  language: Language;
  onBack: () => void;
}

export default function BulletinDetailPage({ update, language, onBack }: BulletinDetailPageProps) {
  const t = getTranslations(language);

  if (!update) {
    return (
      <div className="max-w-3xl mx-auto py-12 text-center space-y-4">
        <BackButton onClick={onBack} label={t.updatesBackToBoard} />
        <div className="py-16 bg-slate-50 rounded-3xl border border-dashed border-slate-200 px-6">
          <h2 className="font-sans text-lg font-bold text-slate-900">{t.updatesNotFound}</h2>
          <p className="text-xs text-slate-500 mt-2">{t.updatesNotFoundSub}</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="max-w-3xl mx-auto py-6 space-y-5"
    >
      <BackButton onClick={onBack} label={t.updatesBackToBoard} />

      <article className="bg-white border border-slate-200/80 rounded-3xl shadow-sm overflow-hidden">
        {update.imageUrl && (
          <div className="w-full bg-slate-50 border-b border-slate-100 flex items-center justify-center p-4 md:p-6">
            <img
              src={update.imageUrl}
              alt=""
              className="w-full max-h-[min(70vh,520px)] h-auto object-contain rounded-lg"
            />
          </div>
        )}

        <div className="px-6 md:px-10 pt-7 md:pt-9 pb-8 md:pb-10">
          <header className="space-y-4 pb-6 border-b border-slate-100">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-orange-50 border border-orange-100 text-slate-700 text-[10px] font-bold rounded-full tracking-wide">
                <BulletinCategoryBadge category={update.category} language={language} />
              </span>
              <span className="inline-flex items-center gap-1 text-emerald-600 font-geist text-[10px] font-bold bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-full">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {t.updatesVerifiedCircular}
              </span>
            </div>

            <h1 className="font-sans text-2xl md:text-[2rem] font-bold text-slate-950 leading-tight tracking-tight">
              {update.title}
            </h1>

            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>{t.updatesPublishedOn} {update.time}</span>
            </div>
          </header>

          <div className="pt-7 md:pt-8">
            <BulletinArticleBody message={update.message} />
          </div>
        </div>
      </article>
    </motion.div>
  );
}
