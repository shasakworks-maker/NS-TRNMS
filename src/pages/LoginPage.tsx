import React, { useState } from 'react';
import { motion } from 'motion/react';
import { UserRole } from '../constants';
import { loginWithGoogle } from '../services/firebaseService';

interface LoginPageProps {
  onLogin: (role: UserRole, userId: string) => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await loginWithGoogle();
      if (result) {
        onLogin(result.user.role as UserRole, result.user.id);
      }
    } catch (err: any) {
       setError(err.message || 'Google login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative flex flex-col items-center justify-center min-h-screen py-12 px-6 bg-[var(--color-bg-primary)] font-sans"
    >
      {/* Immersive Background */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=1920" 
          alt="Dark Gaming Background" 
          className="w-full h-full object-cover opacity-20 select-none grayscale"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-[var(--color-bg-primary)]" />
      </div>

      {/* Logo Section */}
      <motion.div
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="mb-10 relative z-10"
      >
        <img 
          src="https://i.postimg.cc/fzk0J1zg/IMG-20260219-183118-760.webp" 
          alt="NS Tournament Logo" 
          className="w-28 h-28 object-contain mx-auto shadow-2xl rounded-lg"
          referrerPolicy="no-referrer"
        />
      </motion.div>

      {/* Main Login Card */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="bg-[var(--color-bg-secondary)] p-12 rounded-lg border border-white/5 shadow-2xl max-w-[440px] w-full text-center relative z-10"
      >
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.15
              }
            }
          }}
          className="space-y-10"
        >
          <motion.div 
            variants={{
              hidden: { y: 10, opacity: 0 },
              visible: { y: 0, opacity: 1 }
            }}
            className="space-y-4"
          >
            <h1 className="font-sans font-extrabold text-white tracking-tighter flex flex-col items-center leading-none">
              <span className="text-[48px]">WELCOME TO</span>
              <span className="text-[48px]">NS</span>
            </h1>
            <p className="text-zinc-400 text-[16px] leading-relaxed px-4 max-w-[320px] mx-auto opacity-80">
              Join the elite gaming tournaments and win big prizes.
            </p>
          </motion.div>

          <motion.div 
            variants={{
              hidden: { y: 10, opacity: 0 },
              visible: { y: 0, opacity: 1 }
            }}
            className="pt-2"
          >
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="group w-full h-16 flex items-center justify-center gap-4 bg-white text-black font-extrabold rounded-md transition-all hover:bg-zinc-100 active:scale-[0.98] disabled:opacity-50 shadow-xl relative overflow-hidden"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <div className="flex items-center gap-4">
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-[28px] h-[28px]" />
                  <span className="text-[20px] tracking-tight">Sign in with Google</span>
                </div>
              )}
            </button>
          </motion.div>

          <motion.p 
            variants={{
              hidden: { y: 10, opacity: 0 },
              visible: { y: 0, opacity: 1 }
            }}
            className="text-zinc-500 text-[14px] font-medium leading-[1.6] px-6 opacity-60"
          >
            By signing in, you agree to our <br />
            Terms of Service and Privacy Policy.
          </motion.p>
        </motion.div>
      </motion.div>

      {/* Footer Branding */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.6 }}
        transition={{ delay: 0.6 }}
        className="mt-20 text-center relative z-10"
      >
        <p className="text-[14px] text-white/50 uppercase tracking-[0.3em] font-bold">
          POWERED BY SHASAK SINGH
        </p>
      </motion.div>
    </motion.div>
  );
}
