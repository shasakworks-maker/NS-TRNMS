import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { UserRole } from '../constants';
import { auth } from '../lib/firebase';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { Phone, ShieldCheck, ArrowRight, MessageSquare, Edit2, RotateCw } from 'lucide-react';
import { ADMIN_PHONE_NUMBERS } from '../App';

interface LoginPageProps {
  onLogin: (role: UserRole, userId: string) => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [verificationId, setVerificationId] = useState<any>(null);
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    let interval: any;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const setupRecaptcha = () => {
    try {
      const container = document.getElementById('recaptcha-container');
      if (container) {
        // Clear any previous raw HTML to prevent duplicates
        container.innerHTML = '';
        
        // Dynamically create a brand new element with a unique timestamp ID
        const uniqueId = `recaptcha-widget-${Date.now()}`;
        const widgetEl = document.createElement('div');
        widgetEl.id = uniqueId;
        container.appendChild(widgetEl);

        // Always clean up previous verifier to prevent reCAPTCHA rendering conflicts
        if ((window as any).recaptchaVerifier) {
          try {
            (window as any).recaptchaVerifier.clear();
          } catch (e) {
            console.warn('Error clearing previous recaptcha verifier:', e);
          }
          (window as any).recaptchaVerifier = null;
        }

        (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, uniqueId, {
          size: 'invisible',
          callback: () => {
            // reCAPTCHA solved
          },
          'expired-callback': () => {
            setError('reCAPTCHA expired. Please try again.');
          }
        });
      } else {
        throw new Error('reCAPTCHA container element not found in DOM.');
      }
    } catch (err: any) {
      console.error('Error setting up reCAPTCHA:', err);
      setError('Failed to initialize secure verification. Please reload.');
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber) {
      setError('Please enter a valid phone number.');
      return;
    }

    let formattedPhone = phoneNumber.trim().replace(/\s+/g, '');
    if (!formattedPhone.startsWith('+')) {
      if (formattedPhone.length === 10 && /^\d+$/.test(formattedPhone)) {
        formattedPhone = `+91${formattedPhone}`;
      } else {
        setError('Please include country code (e.g. +919876543210)');
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      setupRecaptcha();
      const appVerifier = (window as any).recaptchaVerifier;
      const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
      (window as any).confirmationResult = confirmationResult;
      setVerificationId(confirmationResult);
      setStep('otp');
      setResendTimer(60);
    } catch (err: any) {
      console.error('Error sending OTP:', err);
      
      // Clean up recaptcha state on error
      if ((window as any).recaptchaVerifier) {
        try {
          (window as any).recaptchaVerifier.clear();
          (window as any).recaptchaVerifier = null;
        } catch (clearErr) {
          console.error('Error clearing recaptcha:', clearErr);
        }
      }

      // Check specifically for auth/operation-not-allowed
      if (err.code === 'auth/operation-not-allowed' || (err.message && err.message.includes('operation-not-allowed'))) {
        setError(
          'Phone Sign-In is not enabled in Firebase Console.\n\n' +
          'To fix this:\n' +
          '1. Go to your Firebase Console.\n' +
          '2. Navigate to Authentication > Sign-in method.\n' +
          '3. Click "Add new provider" (or Edit if already added) and select "Phone".\n' +
          '4. Turn on the "Enable" switch and click Save.'
        );
      } else {
        setError(err.message || 'Failed to send OTP. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length < 6) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const confirmationResult = (window as any).confirmationResult || verificationId;
      if (!confirmationResult) {
        throw new Error('Verification session expired. Please request OTP again.');
      }
      
      const result = await confirmationResult.confirm(otp);
      const firebaseUser = result.user;
      
      const { doc, getDoc, setDoc, serverTimestamp } = await import('firebase/firestore');
      const { db } = await import('../lib/firebase');
      
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const userDocSnap = await getDoc(userDocRef);
      
      let role: UserRole = UserRole.PLAYER;
      if (firebaseUser.phoneNumber && ADMIN_PHONE_NUMBERS.includes(firebaseUser.phoneNumber)) {
        role = UserRole.ADMIN;
      }
      
      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        role = userData.role as UserRole;
        if (firebaseUser.phoneNumber && ADMIN_PHONE_NUMBERS.includes(firebaseUser.phoneNumber)) {
          role = UserRole.ADMIN;
        }
      } else {
        const displayId = `NS-${Math.floor(1000 + Math.random() * 9000)}`;
        const defaultName = firebaseUser.phoneNumber ? `Gamer_${firebaseUser.phoneNumber.slice(-4)}` : 'Gamer';
        const referralCode = (defaultName.split(' ')[0].substring(0, 4).toUpperCase() || 'REF') + Math.floor(1000 + Math.random() * 9000);
        
        const newUser = {
          id: firebaseUser.uid,
          uid: firebaseUser.uid,
          email: '',
          phoneNumber: firebaseUser.phoneNumber || '',
          username: defaultName,
          ign: defaultName,
          displayId,
          role: role,
          walletBalance: 5,
          profileImage: '',
          referralCode,
          referralsCount: 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
        await setDoc(userDocRef, newUser);
      }
      
      onLogin(role, firebaseUser.uid);
    } catch (err: any) {
      console.error('Error confirming OTP:', err);
      setError(err.message || 'Invalid verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditPhone = () => {
    setStep('phone');
    setOtp('');
    setError(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="relative flex flex-col items-center justify-center min-h-[calc(100vh-80px)] p-4 overflow-hidden"
    >
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
        className="mb-6 relative z-10"
      >
        <img 
          src="https://i.postimg.cc/fzk0J1zg/IMG-20260219-183118-760.webp" 
          alt="NS Tournaments Logo" 
          className="w-20 h-20 object-contain mx-auto"
          referrerPolicy="no-referrer"
        />
      </motion.div>

      {/* Invisible reCAPTCHA container required by Firebase Auth */}
      <div id="recaptcha-container" className="absolute z-50"></div>

      <div className="bg-[var(--color-bg-secondary)] p-6 rounded-xl border border-white/10 shadow-2xl max-w-md w-full relative z-10 backdrop-blur-md">
        {step === 'phone' ? (
          <motion.div
            key="phone-step"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-display font-bold text-[var(--color-text-primary)]">Verify Your Number</h1>
              <p className="text-[var(--color-text-secondary)] text-xs">Enter your mobile number to receive a secure login OTP.</p>
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-left">
                <p className="text-red-500 text-xs whitespace-pre-line leading-relaxed">{error}</p>
              </div>
            )}

            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[var(--color-text-secondary)] text-xs font-semibold">Phone Number</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500 font-medium text-sm">
                    <Phone className="w-4 h-4 mr-1 text-zinc-600" />
                    <span>+91</span>
                  </div>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="Enter 10 digit number"
                    disabled={loading}
                    required
                    className="w-full bg-zinc-900/60 border border-white/10 rounded-lg py-3.5 pl-16 pr-4 text-white text-sm font-medium tracking-wide focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent transition-all placeholder-zinc-600"
                  />
                </div>
                <p className="text-[var(--color-text-secondary)] text-[10px] opacity-75">We will send a 6-digit OTP to verify your account.</p>
              </div>

              <button
                type="submit"
                disabled={loading || phoneNumber.length < 10}
                className="w-full flex items-center justify-center gap-2 bg-[var(--color-accent)] hover:opacity-90 text-black font-bold py-3.5 px-6 rounded-lg transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {loading ? (
                  <RotateCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Send OTP</span>
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
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-display font-bold text-[var(--color-text-primary)]">Enter OTP Code</h1>
              <p className="text-[var(--color-text-secondary)] text-xs flex items-center justify-center gap-1.5">
                Sent to <span className="text-white font-semibold">+91 {phoneNumber}</span>
                <button 
                  onClick={handleEditPhone}
                  className="p-1 hover:bg-white/5 rounded-full text-[var(--color-accent)] transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-left">
                <p className="text-red-500 text-xs whitespace-pre-line leading-relaxed">{error}</p>
              </div>
            )}

            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[var(--color-text-secondary)] text-xs font-semibold">Verification Code</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                    <MessageSquare className="w-4 h-4 text-zinc-600" />
                  </div>
                  <input
                    type="text"
                    pattern="\d*"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Enter 6-digit code"
                    disabled={loading}
                    required
                    className="w-full bg-zinc-900/60 border border-white/10 rounded-lg py-3.5 pl-11 pr-4 text-white text-center text-lg font-bold tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent transition-all placeholder-zinc-600 placeholder:tracking-normal placeholder:text-sm placeholder:font-normal"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || otp.length < 6}
                className="w-full flex items-center justify-center gap-2 bg-[var(--color-accent)] hover:opacity-90 text-black font-bold py-3.5 px-6 rounded-lg transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {loading ? (
                  <RotateCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Verify & Login</span>
                    <ShieldCheck className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="text-center pt-2">
              <button
                onClick={handleSendOtp}
                disabled={loading || resendTimer > 0}
                className="text-xs text-[var(--color-text-secondary)] hover:text-white transition-colors disabled:opacity-50"
              >
                {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : 'Resend OTP Code'}
              </button>
            </div>
          </motion.div>
        )}

        <p className="text-[var(--color-text-secondary)] text-[10px] text-center mt-6 px-4 opacity-50">
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
