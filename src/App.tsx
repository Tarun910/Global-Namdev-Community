import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';

import Header from './components/Header';
import BottomNav from './components/BottomNav';
import Hero from './components/Hero';
import Stats from './components/Stats';
import Forum from './components/Forum';
import UpdatesTab from './components/UpdatesTab';
import BulletinDetailPage from './components/pages/BulletinDetailPage';
import RegisterTab from './components/RegisterTab';
import MapTab from './components/MapTab';
import DownloadTab from './components/DownloadTab';
import AdminTab from './components/AdminTab';
import LoginTab from './components/LoginTab';
import ProfileTab from './components/ProfileTab';
import Footer from './components/Footer';

import TermsPage from './components/pages/TermsPage';
import PrivacyPage from './components/pages/PrivacyPage';
import CookiePage from './components/pages/CookiePage';
import GuidelinesPage from './components/pages/GuidelinesPage';
import SupportPage from './components/pages/SupportPage';

import { Language } from './lib/languages';
import { useCommunityData } from './hooks/useCommunityData';
import { getSession, clearSession, AuthSession } from './lib/demoAuth';
import { getTranslations } from './lib/translations';
import { changeAppLanguage, getStoredLanguage } from './lib/i18n';
import { pathToTab, navigateToTab, parseBulletinId, bulletinPath } from './lib/routes';
import { computeMemberDashboardStats } from './lib/memberGeoStats';
import { AdminSubTab } from './lib/adminNav';
import { AdminSession, getAdminSession } from './lib/adminAuth';
import { scaleIn, tapScale } from './lib/motionPresets';

