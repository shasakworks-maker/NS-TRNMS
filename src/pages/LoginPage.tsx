import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { UserRole } from '../constants';
import { loginWithPhone, confirmPhoneOtp } from '../services/firebaseService';
import { RecaptchaVerifier } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { Phone as PhoneIcon, ShieldAlert, ArrowRight, Lock, KeyRound } from 'lucide-react';

interface LoginPageProps {
  onLogin: (role: UserRole, userId: string) => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const recaptchaVerifierRef = useRef<any>(null);

  const setupRecaptcha = () => {
    if (!recaptchaVerifierRef.current) {
      try {
        recaptchaVerifierRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible',
          callback: () => {
            // reCAPTCHA solved
          },
          'expired-callback': () => {
            setError('reCAPTCHA expired. Please request OTP again.');
          }
        });
      } catch (err: any) {
        console.error('Error setting up reCAPTCHA:', err);
        setError('Failed to initialize reCAPTCHA verifier.');
      }
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Clean phone number input
    const cleanedPhone = phone.trim().replace(/\s+/g, '');
    if (!cleanedPhone) {
      setError('Please enter a valid phone number.');
      setLoading(false);
      return;
    }

    if (cleanedPhone.length < 10) {
      setError('Phone number must be at least 10 digits.');
      setLoading(false);
      return;
    }

    try {
      setupRecaptcha();
      const appVerifier = recaptchaVerifierRef.current;
      if (!appVerifier) {
        throw new Error('reCAPTCHA verification system not ready. Please try again.');
      }

      // Format to E.164. If doesn't start with +, assume +91 as default.
      const formattedPhone = cleanedPhone.startsWith('+') ? cleanedPhone : `+91${cleanedPhone}`;

      const result = await loginWithPhone(formattedPhone, appVerifier);
      setConfirmationResult(result);
      setStep('otp');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to send OTP. Please check your number.');
      // Reset reCAPTCHA to allow retry
      if (recaptchaVerifierRef.current) {
        try {
          recaptchaVerifierRef.current.clear();
        } catch (e) {}
        recaptchaVerifierRef.current = null;
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmationResult) return;

    setError(null);
    setLoading(true);

    const cleanedOtp = otp.trim();
    if (cleanedOtp.length !== 6) {
      setError('OTP must be a 6-digit number.');
      setLoading(false);
      return;
    }

    try {
      const loginResult = await confirmPhoneOtp(confirmationResult, cleanedOtp);
      if (loginResult) {
        onLogin(loginResult.user.role as UserRole, loginResult.user.id);
      } else {
        throw new Error('Failed to retrieve or create user profile.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Invalid OTP code. Please check and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToPhone = () => {
    setStep('phone');
    setOtp('');
    setError(null);
    if (recaptchaVerifierRef.current) {
      try {
        recaptchaVerifierRef.current.clear();
      } catch (e) {}
      recaptchaVerifierRef.current = null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="relative flex flex-col items-center justify-center min-h-[calc(100vh-80px)] p-4 overflow-hidden"
    >
      {/* Invisible container required for Firebase recaptcha */}
      <div id="recaptcha-container"></div>

      {/* Immersive Background */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://picsum.photos/seed/gaming-bg/1920/1080?blur=10" 
          alt="Background" 
          className="w-full h-full object-cover opacity-30"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80" />
      </div>

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="mb-8 relative z-10"
      >
        <img 
          src="https://i.postimg.cc/fzk0J1zg/IMG-20260219-183118-760.webp" 
          alt="NS Tournaments Logo" 
          className="w-24 h-24 object-contain mx-auto"
          referrerPolicy="no-referrer"
        />
      </motion.div>

      <div className="bg-[var(--color-bg-secondary)] p-8 rounded-xl border border-white/10 shadow-2xl max-w-md w-full text-center relative z-10 backdrop-blur-md">
        {step === 'phone' ? (
          <motion.div
            key="phone-step"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            <div className="space-y-2">
              <h1 className="text-3xl font-display font-bold text-[var(--color-text-primary)]">Welcome to NS</h1>
              <p className="text-[var(--color-text-secondary)] text-sm">Verify your phone number to start competing in tournaments.</p>
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2 text-left">
                <ShieldAlert className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <p className="text-red-500 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="space-y-2 text-left">
                <label htmlFor="phone-input" className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
                  Phone Number
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3 flex items-center text-[var(--color-text-secondary)] border-r border-white/10 pr-2 gap-1.5 font-medium text-sm">
                    <PhoneIcon className="w-4 h-4 text-[var(--color-primary)]" />
                    <span>+91</span>
                  </div>
                  <input
                    id="phone-input"
                    type="tel"
                    placeholder="Enter 10-digit number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    required
                    disabled={loading}
                    className="w-full bg-[#141414] border border-white/10 rounded-lg py-3.5 pl-20 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-[var(--color-primary)] transition-all font-medium text-base tracking-wide"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || phone.length < 10}
                className="w-full flex items-center justify-center gap-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-black font-bold py-3.5 px-6 rounded-lg transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Send Verification Code</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </motion.div>
        ) : (
          <motion.div
            key="otp-step"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="space-y-2">
              <h1 className="text-3xl font-display font-bold text-[var(--color-text-primary)] font-semibold">Enter OTP</h1>
              <p className="text-[var(--color-text-secondary)] text-sm">
                We sent a 6-digit confirmation code to <span className="text-white font-medium">+91 {phone}</span>
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2 text-left">
                <ShieldAlert className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <p className="text-red-500 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="space-y-2 text-left">
                <label htmlFor="otp-input" className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
                  Verification Code
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3 text-gray-500">
                    <KeyRound className="w-5 h-5 text-[var(--color-primary)]" />
                  </div>
                  <input
                    id="otp-input"
                    type="text"
                    pattern="\d*"
                    maxLength={6}
                    placeholder="Enter 6-digit OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    required
                    disabled={loading}
                    className="w-full bg-[#141414] border border-white/10 rounded-lg py-3.5 pl-12 pr-4 text-white text-center tracking-[0.5em] placeholder-gray-500 focus:outline-none focus:border-[var(--color-primary)] transition-all font-bold text-lg"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full flex items-center justify-center gap-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-black font-bold py-3.5 px-6 rounded-lg transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Verify & Continue</span>
                    <Lock className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <button
              onClick={handleBackToPhone}
              disabled={loading}
              className="text-sm font-semibold text-[var(--color-primary)] hover:underline block mx-auto pt-2"
            >
              Change Phone Number
            </button>
          </motion.div>
        )}

        <p className="text-[var(--color-text-secondary)] text-xs px-4 mt-6">
          By signing in, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>

      <div className="mt-8 text-center relative z-10">
        <p className="text-xs text-[var(--color-text-secondary)] uppercase tracking-widest font-medium opacity-60">
          Powered by Shasak Singh
        </p>
      </div>
    </motion.div>
  );
}
