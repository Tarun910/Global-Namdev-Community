import { motion } from 'motion/react';
import type { FC } from 'react';
import { Home, Globe, Bell, Download, LayoutDashboard, Users, Megaphone, UserSearch, UserCog } from 'lucide-react';
import { Language } from '../lib/languages';
import { getTranslations } from '../lib/translations';
import { AdminSubTab } from '../lib/adminNav';
import { tapScale } from '../lib/motionPresets';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  unreadCount: number;
  language: Language;
  adminSubTab?: AdminSubTab;
  setAdminSubTab?: (tab: AdminSubTab) => void;
  isSuperAdmin?: boolean;
}

const NavButton: FC<{
  active: boolean;
  onClick: () => void;
  label: string;
  Icon: typeof Home;
  badge?: number;
}> = ({ active, onClick, label, Icon, badge }) => {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      {...tapScale}
      className="relative flex flex-col items-center justify-center px-2 py-1 rounded-lg transition-colors duration-200 cursor-pointer text-slate-500 hover:text-slate-700"
    >
      <Icon className={`w-[18px] h-[18px] mb-0.5 ${active ? 'text-primary' : 'text-slate-500'}`} />
      <span className="font-geist text-[9px] font-medium text-slate-500 leading-none">{label}</span>
      {badge !== undefined && badge > 0 && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-0.5 right-1.5 bg-primary text-white text-[8px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center border border-white"
        >
          {badge}
        </motion.span>
      )}
    </motion.button>
  );
};

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
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200/60 h-14 md:hidden flex justify-around items-center px-2 pb-[env(safe-area-inset-bottom)]">
        {adminItems.map(({ section, label, Icon }) => (
          <NavButton
            key={section}
            active={adminSubTab === section}
            onClick={() => goToAdminSection(section)}
            label={label}
            Icon={Icon}
          />
        ))}
      </nav>
    );
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200/60 h-14 md:hidden flex justify-around items-center px-2 pb-[env(safe-area-inset-bottom)]">
      <NavButton active={activeTab === 'home'} onClick={() => setActiveTab('home')} label={t.home} Icon={Home} />
      <NavButton active={activeTab === 'map'} onClick={() => setActiveTab('map')} label={t.memberMap} Icon={Globe} />
      <NavButton
        active={activeTab === 'updates'}
        onClick={() => setActiveTab('updates')}
        label={t.bulletins}
        Icon={Bell}
        badge={unreadCount}
      />
      <NavButton
        active={activeTab === 'download'}
        onClick={() => setActiveTab('download')}
        label={t.idCard}
        Icon={Download}
      />
    </nav>
  );
}
