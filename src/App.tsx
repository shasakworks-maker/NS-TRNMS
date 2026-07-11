import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { AnimatePresence } from 'motion/react';
import Navbar from './components/Navbar';
import NotificationManager from './components/NotificationManager';
import HomePage from './pages/HomePage';
import TournamentsPage from './pages/TournamentsPage';
import WalletPage from './pages/WalletPage';
import RegistrationForm from './pages/RegistrationForm';
import AdminPanel from './pages/AdminPanel';
import LoginPage from './pages/LoginPage';
import MenuPage from './pages/MenuPage';
import ProfilePage from './pages/ProfilePage';
import LeaderboardPage from './pages/LeaderboardPage';
import NotificationsPage from './pages/NotificationsPage';
import RulesPage from './pages/RulesPage';
import AboutPage from './pages/AboutPage';
import SettingsPage from './pages/SettingsPage';
import ReferEarnPage from './pages/ReferEarnPage';
import MyTournamentsPage from './pages/MyTournamentsPage';
import SplashScreen from './components/SplashScreen';
import BottomNav from './components/BottomNav';
import { UserRole } from './constants';
import { initRealtimeListeners, stopRealtimeListeners, getUserById } from './services/firebaseService';

import { auth } from './lib/firebase';
import { onAuthStateChanged, getRedirectResult } from 'firebase/auth';

