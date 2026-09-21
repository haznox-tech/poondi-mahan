import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  Images,
  Star,
  LogOut,
  LayoutDashboard,
  ChevronRight,
  Menu,
  X,
  ExternalLink,
  KeyRound,
  Lock,
  Mail,
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
  Trash2,
  Video,
} from 'lucide-react';
import { useAdminAuth } from '../admin/AdminAuthContext.jsx';
import {
  getAdminEmail,
  updateAdminCredentials,
  getRecentlyDeletedItems,
  getRecentlyDeletedVideos,
  syncFromCodebase,
  flushToCodebase,
} from '../admin/adminStore.js';
import clsx from 'clsx';

const navItems = [
  { to: '/admin/gallery', label: 'Gallery Management', icon: Images },
  { to: '/admin/videos', label: 'Video Management', icon: Video },
  { to: '/admin/featured', label: 'Home Featured Images', icon: Star },
  { to: '/admin/trash', label: 'Recently Deleted', icon: Trash2 },
];

export default function AdminLayout() {
  const { logout } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [adminEmail, setAdminEmail] = useState(getAdminEmail());
  const [trashCount, setTrashCount] = useState(() =>
    typeof window !== 'undefined'
      ? (getRecentlyDeletedItems().length + getRecentlyDeletedVideos().length)
      : 0
  );
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // In-session Change Password Modal state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [settingsEmail, setSettingsEmail] = useState('');
  const [settingsPw, setSettingsPw] = useState('');
  const [settingsConfirmPw, setSettingsConfirmPw] = useState('');
  const [showSettingsPw, setShowSettingsPw] = useState(false);
  const [showSettingsConfirmPw, setShowSettingsConfirmPw] = useState(false);
  const [settingsError, setSettingsError] = useState('');
  const [settingsSuccess, setSettingsSuccess] = useState(false);

  // Sync admin email and trash count when updated
  useEffect(() => {
    let isMounted = true;
    const handleAuthUpdated = () => {
      if (isMounted) setAdminEmail(getAdminEmail());
    };
    const handleTrashUpdated = () => {
      if (isMounted) {
        setTrashCount(getRecentlyDeletedItems().length + getRecentlyDeletedVideos().length);
      }
    };

    syncFromCodebase().then(() => {
      handleAuthUpdated();
      handleTrashUpdated();
    });

    window.addEventListener('pm_admin_auth_updated', handleAuthUpdated);
    window.addEventListener('pm_trash_updated', handleTrashUpdated);
    window.addEventListener('pm_video_trash_updated', handleTrashUpdated);
    window.addEventListener('storage', handleAuthUpdated);
    window.addEventListener('storage', handleTrashUpdated);
    return () => {
      isMounted = false;
      window.removeEventListener('pm_admin_auth_updated', handleAuthUpdated);
      window.removeEventListener('pm_trash_updated', handleTrashUpdated);
      window.removeEventListener('pm_video_trash_updated', handleTrashUpdated);
      window.removeEventListener('storage', handleAuthUpdated);
      window.removeEventListener('storage', handleTrashUpdated);
    };
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Handle ESC key to close modals
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowLogoutModal(false);
        setShowPasswordModal(false);
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleOpenPasswordModal = () => {
    setSettingsEmail(getAdminEmail());
    setSettingsPw('');
    setSettingsConfirmPw('');
    setSettingsError('');
    setSettingsSuccess(false);
    setShowPasswordModal(true);
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSettingsError('');
    const trimmed = settingsEmail.trim().toLowerCase();
    if (!trimmed || !trimmed.includes('@')) {
      setSettingsError('Please enter a valid email address.');
      return;
    }
    if (settingsPw.length < 6) {
      setSettingsError('New password must be at least 6 characters.');
      return;
    }
    if (settingsPw !== settingsConfirmPw) {
      setSettingsError('Passwords do not match.');
      return;
    }
    updateAdminCredentials(trimmed, settingsPw);
    await flushToCodebase();
    setAdminEmail(trimmed);
    setSettingsSuccess(true);
    setTimeout(() => {
      setSettingsSuccess(false);
      setShowPasswordModal(false);
    }, 2000);
  };

  const handleLogout = () => {
    setShowLogoutModal(false);
    logout();
    navigate('/admin/login', { replace: true });
  };

  const getPageTitle = () => {
    if (location.pathname.includes('/admin/trash')) {
      return 'Recently Deleted';
    }
    if (location.pathname.includes('/admin/videos')) {
      return 'Video Management';
    }
    if (location.pathname.includes('/admin/featured')) {
      return 'Home Featured Images';
    }
    return 'Gallery Management';
  };

  return (
    <div className="h-screen h-dvh flex flex-col lg:flex-row bg-[#0f1a17] text-[#FAF7F0] overflow-hidden">
      <Helmet>
        <title>{getPageTitle()} | Admin Panel - Sri Poondi Mahan</title>
        <meta name="robots" content="noindex, nofollow, noarchive, nosnippet" />
        <meta name="googlebot" content="noindex, nofollow, noarchive, nosnippet" />
      </Helmet>
      {/* Mobile Top App Bar (visible on screens < lg, fixed at top) */}
      <header className="lg:hidden shrink-0 z-40 bg-[#0a1210]/95 backdrop-blur-md border-b border-[#1e3530] px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2.5">
          <img
            src="/images/poondimahan-logo.png"
            alt="Poondi Mahan"
            className="w-8 h-8 rounded-full object-cover ring-1 ring-[#B78A3B]/60"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
          <div>
            <p className="text-[#D8B86A] font-serif font-semibold text-xs leading-tight">Poondi Mahan</p>
            <p className="text-[#77736A] text-[9px] uppercase tracking-wider">Admin Panel</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Mobile Quick Logout */}
          <button
            type="button"
            onClick={() => setShowLogoutModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-950/40 border border-rose-800/40 text-rose-300 hover:text-white transition-colors cursor-pointer text-xs font-semibold"
            aria-label="Logout"
            title="Logout of admin panel"
          >
            <LogOut size={14} />
            <span className="hidden sm:inline">Logout</span>
          </button>

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl bg-[#173F35] text-[#FAF7F0] hover:text-[#D8B86A] transition-colors cursor-pointer"
            aria-label={mobileMenuOpen ? 'Close admin menu' : 'Open admin menu'}
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </header>

      {/* Mobile Backdrop Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/75 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar (drawer on mobile, permanently fixed column on desktop) */}
      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-50 w-72 bg-[#0a1210] border-r border-[#1e3530] flex flex-col transition-transform duration-300 ease-in-out lg:static lg:h-full lg:w-64 lg:shrink-0 lg:translate-x-0',
          mobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        )}
      >
        {/* Brand header */}
        <div className="p-5 sm:p-6 border-b border-[#1e3530] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <img
              src="/images/poondimahan-logo.png"
              alt="Poondi Mahan"
              className="w-10 h-10 rounded-full object-cover ring-2 ring-[#B78A3B]/50"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
            <div>
              <p className="text-[#D8B86A] font-serif font-semibold text-sm leading-tight">Poondi Mahan</p>
              <p className="text-[#77736A] text-[10px] uppercase tracking-widest">Admin Panel</p>
            </div>
          </div>

          {/* Close button on mobile inside drawer */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="p-1.5 rounded-lg text-[#77736A] hover:text-[#FAF7F0] lg:hidden cursor-pointer"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 sm:p-4 space-y-1.5 overflow-y-auto">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-3.5 sm:px-4 py-3 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer',
                  isActive
                    ? 'bg-[#173F35] text-[#D8B86A] shadow-sm'
                    : 'text-[#77736A] hover:bg-[#1a2e28] hover:text-[#FAF7F0]'
                )
              }
            >
              <Icon size={17} className="shrink-0" />
              <span className="truncate">{label}</span>
              {to === '/admin/trash' && trashCount > 0 ? (
                <span className="ml-auto px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#2a1a1a] text-[#f87171] border border-[#5a2a2a] shrink-0">
                  {trashCount}
                </span>
              ) : (
                <ChevronRight size={13} className="ml-auto opacity-50 shrink-0" />
              )}
            </NavLink>
          ))}
        </nav>

        {/* User + Change Password + Logout (Pinned at bottom of sidebar) */}
        <div className="p-3 sm:p-4 border-t border-[#1e3530] shrink-0 bg-[#0a1210] space-y-2.5">
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-[#1a2e28]">
            <div className="w-7 h-7 rounded-full bg-[#B78A3B] flex items-center justify-center shrink-0">
              <LayoutDashboard size={13} className="text-[#0a1210]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[9px] text-[#77736A] uppercase tracking-wide">Logged in as</p>
              <p className="text-xs text-[#FAF7F0] truncate font-mono" title={adminEmail}>
                {adminEmail}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleOpenPasswordModal}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#D8B86A] hover:text-[#FAF7F0] bg-[#173F35]/60 hover:bg-[#173F35] border border-[#2a5a4a] transition-colors cursor-pointer"
              title="Change admin password & email"
            >
              <KeyRound size={13} />
              <span>Password</span>
            </button>
            <button
              type="button"
              onClick={() => setShowLogoutModal(true)}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-300 hover:text-white bg-rose-950/30 hover:bg-rose-900/60 border border-rose-800/40 transition-colors cursor-pointer"
              title="Logout of admin panel"
            >
              <LogOut size={13} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area Container */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        {/* Desktop Top Header Menubar (Permanently fixed at top of content area) */}
        <header className="hidden lg:flex shrink-0 z-30 bg-[#0a1210]/95 backdrop-blur-md border-b border-[#1e3530] px-6 lg:px-8 py-3.5 items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-semibold text-[#77736A] uppercase tracking-wider">
              Admin
            </span>
            <span className="text-[#1e3530]">/</span>
            <span className="text-xs sm:text-sm font-semibold text-[#D8B86A]">
              {getPageTitle()}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/gallery"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-[#FAF7F0]/80 hover:text-[#FAF7F0] bg-[#1a2e28]/70 hover:bg-[#173F35] border border-[#2a5a4a]/60 transition-colors cursor-pointer"
              title="View Public Gallery in new tab"
            >
              <ExternalLink size={13} className="text-[#D8B86A]" />
              <span>View Live Site</span>
            </a>

            <div className="h-4 w-px bg-[#1e3530]" />

            {/* Clickable Admin Email Badge to change credentials */}
            <button
              type="button"
              onClick={handleOpenPasswordModal}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#173F35]/40 hover:bg-[#173F35]/70 border border-[#2a5a4a]/40 text-xs text-[#FAF7F0] transition-colors cursor-pointer group"
              title="Click to change password or email"
            >
              <KeyRound size={12} className="text-[#D8B86A] group-hover:scale-110 transition-transform" />
              <span className="font-mono text-xs text-[#FAF7F0]/90">{adminEmail}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowLogoutModal(true)}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-semibold bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 hover:text-white border border-rose-800/50 shadow-sm transition-all duration-150 cursor-pointer"
              title="Sign out of admin panel"
            >
              <LogOut size={14} />
              <span>Logout</span>
            </button>
          </div>
        </header>

        {/* Scrollable Main Content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden min-w-0 p-3.5 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>

      {/* Change Password & Email Modal */}
      {showPasswordModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setShowPasswordModal(false)}
        >
          <div
            className="bg-[#0f1a17] border border-[#1e3530] rounded-2xl sm:rounded-3xl p-5 sm:p-7 max-w-md w-full shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3.5 border-b border-[#1e3530]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#173F35] flex items-center justify-center text-[#D8B86A] shrink-0">
                  <KeyRound size={18} />
                </div>
                <div>
                  <h3 className="text-base font-serif font-bold text-[#FAF7F0]">
                    Admin Security Settings
                  </h3>
                  <p className="text-xs text-[#77736A]">
                    Update your admin email and password
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPasswordModal(false)}
                className="p-1 rounded-lg text-[#77736A] hover:text-[#FAF7F0] cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {settingsSuccess ? (
              <div className="flex items-center gap-3 bg-[#173F35]/50 border border-[#2a5a4a] rounded-xl p-4 text-[#4ade80]">
                <CheckCircle size={20} className="shrink-0" />
                <p className="text-xs font-semibold">
                  Admin credentials updated successfully!
                </p>
              </div>
            ) : (
              <form onSubmit={handleSaveSettings} className="space-y-4 pt-1">
                <div>
                  <label className="block text-[11px] font-semibold text-[#77736A] uppercase tracking-wider mb-1.5">
                    Admin Email Address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={settingsEmail}
                      onChange={(e) => setSettingsEmail(e.target.value)}
                      placeholder="admin@example.com"
                      className="w-full bg-[#0a1210] border border-[#1e3530] focus:border-[#B78A3B] text-[#FAF7F0] rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm outline-none transition-colors"
                      required
                    />
                    <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#77736A]" />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#77736A] uppercase tracking-wider mb-1.5">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showSettingsPw ? 'text' : 'password'}
                      value={settingsPw}
                      onChange={(e) => setSettingsPw(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full bg-[#0a1210] border border-[#1e3530] focus:border-[#B78A3B] text-[#FAF7F0] rounded-xl pl-10 pr-10 py-2.5 text-xs sm:text-sm outline-none transition-colors"
                      required
                    />
                    <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#77736A]" />
                    <button
                      type="button"
                      onClick={() => setShowSettingsPw(!showSettingsPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#77736A] hover:text-[#FAF7F0] cursor-pointer"
                    >
                      {showSettingsPw ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#77736A] uppercase tracking-wider mb-1.5">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showSettingsConfirmPw ? 'text' : 'password'}
                      value={settingsConfirmPw}
                      onChange={(e) => setSettingsConfirmPw(e.target.value)}
                      placeholder="Re-enter new password"
                      className="w-full bg-[#0a1210] border border-[#1e3530] focus:border-[#B78A3B] text-[#FAF7F0] rounded-xl pl-10 pr-10 py-2.5 text-xs sm:text-sm outline-none transition-colors"
                      required
                    />
                    <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#77736A]" />
                    <button
                      type="button"
                      onClick={() => setShowSettingsConfirmPw(!showSettingsConfirmPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#77736A] hover:text-[#FAF7F0] cursor-pointer"
                    >
                      {showSettingsConfirmPw ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                {settingsError && (
                  <div className="flex items-center gap-2 text-[#f87171] text-xs bg-[#2a1a1a] border border-[#5a2a2a] rounded-xl px-3.5 py-2">
                    <AlertCircle size={14} className="shrink-0" />
                    <span>{settingsError}</span>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowPasswordModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#1a2e28] hover:bg-[#173F35] text-[#FAF7F0] border border-[#2a5a4a] transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#B78A3B] hover:bg-[#D8B86A] text-[#0a1210] font-bold shadow-md transition-colors cursor-pointer"
                  >
                    Save Credentials
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setShowLogoutModal(false)}
        >
          <div
            className="bg-[#0a1210] border border-[#1e3530] rounded-2xl p-5 sm:p-6 max-w-sm w-full shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-rose-950/60 border border-rose-800/50 flex items-center justify-center text-rose-400 shrink-0">
                <LogOut size={20} />
              </div>
              <div>
                <h3 className="text-base font-serif font-bold text-[#FAF7F0]">Sign Out</h3>
                <p className="text-xs text-[#77736A] mt-0.5">
                  Are you sure you want to end your admin session?
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#1a2e28] hover:bg-[#173F35] text-[#FAF7F0] border border-[#2a5a4a] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white transition-colors cursor-pointer shadow-md"
              >
                <LogOut size={14} />
                <span>Yes, Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

