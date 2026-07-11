import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Registration, CommunityUpdate, ForumDiscussion } from '../types';
import {
  Lock, LayoutDashboard, Table, ShieldCheck,
  Search, Trash2, Megaphone, Users, CheckCircle2, UserSearch,
  Pencil, X, ImagePlus, UserPlus, Plus, LogOut, UserCog,
} from 'lucide-react';
import VerifyTab from './VerifyTab';
import ConfirmDialog from './ConfirmDialog';
import RegistrationDetailsForm, { RegistrationFormValues } from './RegistrationDetailsForm';
import MobileWithCountryCode from './MobileWithCountryCode';
import { AdminSubTab } from '../lib/adminNav';
import { computeMemberDashboardStats } from '../lib/memberGeoStats';
import { validateRegistrationFields } from '../lib/validateRegistration';
import { generateNextCommunityId } from '../lib/communityId';
import { getDialCodeForCountry } from '../lib/countries';
import { findRegistrationByMobile, isValidLocalMobile } from '../lib/demoAuth';
import { getTranslations } from '../lib/translations';
import {
  AdminSession,
  AdminDirectoryEntry,
  authenticateAdmin,
  clearAdminSession,
  getAdminSession,
  fetchAdminDirectory,
  addAdminAccount,
  removeAdminAccount,
} from '../lib/adminAuth';

interface AdminTabProps {
  registrations: Registration[];
  updates: CommunityUpdate[];
  discussions: ForumDiscussion[];
  onAddUpdate: (update: CommunityUpdate) => void | Promise<void>;
  onUpdateUpdate: (update: CommunityUpdate) => void | Promise<void>;
  onDeleteUpdate: (id: string) => void | Promise<void>;
  onDeleteRegistration: (id: string) => void | Promise<void>;
  onAddRegistration: (registration: Registration) => void | Promise<void>;
  onAdminSessionChange?: (session: AdminSession | null) => void;
  adminSubTab: AdminSubTab;
  setAdminSubTab: (tab: AdminSubTab) => void;
}

type BulletinCategory = CommunityUpdate['category'];

const MAX_BULLETIN_IMAGE_BYTES = 2 * 1024 * 1024;

const EMPTY_CELL = '—';

function ledgerCell(value: string | undefined | null): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : EMPTY_CELL;
}

function formatLedgerMobile(reg: Registration): string {
  if (!reg.mobileNumber?.trim()) return EMPTY_CELL;
  const code = reg.mobileCountryCode?.trim() || '+91';
  return `${code} ${reg.mobileNumber.trim()}`;
}

const LEDGER_COLUMNS: { key: string; label: string; render: (reg: Registration) => string }[] = [
  { key: 'communityId', label: 'Community ID', render: (r) => ledgerCell(r.communityId) },
  { key: 'fullName', label: 'Full Name', render: (r) => ledgerCell(r.fullName) },
  { key: 'fathersName', label: "Father's Name", render: (r) => ledgerCell(r.fathersName) },
  { key: 'mothersName', label: "Mother's Name", render: (r) => ledgerCell(r.mothersName) },
  { key: 'gender', label: 'Gender', render: (r) => ledgerCell(r.gender) },
  { key: 'dobOrAge', label: 'DOB / Age', render: (r) => ledgerCell(r.dobOrAge) },
  { key: 'mobile', label: 'Mobile', render: (r) => formatLedgerMobile(r) },
  { key: 'email', label: 'Email', render: (r) => ledgerCell(r.email) },
  { key: 'gotra', label: 'Gotra', render: (r) => ledgerCell(r.gotra) },
  { key: 'education', label: 'Education', render: (r) => ledgerCell(r.education) },
  { key: 'occupation', label: 'Occupation', render: (r) => ledgerCell(r.occupation) },
  { key: 'relationship', label: 'Relationship', render: (r) => ledgerCell(r.relationship) },
  { key: 'country', label: 'Country', render: (r) => ledgerCell(r.country) },
  { key: 'state', label: 'State', render: (r) => ledgerCell(r.state) },
  { key: 'district', label: 'District', render: (r) => ledgerCell(r.district) },
  { key: 'city', label: 'City', render: (r) => ledgerCell(r.city) },
  { key: 'village', label: 'Village', render: (r) => ledgerCell(r.village) },
  { key: 'registrationDate', label: 'Registration Date', render: (r) => ledgerCell(r.registrationDate) },
  {
    key: 'isVerified',
    label: 'Verified',
    render: (r) => (r.isVerified ? 'Yes' : 'No'),
  },
];

