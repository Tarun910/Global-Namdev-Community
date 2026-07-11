import { 
  Award, Download, Languages, ChevronDown, LogIn, UserCircle,
  LayoutDashboard, Table, Megaphone, UserSearch, UserCog,
} from 'lucide-react';
import { useState } from 'react';
import { INDIAN_LANGUAGES, Language } from '../lib/languages';
import { getTranslations } from '../lib/translations';
import { AdminSubTab } from '../lib/adminNav';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  unreadCount: number;
  language: Language;
  setLanguage: (lang: Language) => void;
  isLoggedIn?: boolean;
  memberName?: string;
  adminSubTab?: AdminSubTab;
  setAdminSubTab?: (tab: AdminSubTab) => void;
  isSuperAdmin?: boolean;
}

export default function Header({ 
  activeTab, 
  setActiveTab, 
  unreadCount,
  language,
  setLanguage,
  isLoggedIn = false,
  memberName,
  adminSubTab = 'kpis',
  setAdminSubTab,
  isSuperAdmin = false,
}: HeaderProps) {
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const t = getTranslations(language);
  const isAdminView = activeTab === 'admin';

  const goToAdminSection = (section: AdminSubTab) => {
    if (activeTab !== 'admin') {
      setActiveTab('admin');
    }
    setAdminSubTab?.(section);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-sm h-14">
      <div className="flex justify-between items-center h-full px-4 sm:px-6 max-w-7xl mx-auto">
        
        <div 
          onClick={() => {
            if (isAdminView) {
              setActiveTab('admin');
              setAdminSubTab?.('kpis');
            } else {
              setActiveTab('home');
            }
          }}
          className="flex items-center gap-1.5 cursor-pointer select-none group min-w-0 shrink"
        >
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-xs shadow-md group-hover:scale-105 transition-all shrink-0">
            G
          </div>
          <span className="font-sans text-[11px] sm:text-xs md:text-sm font-bold text-slate-900 tracking-tight group-hover:text-primary transition-colors leading-tight truncate">
            Namdev Global Community
          </span>
        </div>

        <nav className="hidden lg:flex items-center gap-7">
          {isAdminView ? (
            <>
              <button
                type="button"
                onClick={() => goToAdminSection('kpis')}
                className={`font-geist text-xs font-bold uppercase tracking-wider py-1.5 transition-colors cursor-pointer flex items-center gap-1 ${
                  adminSubTab === 'kpis' ? 'text-primary' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                {t.adminNavDashboard}
              </button>
              <button
                type="button"
                onClick={() => goToAdminSection('database')}
                className={`font-geist text-xs font-bold uppercase tracking-wider py-1.5 transition-colors cursor-pointer flex items-center gap-1 ${
                  adminSubTab === 'database' ? 'text-primary' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Table className="w-3.5 h-3.5" />
                {t.adminNavMembers}
              </button>
              <button
                type="button"
                onClick={() => goToAdminSection('bulletins')}
                className={`font-geist text-xs font-bold uppercase tracking-wider py-1.5 transition-colors cursor-pointer flex items-center gap-1 ${
                  adminSubTab === 'bulletins' ? 'text-primary' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Megaphone className="w-3.5 h-3.5" />
                {t.adminNavNotices}
              </button>
              <button
                type="button"
                onClick={() => goToAdminSection('verify')}
                className={`font-geist text-xs font-bold uppercase tracking-wider py-1.5 transition-colors cursor-pointer flex items-center gap-1 ${
                  adminSubTab === 'verify' ? 'text-primary' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <UserSearch className="w-3.5 h-3.5" />
                {t.adminNavVerify}
              </button>
              {isSuperAdmin && (
                <button
                  type="button"
                  onClick={() => goToAdminSection('admins')}
                  className={`font-geist text-xs font-bold uppercase tracking-wider py-1.5 transition-colors cursor-pointer flex items-center gap-1 ${
                    adminSubTab === 'admins' ? 'text-primary' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <UserCog className="w-3.5 h-3.5" />
                  Admins
                </button>
              )}
              <button
                type="button"
                onClick={() => setActiveTab('home')}
                className="font-geist text-xs font-bold uppercase tracking-wider py-1.5 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                {t.home}
              </button>
            </>
          ) : (
            <>
          <button
            onClick={() => setActiveTab('home')}
            className={`font-geist text-xs font-bold uppercase tracking-wider py-1.5 transition-colors cursor-pointer ${
              activeTab === 'home' ? 'text-primary' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {t.home}
          </button>
          <button
            onClick={() => setActiveTab('map')}
            className={`font-geist text-xs font-bold uppercase tracking-wider py-1.5 transition-colors cursor-pointer ${
              activeTab === 'map' ? 'text-primary' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {t.memberMap}
          </button>
          <button
            onClick={() => setActiveTab('forum')}
            className={`font-geist text-xs font-bold uppercase tracking-wider py-1.5 transition-colors cursor-pointer ${
              activeTab === 'forum' ? 'text-primary' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {t.discussions}
          </button>
          <button
            onClick={() => setActiveTab('updates')}
            className={`font-geist text-xs font-bold uppercase tracking-wider py-1.5 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'updates' ? 'text-primary' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {t.bulletins}
            {unreadCount > 0 && (
              <span className="bg-primary text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                {unreadCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('register')}
            className={`font-geist text-xs font-bold uppercase tracking-wider py-1.5 transition-colors cursor-pointer flex items-center gap-1 ${
              activeTab === 'register' ? 'text-primary' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            {t.register}
          </button>
          <button
            onClick={() => setActiveTab('download')}
            className={`font-geist text-xs font-bold uppercase tracking-wider py-1.5 transition-colors cursor-pointer flex items-center gap-1 ${
              activeTab === 'download' ? 'text-primary' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            {t.idCard}
          </button>
            </>
          )}
        </nav>

        <div className="flex items-center gap-2 relative">
          {isLoggedIn ? (
            <button
              onClick={() => setActiveTab('profile')}
              className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                activeTab === 'profile'
                  ? 'bg-orange-50 text-primary border border-orange-200'
                  : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-orange-50 hover:text-primary'
              }`}
            >
              <UserCircle className="w-4 h-4" />
              {memberName?.split(' ')[0] || 'Profile'}
            </button>
          ) : (
            <button
              onClick={() => setActiveTab('login')}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-orange-50 border border-slate-200 text-slate-700 hover:text-primary font-geist text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              Login
            </button>
          )}

          <div className="relative">
            <button
              onClick={() => setLangDropdownOpen(!langDropdownOpen)}
              className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 rounded-lg shadow-sm transition-all flex items-center gap-1 cursor-pointer"
              title={t.selectLanguage}
              aria-label={t.selectLanguage}
            >
              <Languages className="w-4 h-4 text-primary shrink-0" />
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${langDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {langDropdownOpen && (
              <>
                <div className="fixed inset-0 z-45" onClick={() => setLangDropdownOpen(false)} />
                <div className="absolute right-0 mt-2 w-44 bg-white border border-slate-200 rounded-2xl shadow-xl p-1.5 z-50 animate-in fade-in-50 slide-in-from-top-3 duration-200 space-y-0.5">
                  <div className="px-2.5 py-1 text-[9px] font-geist text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100 mb-1 sticky top-0 bg-white">
                    {t.selectLanguage}
                  </div>
                  {INDIAN_LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setLanguage(lang.code);
                        setLangDropdownOpen(false);
                      }}
                      className={`w-full text-left px-2.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer ${
                        language === lang.code 
                          ? 'bg-orange-50 text-primary' 
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span>{lang.nativeName}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
