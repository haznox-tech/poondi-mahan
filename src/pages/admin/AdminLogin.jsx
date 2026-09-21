import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowLeft,
  KeyRound,
  ShieldCheck,
  ShieldAlert,
  Copy,
  Check,
  RotateCcw,
  Send,
} from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { useAdminAuth } from '../../admin/AdminAuthContext.jsx';
import { getAdminEmail, isResetAuthorized } from '../../admin/adminStore.js';
import EmailOtpVerification from '../../components/EmailOtpVerification.jsx';

function formatCountdown(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function AdminLogin() {
  const navigate = useNavigate();
  const {
    isAuthenticated,
    login,
    lockoutUntil,
    failedAttempts,
    resetFlow,
    setResetFlow,
    resetEmail,
    setResetEmail,
    resetOtpPreview,
    otpExpiresAt,
    resetToken,
    resetDone,
    startForgotPasswordFlow,
    sendOtp,
    confirmOtp,
    saveNewPassword,
    cancelReset,
  } = useAdminAuth();

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState('');

  // New Password step state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [pwError, setPwError] = useState('');
  const [isSavingPw, setIsSavingPw] = useState(false);
  const [pwSuccess, setPwSuccess] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) navigate('/admin/gallery', { replace: true });
  }, [isAuthenticated, navigate]);

  // Lockout countdown timer
  useEffect(() => {
    if (!lockoutUntil) {
      setCountdown('');
      return;
    }
    const update = () => {
      const remaining = lockoutUntil - Date.now();
      if (remaining <= 0) {
        setCountdown('');
        return;
      }
      setCountdown(formatCountdown(remaining));
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [lockoutUntil]);

  // Handle Login submission
  const handleLogin = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError('');
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    const result = login(email, password);
    setLoading(false);
    if (result.success) {
      navigate('/admin/gallery', { replace: true });
    } else if (result.locked) {
      setError('Too many failed attempts. Account locked. Please wait.');
    } else {
      const remaining = 3 - failedAttempts;
      setError(
        `Invalid email or password. ${
          remaining > 0 ? `${remaining} attempt${remaining === 1 ? '' : 's'} remaining.` : ''
        }`
      );
    }
  };

  // Start Forgot Password Flow
  const handleStartForgotPassword = () => {
    setError('');
    startForgotPasswordFlow(email.trim() || getAdminEmail());
  };

  // Step 3: Save New Password
  const handleSaveNewPassword = async (e) => {
    e.preventDefault();
    setPwError('');

    if (newPassword.length < 6) {
      setPwError('Password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError('Passwords do not match. Please verify.');
      return;
    }

    setIsSavingPw(true);
    const res = await saveNewPassword(newPassword, resetEmail);
    setIsSavingPw(false);

    if (!res.success) {
      setPwError(res.error || 'Failed to update password.');
    } else {
      setPwSuccess(true);
      setEmail(resetEmail);
      setTimeout(() => {
        setPwSuccess(false);
        cancelReset();
      }, 2000);
    }
  };

  // -------------------------------------------------------------------------
  // RENDER: Screen 1 & Screen 2 — Dedicated Email & 6-Box OTP Verification Flow
  // -------------------------------------------------------------------------
  if (resetFlow === 'otp_request' || resetFlow === 'otp_verify') {
    return (
      <div className="min-h-screen bg-[#0a1210] flex items-center justify-center px-3.5 sm:px-4 py-8 relative overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#173F35]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[#B78A3B]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 w-full flex justify-center">
          <EmailOtpVerification
            initialEmail={resetEmail || email || getAdminEmail()}
            requireMatchingEmail={(enteredEmail) => {
              const currentAdmin = getAdminEmail().toLowerCase();
              if (enteredEmail.toLowerCase() !== currentAdmin) {
                return {
                  valid: false,
                  error: 'The entered email does not match the registered admin account.',
                };
              }
              return { valid: true };
            }}
            onVerified={({ email: verifiedEmail, verificationToken }) => {
              if (verifiedEmail && typeof setResetEmail === 'function') setResetEmail(verifiedEmail);
              if (verificationToken && typeof setResetToken === 'function') setResetToken(verificationToken);
              setResetFlow('new_password');
            }}
            onCancel={cancelReset}
          />
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // RENDER: STEP 3 — Create New Password (Strictly Protected by OTP Token)
  // -------------------------------------------------------------------------
  if (resetFlow === 'new_password') {
    // Security check: If unverified or unauthorized, strictly deny access!
    const isAuthorized = isResetAuthorized(resetToken);

    if (!isAuthorized) {
      return (
        <div className="min-h-screen bg-[#0a1210] flex items-center justify-center px-3.5 sm:px-4 py-8 relative overflow-hidden">
          <div className="w-full max-w-md relative z-10">
            <div className="bg-[#1f1313] border border-[#5a2a2a] rounded-2xl sm:rounded-3xl p-6 sm:p-8 text-center shadow-2xl space-y-4">
              <div className="w-12 h-12 rounded-full bg-[#3a1a1a] text-[#f87171] flex items-center justify-center mx-auto">
                <ShieldAlert size={26} />
              </div>
              <div>
                <h3 className="text-base font-serif font-bold text-[#FAF7F0] mb-1">
                  Access Denied
                </h3>
                <p className="text-xs text-[#f87171] leading-relaxed">
                  You must verify your OTP code before accessing the password change page.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setResetFlow('otp_request')}
                className="w-full bg-[#B78A3B] hover:bg-[#D8B86A] text-[#0a1210] font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
              >
                Request Verification Code
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-[#0a1210] flex items-center justify-center px-3.5 sm:px-4 py-8 relative overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#173F35]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[#B78A3B]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-md relative z-10">
          <div className="bg-[#0f1a17] border border-[#1e3530] rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-5 sm:mb-6 pb-4 border-b border-[#1e3530]">
              <div className="w-10 h-10 rounded-xl bg-[#173F35] flex items-center justify-center text-[#D8B86A] shrink-0 shadow-sm">
                <KeyRound size={18} />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-serif font-semibold text-[#FAF7F0]">
                  Create New Password
                </h2>
                <p className="text-[#77736A] text-[11px] sm:text-xs">
                  Step 3 of 3: Authorized for <span className="text-[#D8B86A]">{resetEmail}</span>
                </p>
              </div>
            </div>

            {pwSuccess ? (
              <div className="space-y-4 py-4 text-center animate-in fade-in duration-200">
                <div className="w-12 h-12 rounded-full bg-[#173F35] text-[#4ade80] flex items-center justify-center mx-auto">
                  <CheckCircle size={26} />
                </div>
                <div>
                  <h3 className="text-sm font-serif font-bold text-[#FAF7F0] mb-1">
                    Password Changed Successfully!
                  </h3>
                  <p className="text-xs text-[#77736A]">
                    Your new admin credentials have been saved. Returning to login...
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSaveNewPassword} className="space-y-4">
                {/* Verified Email Banner */}
                <div className="bg-[#0a1210] border border-[#1e3530] rounded-xl px-3.5 py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mail size={14} className="text-[#B78A3B]" />
                    <span className="text-xs text-[#FAF7F0] font-mono">{resetEmail}</span>
                  </div>
                  <span className="text-[10px] bg-[#173F35] text-[#4ade80] font-semibold px-2 py-0.5 rounded-md flex items-center gap-1">
                    <Check size={10} /> Verified
                  </span>
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-[11px] sm:text-xs font-semibold text-[#77736A] uppercase tracking-widest mb-1.5">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPw ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full bg-[#0a1210] border border-[#1e3530] focus:border-[#B78A3B] text-[#FAF7F0] placeholder-[#3a4a47] rounded-xl pl-10 pr-10 py-2.5 sm:py-3 text-xs sm:text-sm outline-none transition-colors"
                      required
                      autoFocus
                    />
                    <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#77736A]" />
                    <button
                      type="button"
                      onClick={() => setShowNewPw(!showNewPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#77736A] hover:text-[#FAF7F0] cursor-pointer"
                      aria-label={showNewPw ? 'Hide password' : 'Show password'}
                    >
                      {showNewPw ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-[11px] sm:text-xs font-semibold text-[#77736A] uppercase tracking-widest mb-1.5">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPw ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      className="w-full bg-[#0a1210] border border-[#1e3530] focus:border-[#B78A3B] text-[#FAF7F0] placeholder-[#3a4a47] rounded-xl pl-10 pr-10 py-2.5 sm:py-3 text-xs sm:text-sm outline-none transition-colors"
                      required
                    />
                    <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#77736A]" />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPw(!showConfirmPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#77736A] hover:text-[#FAF7F0] cursor-pointer"
                      aria-label={showConfirmPw ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPw ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                {pwError && (
                  <div className="flex items-center gap-2 text-[#f87171] text-xs bg-[#2a1a1a] border border-[#5a2a2a] rounded-xl px-3.5 py-2.5">
                    <AlertCircle size={14} className="shrink-0" />
                    <span>{pwError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSavingPw}
                  className="w-full bg-[#B78A3B] hover:bg-[#D8B86A] disabled:opacity-50 text-[#0a1210] font-bold py-2.5 sm:py-3 rounded-xl transition-colors duration-200 cursor-pointer text-xs sm:text-sm shadow-md shadow-[#B78A3B]/20 mt-2 flex items-center justify-center gap-2"
                >
                  {isSavingPw ? (
                    <>
                      <span className="w-4 h-4 border-2 border-[#0a1210]/30 border-t-[#0a1210] rounded-full animate-spin" />
                      <span>Saving New Password...</span>
                    </>
                  ) : (
                    'Update & Save Password'
                  )}
                </button>

                <button
                  type="button"
                  onClick={cancelReset}
                  className="w-full flex items-center justify-center gap-2 text-xs sm:text-sm text-[#77736A] hover:text-[#FAF7F0] transition-colors py-2 cursor-pointer"
                >
                  <ArrowLeft size={13} />
                  <span>Cancel & Back to Login</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // RENDER: MAIN LOGIN SCREEN
  // -------------------------------------------------------------------------
  const isLocked = Boolean(lockoutUntil);

  return (
    <div className="min-h-screen bg-[#0a1210] flex items-center justify-center px-3.5 sm:px-4 py-6 sm:py-10 relative overflow-hidden">
      <Helmet>
        <title>Admin Login | Sri Poondi Mahan</title>
        <meta name="robots" content="noindex, nofollow, noarchive, nosnippet" />
        <meta name="googlebot" content="noindex, nofollow, noarchive, nosnippet" />
      </Helmet>
      {/* Decorative background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#B78A3B]/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-[#173F35]/20 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Card */}
        <div className="bg-[#0f1a17] border border-[#1e3530] rounded-2xl sm:rounded-3xl shadow-2xl shadow-black/50 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-br from-[#173F35] to-[#0E2D27] px-5 sm:px-8 pt-6 sm:pt-8 pb-5 sm:pb-6 text-center border-b border-[#1e3530]">
            <div className="flex justify-center mb-3 sm:mb-4">
              <div className="relative">
                <div className="absolute inset-0 bg-[#B78A3B]/20 rounded-full blur-xl scale-125" />
                <img
                  src="/images/poondimahan-logo.png"
                  alt="Poondi Mahan Logo"
                  className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover ring-2 ring-[#B78A3B]/60 shadow-xl"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              </div>
            </div>
            <h1 className="text-lg sm:text-xl font-serif font-bold text-[#D8B86A] tracking-wide mb-0.5">Sri Poondi Mahan</h1>
            <p className="text-[#77736A] text-[10px] sm:text-xs uppercase tracking-[0.2em]">Attru Swamy Ashramam</p>
            <div className="mt-3 sm:mt-4 inline-flex items-center gap-1.5 sm:gap-2 bg-[#0a1210]/40 border border-[#1e3530] rounded-full px-3 sm:px-4 py-1 sm:py-1.5">
              <Lock size={11} className="text-[#B78A3B]" />
              <span className="text-[#FAF7F0] text-[10px] sm:text-xs font-semibold tracking-widest uppercase">Admin Login</span>
            </div>
          </div>

          {/* Form */}
          <div className="px-5 sm:px-8 py-5 sm:py-8">
            {/* Lockout banner */}
            {isLocked && (
              <div className="mb-5 bg-[#2a1a1a] border border-[#5a2a2a] rounded-xl sm:rounded-2xl p-3.5 sm:p-4">
                <div className="flex items-center gap-2 text-[#f87171] mb-1.5">
                  <Clock size={15} className="shrink-0" />
                  <span className="font-semibold text-xs sm:text-sm">Account Temporarily Locked</span>
                </div>
                <p className="text-[#f87171]/70 text-[11px] sm:text-xs mb-2.5">3 failed login attempts. Please wait or unlock using email verification.</p>
                <div className="text-center mb-3">
                  <span className="text-[#f87171] font-mono text-xl sm:text-2xl font-bold">{countdown}</span>
                  <p className="text-[#f87171]/50 text-[9px] sm:text-[10px] mt-0.5">remaining</p>
                </div>
                <button
                  type="button"
                  onClick={handleStartForgotPassword}
                  className="w-full bg-[#B78A3B] hover:bg-[#D8B86A] text-[#0a1210] font-bold py-2 rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Unlock & Reset Password via Email OTP
                </button>
              </div>
            )}

            {resetDone && (
              <div className="mb-4 flex items-center gap-2 bg-[#173F35]/50 border border-[#2a5a4a] rounded-xl p-3">
                <CheckCircle size={15} className="text-[#4ade80] shrink-0" />
                <p className="text-[#4ade80] text-xs">Password updated successfully! You can now log in.</p>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4 sm:space-y-5">
              {/* Email */}
              <div>
                <label htmlFor="admin-email" className="block text-[11px] sm:text-xs font-semibold text-[#77736A] uppercase tracking-widest mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#3a4a47]" />
                  <input
                    id="admin-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@example.com"
                    disabled={isLocked}
                    required
                    autoComplete="username"
                    className="w-full bg-[#0a1210] border border-[#1e3530] focus:border-[#B78A3B] text-[#FAF7F0] placeholder-[#3a4a47] rounded-xl pl-10 pr-3.5 py-2.5 sm:py-3 text-xs sm:text-sm outline-none transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="admin-password" className="block text-[11px] sm:text-xs font-semibold text-[#77736A] uppercase tracking-widest mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#3a4a47]" />
                  <input
                    id="admin-password"
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    disabled={isLocked}
                    required
                    autoComplete="current-password"
                    className="w-full bg-[#0a1210] border border-[#1e3530] focus:border-[#B78A3B] text-[#FAF7F0] placeholder-[#3a4a47] rounded-xl pl-10 pr-10 py-2.5 sm:py-3 text-xs sm:text-sm outline-none transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    disabled={isLocked}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#77736A] hover:text-[#FAF7F0] transition-colors cursor-pointer disabled:opacity-40"
                    aria-label={showPw ? 'Hide password' : 'Show password'}
                  >
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Forgot Password */}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleStartForgotPassword}
                  className="text-xs text-[#B78A3B] hover:text-[#D8B86A] transition-colors cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-start gap-2 bg-[#2a1a1a] border border-[#5a2a2a] rounded-xl px-3.5 py-2.5">
                  <AlertCircle size={14} className="text-[#f87171] shrink-0 mt-0.5" />
                  <p className="text-[#f87171] text-xs leading-relaxed">{error}</p>
                </div>
              )}

              {/* Attempt indicator */}
              {failedAttempts > 0 && !isLocked && (
                <div className="flex items-center gap-2">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className={`h-1.5 flex-1 rounded-full transition-colors ${
                        i < failedAttempts ? 'bg-[#f87171]' : 'bg-[#1e3530]'
                      }`}
                    />
                  ))}
                  <span className="text-[10px] text-[#77736A]">{failedAttempts}/3 attempts</span>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={isLocked || loading}
                className="w-full bg-[#B78A3B] hover:bg-[#D8B86A] disabled:opacity-50 disabled:cursor-not-allowed text-[#0a1210] font-bold py-3 sm:py-3.5 rounded-xl transition-all duration-200 active:scale-[0.98] text-xs sm:text-sm tracking-wide shadow-lg shadow-[#B78A3B]/20 cursor-pointer flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-[#0a1210]/30 border-t-[#0a1210] rounded-full animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  'Login to Admin Panel'
                )}
              </button>
            </form>

            {/* Security note */}
            <p className="text-center text-[#3a4a47] text-[10px] mt-5 sm:mt-6">
              Secured by 3-attempt lockout &bull; 3-hour cooldown period &bull; OTP verification
            </p>
          </div>
        </div>

        {/* Footer link back to site */}
        <div className="text-center mt-5 sm:mt-6">
          <a href="/" className="text-[#77736A] text-xs hover:text-[#FAF7F0] transition-colors">
            &larr; Back to Sri Poondi Mahan Website
          </a>
        </div>
      </div>
    </div>
  );
}

