import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  getAdminEmailHint,
  requestPasswordResetOtp,
  verifyPasswordResetOtp,
  isResetAuthorized,
  completePasswordReset,
  clearOtpSession,
  getActiveOtpSession,
} from './adminStore.js';

const AdminAuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [lockoutUntil, setLockoutUntil] = useState(null);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [adminEmail, setAdminEmail] = useState('');

  // Forgot Password OTP Flow state
  // resetFlow: null | 'otp_request' | 'otp_verify' | 'new_password'
  const [resetFlow, setResetFlow] = useState(null);
  const [resetEmail, setResetEmail] = useState('');
  const [resetToken, setResetToken] = useState(null);
  const [resetOtpPreview, setResetOtpPreview] = useState('');
  const [otpExpiresAt, setOtpExpiresAt] = useState(null);
  const [resetDone, setResetDone] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/auth/session', { credentials: 'include' });
        const data = await res.json().catch(() => ({}));
        setIsAuthenticated(Boolean(data.authenticated));
        if (data.email) setAdminEmail(data.email);
        if (data.lockoutUntil) setLockoutUntil(data.lockoutUntil);
        if (typeof data.attemptsRemaining === 'number') {
          setFailedAttempts(Math.max(0, 3 - data.attemptsRemaining));
        }
      } catch {
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    })();

    // Check if there was an active OTP reset session
    const active = getActiveOtpSession();
    if (active) {
      if (active.email) setResetEmail(active.email);
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
        clearInterval(interval);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutUntil]);

  const login = useCallback(async (email, password) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));

      if (!data.ok) {
        if (data.lockoutUntil) setLockoutUntil(data.lockoutUntil);
        if (typeof data.attemptsRemaining === 'number') {
          setFailedAttempts(Math.max(0, 3 - data.attemptsRemaining));
        }
        return { success: false, locked: Boolean(data.locked), wrongCredentials: !data.locked };
      }

      setFailedAttempts(0);
      setLockoutUntil(null);
      setIsAuthenticated(true);
      if (data.email) setAdminEmail(data.email);
      return { success: true };
    } catch {
      return { success: false, error: 'Network error connecting to the server.' };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch {
      // ignore network errors on logout — still clear local state
    }
    setIsAuthenticated(false);
  }, []);

  // Change email/password for the current authenticated session.
  const changePassword = useCallback(async (currentPassword, newEmail, newPassword) => {
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ currentPassword, newEmail, newPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        return { success: false, error: data.error || 'Failed to update credentials.' };
      }
      if (data.email) setAdminEmail(data.email);
      return { success: true, email: data.email };
    } catch {
      return { success: false, error: 'Network error connecting to the server.' };
    }
  }, []);

  // OTP Password Reset Flow Actions
  const startForgotPasswordFlow = useCallback((initialEmail) => {
    const defaultEmail = initialEmail || getAdminEmailHint();
    setResetEmail(defaultEmail);
    setResetToken(null);
    setResetOtpPreview('');
    setOtpExpiresAt(null);
    setResetFlow('otp_request');
  }, []);

  const sendOtp = useCallback(async (targetEmail) => {
    const res = await requestPasswordResetOtp(targetEmail);
    if (res.success) {
      setResetEmail(res.email);
      setOtpExpiresAt(Date.now() + 10 * 60 * 1000);
      setResetFlow('otp_verify');
    }
    return res;
  }, []);

  const confirmOtp = useCallback(async (inputCode) => {
    const res = await verifyPasswordResetOtp(inputCode, resetEmail);
    if (res.success) {
      setResetToken(res.verificationToken);
      setResetFlow('new_password');
    }
    return res;
  }, [resetEmail]);

  const saveNewPassword = useCallback(async (newPassword, optionalNewEmail) => {
    const activeToken = resetToken || getActiveOtpSession()?.token;
    if (!activeToken || !isResetAuthorized(activeToken)) {
      return { success: false, error: 'Access denied: Please verify with OTP code first.' };
    }

    const targetEmail = optionalNewEmail || resetEmail;
    const res = await completePasswordReset(activeToken, newPassword, targetEmail);
    if (res.success) {
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
        isLoading,
        login,
        logout,
        changePassword,
        adminEmail,
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
