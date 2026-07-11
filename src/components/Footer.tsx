import { ReactNode } from 'react';
import { motion } from 'motion/react';
import { ShieldCheck } from 'lucide-react';
import { Language } from '../lib/languages';
import { getTranslations } from '../lib/translations';
import { tabToPath, AppRoute } from '../lib/routes';
import { SUPPORT_EMAIL, ANJANEYAX_COMPANY_NAME, ANJANEYAX_WEBSITE_URL } from '../lib/contact';
import Logo from './Logo';
import { fadeInUp } from '../lib/motionPresets';

interface FooterProps {
  navigate: (tab: string) => void;
  language: Language;
}

function FooterLink({
  tab,
  navigate,
  children,
}: {
  tab: AppRoute;
  navigate: (tab: string) => void;
  children: ReactNode;
}) {
  const linkClass =
    'text-xs text-slate-500 hover:text-primary transition-colors cursor-pointer text-left block w-fit';

  return (
    <a
      href={tabToPath(tab)}
      onClick={(e) => {
        e.preventDefault();
        navigate(tab);
      }}
      className={linkClass}
    >
      {children}
    </a>
  );
}

export default function Footer({ navigate, language }: FooterProps) {
  const t = getTranslations(language);

  return (
    <motion.footer {...fadeInUp} className="w-full py-16 bg-slate-50 border-t border-slate-200/60 mt-16 text-slate-800">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 px-6 max-w-7xl mx-auto">
        <div className="space-y-4">
          <Logo size="md" textClassName="text-primary" />
          <p className="text-slate-600 text-xs leading-relaxed max-w-xs">{t.heroSub}</p>
        </div>

        <div className="space-y-3">
          <p className="font-geist text-xs font-bold text-primary uppercase tracking-widest">
            {t.footerLegal}
          </p>
          <ul className="space-y-2">
            <li>
              <FooterLink tab="terms" navigate={navigate}>
                {t.termsOfService}
              </FooterLink>
            </li>
            <li>
              <FooterLink tab="privacy" navigate={navigate}>
                {t.privacyPolicy}
              </FooterLink>
            </li>
            <li>
              <FooterLink tab="cookies" navigate={navigate}>
                {t.cookiePolicy}
              </FooterLink>
            </li>
            <li>
              <FooterLink tab="guidelines" navigate={navigate}>
                {t.communityGuidelines}
              </FooterLink>
            </li>
          </ul>
        </div>

        <div className="space-y-3">
          <p className="font-geist text-xs font-bold text-primary uppercase tracking-widest">
            {t.footerSupport}
          </p>
          <ul className="space-y-2">
            <li>
              <FooterLink tab="support" navigate={navigate}>
                {t.supportPage}
              </FooterLink>
            </li>
            <li>
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="text-xs text-slate-500 hover:text-primary transition-colors cursor-pointer text-left block w-fit break-all max-w-full"
              >
                {SUPPORT_EMAIL}
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-12 pt-8 border-t border-slate-200/60 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="text-slate-500 text-xs leading-relaxed">
          <p>{t.footerCopyright}</p>
          <p>
            {t.footerRightsReserved}{' '}
            <a
              href={ANJANEYAX_WEBSITE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-2"
            >
              {ANJANEYAX_COMPANY_NAME}
            </a>
          </p>
        </div>
        <div className="inline-flex items-center gap-1 bg-slate-100 px-3 py-1 rounded-full border border-slate-200/60 w-fit">
          <ShieldCheck className="w-3.5 h-3.5 text-primary" />
          <span className="font-geist text-[10px] font-bold text-slate-700">Community Shield Active</span>
        </div>
      </div>
    </motion.footer>
  );
}
