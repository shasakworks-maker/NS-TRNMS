import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { UserRole } from '../constants';
import { Menu, Wallet, User as UserIcon, Bell } from 'lucide-react';
import { getUserById } from '../services/firebaseService';
import { User } from '../types';

import { useFirebaseData } from '../hooks/useFirebaseData';

interface NavbarProps {
  currentUserRole: UserRole | null;
  currentUserId: string | null;
}

export default function Navbar({ currentUserRole, currentUserId }: NavbarProps) {
  const [user, setUser] = useState<User | null>(null);
  const dataVersion = useFirebaseData();

  useEffect(() => {
    const fetchUser = () => {
      if (currentUserId) {
        const userData = getUserById(currentUserId);
        if (userData) {
          setUser({ ...userData }); // Spread to ensure new object reference
        }
      }
    };

    fetchUser();
  }, [currentUserId, dataVersion]);

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 120, damping: 20 }}
      className="fixed top-0 left-1/2 -translate-x-1/2 z-50 px-4 py-3 w-full max-w-[450px]"
    >
      <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl flex justify-between items-center px-4 py-2 shadow-xl">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex-shrink-0">
            <img 
              src="https://i.postimg.cc/fzk0J1zg/IMG-20260219-183118-760.webp" 
              alt="NS Logo" 
              className="w-8 h-8 object-contain"
              referrerPolicy="no-referrer"
            />
          </Link>
          <div className="w-px h-6 bg-white/10 hidden sm:block" />
          <Link to="/profile" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--color-accent)] to-purple-600 flex items-center justify-center text-white shadow-[0_0_15px_rgba(0,200,255,0.3)] overflow-hidden border border-white/10 group-hover:scale-105 transition-transform">
                {user?.profileImage ? (
                  <img src={user.profileImage} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <UserIcon className="w-4 h-4" />
                )}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 border-2 border-black rounded-full"></div>
            </div>
            <div className="flex flex-col">
              <span className="text-white text-xs font-bold leading-none">{user?.username || 'Gamer'}</span>
              <span className="text-[var(--color-accent)] text-[9px] font-bold uppercase tracking-widest mt-0.5">
                {currentUserRole === UserRole.ADMIN ? 'Admin' : 'Pro Player'}
              </span>
            </div>
          </Link>
        </div>
        
        <div className="flex items-center space-x-2">
          <Link to="/notifications" className="p-2 rounded-xl bg-white/5 border border-white/10 text-zinc-400 hover:text-white transition-colors relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-black"></span>
          </Link>
          {currentUserRole === UserRole.PLAYER && (
            <Link to="/wallet" className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
              <Wallet className="w-4 h-4 text-green-400" />
              <span className="text-xs font-bold">₹{user?.walletBalance || 0}</span>
            </Link>
          )}
          <Link to="/menu" className="p-2 rounded-xl bg-white/5 border border-white/10 text-zinc-400 hover:text-white transition-colors">
            <Menu className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </motion.nav>
  );
}

interface NavLinkProps {
  to: string;
  children: React.ReactNode;
}

function NavLink({ to, children }: NavLinkProps) {
  return (
    <Link to={to} className="text-[var(--color-text-primary)] hover:text-[var(--color-accent)] transition-colors duration-200 font-semibold text-sm uppercase tracking-wider">
      {children}
    </Link>
  );
}
