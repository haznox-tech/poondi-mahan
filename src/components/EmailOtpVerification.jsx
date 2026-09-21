import React, { useState, useEffect, useRef } from 'react';
import {
  Mail,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowLeft,
  RotateCcw,
  Check,
} from 'lucide-react';

/**
 * Validate email format using standard RFC 5322 compatible regex
 */
function isValidEmail(email) {
  const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return re.test(String(email).trim().toLowerCase());
}

/**
 * Mask email address for user privacy (e.g. j***e@example.com)
 */
function maskEmailAddress(email) {
  if (!email || !email.includes('@')) return email || '';
  const [user, domain] = email.split('@');
  if (user.length <= 2) return `${user[0]}*@${domain}`;
  const maskedMiddle = '*'.repeat(Math.min(user.length - 2, 4));
  return `${user[0]}${maskedMiddle}${user.slice(-1)}@${domain}`;
}

export default function EmailOtpVerification({
  initialEmail = '',
  onVerified,
  onCancel,
  requireMatchingEmail = null, // Optional callback or email string to restrict allowed emails (e.g. admin email)
  title = 'Verify Your Email',
  subtitle = "Enter your email address and we'll send you a verification code.",
}) {
  // Step in the verification flow: 'enter_email' | 'enter_code' | 'verified'
  const [step, setStep] = useState('enter_email');

  // Screen 1: Email State
  const [email, setEmail] = useState(initialEmail);
  const [emailError, setEmailError] = useState('');
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [serverMessage, setServerMessage] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');

  // Screen 2: 6-Box OTP State
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendSuccess, setResendSuccess] = useState(false);

  // Screen 3: Verified State
  const [verificationData, setVerificationData] = useState(null);

  // Refs for 6 separate input boxes
  const inputRefs = useRef([]);

  // Resend Countdown Timer (30 seconds)
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  // Focus the first input box when moving to the OTP screen
  useEffect(() => {
    if (step === 'enter_code') {
      setTimeout(() => {
        if (inputRefs.current[0]) {
          inputRefs.current[0].focus();
          inputRefs.current[0].select();
        }
      }, 100);
    }
  }, [step]);

  // ---------------------------------------------------------------------------
  // Action 1: Send Verification Code
  // ---------------------------------------------------------------------------
  const handleSendCode = async (e) => {
    if (e) e.preventDefault();
    setEmailError('');
    setServerMessage('');

    const trimmedEmail = email.trim().toLowerCase();

    // 1. Format validation
    if (!trimmedEmail) {
      setEmailError('Please enter your email address.');
      return;
    }
    if (!isValidEmail(trimmedEmail)) {
      setEmailError('Please enter a valid email address.');
      return;
    }

    // Optional domain/recipient check
    if (requireMatchingEmail && typeof requireMatchingEmail === 'string') {
      if (trimmedEmail !== requireMatchingEmail.toLowerCase()) {
        setEmailError('This email is not registered for admin recovery.');
        return;
      }
    } else if (typeof requireMatchingEmail === 'function') {
      const check = requireMatchingEmail(trimmedEmail);
      if (!check.valid) {
        setEmailError(check.error || 'This email address is not authorized.');
        return;
      }
    }

    setIsSendingCode(true);

    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmedEmail }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.ok) {
        setEmailError(data.error || 'Failed to send verification code. Please try again.');
        setIsSendingCode(false);
        return;
      }

      // Success: advance to Screen 2
      setMaskedEmail(data.maskedEmail || maskEmailAddress(trimmedEmail));
      setServerMessage(data.message || "We've sent a 6-digit verification code to your email address.");
      setResendCooldown(data.resendIn || 30);
      setOtpDigits(['', '', '', '', '', '']);
      setOtpError('');
      setStep('enter_code');
    } catch (err) {
      setEmailError('Network error connecting to verification service.');
    } finally {
      setIsSendingCode(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Action 2: Handle 6-Box OTP Input Interactions
  // ---------------------------------------------------------------------------
  const handleOtpChange = (index, value) => {
    setOtpError('');
    // Strip non-numeric characters
    const cleanVal = value.replace(/\D/g, '');

    // Handle standard single-digit typing
    if (cleanVal.length <= 1) {
      const nextDigits = [...otpDigits];
      nextDigits[index] = cleanVal;
      setOtpDigits(nextDigits);

      // Auto-advance to next box if character was entered
      if (cleanVal && index < 5 && inputRefs.current[index + 1]) {
        inputRefs.current[index + 1].focus();
        inputRefs.current[index + 1].select();
      }
    } else if (cleanVal.length > 1) {
      // User typed or pasted multiple characters into this single input
      handlePasteData(cleanVal, index);
    }
  };

  const handleKeyDown = (index, e) => {
    // Backspace navigation: if current box is empty, move to previous box
    if (e.key === 'Backspace') {
      if (!otpDigits[index] && index > 0 && inputRefs.current[index - 1]) {
        e.preventDefault();
        const nextDigits = [...otpDigits];
        nextDigits[index - 1] = '';
        setOtpDigits(nextDigits);
        inputRefs.current[index - 1].focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    handlePasteData(pastedText, 0);
  };

  const handlePasteData = (text, startIndex = 0) => {
    const cleanNumbers = text.replace(/\D/g, '').slice(0, 6);
    if (!cleanNumbers) return;

    const nextDigits = [...otpDigits];
    for (let i = 0; i < 6; i++) {
      if (i >= startIndex && i < startIndex + cleanNumbers.length) {
        nextDigits[i] = cleanNumbers[i - startIndex] || '';
      }
    }
    setOtpDigits(nextDigits);

    // Focus the box following the last pasted digit, or box 5 if full
    const targetIndex = Math.min(5, startIndex + cleanNumbers.length);
    if (inputRefs.current[targetIndex]) {
      inputRefs.current[targetIndex].focus();
    }
  };

  // ---------------------------------------------------------------------------
  // Action 3: Verify OTP Code
  // ---------------------------------------------------------------------------
  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    setOtpError('');

    const fullCode = otpDigits.join('');

    if (fullCode.length < 6) {
      setOtpError('Please enter all 6 digits of your verification code.');
      return;
    }

    setIsVerifying(true);

    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          otp: fullCode,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.ok) {
        // Specific user-requested error messages
        if (response.status === 429) {
          setOtpError(data.error || 'Too many invalid attempts. Please request a new code.');
        } else if (data.error && data.error.includes('expired')) {
          setOtpError('This verification code has expired. Please request a new code.');
        } else {
          setOtpError('Invalid verification code. Please try again.');
        }
        setIsVerifying(false);
        return;
      }

      // Success: Save token to sessionStorage for authorization checks
      const targetEmail = email.trim().toLowerCase();
      if (typeof window !== 'undefined' && data.verificationToken) {
        sessionStorage.setItem('pm_admin_verified_token', JSON.stringify({
          token: data.verificationToken,
          email: targetEmail,
          verified: true,
          savedAt: Date.now(),
        }));
      }

      const verifiedResult = {
        email: targetEmail,
        verificationToken: data.verificationToken,
      };

      setVerificationData(verifiedResult);
      setStep('verified');
      setIsVerifying(false);

      // Trigger callback after a brief celebratory moment
      if (onVerified) {
        setTimeout(() => {
          onVerified(verifiedResult);
        }, 900);
      }
    } catch (err) {
      setOtpError('Network error connecting to verification service.');
      setIsVerifying(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Action 4: Resend Verification Code
  // ---------------------------------------------------------------------------
  const handleResendCode = async () => {
    if (resendCooldown > 0 || isSendingCode) return;
    setOtpError('');
    setIsSendingCode(true);

    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.ok) {
        setOtpError(data.error || 'Failed to resend code. Please wait a moment.');
        setIsSendingCode(false);
        return;
      }

      setResendCooldown(data.resendIn || 30);
      setOtpDigits(['', '', '', '', '', '']);
      setResendSuccess(true);
      setTimeout(() => setResendSuccess(false), 3000);

      // Refocus first input
      if (inputRefs.current[0]) {
        inputRefs.current[0].focus();
      }
    } catch {
      setOtpError('Network error connecting to server.');
    } finally {
      setIsSendingCode(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Action 5: Change Email (Back to Screen 1)
  // ---------------------------------------------------------------------------
  const handleChangeEmail = () => {
    setStep('enter_email');
    setOtpDigits(['', '', '', '', '', '']);
    setOtpError('');
    setEmailError('');
  };

  // ===========================================================================
  // RENDER: Screen 3 — Successful Verification
  // ===========================================================================
  if (step === 'verified') {
    return (
      <div className="w-full max-w-md bg-[#0f1a17] border border-[#1e3530] rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-2xl text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#173F35] border border-[#2a4d41] text-[#4ade80] flex items-center justify-center mx-auto mb-5 shadow-lg shadow-[#4ade80]/10">
          <CheckCircle2 size={36} />
        </div>

        <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#FAF7F0] mb-2">
          Email verified successfully!
        </h2>
        <p className="text-xs sm:text-sm text-[#A69B89] mb-6">
          Your identity for <span className="text-[#D8B86A] font-medium">{email}</span> has been confirmed.
        </p>

        <div className="pt-4 border-t border-[#1e3530] flex flex-col items-center gap-3">
          <div className="flex items-center justify-center gap-2 text-xs text-[#77736A]">
            <Loader2 size={14} className="animate-spin text-[#B78A3B]" />
            <span>Redirecting to create new password...</span>
          </div>
          <button
            type="button"
            onClick={() => {
              const token = (typeof window !== 'undefined') ? JSON.parse(sessionStorage.getItem('pm_admin_verified_token') || '{}').token : null;
              if (onVerified) onVerified(verificationData || { email, verificationToken: token });
            }}
            className="text-xs text-[#B78A3B] hover:text-[#FAF7F0] font-semibold underline cursor-pointer"
          >
            Click here if not redirected automatically
          </button>
        </div>
      </div>
    );
  }

  // ===========================================================================
  // RENDER: Screen 2 — Enter Verification Code (6 Separate Boxes)
  // ===========================================================================
  if (step === 'enter_code') {
    return (
      <div className="w-full max-w-md bg-[#0f1a17] border border-[#1e3530] rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-2xl">
        {/* Header with Shield Icon */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-[#173F35] border border-[#2a4d41] flex items-center justify-center text-[#D8B86A] shadow-md shadow-[#B78A3B]/10 mb-3.5">
            <ShieldCheck size={28} />
          </div>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#FAF7F0]">
            Enter Verification Code
          </h2>
          <p className="text-xs sm:text-sm text-[#A69B89] mt-1.5 leading-relaxed">
            Enter the 6-digit code sent to <span className="text-[#D8B86A] font-mono font-medium">{maskedEmail}</span>.
          </p>
        </div>

        {/* 6-Digit OTP Inputs */}
        <form onSubmit={handleVerifyOtp} className="space-y-5">
          <div>
            <div className="flex items-center justify-between gap-1.5 sm:gap-2.5 my-2">
              {otpDigits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => (inputRefs.current[idx] = el)}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  onPaste={idx === 0 ? handlePaste : undefined}
                  autoComplete="one-time-code"
                  aria-label={`Verification code digit ${idx + 1}`}
                  className="w-11 h-13 sm:w-13 sm:h-14 text-center font-mono font-bold text-lg sm:text-xl text-[#FAF7F0] bg-[#0a1210] border border-[#1e3530] focus:border-[#B78A3B] focus:ring-2 focus:ring-[#B78A3B]/30 rounded-xl outline-none transition-all duration-150 select-all"
                />
              ))}
            </div>

            {/* Error State */}
            {otpError && (
              <div className="flex items-start gap-2 bg-[#2a1a1a] border border-[#5a2a2a] rounded-xl px-3.5 py-2.5 mt-3">
                <AlertCircle size={15} className="text-[#f87171] shrink-0 mt-0.5" />
                <p className="text-[#f87171] text-xs leading-relaxed">{otpError}</p>
              </div>
            )}

            {/* Resend Success Toast */}
            {resendSuccess && (
              <div className="flex items-center gap-2 bg-[#122b1f] border border-[#23583e] rounded-xl px-3.5 py-2 mt-3 text-[#4ade80] text-xs">
                <Check size={14} />
                <span>A new 6-digit verification code has been dispatched.</span>
              </div>
            )}
          </div>

          {/* Verify Email Button */}
          <button
            type="submit"
            disabled={isVerifying}
            className="w-full bg-[#B78A3B] hover:bg-[#D8B86A] disabled:opacity-50 text-[#0a1210] font-bold py-3 sm:py-3.5 rounded-xl transition-all duration-200 cursor-pointer text-sm shadow-lg shadow-[#B78A3B]/20 flex items-center justify-center gap-2"
          >
            {isVerifying ? (
              <>
                <Loader2 size={16} className="animate-spin text-[#0a1210]" />
                <span>Verifying Email...</span>
              </>
            ) : (
              <>
                <ShieldCheck size={16} />
                <span>Verify Email</span>
              </>
            )}
          </button>

          {/* Resend & Change Email Actions */}
          <div className="pt-3 border-t border-[#1e3530] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            {/* Resend Code Countdown */}
            <div className="text-center sm:text-left">
              {resendCooldown > 0 ? (
                <span className="text-[#77736A]">
                  Resend code in <strong className="text-[#D8B86A] font-mono">{resendCooldown} seconds</strong>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={isSendingCode}
                  className="inline-flex items-center gap-1.5 text-[#B78A3B] hover:text-[#FAF7F0] font-semibold transition-colors cursor-pointer"
                >
                  <RotateCcw size={12} className={isSendingCode ? 'animate-spin' : ''} />
                  <span>Resend Code</span>
                </button>
              )}
            </div>

            {/* Change Email Option */}
            <button
              type="button"
              onClick={handleChangeEmail}
              className="text-[#77736A] hover:text-[#FAF7F0] transition-colors cursor-pointer"
            >
              Change Email
            </button>
          </div>

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="w-full flex items-center justify-center gap-1.5 text-xs text-[#77736A] hover:text-[#FAF7F0] transition-colors pt-2 cursor-pointer"
            >
              <ArrowLeft size={13} />
              <span>Back to Login</span>
            </button>
          )}
        </form>
      </div>
    );
  }

  // ===========================================================================
  // RENDER: Screen 1 — Enter Email Address
  // ===========================================================================
  return (
    <div className="w-full max-w-md bg-[#0f1a17] border border-[#1e3530] rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-2xl">
      {/* Header with Email Icon */}
      <div className="flex flex-col items-center text-center mb-6">
        <div className="w-14 h-14 rounded-2xl bg-[#173F35] border border-[#2a4d41] flex items-center justify-center text-[#D8B86A] shadow-md shadow-[#B78A3B]/10 mb-3.5">
          <Mail size={28} />
        </div>
        <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#FAF7F0]">
          {title}
        </h2>
        <p className="text-xs sm:text-sm text-[#A69B89] mt-1.5 leading-relaxed">
          {subtitle}
        </p>
      </div>

      <form onSubmit={handleSendCode} className="space-y-4">
        <div>
          <label
            htmlFor="verification-email"
            className="block text-xs font-semibold text-[#77736A] uppercase tracking-widest mb-1.5"
          >
            Email Address
          </label>
          <div className="relative">
            <input
              id="verification-email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailError) setEmailError('');
              }}
              placeholder="name@example.com"
              autoComplete="email"
              autoFocus
              className={`w-full bg-[#0a1210] border ${
                emailError ? 'border-[#f87171] focus:border-[#f87171]' : 'border-[#1e3530] focus:border-[#B78A3B]'
              } text-[#FAF7F0] placeholder-[#3a4a47] rounded-xl pl-10 pr-4 py-3 text-sm outline-none transition-colors duration-150`}
            />
            <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#77736A]" />
          </div>

          {/* Inline format validation error */}
          {emailError && (
            <div className="flex items-start gap-2 bg-[#2a1a1a] border border-[#5a2a2a] rounded-xl px-3.5 py-2.5 mt-2.5">
              <AlertCircle size={14} className="text-[#f87171] shrink-0 mt-0.5" />
              <p className="text-[#f87171] text-xs leading-relaxed">{emailError}</p>
            </div>
          )}
        </div>

        {/* Send Verification Code Button */}
        <button
          type="submit"
          disabled={isSendingCode}
          className="w-full bg-[#B78A3B] hover:bg-[#D8B86A] disabled:opacity-50 text-[#0a1210] font-bold py-3 sm:py-3.5 rounded-xl transition-all duration-200 cursor-pointer text-sm shadow-lg shadow-[#B78A3B]/20 flex items-center justify-center gap-2 mt-2"
        >
          {isSendingCode ? (
            <>
              <Loader2 size={16} className="animate-spin text-[#0a1210]" />
              <span>Sending Verification Code...</span>
            </>
          ) : (
            <>
              <Mail size={16} />
              <span>Send Verification Code</span>
            </>
          )}
        </button>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="w-full flex items-center justify-center gap-1.5 text-xs text-[#77736A] hover:text-[#FAF7F0] transition-colors py-2 cursor-pointer"
          >
            <ArrowLeft size={13} />
            <span>Cancel & Back to Login</span>
          </button>
        )}
      </form>
    </div>
  );
}
