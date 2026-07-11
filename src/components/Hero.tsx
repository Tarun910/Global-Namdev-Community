import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { ArrowRight, ShieldCheck, UserCheck, Users, LogIn } from 'lucide-react';
import { getTranslations } from '../lib/translations';
import { Language } from '../lib/languages';

interface HeroProps {
  onRegisterSelf: () => void;
  onRegisterFamily: () => void;
  onLogin: () => void;
  onExploreStatsClick: () => void;
  language: Language;
  totalRegistrations: number;
}

function StatCounter({ endValue, duration = 1200 }: { endValue: number; duration?: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number | null = null;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * endValue));
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        setCount(endValue);
      }
    };
    requestAnimationFrame(step);
  }, [endValue, duration]);

  return <span className="tabular-nums">{count.toLocaleString()}</span>;
}

export default function Hero({ 
  onRegisterSelf, 
  onRegisterFamily, 
  onLogin, 
  onExploreStatsClick,
  language,
  totalRegistrations,
}: HeroProps) {
  const t = getTranslations(language);

  return (
    <section className="relative flex flex-col justify-center overflow-hidden pt-2 pb-6 px-4 sm:px-6 bg-transparent min-h-[calc(100dvh-3.5rem-5rem)] md:min-h-[calc(100dvh-3.5rem-2rem)]">
      {/* Decorative background blur shapes */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-primary/10 blur-[80px] rounded-full pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary-container/10 blur-[100px] rounded-full pointer-events-none" />

      {/* Abstract Map Grid Lines background overlay */}
      <div className="absolute inset-0 opacity-[0.4] pointer-events-none select-none">
        <div className="w-full h-full bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:24px_24px]"></div>
      </div>

      <div className="relative z-10 max-w-5xl mx-auto text-center space-y-4 sm:space-y-5">
        {/* Floating Verified Indicator */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/95 border border-slate-200/80 select-none cursor-pointer shadow-sm shadow-slate-100"
          onClick={onExploreStatsClick}
        >
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          <span className="font-geist text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-700 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-primary" />
            {t.globalVerifiedNetwork}
          </span>
        </motion.div>

        {/* Brand Display Header */}
        <div className="space-y-2 sm:space-y-3">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="font-sans text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-slate-950 leading-tight"
          >
            {t.heroTitlePrefix}{' '}
            <span className="text-primary">Namdev</span>{' '}
            {t.heroTitleSuffix}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="font-sans text-[11px] sm:text-xs md:text-sm text-slate-600 max-w-2xl mx-auto leading-relaxed font-normal px-1"
          >
            {t.heroSub}
          </motion.p>
        </div>

        {/* Live total registrations — visible on first look */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="inline-flex flex-col items-center gap-1 px-6 py-3.5 rounded-2xl bg-white/95 border border-orange-100/80 shadow-sm"
        >
          <span className="font-sans text-3xl sm:text-4xl font-bold text-primary leading-none">
            <StatCounter endValue={totalRegistrations} />
          </span>
          <span className="font-geist text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-500">
            {t.totalRegistrations}
          </span>
        </motion.div>

        {/* Call to Actions (Interactive 3 Entry-Points) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="flex flex-col gap-3 max-w-3xl mx-auto pt-1 sm:pt-2"
        >
          <div className="flex flex-col items-stretch justify-center gap-2 w-full max-w-xs mx-auto">
            <button
              onClick={onRegisterSelf}
              className="w-full px-3 py-2.5 bg-primary text-white hover:bg-orange-600 rounded-xl font-geist text-[10px] sm:text-xs font-bold shadow-md hover:shadow-primary/20 transition-all active:scale-95 flex items-center justify-center gap-1 group cursor-pointer"
            >
              <UserCheck className="w-3.5 h-3.5 text-white shrink-0" />
              <span>{t.registerSelf}</span>
            </button>
            <button
              onClick={onRegisterFamily}
              className="w-full px-3 py-2.5 bg-white hover:bg-orange-50/50 border border-orange-200 text-slate-800 hover:text-primary rounded-xl font-geist text-[10px] sm:text-xs font-bold shadow-sm transition-all active:scale-95 flex items-center justify-center gap-1 cursor-pointer"
            >
              <Users className="w-3.5 h-3.5 text-primary shrink-0" />
              <span>{t.registerFamily}</span>
            </button>
            <button
              onClick={onLogin}
              className="w-full px-3 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-geist text-[10px] sm:text-xs font-bold shadow-md transition-all active:scale-95 flex items-center justify-center gap-1 cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5 text-orange-400 shrink-0" />
              <span>{t.login}</span>
            </button>
          </div>

          <div className="text-center">
            <button
              onClick={onExploreStatsClick}
              className="font-sans text-xs font-semibold text-slate-500 hover:text-primary transition-colors cursor-pointer inline-flex items-center gap-1 mt-1 group"
            >
              {t.exploreLiveStats}
              <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
        </motion.div>

        {/* Bottom micro-features row */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="pt-4 sm:pt-6 grid grid-cols-2 gap-3 max-w-sm mx-auto text-center"
        >
          <div className="space-y-0.5">
            <div className="font-sans text-base font-bold text-primary">100%</div>
            <div className="font-geist text-[9px] sm:text-[10px] uppercase tracking-wider text-slate-500">{t.verifiedMembers}</div>
          </div>
          <div className="space-y-0.5">
            <div className="font-sans text-base font-bold text-primary">Digital</div>
            <div className="font-geist text-[9px] sm:text-[10px] uppercase tracking-wider text-slate-500">{t.digitalIdCard}</div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
