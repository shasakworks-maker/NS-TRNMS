import { motion } from 'motion/react';
import { useState, useEffect } from 'react';

export default function SplashScreen() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 2;
      });
    }, 30);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-[#0a0a0a]"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ 
          duration: 0.8,
          ease: "easeOut"
        }}
        className="text-center px-6 w-full max-w-xs"
      >
        <div className="relative mb-8">
          <motion.div
            animate={{ 
              rotate: [0, 360],
            }}
            transition={{ 
              duration: 10, 
              repeat: Infinity, 
              ease: "linear" 
            }}
            className="absolute -inset-4 border border-[var(--color-accent)]/20 rounded-full"
          />
          <img
            src="https://i.postimg.cc/fzk0J1zg/IMG-20260219-183118-760.webp"
            alt="NS Tournaments Logo"
            className="w-40 h-40 object-contain mx-auto relative z-10 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]"
            referrerPolicy="no-referrer"
          />
        </div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="space-y-4"
        >
          <h1 className="text-3xl font-display font-bold text-white tracking-[0.2em] uppercase">
            NS <span className="text-[var(--color-accent)]">Tournaments</span>
          </h1>
          
          <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-[var(--color-accent)]"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ ease: "linear" }}
            />
          </div>
          
          <p className="text-[10px] text-white/30 uppercase tracking-[0.3em] font-bold">
            Loading Arena... {progress}%
          </p>
        </motion.div>
      </motion.div>

      <div className="absolute bottom-10 text-center">
        <p className="text-[10px] text-white/20 uppercase tracking-widest font-mono">
          Powered by Shasak Singh
        </p>
      </div>
    </motion.div>
  );
}
