import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  initCredentials,
  verifyPassword,
  isLockedOut,
  getLockoutUntil,
  getFailedAttempts,
  recordFailedAttempt,
  resetLockout,
  getAdminEmail,
  requestPasswordResetOtp,
  verifyPasswordResetOtp,
  isResetAuthorized,
  completePasswordReset,
  clearOtpSession,
  getActiveOtpSession,
} from './adminStore.js';

const AdminAuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem('pm_admin_auth') === 'true';
  });
  const [lockoutUntil, setLockoutUntil] = useState(() => getLockoutUntil());
  const [failedAttempts, setFailedAttempts] = useState(() => getFailedAttempts());

  // Forgot Password OTP Flow state
  // resetFlow: null | 'otp_request' | 'otp_verify' | 'new_password'
  const [resetFlow, setResetFlow] = useState(null);
  const [resetEmail, setResetEmail] = useState('');
  const [resetToken, setResetToken] = useState(null);
  const [resetOtpPreview, setResetOtpPreview] = useState('');
  const [otpExpiresAt, setOtpExpiresAt] = useState(null);
  const [resetDone, setResetDone] = useState(false);

  useEffect(() => {
    initCredentials();
    // Check if there was an active session
    const active = getActiveOtpSession();
    if (active) {
      if (active.email) setResetEmail(active.email);
      if (active.code) setResetOtpPreview(active.code);
      if (active.expiresAt) setOtpExpiresAt(active.expiresAt);
      if (active.token) {
        setResetToken(active.token);
        setResetFlow('new_password');
      } else if (active.email) {
        setResetFlow('otp_verify');
      }
    }
  }, []);

  useEffect(() => {
    if (!lockoutUntil) return;
    const interval = setInterval(() => {
      if (Date.now() >= lockoutUntil) {
        setLockoutUntil(null);
        setFailedAttempts(0);
        resetLockout();
        clearInterval(interval);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutUntil]);

  const login = useCallback((email, password) => {
    if (isLockedOut()) {
      setLockoutUntil(getLockoutUntil());
      return { success: false, locked: true };
    }

    const adminEmail = getAdminEmail();
    if (email.trim().toLowerCase() !== adminEmail.toLowerCase()) {
      recordFailedAttempt();
      const attempts = getFailedAttempts();
      setFailedAttempts(attempts);
      if (isLockedOut()) setLockoutUntil(getLockoutUntil());
      return { success: false, locked: false, wrongCredentials: true };
    }

    if (!verifyPassword(password)) {
      recordFailedAttempt();
      const attempts = getFailedAttempts();
      setFailedAttempts(attempts);
      if (isLockedOut()) setLockoutUntil(getLockoutUntil());
      return { success: false, locked: isLockedOut(), wrongCredentials: true };
    }

    resetLockout();
    setFailedAttempts(0);
    setLockoutUntil(null);
    sessionStorage.setItem('pm_admin_auth', 'true');
    setIsAuthenticated(true);
    return { success: true };
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem('pm_admin_auth');
    setIsAuthenticated(false);
  }, []);

  // OTP Password Reset Flow Actions
  const startForgotPasswordFlow = useCallback((initialEmail) => {
    const defaultEmail = initialEmail || getAdminEmail();
    setResetEmail(defaultEmail);
    setResetToken(null);
    setResetOtpPreview('');
    setOtpExpiresAt(null);
    setResetFlow('otp_request');
  }, []);

  const sendOtp = useCallback((targetEmail) => {
    const res = requestPasswordResetOtp(targetEmail);
    if (res.success) {
      setResetEmail(res.email);
      setResetOtpPreview(res.code || '');
      setOtpExpiresAt(res.expiresAt || null);
      setResetFlow('otp_verify');
    }
    return res;
  }, []);

  const confirmOtp = useCallback((inputCode) => {
    const res = verifyPasswordResetOtp(inputCode);
    if (res.success) {
      setResetToken(res.token);
      setResetFlow('new_password');
    }
    return res;
  }, []);

  const saveNewPassword = useCallback(async (newPassword, optionalNewEmail) => {
    const activeToken = resetToken || getActiveOtpSession()?.token;
    if (!activeToken || !isResetAuthorized(activeToken)) {
      return { success: false, error: 'Access denied: Please verify with OTP code first.' };
    }

    const targetEmail = optionalNewEmail || resetEmail || getAdminEmail();
    const res = await completePasswordReset(activeToken, newPassword, targetEmail);
    if (res.success) {
      resetLockout();
      setFailedAttempts(0);
      setLockoutUntil(null);
      setResetDone(true);
      setTimeout(() => setResetDone(false), 8000);
    }
    return res;
  }, [resetToken, resetEmail]);

  const cancelReset = useCallback(() => {
    clearOtpSession();
    setResetFlow(null);
    setResetToken(null);
    setResetEmail('');
    setResetOtpPreview('');
    setOtpExpiresAt(null);
  }, []);

  return (
    <AdminAuthContext.Provider
      value={{
        isAuthenticated,
        login,
        logout,
        lockoutUntil,
        failedAttempts,
        // OTP Forgot Password exports
        resetFlow,
        setResetFlow,
        resetEmail,
        setResetEmail,
        resetOtpPreview,
        setResetOtpPreview,
        otpExpiresAt,
        setOtpExpiresAt,
        resetToken,
        setResetToken,
        resetDone,
        setResetDone,
        startForgotPasswordFlow,
        sendOtp,
        confirmOtp,
        saveNewPassword,
        cancelReset,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used inside AdminAuthProvider');
  return ctx;
}
