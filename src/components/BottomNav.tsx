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
      className={`relative flex flex-col items-center justify-center px-3 py-1.5 rounded-full transition-colors duration-200 cursor-pointer ${
        active ? 'text-primary font-bold' : 'text-slate-500 hover:bg-slate-50'
      }`}
    >
      {active && (
        <motion.span
          layoutId="bottom-nav-active"
          className="absolute inset-0 bg-orange-50 rounded-full -z-10"
          transition={{ type: 'spring', stiffness: 380, damping: 28 }}
        />
      )}
      <Icon className="w-5 h-5 mb-0.5" />
      <span className="font-geist text-[10px] font-semibold">{label}</span>
      {badge !== undefined && badge > 0 && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-1.5 right-3 bg-primary text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-white"
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
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200/60 shadow-[0_-4px_24px_rgba(15,23,42,0.04)] rounded-t-2xl h-20 md:hidden flex justify-around items-center px-4">
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
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200/60 shadow-[0_-4px_24px_rgba(15,23,42,0.04)] rounded-t-2xl h-20 md:hidden flex justify-around items-center px-4">
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
