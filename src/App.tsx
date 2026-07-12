import { useState, useEffect, useCallback, useMemo, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'motion/react';

import Header from './components/Header';
import BottomNav from './components/BottomNav';
import Hero from './components/Hero';
import UpdatesTab from './components/UpdatesTab';
import Footer from './components/Footer';

const Stats = lazy(() => import('./components/Stats'));
const Forum = lazy(() => import('./components/Forum'));
const MapTab = lazy(() => import('./components/MapTab'));
const RegisterTab = lazy(() => import('./components/RegisterTab'));
const LoginTab = lazy(() => import('./components/LoginTab'));
const ForgotPasswordTab = lazy(() => import('./components/ForgotPasswordTab'));
const ProfileTab = lazy(() => import('./components/ProfileTab'));
const DownloadTab = lazy(() => import('./components/DownloadTab'));
const AdminTab = lazy(() => import('./components/AdminTab'));
const BulletinDetailPage = lazy(() => import('./components/pages/BulletinDetailPage'));
const TermsPage = lazy(() => import('./components/pages/TermsPage'));
const PrivacyPage = lazy(() => import('./components/pages/PrivacyPage'));
const CookiePage = lazy(() => import('./components/pages/CookiePage'));
const GuidelinesPage = lazy(() => import('./components/pages/GuidelinesPage'));
const SupportPage = lazy(() => import('./components/pages/SupportPage'));

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
import ToastHost, { showToast } from './components/ToastHost';

function getTransitionKey(tab: string, bulletinId: string | null): string {
  if (tab === 'login' || tab === 'profile' || tab === 'forgotPassword') return 'auth';
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

  const [registerMode, setRegisterMode] = useState<'self' | 'family'>('self');

  const navigate = useCallback((tab: string) => {
    setActiveTab(tab);
    setBulletinId(null);
    navigateToTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const openRegister = useCallback((mode: 'self' | 'family') => {
    setRegisterMode(mode);
    setActiveTab('register');
    setBulletinId(null);
    navigateToTab('register');
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

  const announceLogin = useCallback(() => {
    showToast(getTranslations(language).loginSuccessToast, 'login');
  }, [language]);

  const handleLoginSuccess = useCallback((authSession: AuthSession) => {
    setSession(authSession);
    announceLogin();
    setActiveTab('profile');
    navigateToTab('profile', true);
    window.scrollTo(0, 0);
  }, [announceLogin]);

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
    showToast(t.logoutSuccessToast, 'logout');
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
        onRegisterClick={() => openRegister('self')}
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
                  onRegisterSelf={() => openRegister('self')}
                  onRegisterFamily={() => openRegister('family')}
                  onLogin={() => navigate('login')}
                  onExploreStatsClick={() => {
                    const statsSec = document.getElementById('stats-grid');
                    statsSec?.scrollIntoView({ behavior: 'smooth' });
                  }} 
                  language={language}
                  totalRegistrations={memberDashboardStats.totalRegistrations}
                />

                <div id="stats-grid">
                  <Suspense fallback={null}>
                    <Stats registrations={registrations} language={language} />
                  </Suspense>
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
                        onClick={() => openRegister('self')}
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
              <Suspense fallback={null}>
                <MapTab registrations={registrations} language={language} />
              </Suspense>
            )}

            {/* 4. FORUM DISCUSSIONS TAB */}
            {activeTab === 'forum' && (
              <Suspense fallback={null}>
                <Forum
                  discussions={discussions}
                  onAddDiscussion={handleAddDiscussion}
                  onAddComment={handleAddComment}
                  onLikeDiscussion={handleLikeDiscussion}
                  userName="Verified Member"
                  language={language}
                />
              </Suspense>
            )}

            {/* 5. BULLETINS / UPDATES TAB */}
            {activeTab === 'updates' && (
              bulletinId ? (
                <Suspense fallback={null}>
                  <BulletinDetailPage
                    update={selectedBulletin}
                    language={language}
                    onBack={closeBulletin}
                  />
                </Suspense>
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
              <Suspense fallback={null}>
                <RegisterTab 
                  registerMode={registerMode}
                  onRegisterSubmit={handleRegisterSubmit} 
                  onNavigate={navigate}
                  onNavigateLogin={() => navigate('login')}
                  onSessionCreated={(authSession) => {
                    setSession(authSession);
                    announceLogin();
                  }}
                  registrations={registrations}
                  language={language}
                />
              </Suspense>
            )}

            {activeTab === 'login' && (
              <Suspense fallback={null}>
                {loggedInMember ? (
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
                    onNavigateRegister={() => openRegister('self')}
                    onNavigateForgotPassword={() => navigate('forgotPassword')}
                    language={language}
                  />
                )}
              </Suspense>
            )}

            {activeTab === 'profile' && (
              <Suspense fallback={null}>
                {loggedInMember ? (
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
                    onNavigateRegister={() => openRegister('self')}
                    onNavigateForgotPassword={() => navigate('forgotPassword')}
                    language={language}
                  />
                )}
              </Suspense>
            )}

            {activeTab === 'forgotPassword' && (
              <Suspense fallback={null}>
                <ForgotPasswordTab
                  registrations={registrations}
                  language={language}
                  onNavigateLogin={() => navigate('login')}
                />
              </Suspense>
            )}

            {/* 7. DOWNLOAD CARD TAB */}
            {activeTab === 'download' && (
              <Suspense fallback={null}>
                <DownloadTab
                  registrations={registrations}
                  language={language}
                  loggedInMember={loggedInMember}
                />
              </Suspense>
            )}

            {/* 9. ADMIN PANEL TAB */}
            {activeTab === 'admin' && (
              <Suspense fallback={null}>
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
              </Suspense>
            )}

            {activeTab === 'terms' && (
              <Suspense fallback={null}>
                <TermsPage onBack={() => navigate('home')} />
              </Suspense>
            )}

            {activeTab === 'privacy' && (
              <Suspense fallback={null}>
                <PrivacyPage onBack={() => navigate('home')} />
              </Suspense>
            )}

            {activeTab === 'cookies' && (
              <Suspense fallback={null}>
                <CookiePage onBack={() => navigate('home')} />
              </Suspense>
            )}

            {activeTab === 'guidelines' && (
              <Suspense fallback={null}>
                <GuidelinesPage onBack={() => navigate('home')} />
              </Suspense>
            )}

            {activeTab === 'support' && (
              <Suspense fallback={null}>
                <SupportPage onBack={() => navigate('home')} />
              </Suspense>
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

      <ToastHost />
    </div>
  );
}
