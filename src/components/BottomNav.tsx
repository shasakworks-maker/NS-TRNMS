import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Trophy, Wallet, Menu, Target } from 'lucide-react';
import { motion } from 'motion/react';
import { UserRole } from '../constants';

interface BottomNavProps {
  currentUserRole: UserRole | null;
}

export default function BottomNav({ currentUserRole }: BottomNavProps) {
  if (!currentUserRole) return null;

  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 z-50 w-full max-w-[450px] px-4 pb-6">
      <div className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl flex justify-around items-center h-16 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
        <BottomNavItem to="/" icon={<Home className="w-5 h-5" />} label="Home" />
        <BottomNavItem to="/tournaments" icon={<Trophy className="w-5 h-5" />} label="Arena" />
        <BottomNavItem to="/leaderboard" icon={<Target className="w-5 h-5" />} label="Ranks" />
        <BottomNavItem to="/wallet" icon={<Wallet className="w-5 h-5" />} label="Wallet" />
        <BottomNavItem to="/menu" icon={<Menu className="w-5 h-5" />} label="Menu" />
      </div>
    </div>
  );
}

interface BottomNavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
}

function BottomNavItem({ to, icon, label }: BottomNavItemProps) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `relative flex flex-col items-center justify-center w-16 h-full transition-all duration-300 ${
          isActive ? 'text-[var(--color-accent)]' : 'text-zinc-500 hover:text-zinc-300'
        }`
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <motion.div
              layoutId="nav-pill"
              className="absolute -top-1 w-8 h-1 bg-[var(--color-accent)] rounded-full shadow-[0_0_10px_var(--color-accent)]"
              transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
            />
          )}
          <div className={`transition-transform duration-300 ${isActive ? 'scale-110 -translate-y-1' : ''}`}>
            {icon}
          </div>
          <span className={`text-[9px] font-bold uppercase tracking-widest mt-1 transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-60'}`}>
            {label}
          </span>
        </>
      )}
    </NavLink>
  );
}
