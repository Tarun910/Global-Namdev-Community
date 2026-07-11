import { Home, Globe, Bell, Download, LayoutDashboard, Users, Megaphone, UserSearch, UserCog } from 'lucide-react';
import { Language } from '../lib/languages';
import { getTranslations } from '../lib/translations';
import { AdminSubTab } from '../lib/adminNav';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  unreadCount: number;
  language: Language;
  adminSubTab?: AdminSubTab;
  setAdminSubTab?: (tab: AdminSubTab) => void;
  isSuperAdmin?: boolean;
}

export default function BottomNav({
  activeTab,
  setActiveTab,
  unreadCount,
  language,
  adminSubTab = 'kpis',
  setAdminSubTab,
  isSuperAdmin = false,
}: BottomNavProps) {
  const t = getTranslations(language);
  const isAdminView = activeTab === 'admin';

  const goToAdminSection = (section: AdminSubTab) => {
    if (activeTab !== 'admin') {
      setActiveTab('admin');
    }
    setAdminSubTab?.(section);
  };

  if (isAdminView) {
    const adminItems: { section: AdminSubTab; label: string; Icon: typeof LayoutDashboard }[] = [
      { section: 'kpis', label: t.adminNavDashboard, Icon: LayoutDashboard },
      { section: 'database', label: t.adminNavMembers, Icon: Users },
      { section: 'bulletins', label: t.adminNavNotices, Icon: Megaphone },
      { section: 'verify', label: t.adminNavVerify, Icon: UserSearch },
      ...(isSuperAdmin ? [{ section: 'admins' as AdminSubTab, label: 'Admins', Icon: UserCog }] : []),
    ];

    return (
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200/60 shadow-[0_-4px_24px_rgba(15,23,42,0.04)] rounded-t-2xl h-20 md:hidden flex justify-around items-center px-4">
        {adminItems.map(({ section, label, Icon }) => (
          <button
            key={section}
            type="button"
            onClick={() => goToAdminSection(section)}
            className={`flex flex-col items-center justify-center px-3 py-1.5 rounded-full transition-all duration-200 cursor-pointer ${
              adminSubTab === section ? 'text-primary font-bold' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <Icon className="w-5 h-5 mb-0.5" />
            <span className="font-geist text-[10px] font-semibold">{label}</span>
          </button>
        ))}
      </nav>
    );
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200/60 shadow-[0_-4px_24px_rgba(15,23,42,0.04)] rounded-t-2xl h-20 md:hidden flex justify-around items-center px-4">
      <button
        onClick={() => setActiveTab('home')}
        className={`flex flex-col items-center justify-center px-3 py-1.5 rounded-full transition-all duration-200 cursor-pointer ${
          activeTab === 'home' ? 'text-primary font-bold' : 'text-slate-500 hover:bg-slate-50'
        }`}
      >
        <Home className="w-5 h-5 mb-0.5" />
        <span className="font-geist text-[10px] font-semibold">{t.home}</span>
      </button>

      <button
        onClick={() => setActiveTab('map')}
        className={`flex flex-col items-center justify-center px-3 py-1.5 rounded-full transition-all duration-200 cursor-pointer ${
          activeTab === 'map' ? 'text-primary font-bold' : 'text-slate-500 hover:bg-slate-50'
        }`}
      >
        <Globe className="w-5 h-5 mb-0.5" />
        <span className="font-geist text-[10px] font-semibold">{t.memberMap}</span>
      </button>

      <button
        onClick={() => setActiveTab('updates')}
        className={`flex flex-col items-center justify-center px-3 py-1.5 rounded-full transition-all duration-200 relative cursor-pointer ${
          activeTab === 'updates' ? 'text-primary font-bold' : 'text-slate-500 hover:bg-slate-50'
        }`}
      >
        <Bell className="w-5 h-5 mb-0.5" />
        <span className="font-geist text-[10px] font-semibold">{t.bulletins}</span>
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-3 bg-primary text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-white">
            {unreadCount}
          </span>
        )}
      </button>

      <button
        onClick={() => setActiveTab('download')}
        className={`flex flex-col items-center justify-center px-3 py-1.5 rounded-full transition-all duration-200 cursor-pointer ${
          activeTab === 'download' ? 'text-primary font-bold' : 'text-slate-500 hover:bg-slate-50'
        }`}
      >
        <Download className="w-5 h-5 mb-0.5" />
        <span className="font-geist text-[10px] font-semibold">{t.idCard}</span>
      </button>
    </nav>
  );
}
