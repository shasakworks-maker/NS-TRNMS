import { useState } from 'react';
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
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="space-y-2">
            <h1 className="text-3xl font-display font-bold text-[var(--color-text-primary)]">Welcome to NS</h1>
            <p className="text-[var(--color-text-secondary)] text-sm">Join the elite gaming tournaments and win big prizes.</p>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-500 text-sm">{error}</p>
            </div>
          )}

          <div className="pt-2">
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 bg-white text-gray-900 font-bold py-4 px-6 rounded-lg hover:bg-gray-100 transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
              ) : (
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-6 h-6" />
              )}
              {loading ? 'Connecting...' : 'Sign in with Google'}
            </button>
          </div>

          <p className="text-[var(--color-text-secondary)] text-xs px-4">
            By signing in, you agree to our Terms of Service and Privacy Policy.
          </p>
        </motion.div>
      </div>
      
      <div className="mt-8 text-center relative z-10">
        <p className="text-xs text-[var(--color-text-secondary)] uppercase tracking-widest font-medium opacity-60">
          Powered by Shasak Singh
        </p>
      </div>
    </motion.div>
  );
}

