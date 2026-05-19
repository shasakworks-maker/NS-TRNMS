import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { 
  User as UserIcon, 
  Wallet, 
  Trophy, 
  History, 
  Settings, 
  HelpCircle, 
  LogOut, 
  Info,
  ChevronRight,
  Shield,
  Target,
  Gift
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { UserRole } from '../constants';
import { getUserById } from '../services/firebaseService';
import { User } from '../types';

import { useFirebaseData } from '../hooks/useFirebaseData';

interface MenuPageProps {
  currentUserRole: UserRole | null;
  currentUserId: string | null;
  onLogout: () => void;
}

export default function MenuPage({ currentUserRole, currentUserId, onLogout }: MenuPageProps) {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const dataVersion = useFirebaseData();

  useEffect(() => {
    const fetchUser = () => {
      if (currentUserId) {
        const currentUser = getUserById(currentUserId);
        if (currentUser) {
          setUser({ ...currentUser });
        }
      }
    };

    fetchUser();
  }, [currentUserId, dataVersion]);

  const menuItems = [
    { 
      title: 'Profile', 
      icon: <UserIcon className="w-5 h-5" />, 
      path: '/profile', 
      color: 'text-blue-400',
      roles: [UserRole.PLAYER, UserRole.ADMIN]
    },
    { 
      title: 'My Wallet', 
      icon: <Wallet className="w-5 h-5" />, 
      path: '/wallet', 
      color: 'text-green-400',
      roles: [UserRole.PLAYER]
    },
    { 
      title: 'Tournaments', 
      icon: <Trophy className="w-5 h-5" />, 
      path: '/tournaments', 
      color: 'text-yellow-400',
      roles: [UserRole.PLAYER, UserRole.ADMIN]
    },
    { 
      title: 'My Tournaments', 
      icon: <History className="w-5 h-5 text-purple-400" />, 
      path: '/my-tournaments',
      color: 'text-purple-400',
      roles: [UserRole.PLAYER]
    },
    { 
      title: 'Leaderboard', 
      icon: <Target className="w-5 h-5" />, 
      path: '/leaderboard', 
      color: 'text-orange-400',
      roles: [UserRole.PLAYER, UserRole.ADMIN]
    },
    { 
      title: 'Refer & Earn', 
      icon: <Gift className="w-5 h-5" />, 
      path: '/refer-earn', 
      color: 'text-pink-400',
      roles: [UserRole.PLAYER, UserRole.ADMIN]
    },
    { 
      title: 'Transaction History', 
      icon: <History className="w-5 h-5" />, 
      path: '/wallet', 
      color: 'text-purple-400',
      roles: [UserRole.PLAYER]
    },
    { 
      title: 'Admin Panel', 
      icon: <Shield className="w-5 h-5" />, 
      path: '/admin', 
      color: 'text-red-400',
      roles: [UserRole.ADMIN]
    },
    { 
      title: 'Settings', 
      icon: <Settings className="w-5 h-5" />, 
      path: '/settings', 
      color: 'text-gray-400',
      roles: [UserRole.PLAYER, UserRole.ADMIN]
    },
    { 
      title: 'Help & Support', 
      icon: <HelpCircle className="w-5 h-5" />, 
      path: 'https://wa.me/918318235153', 
      color: 'text-teal-400',
      roles: [UserRole.PLAYER, UserRole.ADMIN]
    },
    { 
      title: 'About Us', 
      icon: <Info className="w-5 h-5" />, 
      path: '/about', 
      color: 'text-indigo-400',
      roles: [UserRole.PLAYER, UserRole.ADMIN]
    },
  ];

  const filteredItems = menuItems.filter(item => 
    currentUserRole && item.roles.includes(currentUserRole)
  );

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-col space-y-6"
    >
      <div className="flex items-center space-x-4 p-4 bg-[var(--color-bg-secondary)] rounded-2xl border border-[var(--color-border)]">
        <div className="w-16 h-16 rounded-full bg-[var(--color-accent)] flex items-center justify-center text-white text-2xl font-bold overflow-hidden">
          {user?.profileImage ? (
            <img src={user.profileImage} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            currentUserRole === UserRole.ADMIN ? 'A' : (user?.username?.charAt(0).toUpperCase() || 'P')
          )}
        </div>
        <div>
          <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
            {user?.username || (currentUserRole === UserRole.ADMIN ? 'Administrator' : 'Pro Player')}
          </h2>
          <p className="text-sm text-[var(--color-text-secondary)]">
            {user?.email || (currentUserRole === UserRole.ADMIN ? 'admin@example.com' : 'player@example.com')}
          </p>
        </div>
      </div>

      <div className="bg-[var(--color-bg-secondary)] rounded-2xl border border-[var(--color-border)] overflow-hidden">
        {filteredItems.map((item, index) => {
          const isExternal = item.path.startsWith('http');
          const content = (
            <>
              <div className="flex items-center space-x-4">
                <div className={item.color}>{item.icon}</div>
                <span className="font-semibold text-[var(--color-text-primary)]">{item.title}</span>
              </div>
              <ChevronRight className="w-5 h-5 text-[var(--color-text-secondary)]" />
            </>
          );
          const className = `flex items-center justify-between p-4 hover:bg-[var(--color-border)] transition-colors duration-200 ${
            index !== filteredItems.length - 1 ? 'border-b border-[var(--color-border)]' : ''
          }`;

          return isExternal ? (
            <a key={item.title} href={item.path} target="_blank" rel="noopener noreferrer" className={className}>
              {content}
            </a>
          ) : (
            <Link key={item.title} to={item.path} className={className}>
              {content}
            </Link>
          );
        })}
      </div>

      <button
        onClick={handleLogout}
        className="flex items-center justify-center space-x-2 p-4 w-full bg-red-900/20 text-red-500 rounded-2xl border border-red-900/30 hover:bg-red-900/30 transition-colors duration-200 font-bold"
      >
        <LogOut className="w-5 h-5" />
        <span>Logout</span>
      </button>

      <div className="text-center py-4 flex flex-col items-center gap-2">
        <img 
          src="https://i.postimg.cc/fzk0J1zg/IMG-20260219-183118-760.webp" 
          alt="NS Logo" 
          className="w-8 h-8 object-contain opacity-50"
          referrerPolicy="no-referrer"
        />
        <p className="text-xs text-[var(--color-text-secondary)] uppercase tracking-widest">
          NS Tournaments v1.0.0
        </p>
      </div>
    </motion.div>
  );
}
