import { motion } from 'motion/react';
import { ReactNode } from 'react';

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  loading?: boolean;
}

export default function Button({ 
  children, 
  onClick, 
  variant = 'primary', 
  className = '', 
  disabled = false,
  type = 'button',
  loading = false
}: ButtonProps) {
  const baseStyles = 'px-6 py-3 rounded-xl font-bold transition-all duration-300 text-sm uppercase tracking-wider flex items-center justify-center gap-2';
  let variantStyles = '';

  switch (variant) {
    case 'primary':
      variantStyles = 'bg-[var(--color-accent)] text-white shadow-[0_0_20px_rgba(0,200,255,0.3)] hover:shadow-[0_0_30px_rgba(0,200,255,0.5)] hover:-translate-y-0.5';
      break;
    case 'secondary':
      variantStyles = 'bg-white/5 text-white border border-white/10 hover:bg-white/10 hover:-translate-y-0.5';
      break;
    case 'danger':
      variantStyles = 'bg-red-500/20 text-red-500 border border-red-500/30 hover:bg-red-500/30 hover:-translate-y-0.5';
      break;
  }

  return (
    <motion.button
      whileTap={{ scale: (disabled || loading) ? 1 : 0.95 }}
      onClick={onClick}
      type={type}
      className={`${baseStyles} ${variantStyles} ${className} ${(disabled || loading) ? 'opacity-50 cursor-not-allowed' : ''}`}
      disabled={disabled || loading}
    >
      {loading ? (
        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
      ) : null}
      {children}
    </motion.button>
  );
}