function getTransitionKey(tab: string, bulletinId: string | null): string {
  if (tab === 'login' || tab === 'profile') return 'auth';
  if (tab === 'updates' && bulletinId) return `updates-${bulletinId}`;
  return tab;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<string>(() => pathToTab(window.location.pathname));
  const [bulletinId, setBulletinId] = useState<string | null>(() => parseBulletinId(window.location.pathname));
  const [language, setLanguage] = useState<Language>(() => getStoredLanguage() ?? 'hi');
  const [adminSubTab, setAdminSubTab] = useState<AdminSubTab>('kpis');
  const [adminSession, setAdminSession] = useState<AdminSession | null>(() => getAdminSession());
  const t = getTranslations(language);

  useEffect(() => {
    void changeAppLanguage(language);
  }, [language]);

  const navigate = useCallback((tab: string) => {
    setActiveTab(tab);
    setBulletinId(null);
    navigateToTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const {
    registrations,
    updates,
    discussions,
    loading: dataLoading,
    error: dataError,
    usingSupabase,
    handlePublishUpdate,
    handleDeleteUpdate,
    handleUpdateUpdate,
    handleMarkRead,
    handleMarkAllUpdatesRead,
    handleRegisterSubmit,
    handleDeleteRegistration,
    handleUpdateRegistration,
    handleAddDiscussion,
    handleAddComment,
    handleLikeDiscussion,
    refreshData,
  } = useCommunityData();

  const openBulletin = useCallback((id: string) => {
    setActiveTab('updates');
    setBulletinId(id);
    const path = bulletinPath(id);
    if (window.location.pathname !== path) {
      window.history.pushState({ tab: 'updates', bulletinId: id }, '', path);
    }
    handleMarkRead(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [handleMarkRead]);

  const closeBulletin = useCallback(() => {
    setBulletinId(null);
    setActiveTab('updates');
    navigateToTab('updates');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    const syncSession = () => setSession(getSession());
    syncSession();
    window.addEventListener('storage', syncSession);
    window.addEventListener('focus', syncSession);
    return () => {
      window.removeEventListener('storage', syncSession);
      window.removeEventListener('focus', syncSession);
    };
  }, []);

  useEffect(() => {
    const onPopState = () => {
      const pathname = window.location.pathname;
      setActiveTab(pathToTab(pathname));
      setBulletinId(parseBulletinId(pathname));
      setSession(getSession());
      setAdminSession(getAdminSession());
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const [session, setSession] = useState<AuthSession | null>(() => getSession());

  const handleLoginSuccess = useCallback((authSession: AuthSession) => {
    setSession(authSession);
    setActiveTab('profile');
    navigateToTab('profile', true);
    window.scrollTo(0, 0);
  }, []);

  const loggedInMember = session
    ? registrations.find((r) => r.id === session.registrationId) ?? null
    : null;

  const memberDashboardStats = useMemo(
    () => computeMemberDashboardStats(registrations),
    [registrations]
  );

  useEffect(() => {
    if (activeTab === 'updates') {
      handleMarkAllUpdatesRead();
    }
  }, [activeTab, handleMarkAllUpdatesRead]);

  const handleLogout = () => {
    clearSession();
    setSession(null);
    navigate('home');
  };

  // Unread badge tracker
  const unreadCount = updates.filter(up => !up.isRead).length;
  const selectedBulletin = bulletinId ? updates.find((up) => up.id === bulletinId) ?? null : null;
  const transitionKey = getTransitionKey(activeTab, bulletinId);
  const isAuthRoute = transitionKey === 'auth';

  return (
    <div className="bg-slate-50/50 text-slate-800 font-sans min-h-screen min-w-0 w-full overflow-x-hidden pb-16 md:pb-8 flex flex-col justify-between">
      
      {/* Top Header Navbar */}
      <Header 
        activeTab={activeTab} 
        setActiveTab={navigate} 
        unreadCount={unreadCount} 
        language={language}
        setLanguage={setLanguage}
        isLoggedIn={Boolean(session)}
        memberName={loggedInMember?.fullName}
        adminSubTab={adminSubTab}
        setAdminSubTab={setAdminSubTab}
        isSuperAdmin={Boolean(adminSession?.isSuperAdmin)}
      />

      {/* Main Content Router with Transitions */}
      <main className="pt-14 px-4 sm:px-6 max-w-7xl mx-auto w-full min-w-0 flex-1 overflow-x-hidden">
        {usingSupabase && dataLoading && (
          <div className="py-16 text-center text-sm text-slate-500 font-geist">
            Loading community data from Supabase…
          </div>
        )}

        {usingSupabase && dataError && !dataLoading && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex flex-wrap items-center justify-between gap-3">
            <span>Could not load Supabase data: {dataError}</span>
            <button
              type="button"
              onClick={() => void refreshData()}
              className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-bold hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        )}

        {!(usingSupabase && dataLoading) && (
        <AnimatePresence mode="wait">
          <motion.div
            key={transitionKey}
            className="w-full min-w-0 overflow-x-hidden"
            initial={isAuthRoute ? false : { opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={isAuthRoute ? undefined : { opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
          >
            {/* 1. HOME TAB */}
            {activeTab === 'home' && (
              <div className="space-y-16">
                <Hero 
                  onRegisterSelf={() => navigate('register')}
                  onRegisterFamily={() => navigate('register')}
                  onLogin={() => navigate('login')}
                  onExploreStatsClick={() => {
                    const statsSec = document.getElementById('stats-grid');
                    statsSec?.scrollIntoView({ behavior: 'smooth' });
                  }} 
                  language={language}
                  totalRegistrations={memberDashboardStats.totalRegistrations}
                />

                <div id="stats-grid">
                  <Stats registrations={registrations} language={language} />
                </div>

                {/* Saffron Stripe invitation panel */}
                <section className="py-6">
                  <motion.div
                    {...scaleIn}
                    className="bg-primary text-white p-8 md:p-12 rounded-3xl text-center space-y-5 saffron-gradient shadow-xl relative overflow-hidden"
                  >
                    <motion.div
                      animate={{ scale: [1, 1.08, 1], opacity: [0.4, 0.7, 0.4] }}
                      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                      className="absolute top-0 right-0 w-44 h-44 bg-white/5 rounded-full blur-2xl pointer-events-none"
                    />
                    <div className="space-y-2 max-w-xl mx-auto">
                      <span className="text-[10px] uppercase font-geist font-bold tracking-widest text-orange-200">{t.memberDirectoryProgram}</span>
                      <h3 className="font-sans text-2xl md:text-3xl font-bold tracking-tight">{t.claimIdCardTitle}</h3>
                      <p className="font-sans text-xs text-orange-50/90 leading-relaxed">
                        {t.claimIdCardDesc}
                      </p>
                    </div>

                    <div className="pt-2">
                      <motion.button
                        {...tapScale}
                        onClick={() => navigate('register')}
                        className="px-6 py-3 bg-white text-primary font-geist text-xs font-bold rounded-xl shadow-md hover:bg-slate-50 transition-colors cursor-pointer"
                      >
                        {t.registerProfileButton}
                      </motion.button>
                    </div>
                  </motion.div>
                </section>
              </div>
            )}

            {/* 3. INTERACTIVE MAP TAB */}
            {activeTab === 'map' && (
              <MapTab registrations={registrations} language={language} />
            )}

            {/* 4. FORUM DISCUSSIONS TAB */}
            {activeTab === 'forum' && (
              <Forum
                discussions={discussions}
                onAddDiscussion={handleAddDiscussion}
                onAddComment={handleAddComment}
                onLikeDiscussion={handleLikeDiscussion}
                userName="Verified Member"
                language={language}
              />
            )}

            {/* 5. BULLETINS / UPDATES TAB */}
            {activeTab === 'updates' && (
              bulletinId ? (
                <BulletinDetailPage
                  update={selectedBulletin}
                  language={language}
                  onBack={closeBulletin}
                />
              ) : (
                <UpdatesTab
                  updates={updates}
                  language={language}
                  onOpenBulletin={openBulletin}
                />
              )
            )}

            {/* 6. REGISTER TAB */}
            {activeTab === 'register' && (
              <RegisterTab 
                onRegisterSubmit={handleRegisterSubmit} 
                onNavigate={navigate}
                onNavigateLogin={() => navigate('login')}
                onSessionCreated={(authSession) => setSession(authSession)}
                registrations={registrations}
                language={language}
              />
            )}

            {activeTab === 'login' && (
              loggedInMember ? (
                <ProfileTab
                  member={loggedInMember}
                  onUpdate={handleUpdateRegistration}
                  onLogout={handleLogout}
                  language={language}
                />
              ) : (
                <LoginTab
                  registrations={registrations}
                  onLoginSuccess={handleLoginSuccess}
                  onNavigateRegister={() => navigate('register')}
                  language={language}
                />
              )
            )}

            {activeTab === 'profile' && (
              loggedInMember ? (
                <ProfileTab
                  member={loggedInMember}
                  onUpdate={handleUpdateRegistration}
                  onLogout={handleLogout}
                  language={language}
                />
              ) : (
                <LoginTab
                  registrations={registrations}
                  onLoginSuccess={handleLoginSuccess}
                  onNavigateRegister={() => navigate('register')}
                  language={language}
                />
              )
            )}

            {/* 7. DOWNLOAD CARD TAB */}
            {activeTab === 'download' && (
              <DownloadTab registrations={registrations} language={language} />
            )}

            {/* 9. ADMIN PANEL TAB */}
            {activeTab === 'admin' && (
              <AdminTab
                registrations={registrations}
                updates={updates}
                discussions={discussions}
                onAddUpdate={handlePublishUpdate}
                onUpdateUpdate={handleUpdateUpdate}
                onDeleteUpdate={handleDeleteUpdate}
                onDeleteRegistration={handleDeleteRegistration}
                onAddRegistration={handleRegisterSubmit}
                onAdminSessionChange={setAdminSession}
                adminSubTab={adminSubTab}
                setAdminSubTab={setAdminSubTab}
              />
            )}

            {activeTab === 'terms' && (
              <TermsPage onBack={() => navigate('home')} />
            )}

            {activeTab === 'privacy' && (
              <PrivacyPage onBack={() => navigate('home')} />
            )}

            {activeTab === 'cookies' && (
              <CookiePage onBack={() => navigate('home')} />
            )}

            {activeTab === 'guidelines' && (
              <GuidelinesPage onBack={() => navigate('home')} />
            )}

            {activeTab === 'support' && (
              <SupportPage onBack={() => navigate('home')} />
            )}
          </motion.div>
        </AnimatePresence>
        )}
      </main>

      {/* Footer block */}
      <Footer navigate={navigate} language={language} />

      {/* Mobile Sticky bottom navigation bar */}
      <BottomNav 
        activeTab={activeTab} 
        setActiveTab={navigate} 
        unreadCount={unreadCount} 
        language={language}
        adminSubTab={adminSubTab}
        setAdminSubTab={setAdminSubTab}
        isSuperAdmin={Boolean(adminSession?.isSuperAdmin)}
      />
    </div>
  );
}