function registrationSearchText(reg: Registration): string {
  return [
    reg.communityId,
    reg.fullName,
    reg.fathersName,
    reg.mothersName,
    reg.gender,
    reg.dobOrAge,
    reg.mobileNumber,
    reg.mobileCountryCode,
    reg.email,
    reg.gotra,
    reg.education,
    reg.occupation,
    reg.relationship,
    reg.country,
    reg.state,
    reg.district,
    reg.city,
    reg.village,
    reg.registrationDate,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

type PendingConfirm =
  | { kind: 'member'; id: string; name: string }
  | { kind: 'notice'; id: string; title: string }
  | { kind: 'notice-image' }
  | { kind: 'admin'; id: string; username: string };

const ADMIN_FORM_T = getTranslations('en');

const DEFAULT_MEMBER_FORM: RegistrationFormValues = {
  fullName: '',
  fathersName: '',
  mothersName: '',
  gender: 'Male',
  dobOrAge: '',
  email: '',
  gotra: '',
  education: '',
  occupation: '',
  country: 'India',
  state: '',
  district: '',
  city: '',
  village: '',
  relationship: 'Self',
};

export default function AdminTab({
  registrations,
  updates,
  discussions,
  onAddUpdate,
  onUpdateUpdate,
  onDeleteUpdate,
  onDeleteRegistration,
  onAddRegistration,
  onAdminSessionChange,
  adminSubTab,
  setAdminSubTab,
}: AdminTabProps) {
  const [adminSession, setAdminSession] = useState<AdminSession | null>(() => getAdminSession());
  const isAuthenticated = Boolean(adminSession);
  const isSuperAdmin = Boolean(adminSession?.isSuperAdmin);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Tab State inside Admin panel (synced with header / bottom nav)
  const [dbSearch, setDbSearch] = useState('');
  const [bulletinTitle, setBulletinTitle] = useState('');
  const [bulletinMessage, setBulletinMessage] = useState('');
  const [bulletinCategory, setBulletinCategory] = useState<BulletinCategory>('announcement');
  const [bulletinImageUrl, setBulletinImageUrl] = useState<string | undefined>();
  const [editingBulletinId, setEditingBulletinId] = useState<string | null>(null);
  const [imageError, setImageError] = useState('');
  const [formSuccess, setFormSuccess] = useState(false);
  const [formSuccessMessage, setFormSuccessMessage] = useState('');

  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm | null>(null);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [memberForm, setMemberForm] = useState<RegistrationFormValues>(DEFAULT_MEMBER_FORM);
  const [memberMobile, setMemberMobile] = useState('');
  const [memberDialCode, setMemberDialCode] = useState('+91');
  const [memberFormErrors, setMemberFormErrors] = useState<Record<string, string>>({});
  const [addMemberSuccess, setAddMemberSuccess] = useState('');
  const replaceImageInputRef = useRef<HTMLInputElement>(null);

  const [adminAccounts, setAdminAccounts] = useState<AdminDirectoryEntry[]>([]);
  const [loginLoading, setLoginLoading] = useState(false);
  const [newAdminUsername, setNewAdminUsername] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [newAdminPasswordConfirm, setNewAdminPasswordConfirm] = useState('');
  const [adminFormError, setAdminFormError] = useState('');
  const [adminFormSuccess, setAdminFormSuccess] = useState('');

  useEffect(() => {
    if (adminSubTab === 'admins' && !isSuperAdmin) {
      setAdminSubTab('kpis');
    }
  }, [adminSubTab, isSuperAdmin, setAdminSubTab]);

  useEffect(() => {
    void refreshAdminDirectory();
  }, []);

  const refreshAdminDirectory = async () => {
    const directory = await fetchAdminDirectory();
    setAdminAccounts(directory);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');
    try {
      const session = await authenticateAdmin(username, password);
      if (session) {
        setAdminSession(session);
        onAdminSessionChange?.(session);
        setUsername('');
        setPassword('');
        await refreshAdminDirectory();
      } else {
        setLoginError('Invalid administrator credentials. Please try again.');
      }
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    clearAdminSession();
    setAdminSession(null);
    onAdminSessionChange?.(null);
    setAdminSubTab('kpis');
  };

  // KPI Calculations — same logic as user home hero & stats section
  const memberStats = useMemo(
    () => computeMemberDashboardStats(registrations),
    [registrations]
  );

  const publishedNoticesCount = updates.length;

  // Filter registrations list
  const filteredRegistrations = useMemo(() => {
    const query = dbSearch.trim().toLowerCase();
    if (!query) return registrations;
    return registrations.filter((r) => registrationSearchText(r).includes(query));
  }, [registrations, dbSearch]);

  const resetBulletinForm = () => {
    setBulletinTitle('');
    setBulletinMessage('');
    setBulletinCategory('announcement');
    setBulletinImageUrl(undefined);
    setEditingBulletinId(null);
    setImageError('');
  };

  const resetAddMemberForm = () => {
    setMemberForm(DEFAULT_MEMBER_FORM);
    setMemberMobile('');
    setMemberDialCode('+91');
    setMemberFormErrors({});
    setAddMemberSuccess('');
  };

  const openAddMemberModal = () => {
    resetAddMemberForm();
    setShowAddMemberModal(true);
  };

  const closeAddMemberModal = () => {
    setShowAddMemberModal(false);
    resetAddMemberForm();
  };

  const updateMemberFormField = <K extends keyof RegistrationFormValues>(
    key: K,
    value: RegistrationFormValues[K]
  ) => {
    setMemberForm((prev) => ({ ...prev, [key]: value }));
    setMemberFormErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleMemberCountryChange = (nextCountry: string) => {
    updateMemberFormField('country', nextCountry);
    setMemberDialCode(getDialCodeForCountry(nextCountry));
  };

  const handleAddMemberSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const fieldErrors = validateRegistrationFields({
      ...memberForm,
      mobileNumber: memberMobile,
    });

    if (!memberMobile.trim()) {
      fieldErrors.mobileNumber = 'Mobile number is required';
    } else if (!isValidLocalMobile(memberMobile)) {
      fieldErrors.mobileNumber = 'Enter a valid mobile number';
    } else if (findRegistrationByMobile(registrations, memberDialCode, memberMobile)) {
      fieldErrors.mobileNumber = 'This mobile number is already registered';
    }

    if (Object.keys(fieldErrors).length > 0) {
      setMemberFormErrors(fieldErrors);
      return;
    }

    const registrationYear = new Date().getFullYear();
    const communityId = generateNextCommunityId(registrations, registrationYear);
    const id = `reg-${Date.now()}`;

    const newRegistration: Registration = {
      id,
      communityId,
      fullName: memberForm.fullName.trim(),
      fathersName: memberForm.fathersName.trim(),
      mothersName: memberForm.mothersName?.trim() || undefined,
      gender: memberForm.gender,
      dobOrAge: memberForm.dobOrAge.trim(),
      mobileNumber: memberMobile.trim(),
      mobileCountryCode: memberDialCode,
      email: memberForm.email?.trim() || undefined,
      gotra: memberForm.gotra?.trim() || undefined,
      education: memberForm.education.trim(),
      occupation: memberForm.occupation.trim(),
      country: memberForm.country,
      state: memberForm.state.trim(),
      district: memberForm.district.trim(),
      city: memberForm.city.trim(),
      village: memberForm.village?.trim() || undefined,
      relationship: memberForm.relationship,
      registrationDate: new Date().toISOString().slice(0, 10),
      isVerified: true,
    };

    onAddRegistration(newRegistration);
    setAddMemberSuccess(`${newRegistration.fullName} added with ID ${communityId}`);
    setTimeout(() => {
      closeAddMemberModal();
    }, 1200);
  };

  const confirmDeleteMember = (reg: Registration) => {
    setPendingConfirm({ kind: 'member', id: reg.id, name: reg.fullName });
  };

  const confirmDeleteNotice = (update: CommunityUpdate) => {
    setPendingConfirm({ kind: 'notice', id: update.id, title: update.title });
  };

  const executePendingConfirm = async () => {
    if (!pendingConfirm) return;

    if (pendingConfirm.kind === 'member') {
      await onDeleteRegistration(pendingConfirm.id);
    } else if (pendingConfirm.kind === 'notice') {
      if (editingBulletinId === pendingConfirm.id) resetBulletinForm();
      await onDeleteUpdate(pendingConfirm.id);
    } else if (pendingConfirm.kind === 'notice-image') {
      setBulletinImageUrl(undefined);
    } else if (pendingConfirm.kind === 'admin' && adminSession) {
      const result = await removeAdminAccount(pendingConfirm.id, adminSession);
      if (result.ok === false) {
        setAdminFormError(result.error);
      } else {
        await refreshAdminDirectory();
        setAdminFormSuccess(`${pendingConfirm.username} removed from admin access.`);
        setTimeout(() => setAdminFormSuccess(''), 3000);
      }
    }

    setPendingConfirm(null);
  };

  const handleAddAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminFormError('');
    setAdminFormSuccess('');

    if (!adminSession?.isSuperAdmin) {
      setAdminFormError('Only the super admin can add other admins.');
      return;
    }
    if (newAdminPassword !== newAdminPasswordConfirm) {
      setAdminFormError('Passwords do not match.');
      return;
    }

    const result = await addAdminAccount(newAdminUsername, newAdminPassword, adminSession.username);
    if (result.ok === false) {
      setAdminFormError(result.error);
      return;
    }

    await refreshAdminDirectory();
    setNewAdminUsername('');
    setNewAdminPassword('');
    setNewAdminPasswordConfirm('');
    setAdminFormSuccess('New admin account created successfully.');
    setTimeout(() => setAdminFormSuccess(''), 3000);
  };

  const handleConfirmReplaceImage = () => {
    setPendingConfirm(null);
    replaceImageInputRef.current?.click();
  };

  const handleBulletinImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setImageError('Please choose a JPG, PNG, or WebP image.');
      return;
    }
    if (file.size > MAX_BULLETIN_IMAGE_BYTES) {
      setImageError('Image must be 2 MB or smaller.');
      return;
    }

    setImageError('');
    const reader = new FileReader();
    reader.onload = () => setBulletinImageUrl(reader.result as string);
    reader.onerror = () => setImageError('Could not read the image file.');
    reader.readAsDataURL(file);
  };

  const startEditingBulletin = (update: CommunityUpdate) => {
    setEditingBulletinId(update.id);
    setBulletinTitle(update.title);
    setBulletinMessage(update.message);
    setBulletinCategory(update.category);
    setBulletinImageUrl(update.imageUrl);
    setImageError('');
    setFormSuccess(false);
    setAdminSubTab('bulletins');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePublishBulletin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulletinTitle.trim() || !bulletinMessage.trim()) return;

    const payload = {
      category: bulletinCategory,
      title: bulletinTitle.trim(),
      message: bulletinMessage.trim(),
      imageUrl: bulletinImageUrl,
    };

    if (editingBulletinId) {
      const existing = updates.find((up) => up.id === editingBulletinId);
      if (!existing) return;

      onUpdateUpdate({
        ...existing,
        ...payload,
        time: existing.time.startsWith('Edited') ? existing.time : `Edited · ${existing.time}`,
      });
      setFormSuccessMessage('Community notice updated successfully.');
    } else {
      const newBulletin: CommunityUpdate = {
        id: `bulletin-${Date.now()}`,
        ...payload,
        time: 'Just now',
        isRead: false,
        isImportant: true,
      };
      onAddUpdate(newBulletin);
      setFormSuccessMessage('Community notice published to the bulletin board.');
    }

    resetBulletinForm();
    setFormSuccess(true);
    setTimeout(() => setFormSuccess(false), 3000);
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto py-12">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-slate-200/80 p-8 rounded-3xl shadow-sm space-y-6"
        >
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-orange-50 text-primary border border-orange-200 rounded-full flex items-center justify-center mx-auto shadow-sm">
              <Lock className="w-5 h-5 stroke-2" />
            </div>
            <h2 className="font-sans text-xl font-bold text-slate-900">Admin Portal Secure Gateway</h2>
            <p className="text-xs text-slate-500">
              Please authenticate with your administrator credentials to access database logs and controls.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">Username</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter admin username..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter secure password..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white"
              />
            </div>

            {loginError && (
              <p className="text-[10px] text-red-500 font-semibold text-center">{loginError}</p>
            )}

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-3 bg-primary text-white font-geist text-xs font-bold rounded-xl shadow-md hover:opacity-90 active:scale-95 transition-all cursor-pointer disabled:opacity-60"
            >
              {loginLoading ? 'Authenticating…' : 'Authenticate Portal'}
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-8 py-6">
      {/* Admin Shell Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-orange-50 border border-orange-200 text-primary px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5" />
            Security Mode Active
          </div>
          <h2 className="font-sans text-2xl md:text-3xl font-bold text-slate-950 mt-2">Administrator Console</h2>
          <p className="text-xs text-slate-500 mt-1">
            Signed in as <span className="font-semibold text-slate-700">{adminSession?.username}</span>
            {isSuperAdmin ? ' · Super Admin' : ' · Admin'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-geist text-xs font-semibold bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            Logout
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-6 -mt-4">
        <p className="text-xs text-slate-500">Manage member records, moderate threads, and publish community notices.</p>

        {/* Sub Navigation menu — desktop only; mobile uses bottom nav */}
        <div className="hidden md:flex flex-wrap gap-1.5">
          <button
            onClick={() => setAdminSubTab('kpis')}
            className={`px-3.5 py-2 rounded-xl font-geist text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              adminSubTab === 'kpis' ? 'bg-primary text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            KPIs
          </button>
          <button
            onClick={() => setAdminSubTab('database')}
            className={`px-3.5 py-2 rounded-xl font-geist text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              adminSubTab === 'database' ? 'bg-primary text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            Member Ledger ({registrations.length})
          </button>
          <button
            onClick={() => setAdminSubTab('bulletins')}
            className={`px-3.5 py-2 rounded-xl font-geist text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              adminSubTab === 'bulletins' ? 'bg-primary text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Megaphone className="w-3.5 h-3.5" />
            Publish Notices
          </button>
          <button
            onClick={() => setAdminSubTab('verify')}
            className={`px-3.5 py-2 rounded-xl font-geist text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              adminSubTab === 'verify' ? 'bg-primary text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <UserSearch className="w-3.5 h-3.5" />
            Verify Registration
          </button>
          {isSuperAdmin && (
            <button
              onClick={() => setAdminSubTab('admins')}
              className={`px-3.5 py-2 rounded-xl font-geist text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                adminSubTab === 'admins' ? 'bg-primary text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <UserCog className="w-3.5 h-3.5" />
              Manage Admins
            </button>
          )}
        </div>
      </div>

      {/* KPI Widgets View */}
      {adminSubTab === 'kpis' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm">
              <p className="text-[10px] font-geist text-slate-400 font-bold uppercase tracking-wider">Total Registrations</p>
              <h3 className="font-sans text-2xl font-bold text-primary mt-1">
                {memberStats.totalRegistrations.toLocaleString()}
              </h3>
              <p className="text-[10px] text-slate-400 mt-2 font-medium">
                Same live count shown on the public home page
              </p>
            </div>

            <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm">
              <p className="text-[10px] font-geist text-slate-400 font-bold uppercase tracking-wider">Regions Tracked</p>
              <h3 className="font-sans text-2xl font-bold text-slate-900 mt-1">
                {memberStats.regionsTracked.toLocaleString()}
              </h3>
              <p className="text-[10px] text-slate-400 mt-2 font-medium">
                State / region areas from member registrations
              </p>
            </div>

            <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm">
              <p className="text-[10px] font-geist text-slate-400 font-bold uppercase tracking-wider">Verified Lineages</p>
              <h3 className="font-sans text-2xl font-bold text-slate-900 mt-1">
                {memberStats.verifiedLineages.toLocaleString()}
              </h3>
              <p className="text-[10px] text-slate-400 mt-2 font-medium">
                Unique gotra lines recorded in the directory
              </p>
            </div>

            <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm">
              <p className="text-[10px] font-geist text-slate-400 font-bold uppercase tracking-wider">Countries Represented</p>
              <h3 className="font-sans text-2xl font-bold text-slate-900 mt-1">
                {memberStats.countriesRepresented.toLocaleString()}
              </h3>
              <p className="text-[10px] text-slate-400 mt-2 font-medium">
                Same country totals as the member map analytics
              </p>
            </div>
          </div>

          <div className="max-w-sm">
            <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm">
              <p className="text-[10px] font-geist text-slate-400 font-bold uppercase tracking-wider">Live Community Notices</p>
              <h3 className="font-sans text-2xl font-bold text-slate-900 mt-1">{publishedNoticesCount.toLocaleString()}</h3>
              <p className="text-[10px] text-slate-400 mt-2 font-medium">Published on the public bulletin board</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 p-6 rounded-3xl shadow-sm space-y-4">
            <h3 className="font-sans text-base font-bold text-slate-950 flex items-center gap-1.5 border-b border-slate-100 pb-3">
              <Users className="w-4 h-4 text-primary" />
              Recent Forum Activities ({discussions.length} Discussions)
            </h3>

            <div className="divide-y divide-slate-100">
              {discussions.slice(0, 3).map((disc) => (
                <div key={disc.id} className="py-3.5 flex justify-between items-center">
                  <div>
                    <h4 className="font-sans text-xs font-bold text-slate-800">{disc.title}</h4>
                    <p className="text-[10px] text-slate-400">Published by {disc.author} ({disc.authorRole})</p>
                  </div>
                  <span className="text-[10px] font-geist font-bold text-slate-500 bg-slate-50 px-2.5 py-1 rounded border border-slate-200/60">
                    {disc.category.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Database Table view */}
      {adminSubTab === 'database' && (
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm space-y-4 p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <h3 className="font-sans text-base font-bold text-slate-950">Member Directory Ledger</h3>
              <button
                type="button"
                onClick={openAddMemberModal}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-primary text-white rounded-xl font-geist text-xs font-bold shadow-sm hover:opacity-90 transition-all cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Add Member
              </button>
            </div>
            
            <div className="relative w-full sm:max-w-xs">
              <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={dbSearch}
                onChange={(e) => setDbSearch(e.target.value)}
                placeholder="Search any member field..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
              />
            </div>
          </div>

          {filteredRegistrations.length > 0 ? (
            <div className="overflow-x-auto border border-slate-100 rounded-2xl">
              <table className="w-full text-left border-collapse min-w-[1400px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    {LEDGER_COLUMNS.map((col) => (
                      <th
                        key={col.key}
                        className="p-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap"
                      >
                        {col.label}
                      </th>
                    ))}
                    <th className="p-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right whitespace-nowrap sticky right-0 bg-slate-50 border-l border-slate-100">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRegistrations.map((reg) => (
                    <tr key={reg.id} className="hover:bg-slate-50/50 transition-colors">
                      {LEDGER_COLUMNS.map((col) => {
                        const value = col.render(reg);
                        const isEmpty = value === EMPTY_CELL;
                        return (
                          <td
                            key={col.key}
                            className={`p-3 text-xs whitespace-nowrap max-w-[220px] truncate ${
                              col.key === 'communityId'
                                ? 'font-bold text-primary font-mono'
                                : col.key === 'fullName'
                                  ? 'font-bold text-slate-800'
                                  : isEmpty
                                    ? 'text-slate-300'
                                    : 'text-slate-600'
                            } ${col.key === 'mobile' ? 'font-mono' : ''}`}
                            title={value}
                          >
                            {value}
                          </td>
                        );
                      })}
                      <td className="p-3 text-right whitespace-nowrap sticky right-0 bg-white border-l border-slate-100">
                        <button
                          type="button"
                          onClick={() => confirmDeleteMember(reg)}
                          className="p-1.5 hover:bg-red-50 text-red-500 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                          title="Remove member"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 space-y-3">
              <Table className="w-10 h-10 text-slate-300 mx-auto stroke-1" />
              <div>
                <p className="font-sans text-xs font-bold text-slate-700">No Submissions Found</p>
                <p className="text-[10px] text-slate-400">Try modifying your search or add a member manually.</p>
              </div>
              <button
                type="button"
                onClick={openAddMemberModal}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-xl font-geist text-xs font-bold shadow-sm hover:opacity-90 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Member
              </button>
            </div>
          )}
        </div>
      )}

      {/* Bulletins publishing form */}
      {adminSubTab === 'bulletins' && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          <div className="md:col-span-7 bg-white border border-slate-200/80 p-6 rounded-3xl shadow-sm space-y-5">
            <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h3 className="font-sans text-base font-bold text-slate-950">
                  {editingBulletinId ? 'Edit Community Notice' : 'Publish Community Notice'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Notices published here appear immediately on the public bulletin board for members.
                </p>
              </div>
              {editingBulletinId && (
                <button
                  type="button"
                  onClick={resetBulletinForm}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-primary cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  Cancel edit
                </button>
              )}
            </div>

            <form onSubmit={handlePublishBulletin} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">Notice Category</label>
                  <select
                    value={bulletinCategory}
                    onChange={(e) => setBulletinCategory(e.target.value as BulletinCategory)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none"
                  >
                    <option value="announcement">Announcement</option>
                    <option value="scholarship">Scholarship Program</option>
                    <option value="meeting">Webinar or Meeting</option>
                    <option value="blood-camp">Blood Donation Drive</option>
                    <option value="festival">Festival Wish</option>
                    <option value="event">Community Event</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">Notice Title</label>
                <input
                  type="text"
                  required
                  value={bulletinTitle}
                  onChange={(e) => setBulletinTitle(e.target.value)}
                  placeholder="e.g. National Merit Scholarship Form Open"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">Detailed Message</label>
                <textarea
                  required
                  rows={4}
                  value={bulletinMessage}
                  onChange={(e) => setBulletinMessage(e.target.value)}
                  placeholder="Provide precise details, requirements, links or dates..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Cover Image <span className="font-normal normal-case text-slate-400">(optional)</span>
                </label>
                <div className="flex flex-col sm:flex-row gap-3 items-start">
                  <label className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer transition-colors">
                    <ImagePlus className="w-4 h-4 text-primary" />
                    {bulletinImageUrl ? 'Replace image' : 'Add image'}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      onChange={handleBulletinImageChange}
                      className="hidden"
                    />
                  </label>
                  {bulletinImageUrl && (
                    <button
                      type="button"
                      onClick={() => setPendingConfirm({ kind: 'notice-image' })}
                      className="text-[11px] font-bold text-red-500 hover:text-red-600 cursor-pointer"
                    >
                      Remove image
                    </button>
                  )}
                </div>
                <input
                  ref={replaceImageInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleBulletinImageChange}
                  className="hidden"
                />
                {imageError && <p className="text-[10px] text-red-500 font-medium">{imageError}</p>}
                {bulletinImageUrl && (
                  <img
                    src={bulletinImageUrl}
                    alt="Notice preview"
                    className="w-full max-w-sm rounded-xl border border-slate-200 object-cover max-h-44"
                  />
                )}
              </div>

              {formSuccess && (
                <div className="bg-emerald-50 text-emerald-800 p-3 rounded-xl text-center text-[11px] font-bold border border-emerald-100 flex items-center justify-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  {formSuccessMessage}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 bg-primary text-white font-geist text-xs font-bold rounded-xl shadow-sm hover:opacity-90 active:scale-[0.99] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Megaphone className="w-3.5 h-3.5" />
                {editingBulletinId ? 'Save Notice Changes' : 'Publish Community Notice'}
              </button>
            </form>
          </div>

          <div className="md:col-span-5 bg-white border border-slate-200 p-6 rounded-3xl shadow-sm space-y-4">
            <h3 className="font-sans text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              Published Notices ({updates.length})
            </h3>

            <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
              {updates.map((up) => (
                <div key={up.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <h4 className="font-sans text-xs font-bold text-slate-800 leading-tight">{up.title}</h4>
                      <p className="text-[10px] text-slate-400 mt-1">{up.time} · {up.category.replace('-', ' ')}</p>
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => startEditingBulletin(up)}
                        className="text-slate-400 hover:text-primary transition-colors p-1 cursor-pointer"
                        title="Edit notice"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => confirmDeleteNotice(up)}
                        className="text-slate-400 hover:text-red-500 transition-colors p-1 cursor-pointer"
                        title="Delete notice"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  {up.imageUrl && (
                    <img
                      src={up.imageUrl}
                      alt=""
                      className="w-full rounded-lg border border-slate-200 object-cover max-h-24"
                    />
                  )}
                  <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed">{up.message}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {adminSubTab === 'verify' && (
        <VerifyTab registrations={registrations} embedded />
      )}

      {adminSubTab === 'admins' && isSuperAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-5 bg-white border border-slate-200/80 p-6 rounded-3xl shadow-sm space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="font-sans text-base font-bold text-slate-950">Add Admin Account</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Create credentials for another administrator. Only the super admin can add or remove admins.
              </p>
            </div>

            <form onSubmit={handleAddAdminSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">Username</label>
                <input
                  type="text"
                  required
                  value={newAdminUsername}
                  onChange={(e) => setNewAdminUsername(e.target.value)}
                  placeholder="e.g. chapter_admin_mumbai"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">Password</label>
                <input
                  type="password"
                  required
                  value={newAdminPassword}
                  onChange={(e) => setNewAdminPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">Confirm Password</label>
                <input
                  type="password"
                  required
                  value={newAdminPasswordConfirm}
                  onChange={(e) => setNewAdminPasswordConfirm(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none"
                />
              </div>

              {adminFormError && (
                <p className="text-[10px] text-red-500 font-semibold">{adminFormError}</p>
              )}

              {adminFormSuccess && (
                <div className="bg-emerald-50 text-emerald-800 p-3 rounded-xl text-center text-[11px] font-bold border border-emerald-100 flex items-center justify-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  {adminFormSuccess}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 bg-primary text-white font-geist text-xs font-bold rounded-xl shadow-sm hover:opacity-90 transition-all cursor-pointer inline-flex items-center justify-center gap-1.5"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Add Admin
              </button>
            </form>
          </div>

          <div className="lg:col-span-7 bg-white border border-slate-200 p-6 rounded-3xl shadow-sm space-y-4">
            <h3 className="font-sans text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              Admin Accounts ({adminAccounts.length})
            </h3>

            <div className="space-y-3">
              {adminAccounts.map((account) => (
                <div
                  key={account.id}
                  className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between gap-3"
                >
                  <div>
                    <p className="font-sans text-xs font-bold text-slate-800">{account.username}</p>
                    <p className="text-[10px] text-slate-400 mt-1">
                      {account.isSuperAdmin ? 'Super Admin · cannot be removed' : 'Administrator'}
                      {account.createdAt ? ` · added ${new Date(account.createdAt).toLocaleDateString()}` : ''}
                    </p>
                  </div>

                  {account.isSuperAdmin ? (
                    <span className="text-[10px] font-geist font-bold text-primary bg-orange-50 border border-orange-100 px-2.5 py-1 rounded-full">
                      SUPER
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        setPendingConfirm({
                          kind: 'admin',
                          id: account.id,
                          username: account.username,
                        })
                      }
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-bold text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={pendingConfirm?.kind === 'member'}
        title="Remove member from directory?"
        message={
          pendingConfirm?.kind === 'member'
            ? `${pendingConfirm.name} will be permanently removed from the global member ledger. This cannot be undone.`
            : ''
        }
        onClose={() => setPendingConfirm(null)}
        actions={[
          { label: 'Cancel', variant: 'ghost', onClick: () => setPendingConfirm(null) },
          { label: 'Delete member', variant: 'danger', onClick: executePendingConfirm },
        ]}
      />

      <ConfirmDialog
        open={pendingConfirm?.kind === 'notice'}
        title="Delete community notice?"
        message={
          pendingConfirm?.kind === 'notice'
            ? `"${pendingConfirm.title}" will be removed from the public bulletin board.`
            : ''
        }
        onClose={() => setPendingConfirm(null)}
        actions={[
          { label: 'Cancel', variant: 'ghost', onClick: () => setPendingConfirm(null) },
          { label: 'Delete notice', variant: 'danger', onClick: executePendingConfirm },
        ]}
      />

      <ConfirmDialog
        open={pendingConfirm?.kind === 'notice-image'}
        title="Remove cover image?"
        message="The notice cover image will be removed. You can add a new image before publishing."
        onClose={() => setPendingConfirm(null)}
        actions={[
          { label: 'Cancel', variant: 'ghost', onClick: () => setPendingConfirm(null) },
          { label: 'Add image', variant: 'primary', onClick: handleConfirmReplaceImage },
          { label: 'Remove image', variant: 'danger', onClick: executePendingConfirm },
        ]}
      />

      <ConfirmDialog
        open={pendingConfirm?.kind === 'admin'}
        title="Remove admin access?"
        message={
          pendingConfirm?.kind === 'admin'
            ? `"${pendingConfirm.username}" will no longer be able to sign in to the admin console.`
            : ''
        }
        onClose={() => setPendingConfirm(null)}
        actions={[
          { label: 'Cancel', variant: 'ghost', onClick: () => setPendingConfirm(null) },
          { label: 'Remove admin', variant: 'danger', onClick: executePendingConfirm },
        ]}
      />

      <AnimatePresence>
        {showAddMemberModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.button
              type="button"
              aria-label="Close add member dialog backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeAddMemberModal}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] cursor-pointer"
            />

            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="add-member-title"
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.18 }}
              className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl border border-slate-200 shadow-xl p-6 space-y-5"
            >
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h2 id="add-member-title" className="font-sans text-base font-bold text-slate-950">
                    Add Member to Directory
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Manually register a member. All fields appear in the ledger; empty optional fields show as —.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeAddMemberModal}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer shrink-0"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddMemberSubmit} className="space-y-5">
                <MobileWithCountryCode
                  dialCode={memberDialCode}
                  onDialCodeChange={setMemberDialCode}
                  mobile={memberMobile}
                  onMobileChange={setMemberMobile}
                  error={memberFormErrors.mobileNumber}
                  label="Mobile Number"
                  language="en"
                />

                <RegistrationDetailsForm
                  values={memberForm}
                  onChange={updateMemberFormField}
                  errors={memberFormErrors}
                  t={ADMIN_FORM_T}
                  mobileDisplay={`${memberDialCode} ${memberMobile || '—'}`}
                  onCountryChange={handleMemberCountryChange}
                />

                {addMemberSuccess && (
                  <div className="bg-emerald-50 text-emerald-800 p-3 rounded-xl text-center text-[11px] font-bold border border-emerald-100 flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    {addMemberSuccess}
                  </div>
                )}

                <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={closeAddMemberModal}
                    className="px-4 py-2.5 rounded-xl font-geist text-xs font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2.5 rounded-xl font-geist text-xs font-bold bg-primary text-white hover:opacity-90 cursor-pointer inline-flex items-center justify-center gap-1.5"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    Add Member
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