export default function App() {
  const [currentUserRole, setCurrentUserRole] = useState<UserRole | null>(() => {
    const savedRole = localStorage.getItem('AUTH_ROLE');
    return (savedRole as UserRole) || null;
  });
  const [currentUserId, setCurrentUserId] = useState<string | null>(() => {
    return localStorage.getItem('AUTH_USER_ID') || null;
  });
  const [showSplash, setShowSplash] = useState(true);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  useEffect(() => {
    // Handle redirect result to log errors or successful logins
    getRedirectResult(auth)
      .then((result) => {
        if (result) {
          console.log('Google redirect sign-in successful:', result.user);
        }
      })
      .catch((error) => {
        console.error('Google redirect sign-in error:', error);
      });

    // Sync Firebase Auth state with App state
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Sync app state with Firebase User if app state is missing or mismatched
        if (!currentUserId || currentUserId !== firebaseUser.uid) {
          try {
            // First try to check if user profile exists in Firestore
            const { getDoc, doc } = await import('firebase/firestore');
            const { db } = await import('./lib/firebase');
            const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
            
            if (userDoc.exists()) {
              const userData = userDoc.data();
              
              // HEALING: Force role to admin for the owner email
              let enforcedRole = userData.role as UserRole;
              if (firebaseUser.email === 'ashokpal76199@gmail.com') {
                enforcedRole = UserRole.ADMIN;
              }

              // HEALING: If document is massive (approaching 1MB limit), clear profile image to allow updates
              const docSize = JSON.stringify(userData).length;
              const updates: any = {};
              
              if (docSize > 900000 && userData.profileImage) {
                console.warn('User document is too large. Auto-clearing profile image to permit updates.');
                updates.profileImage = '';
              }
              
              // HEALING: Ensure user has a referral code
              if (!userData.referralCode) {
                const code = (userData.username?.split(' ')[0].substring(0, 4).toUpperCase() || 'REF') + Math.floor(1000 + Math.random() * 9000);
                updates.referralCode = code;
                updates.referralsCount = 0;
              }

              // HEALING: Sync profile image from Google if missing
              if (!userData.profileImage && firebaseUser.photoURL) {
                updates.profileImage = firebaseUser.photoURL;
              }

              // HEALING: Sync username from Google if missing or default
              if ((!userData.username || userData.username === 'User' || userData.username === 'Gamer') && firebaseUser.displayName) {
                updates.username = firebaseUser.displayName;
                if (!userData.ign || userData.ign === 'User' || userData.ign === 'Gamer') {
                  updates.ign = firebaseUser.displayName;
                }
              }

              // HEALING: Ensure admin correctly has their role in DB too
              if (firebaseUser.email === 'ashokpal76199@gmail.com' && userData.role !== UserRole.ADMIN) {
                updates.role = UserRole.ADMIN;
              }

              // HEALING: Missing referral code
              if (!userData.referralCode) {
                const referralCode = (userData.username?.split(' ')[0].substring(0, 4).toUpperCase() || 'REF') + Math.floor(1000 + Math.random() * 9000);
                updates.referralCode = referralCode;
                updates.referralsCount = 0;
              }

              if (Object.keys(updates).length > 0) {
                const { updateDoc: updateDocFn } = await import('firebase/firestore');
                await updateDocFn(doc(db, 'users', firebaseUser.uid), updates);
              }

              handleLogin(enforcedRole, firebaseUser.uid);
            } else {
              // User doc doesn't exist, but Auth user does.
              // This can happen if the creation during signup failed or was interrupted.
              const role = firebaseUser.email === 'ashokpal76199@gmail.com' ? UserRole.ADMIN : UserRole.PLAYER;
              
              // Create the document if it's missing
              const { setDoc: setDocFn, serverTimestamp: serverTs } = await import('firebase/firestore');
              const { db } = await import('./lib/firebase');
              
              const referralCode = (firebaseUser.displayName?.split(' ')[0].substring(0, 4).toUpperCase() || 'REF') + Math.floor(1000 + Math.random() * 9000);
              const displayId = `NS-${Math.floor(1000 + Math.random() * 9000)}`;

              const newUser = {
                id: firebaseUser.uid,
                uid: firebaseUser.uid,
                email: firebaseUser.email || '',
                username: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
                ign: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
                displayId,
                role: role,
                walletBalance: 5, // Welcome bonus
                profileImage: firebaseUser.photoURL || '',
                referralCode,
                referralsCount: 0,
                createdAt: serverTs(),
                updatedAt: serverTs(),
              };

              await setDocFn(doc(db, 'users', firebaseUser.uid), newUser);
              
              handleLogin(role, firebaseUser.uid);
            }
          } catch (e) {
            console.error('Error syncing auth state:', e);
          }
        }
      } else {
        // Logged out from Firebase
        if (currentUserId) {
          handleLogout();
        }
      }
      setIsAuthChecking(false);
    });

    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2000);

    return () => {
      unsubscribeAuth();
      stopRealtimeListeners();
      clearTimeout(timer);
    };
  }, []);

  // Update listeners when user or auth state changes
  useEffect(() => {
    if (!isAuthChecking) {
      initRealtimeListeners(currentUserId, currentUserRole);
    }
  }, [currentUserId, currentUserRole, isAuthChecking]);

  const handleLogin = (role: UserRole, userId: string) => {
    setCurrentUserRole(role);
    setCurrentUserId(userId);
    localStorage.setItem('AUTH_ROLE', role);
    localStorage.setItem('AUTH_USER_ID', userId);
  };

  const handleLogout = () => {
    auth.signOut();
    setCurrentUserRole(null);
    setCurrentUserId(null);
    localStorage.removeItem('AUTH_ROLE');
    localStorage.removeItem('AUTH_USER_ID');
    stopRealtimeListeners();
  };

  return (
    <Router>
      <div className="min-h-screen bg-[#0a0a0a] flex justify-center">
        <div className="w-full max-w-[450px] bg-[var(--color-bg-primary)] min-h-screen shadow-2xl relative flex flex-col">
          <AnimatePresence mode="wait">
            {showSplash && <SplashScreen key="splash" />}
          </AnimatePresence>

          {!showSplash && !isAuthChecking && (
            <>
              {currentUserRole && <Navbar currentUserRole={currentUserRole} currentUserId={currentUserId} />}
              <NotificationManager currentUserId={currentUserId} />
              <main className={currentUserRole ? "pt-20 pb-24 px-4" : "pb-10 px-4"}>
                <Routes>
                  {!currentUserRole ? (
                    <>
                      <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
                      <Route path="*" element={<Navigate to="/login" replace />} />
                    </>
                  ) : (
                    <>
                      <Route path="/" element={<HomePage />} />
                      <Route path="/tournaments" element={<TournamentsPage currentUserId={currentUserId} currentUserRole={currentUserRole} />} />
                      <Route path="/leaderboard" element={<LeaderboardPage />} />
                      <Route path="/notifications" element={<NotificationsPage currentUserId={currentUserId} />} />
                      <Route path="/wallet" element={<WalletPage currentUserId={currentUserId} />} />
                      <Route path="/menu" element={<MenuPage currentUserRole={currentUserRole} currentUserId={currentUserId} onLogout={handleLogout} />} />
                      <Route path="/profile" element={<ProfilePage currentUserId={currentUserId} />} />
                      <Route path="/rules" element={<RulesPage />} />
                      <Route path="/about" element={<AboutPage />} />
                      <Route path="/settings" element={<SettingsPage />} />
                      <Route path="/refer-earn" element={<ReferEarnPage currentUserId={currentUserId} />} />
                      <Route path="/my-tournaments" element={<MyTournamentsPage currentUserId={currentUserId} />} />
                      <Route path="/register/:tournamentId" element={<RegistrationForm currentUserId={currentUserId} />} />
                      {currentUserRole === UserRole.ADMIN && (
                        <Route path="/admin" element={<AdminPanel currentUserId={currentUserId} />} />
                      )}
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </>
                  )}
                </Routes>
              </main>
              <BottomNav currentUserRole={currentUserRole} />
            </>
          )}
        </div>
      </div>
    </Router>
  );
}





