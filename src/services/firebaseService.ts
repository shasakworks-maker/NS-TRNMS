// This file would contain Firebase initialization and interaction logic.
// For this demonstration, we'll use mock data directly in the frontend.
// In a real app, you would initialize Firebase here and create functions
// to interact with Firestore, e.g., `getUsers()`, `addTournament()`, etc.

// Example Firebase initialization (conceptual):
/*
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
*/

// For now, we'll just export functions that return mock data
// or simulate database operations using the mock data.

import { mockUsers, mockTournaments, mockRegistrations, mockTransactions, mockPaymentRequests, mockQrCodeUrl, mockWithdrawalRequests, mockLeaderboard, mockNotifications, mockNews } from '../data/mockData';
import { User, Tournament, Registration, Transaction, UserPaymentRequest, WithdrawalRequest, AppNotification } from '../types';
import { UserRole, PaymentRequestStatus, TransactionType, TransactionStatus } from '../constants';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  addDoc, 
  query, 
  where, 
  onSnapshot, 
  serverTimestamp, 
  Timestamp,
  deleteDoc,
  orderBy,
  limit,
  runTransaction,
  increment
} from 'firebase/firestore';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInAnonymously,
  onAuthStateChanged,
  updatePassword,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { db, auth } from '../lib/firebase';

// --- Error Handling Helper ---
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Removes undefined fields from an object to prevent Firestore errors.
 */
function cleanObject(obj: any) {
  if (!obj || typeof obj !== 'object') return obj;
  const cleaned: any = Array.isArray(obj) ? [] : {};
  Object.keys(obj).forEach(key => {
    const val = obj[key];
    if (val !== undefined) {
      cleaned[key] = val && typeof val === 'object' && !(val instanceof Date) && !(val instanceof Timestamp)
        ? cleanObject(val)
        : val;
    }
  });
  return cleaned;
}

// For APK/Native builds, we need an absolute URL for the backend.
// In development, it defaults to empty string (relative path).
// We sanitize by removing trailing slash.
const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

// --- Real-time Listeners and State ---
let users: User[] = [];
let tournaments: Tournament[] = [];
let registrations: Registration[] = [];
let transactions: Transaction[] = [];
let paymentRequests: UserPaymentRequest[] = [];
let withdrawalRequests: WithdrawalRequest[] = [];
let notifications: AppNotification[] = [];
let news: string = '';
let redeemCodes: any[] = [];

let unsubscribes: (() => void)[] = [];

// Helper to convert Firestore timestamp to Date
const toDate = (ts: any) => {
  if (!ts) return new Date();
  if (ts instanceof Timestamp) return ts.toDate();
  if (typeof ts === 'object' && ts.seconds) return new Date(ts.seconds * 1000);
  if (ts instanceof Date) return ts;
  const d = new Date(ts);
  return isNaN(d.getTime()) ? new Date() : d;
};

export const stopRealtimeListeners = () => {
  unsubscribes.forEach(unsub => unsub());
  unsubscribes = [];
};

let isSyncingStatuses = false;

// Helper to sync tournament statuses based on time
const syncTournamentStatuses = async () => {
  if (isSyncingStatuses) return;
  isSyncingStatuses = true;
  try {
    const now = new Date();
  
  for (const t of tournaments) {
    if (t.status === 'completed' || t.status === 'cancelled') continue;
    
    // Combine date and time
    // t.date is already a Date object from toDate() in the listener
    const startDateTime = new Date(t.date);
    if (t.time) {
      const [hours, minutes] = t.time.split(':').map(Number);
      startDateTime.setHours(hours || 0, minutes || 0, 0, 0);
    }
    
    let newStatus: Tournament['status'] | null = null;
    
    // 1. Upcoming -> Ongoing if start time has passed
    if (t.status === 'upcoming' && now >= startDateTime) {
      newStatus = 'ongoing';
    } 
    
    // 2. Ongoing -> Completed if 2 hours have passed since start
    // This provides "automatic" completion if admin forgets, 
    // though admin can still complete it manually with results.
    const endDateTime = new Date(startDateTime.getTime() + 2 * 60 * 60 * 1000); 
    if (t.status === 'ongoing' && now >= endDateTime) {
      newStatus = 'completed';
    }

      if (newStatus && newStatus !== t.status) {
        console.log(`Auto-updating tournament ${t.id} status from ${t.status} to ${newStatus}`);
        await updateTournamentStatus(t.id, newStatus);
      }
    }
  } finally {
    isSyncingStatuses = false;
  }
};

// Initialize Real-time Listeners
export const initRealtimeListeners = (userId: string | null, role: UserRole | null) => {
  stopRealtimeListeners();
  
  const notify = () => window.dispatchEvent(new CustomEvent('ns-data-updated'));

  // Public/Global Listeners
  unsubscribes.push(onSnapshot(collection(db, 'tournaments'), (snapshot) => {
    tournaments = snapshot.docs.map(d => ({ 
      ...d.data(), 
      id: d.id, 
      date: d.data().date ? toDate(d.data().date) : new Date(),
      createdAt: toDate(d.data().createdAt), 
      updatedAt: toDate(d.data().updatedAt) 
    } as Tournament));
    
    // Auto-sync statuses on data change
    syncTournamentStatuses();
    
    notify();
  }, (err) => handleFirestoreError(err, OperationType.LIST, 'tournaments')));

  // Periodic sync every 30 seconds to catch transitions while app is idle
  const statusSyncInterval = setInterval(syncTournamentStatuses, 30000);
  unsubscribes.push(() => clearInterval(statusSyncInterval));

  unsubscribes.push(onSnapshot(doc(db, 'system', 'news'), (doc) => {
    if (doc.exists()) {
      news = doc.data().content || '';
      window.dispatchEvent(new CustomEvent('news-updated', { detail: { news } }));
    }
    notify();
  }, (err) => handleFirestoreError(err, OperationType.GET, 'system/news')));

  // Auth-dependent Listeners
  if (userId) {
    const isAdmin = role === UserRole.ADMIN;

    // Users: Admin sees all, Player sees all (for leaderboard) but rules might restrict
    unsubscribes.push(onSnapshot(collection(db, 'users'), (snapshot) => {
      users = snapshot.docs.map(d => ({ ...d.data(), id: d.id, createdAt: toDate(d.data().createdAt), updatedAt: toDate(d.data().updatedAt) } as User));
      notify();
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'users')));

    // Payment Requests
    const prQuery = isAdmin ? collection(db, 'paymentRequests') : query(collection(db, 'paymentRequests'), where('userId', '==', userId));
    unsubscribes.push(onSnapshot(prQuery, (snapshot) => {
      paymentRequests = snapshot.docs.map(d => ({ 
        ...d.data(), 
        id: d.id, 
        requestDate: toDate(d.data().requestDate),
        processedDate: d.data().processedDate ? toDate(d.data().processedDate) : undefined
      } as UserPaymentRequest));
      notify();
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'paymentRequests')));

    // Withdrawal Requests
    const wrQuery = isAdmin ? collection(db, 'withdrawalRequests') : query(collection(db, 'withdrawalRequests'), where('userId', '==', userId));
    unsubscribes.push(onSnapshot(wrQuery, (snapshot) => {
      withdrawalRequests = snapshot.docs.map(d => ({ 
        ...d.data(), 
        id: d.id, 
        requestDate: toDate(d.data().requestDate),
        processedDate: d.data().processedDate ? toDate(d.data().processedDate) : undefined
      } as WithdrawalRequest));
      notify();
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'withdrawalRequests')));

    // Notifications
    const nQuery = query(collection(db, 'notifications'), where('userId', '==', userId));
    unsubscribes.push(onSnapshot(nQuery, (snapshot) => {
      notifications = snapshot.docs.map(d => ({ ...d.data(), id: d.id, createdAt: toDate(d.data().createdAt) } as AppNotification));
      notify();
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'notifications')));

    // Transactions
    const tQuery = isAdmin ? collection(db, 'transactions') : query(collection(db, 'transactions'), where('userId', '==', userId));
    unsubscribes.push(onSnapshot(tQuery, (snapshot) => {
      transactions = snapshot.docs.map(d => ({ ...d.data(), id: d.id, transactionDate: toDate(d.data().transactionDate) } as Transaction));
      notify();
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'transactions')));
    
    // Registrations
    const rQuery = isAdmin ? collection(db, 'registrations') : query(collection(db, 'registrations'), where('userId', '==', userId));
    unsubscribes.push(onSnapshot(rQuery, (snapshot) => {
      registrations = snapshot.docs.map(d => ({ ...d.data(), id: d.id, registrationDate: toDate(d.data().registrationDate) } as Registration));
      notify();
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'registrations')));

    if (isAdmin) {
      unsubscribes.push(onSnapshot(collection(db, 'redeemCodes'), (snapshot) => {
        redeemCodes = snapshot.docs.map(d => ({ 
          ...d.data(), 
          id: d.id, 
          usedAt: d.data().usedAt ? toDate(d.data().usedAt) : undefined,
          createdAt: toDate(d.data().createdAt) 
        }));
        notify();
      }, (err) => handleFirestoreError(err, OperationType.LIST, 'redeemCodes')));
    }
  }
};

const getStoredData = () => null; // Use Firestore listeners instead
const saveToStorage = () => {}; // Use Firestore writes instead

// --- News Service (Mock) ---
export const getNews = (): string => {
  return news;
};

export const updateNews = async (newNews: string): Promise<boolean> => {
  try {
    await setDoc(doc(db, 'system', 'news'), cleanObject({ content: newNews, updatedAt: serverTimestamp() }), { merge: true });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'system/news');
    return false;
  }
};

// --- Notification Service (Mock) ---
export const getSystemNotifications = async (): Promise<AppNotification[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/notifications/system`);
    if (!response.ok) return [];
    const data = await response.json();
    return data.map((n: any) => ({
      ...n,
      createdAt: new Date(n.createdAt)
    }));
  } catch (error) {
    console.error('Failed to fetch system notifications:', error);
    return [];
  }
};

export const getNotificationsByUserId = (userId: string): AppNotification[] => {
  return notifications.filter(n => n.userId === userId).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
};

export const markNotificationAsRead = async (notificationId: string): Promise<boolean> => {
  try {
    await updateDoc(doc(db, 'notifications', notificationId), { isRead: true });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `notifications/${notificationId}`);
    return false;
  }
};

// --- Leaderboard Service (Mock) ---
export const getLeaderboard = () => {
  return users
    .filter(u => u.role === 'player')
    .map(u => ({
      id: u.id,
      username: u.username || u.ign || 'Player',
      avatar: u.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.id}`,
      kills: u.stats?.totalKills || 0,
      wins: u.stats?.totalWins || 0,
      matches: u.stats?.totalMatches || 0,
      kd: u.stats?.kdRatio || 0
    }))
    .sort((a, b) => b.kills - a.kills || b.wins - a.wins || b.matches - a.matches);
};

// --- Auth Service (Mock/Real Hybrid) ---
export const sendOtpToEmail = async (email: string): Promise<{ success: boolean; message: string; previewUrl?: string }> => {
  console.log(`Requesting OTP for ${email}`);
  const response = await fetch(`${API_BASE_URL}/api/auth/send-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to send OTP');
  }
  return data;
};

export const verifyOtp = async (email: string, otp: string): Promise<boolean> => {
  console.log(`Verifying OTP ${otp} for ${email}`);
  const response = await fetch(`${API_BASE_URL}/api/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp }),
  });

  if (!response.ok) {
    return false;
  }
  
  const data = await response.json();
  return data.success;
};

export const createUser = async (userData: Omit<User, 'id' | 'displayId' | 'createdAt' | 'updatedAt' | 'role' | 'walletBalance'> & { password?: string }): Promise<User> => {
  try {
    // 1. Create User in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password || 'default123');
    const firebaseUser = userCredential.user;

    // 2. Create User Profile in Firestore
    const displayId = `NS-${Math.floor(1000 + Math.random() * 9000)}`;
    const newUser: User = {
      ...userData,
      id: firebaseUser.uid,
      uid: firebaseUser.uid,
      displayId,
      role: 'player',
      walletBalance: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await setDoc(doc(db, 'users', firebaseUser.uid), cleanObject({
      ...newUser,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }));

    return newUser;
  } catch (error: any) {
    if (error.code === 'auth/email-already-in-use') {
      throw new Error('This email is already in use. Please sign in instead.');
    }
    handleFirestoreError(error, OperationType.CREATE, 'users');
    throw error;
  }
};

export const getAllUsers = (): User[] => {
  return users;
};

export const loginUser = async (email: string, password: string): Promise<{ user: User } | null> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;
    
    // Fetch user profile from Firestore
    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
    if (userDoc.exists()) {
      return { user: { ...userDoc.data(), id: userDoc.id } as User };
    } else {
      // If user exists in Auth but not in Firestore, create a basic profile
      const displayId = `NS-${Math.floor(1000 + Math.random() * 9000)}`;
      const referralCode = (firebaseUser.displayName?.split(' ')[0].substring(0, 4).toUpperCase() || 'REF') + Math.floor(1000 + Math.random() * 9000);
      
      const newUser: User = {
        id: firebaseUser.uid,
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        username: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
        ign: firebaseUser.email?.split('@')[0] || 'User',
        displayId,
        role: (firebaseUser.email === 'ashokpal76199@gmail.com' || (firebaseUser.phoneNumber && ['+919161226884'].includes(firebaseUser.phoneNumber))) ? 'admin' : 'player',
        walletBalance: 5, // Welcome Bonus
        profileImage: firebaseUser.photoURL || '',
        referralCode,
        referralsCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await setDoc(doc(db, 'users', firebaseUser.uid), cleanObject({
        ...newUser,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }));

      // Add welcome transaction and notification
      await addDoc(collection(db, 'transactions'), {
        userId: firebaseUser.uid,
        type: TransactionType.DEPOSIT,
        amount: 5,
        description: 'Welcome Bonus',
        status: TransactionStatus.COMPLETED,
        transactionDate: serverTimestamp()
      });

      await addDoc(collection(db, 'notifications'), {
        userId: firebaseUser.uid,
        title: 'Welcome to Nasid Esports!',
        message: 'We have added ₹5 to your wallet as a welcome bonus. Enjoy!',
        type: 'success',
        isRead: false,
        createdAt: serverTimestamp()
      });

      return { user: newUser };
    }
  } catch (error: any) {
    if (error.code === 'auth/operation-not-allowed') {
      throw new Error('Email/Password login is not enabled in Firebase Console. Please enable it in Authentication > Sign-in method.');
    }
    if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
      throw new Error('Invalid email or password.');
    }
    if (error.code === 'auth/too-many-requests') {
      throw new Error('Too many failed login attempts. Please try again later.');
    }
    console.error('Login failed:', error);
    throw error;
  }
  return null;
};

export const loginWithGoogle = async (): Promise<{ user: User } | null> => {
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const firebaseUser = result.user;

    // Fetch user profile from Firestore
    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
    if (userDoc.exists()) {
      return { user: { ...userDoc.data(), id: userDoc.id } as User };
    } else {
      // Create profile for new Google user
      const displayId = `NS-${Math.floor(1000 + Math.random() * 9000)}`;
      const referralCode = (firebaseUser.displayName?.split(' ')[0].substring(0, 4).toUpperCase() || 'REF') + Math.floor(1000 + Math.random() * 9000);
      
      const newUser: User = {
        id: firebaseUser.uid,
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        username: firebaseUser.displayName || 'User',
        ign: firebaseUser.displayName || 'User',
        displayId,
        role: (firebaseUser.email === 'ashokpal76199@gmail.com' || (firebaseUser.phoneNumber && ['+919161226884'].includes(firebaseUser.phoneNumber))) ? 'admin' : 'player',
        walletBalance: 5, // Welcome Bonus
        profileImage: firebaseUser.photoURL || '',
        referralCode,
        referralsCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await setDoc(doc(db, 'users', firebaseUser.uid), cleanObject({
        ...newUser,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }));

      // Add welcome transaction and notification
      await addDoc(collection(db, 'transactions'), {
        userId: firebaseUser.uid,
        type: TransactionType.DEPOSIT,
        amount: 5,
        description: 'Welcome Bonus',
        status: TransactionStatus.COMPLETED,
        transactionDate: serverTimestamp()
      });

      await addDoc(collection(db, 'notifications'), {
        userId: firebaseUser.uid,
        title: 'Welcome to Nasid Esports!',
        message: 'We have added ₹5 to your wallet as a welcome bonus. Enjoy!',
        type: 'success',
        isRead: false,
        createdAt: serverTimestamp()
      });

      return { user: newUser };
    }
  } catch (error) {
    console.error('Google Login failed:', error);
    throw error;
  }
};

export const resetPassword = async (email: string, newPassword: string): Promise<boolean> => {
  try {
    if (auth.currentUser && auth.currentUser.email === email) {
      await updatePassword(auth.currentUser, newPassword);
      await updateDoc(doc(db, 'users', auth.currentUser.uid), { 
        password: newPassword, // Note: keeping for legacy if needed, but Auth handles it
        updatedAt: serverTimestamp() 
      });
      return true;
    }
    // If not current user, this would typically require a re-auth or email link.
    // For now, simpler implementation:
    const q = query(collection(db, 'users'), where('email', '==', email));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const userDoc = snapshot.docs[0];
      await updateDoc(doc(db, 'users', userDoc.id), { password: newPassword, updatedAt: serverTimestamp() });
      return true;
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, 'users');
  }
  return false;
};

export const updateUserProfile = async (userId: string, updates: Partial<User>): Promise<boolean> => {
  try {
    // Safety check for update size
    const updateSize = JSON.stringify(updates).length;
    console.log(`Updating user profile ${userId}, payload size: ${updateSize} bytes`);
    
    if (updateSize > 500000) { // Keep updates under 500KB to be safe
      console.error('Update payload too large. Please compress images before uploading.');
      return false;
    }

    await updateDoc(doc(db, 'users', userId), cleanObject({ ...updates, updatedAt: serverTimestamp() }));
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
    return false;
  }
};

export const updateUserProfileImage = async (userId: string, imageUrl: string): Promise<boolean> => {
  return updateUserProfile(userId, { profileImage: imageUrl });
};

// --- User Service (Mock) ---
export const getUserById = (userId: string): User | undefined => {
  return users.find(user => user.id === userId || user.uid === userId);
};

export const fetchUserById = async (userId: string): Promise<User | null> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      return { ...userDoc.data(), id: userDoc.id } as User;
    }
  } catch (error) {
    console.error('Error fetching user:', error);
  }
  return null;
};

export const getTotalUserCount = (): number => {
  return users.length;
};

export const updateUserWalletBalance = async (userId: string, amount: number): Promise<boolean> => {
  try {
    await updateDoc(doc(db, 'users', userId), { 
      walletBalance: increment(amount),
      updatedAt: serverTimestamp() 
    });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
    return false;
  }
};

// --- Tournament Service (Mock) ---
export const getUpcomingTournaments = (): Tournament[] => {
  return tournaments.filter(t => t.status === 'upcoming');
};

export const getOngoingTournaments = (): Tournament[] => {
  return tournaments.filter(t => t.status === 'ongoing');
};

export const getCompletedTournaments = (): Tournament[] => {
  return tournaments.filter(t => t.status === 'completed');
};

export const getTournamentById = (tournamentId: string): Tournament | undefined => {
  return tournaments.find(t => t.id === tournamentId);
};

export const createTournament = async (tournament: Omit<Tournament, 'id' | 'createdAt' | 'updatedAt'>): Promise<Tournament> => {
  try {
    const docRef = await addDoc(collection(db, 'tournaments'), cleanObject({
      ...tournament,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }));
    return { ...tournament, id: docRef.id, createdAt: new Date(), updatedAt: new Date() } as Tournament;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'tournaments');
    throw error;
  }
};

export const updateTournamentStatus = async (
  tournamentId: string, 
  status: Tournament['status'], 
  winnerId?: string, 
  matchResults?: Tournament['matchResults'],
  roomId?: string,
  roomPassword?: string
): Promise<boolean> => {
  try {
    await runTransaction(db, async (transaction) => {
      const tournamentRef = doc(db, 'tournaments', tournamentId);
      const tournamentDoc = await transaction.get(tournamentRef);
      if (!tournamentDoc.exists()) throw new Error('Tournament not found');

      const currentData = tournamentDoc.data() as Tournament;
      
      // Prepare updates
      const updates: any = cleanObject({ status, updatedAt: serverTimestamp() });
      if (winnerId) updates.winnerId = winnerId;
      if (matchResults) updates.matchResults = matchResults;
      if (roomId) updates.roomId = roomId;
      if (roomPassword) updates.roomPassword = roomPassword;
      
      transaction.update(tournamentRef, updates);

      // If completing and results provided, update user stats
      if (status === 'completed' && matchResults && currentData.status !== 'completed') {
        for (const result of matchResults) {
          const userRef = doc(db, 'users', result.userId);
          const userDoc = await transaction.get(userRef);
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const currentStats = userData.stats || {
              totalMatches: 0,
              totalWins: 0,
              totalKills: 0,
              kdRatio: 0,
              winRate: 0
            };

            const newKills = currentStats.totalKills + result.kills;
            const newMatches = currentStats.totalMatches + 1;
            const newWins = currentStats.totalWins + (result.rank === 1 ? 1 : 0);
            
            const newStats = {
              totalMatches: newMatches,
              totalWins: newWins,
              totalKills: newKills,
              kdRatio: Number((newKills / Math.max(1, newMatches)).toFixed(2)),
              winRate: Number(((newWins / newMatches) * 100).toFixed(1))
            };

            transaction.update(userRef, { 
              stats: newStats,
              updatedAt: serverTimestamp()
            });
          }
        }
      }
    });

    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `tournaments/${tournamentId}`);
    return false;
  }
};

export const updateTournamentRoomInfo = async (tournamentId: string, roomId: string, roomPassword: string): Promise<boolean> => {
  try {
    await updateDoc(doc(db, 'tournaments', tournamentId), cleanObject({
      roomId,
      roomPassword,
      updatedAt: serverTimestamp()
    }));
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `tournaments/${tournamentId}`);
    return false;
  }
};

// --- Registration Service (Mock) ---
export const getRegistrationsByTournamentId = (tournamentId: string): Registration[] => {
  return registrations.filter(reg => reg.tournamentId === tournamentId);
};

export const adminRegisterUserForTournament = async (tournamentId: string, userId: string, ign: string): Promise<boolean> => {
  try {
    await runTransaction(db, async (transaction) => {
      const tournamentRef = doc(db, 'tournaments', tournamentId);
      const tournamentDoc = await transaction.get(tournamentRef);
      if (!tournamentDoc.exists()) throw new Error('Tournament not found');
      
      const data = tournamentDoc.data() as Tournament;
      if (data.registeredCount >= data.maxSlots) throw new Error('Tournament is full');

      const regRef = doc(collection(db, 'registrations'));
      transaction.set(regRef, {
        tournamentId,
        userId,
        ign,
        uid: userId,
        status: 'confirmed',
        registrationDate: serverTimestamp()
      });

      transaction.update(tournamentRef, {
        registeredCount: increment(1),
        updatedAt: serverTimestamp()
      });
    });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'registrations');
    return false;
  }
};

export const removeRegistration = async (registrationId: string, tournamentId: string): Promise<boolean> => {
  try {
    await runTransaction(db, async (transaction) => {
      const regRef = doc(db, 'registrations', registrationId);
      const tournamentRef = doc(db, 'tournaments', tournamentId);
      
      transaction.delete(regRef);
      transaction.update(tournamentRef, {
        registeredCount: increment(-1),
        updatedAt: serverTimestamp()
      });
    });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `registrations/${registrationId}`);
    return false;
  }
};

export const getMyTournaments = (userId: string): Tournament[] => {
  const userRegs = registrations.filter(reg => reg.userId === userId);
  const tournamentIds = userRegs.map(reg => reg.tournamentId);
  return tournaments.filter(t => tournamentIds.includes(t.id));
};

export const getRegistrationsByUserId = (userId: string): Registration[] => {
  return registrations.filter(reg => reg.userId === userId);
};

export const registerUserForTournament = async (registration: Omit<Registration, 'id' | 'registrationDate'>, entryFee: number, tournamentName: string): Promise<Registration> => {
  try {
    const docId = await runTransaction(db, async (transaction) => {
      // 1. Get Tournament
      const tournamentRef = doc(db, 'tournaments', registration.tournamentId);
      const tournamentDoc = await transaction.get(tournamentRef);
      
      if (!tournamentDoc.exists()) {
        throw new Error('Tournament does not exist.');
      }
      
      const data = tournamentDoc.data() as Tournament;
      const currentCount = data.registeredCount || 0;
      if (currentCount >= data.maxSlots) {
        throw new Error('Tournament is full.');
      }

      // 2. Get User
      const userRef = doc(db, 'users', registration.userId);
      const userDoc = await transaction.get(userRef);
      if (!userDoc.exists()) throw new Error('User not found.');
      const userBalance = userDoc.data().walletBalance || 0;
      
      if (userBalance < entryFee) {
        throw new Error('Insufficient balance.');
      }

      // 3. Deduct Fee
      transaction.update(userRef, {
        walletBalance: increment(-entryFee),
        updatedAt: serverTimestamp()
      });

      // 4. Create Transaction Record
      const transRef = doc(collection(db, 'transactions'));
      transaction.set(transRef, {
        userId: registration.userId,
        type: TransactionType.ENTRY_FEE,
        amount: entryFee,
        description: `Entry fee for ${tournamentName}`,
        status: TransactionStatus.COMPLETED,
        relatedEntityId: registration.tournamentId,
        transactionDate: serverTimestamp()
      });

      // 5. Create Registration
      const regRef = doc(collection(db, 'registrations'));
      transaction.set(regRef, {
        ...registration,
        registrationDate: serverTimestamp(),
      });

      // 6. Update Tournament Count
      transaction.update(tournamentRef, {
        registeredCount: increment(1),
        updatedAt: serverTimestamp()
      });
      
      return regRef.id;
    });

    return { ...registration, id: docId, registrationDate: new Date() } as Registration;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'registrations');
    throw error;
  }
};

export const isUserRegisteredForTournament = (userId: string, tournamentId: string): boolean => {
  return registrations.some(reg => reg.userId === userId && reg.tournamentId === tournamentId && reg.status === 'confirmed');
};

// --- Transaction Service (Mock) ---
export const addTransaction = async (transaction: Omit<Transaction, 'id' | 'transactionDate'>): Promise<Transaction> => {
  try {
    const docRef = await addDoc(collection(db, 'transactions'), cleanObject({
      ...transaction,
      transactionDate: serverTimestamp(),
    }));
    return { ...transaction, id: docRef.id, transactionDate: new Date() } as Transaction;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'transactions');
    throw error;
  }
};

export const getTransactionsByUserId = (userId: string): Transaction[] => {
  return transactions.filter(t => t.userId === userId);
};

export const deleteUser = async (userId: string): Promise<boolean> => {
  try {
    await deleteDoc(doc(db, 'users', userId));
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `users/${userId}`);
    return false;
  }
};

export const getWithdrawalRequestsByUserId = (userId: string): WithdrawalRequest[] => {
  return withdrawalRequests.filter(wr => wr.userId === userId);
};

// --- Payment Request Service (Mock) ---
export const getQrCodeUrl = async (): Promise<string> => {
  try {
    const docSnap = await getDoc(doc(db, 'system', 'config'));
    if (docSnap.exists()) {
      return docSnap.data().qrCodeUrl || mockQrCodeUrl;
    }
  } catch (error) {
    console.error('Failed to get QR code URL:', error);
  }
  return mockQrCodeUrl;
};

export const updateQrCodeUrl = async (newUrl: string): Promise<boolean> => {
  try {
    await setDoc(doc(db, 'system', 'config'), cleanObject({ qrCodeUrl: newUrl, updatedAt: serverTimestamp() }), { merge: true });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'system/config');
    return false;
  }
};

export const createPaymentRequest = async (request: Omit<UserPaymentRequest, 'id' | 'requestDate' | 'status'>): Promise<UserPaymentRequest> => {
  try {
    const docRef = await addDoc(collection(db, 'paymentRequests'), cleanObject({
      ...request,
      status: PaymentRequestStatus.PENDING,
      requestDate: serverTimestamp(),
    }));
    return { ...request, id: docRef.id, status: PaymentRequestStatus.PENDING, requestDate: new Date() } as UserPaymentRequest;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'paymentRequests');
    throw error;
  }
};

export const getPendingPaymentRequests = (): UserPaymentRequest[] => {
  return paymentRequests.filter(req => req.status === PaymentRequestStatus.PENDING);
};

export const updatePaymentRequestStatus = async (requestId: string, status: PaymentRequestStatus, adminId: string): Promise<boolean> => {
  try {
    await runTransaction(db, async (transaction) => {
      const prRef = doc(db, 'paymentRequests', requestId);
      const prSnap = await transaction.get(prRef);
      if (!prSnap.exists()) throw new Error('Payment request not found');
      
      const prData = prSnap.data() as UserPaymentRequest;
      if (prData.status !== PaymentRequestStatus.PENDING) return;

      // 1. Update request status
      transaction.update(prRef, {
        status,
        processedByAdminId: adminId,
        processedDate: serverTimestamp()
      });

      if (status === PaymentRequestStatus.ACCEPTED) {
        // 2. Update user wallet
        const userRef = doc(db, 'users', prData.userId);
        transaction.update(userRef, {
          walletBalance: increment(prData.amount),
          updatedAt: serverTimestamp()
        });

        // 3. Add transaction record
        const transRef = doc(collection(db, 'transactions'));
        transaction.set(transRef, {
          userId: prData.userId,
          type: TransactionType.DEPOSIT,
          amount: prData.amount,
          description: `Deposit via QR (UTR: ${prData.utr})`,
          status: TransactionStatus.COMPLETED,
          relatedEntityId: requestId,
          transactionDate: serverTimestamp()
        });

        // 4. Add notification
        const notifRef = doc(collection(db, 'notifications'));
        transaction.set(notifRef, {
          userId: prData.userId,
          title: 'Deposit Approved',
          message: `Your deposit of ₹${prData.amount} has been approved and added to your wallet.`,
          type: 'success',
          isRead: false,
          createdAt: serverTimestamp()
        });
      }
    });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `paymentRequests/${requestId}`);
    return false;
  }
};

// --- Withdrawal Request Service (Mock) ---
export const createWithdrawalRequest = async (request: Omit<WithdrawalRequest, 'id' | 'requestDate' | 'status'>): Promise<WithdrawalRequest> => {
  try {
    return await runTransaction(db, async (transaction) => {
      const userRef = doc(db, 'users', request.userId);
      const userDoc = await transaction.get(userRef);
      if (!userDoc.exists()) throw new Error('User not found');
      
      const balance = userDoc.data().walletBalance || 0;
      if (balance < request.amount) throw new Error('Insufficient balance');

      // 1. Deduct balance
      transaction.update(userRef, {
        walletBalance: balance - request.amount,
        updatedAt: serverTimestamp()
      });

      // 2. Create withdrawal request
      const wrRef = doc(collection(db, 'withdrawalRequests'));
      
      // Clean undefined fields for Firestore
      const cleanRequest = Object.fromEntries(
        Object.entries(request).filter(([_, v]) => v !== undefined)
      );

      const wrData = {
        ...cleanRequest,
        status: PaymentRequestStatus.PENDING,
        requestDate: serverTimestamp(),
      };
      transaction.set(wrRef, wrData);

      // 3. Create pending transaction
      const transRef = doc(collection(db, 'transactions'));
      transaction.set(transRef, {
        userId: request.userId,
        type: 'withdrawal',
        amount: request.amount,
        description: `Withdrawal request (${request.method === 'upi' ? 'UPI' : 'Redeem Code'})`,
        status: 'pending',
        relatedEntityId: wrRef.id,
        transactionDate: serverTimestamp()
      });

      return { ...request, id: wrRef.id, status: PaymentRequestStatus.PENDING, requestDate: new Date() } as WithdrawalRequest;
    });
  } catch (error: any) {
    handleFirestoreError(error, OperationType.CREATE, 'withdrawalRequests');
    throw error;
  }
};

export const getPendingWithdrawalRequests = (): WithdrawalRequest[] => {
  return withdrawalRequests.filter(req => req.status === PaymentRequestStatus.PENDING);
};

export const updateWithdrawalRequestStatus = async (requestId: string, status: PaymentRequestStatus, adminId: string, redeemCode?: string): Promise<boolean> => {
  try {
    // 1. Find the related transaction BEFORE the transaction block
    // Firestore transactions cannot execute asynchronous queries like getDocs inside them.
    const transQuery = query(collection(db, 'transactions'), where('relatedEntityId', '==', requestId));
    const transSnap = await getDocs(transQuery);
    const transDocRef = !transSnap.empty ? transSnap.docs[0].ref : null;

    await runTransaction(db, async (transaction) => {
      const wrRef = doc(db, 'withdrawalRequests', requestId);
      const wrDoc = await transaction.get(wrRef);
      if (!wrDoc.exists()) throw new Error('Request not found');
      
      const wrData = wrDoc.data() as WithdrawalRequest;
      if (wrData.status !== PaymentRequestStatus.PENDING) return;
      
      transaction.update(wrRef, {
        status,
        processedByAdminId: adminId,
        processedDate: serverTimestamp(),
        ...(redeemCode ? { redeemCode } : {})
      });
      
      // Update transaction status if it exists
      if (transDocRef) {
        transaction.update(transDocRef, {
          status: status === PaymentRequestStatus.ACCEPTED ? 'completed' : 'failed'
        });
      }

      if (status === PaymentRequestStatus.ACCEPTED) {
        const notificationRef = doc(collection(db, 'notifications'));
        transaction.set(notificationRef, {
          userId: wrData.userId,
          title: 'Withdrawal Approved',
          message: wrData.method === 'redeem_code' && redeemCode 
            ? `Your redeem code for ₹${wrData.amount} is: ${redeemCode}. Thank you for using our app!`
            : `Your withdrawal of ₹${wrData.amount} has been approved and processed.`,
          type: 'success',
          isRead: false,
          createdAt: serverTimestamp()
        });
      } else if (status === PaymentRequestStatus.DECLINED) {
        // Refund balance
        const userRef = doc(db, 'users', wrData.userId);
        transaction.update(userRef, {
          walletBalance: increment(wrData.amount),
          updatedAt: serverTimestamp()
        });

        const notificationRef = doc(collection(db, 'notifications'));
        transaction.set(notificationRef, {
          userId: wrData.userId,
          title: 'Withdrawal Declined',
          message: `Your withdrawal request of ₹${wrData.amount} was declined. The amount has been refunded to your wallet.`,
          type: 'error',
          isRead: false,
          createdAt: serverTimestamp()
        });
      }
    });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `withdrawalRequests/${requestId}`);
    return false;
  }
};

// --- Admin Credentials Service (Mock) ---
export const updateAdminCredentials = async (newEmail: string, newPassword: string): Promise<boolean> => {
  try {
    await setDoc(doc(db, 'system', 'config'), cleanObject({ 
      adminEmail: newEmail, 
      adminPassword: newPassword,
      updatedAt: serverTimestamp() 
    }), { merge: true });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'system/config');
    return false;
  }
};

export const updatePlayerCredentials = async (newEmail: string, newPassword: string): Promise<boolean> => {
  try {
    await setDoc(doc(db, 'system', 'config'), cleanObject({ 
      playerEmail: newEmail, 
      playerPassword: newPassword,
      updatedAt: serverTimestamp() 
    }), { merge: true });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'system/config');
    return false;
  }
};

// --- Redeem Code Service ---
export const getAllRedeemCodes = () => redeemCodes;

export const generateRedeemCode = async (code: string, amount: number): Promise<boolean> => {
  try {
    const q = query(collection(db, 'redeemCodes'), where('code', '==', code));
    const snap = await getDocs(q);
    if (!snap.empty) {
      throw new Error('Code already exists');
    }

    await addDoc(collection(db, 'redeemCodes'), cleanObject({
      code,
      amount,
      isUsed: false,
      createdAt: serverTimestamp()
    }));
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'redeemCodes');
    return false;
  }
};

export const redeemRewardCode = async (userId: string, code: string): Promise<{ success: boolean; amount?: number; message: string }> => {
  try {
    // 1. Find the redeem code document first (outside transaction because we need to search by field)
    const q = query(collection(db, 'redeemCodes'), where('code', '==', code));
    const snap = await getDocs(q);
    
    if (snap.empty) {
      return { success: false, message: 'Invalid code.' };
    }

    const codeDocRef = snap.docs[0].ref;

    // 2. Perform the redemption in a single transaction
    return await runTransaction(db, async (t) => {
      const codeDoc = await t.get(codeDocRef);
      if (!codeDoc.exists()) {
        return { success: false, message: 'Code no longer exists.' };
      }
      
      const codeData = codeDoc.data()!;
      if (codeData.isUsed) {
        return { success: false, message: 'Code already used.' };
      }

      const userRef = doc(db, 'users', userId);
      const userDoc = await t.get(userRef);
      if (!userDoc.exists()) {
        return { success: false, message: 'User not found.' };
      }

      const amount = codeData.amount;
      
      // Mark code as used
      t.update(codeDocRef, {
        isUsed: true,
        usedBy: userId,
        usedAt: serverTimestamp()
      });

      // Update user balance
      t.update(userRef, {
        walletBalance: increment(amount),
        updatedAt: serverTimestamp()
      });

      // Add transaction record
      const transRef = doc(collection(db, 'transactions'));
      t.set(transRef, {
        userId,
        type: 'redeem_code',
        amount,
        description: `Redeemed code: ${code}`,
        status: 'completed',
        transactionDate: serverTimestamp()
      });

      return { success: true, amount, message: `Successfully redeemed ₹${amount}!` };
    });
  } catch (error: any) {
    console.error('Redeem error:', error);
    return { success: false, message: error.message || 'Failed to redeem code.' };
  }
};

// --- Referral Service ---
export const applyReferralCode = async (userId: string, code: string): Promise<{ success: boolean; message: string }> => {
  try {
    const referralQuery = query(collection(db, 'users'), where('referralCode', '==', code));
    const referrerSnap = await getDocs(referralQuery);
    
    if (referrerSnap.empty) {
      return { success: false, message: 'Invalid referral code.' };
    }
    
    const referrerDoc = referrerSnap.docs[0];
    const referrerId = referrerDoc.id;
    
    return await runTransaction(db, async (transaction) => {
      const userRef = doc(db, 'users', userId);
      const userDoc = await transaction.get(userRef);
      if (!userDoc.exists()) throw new Error('User not found');
      
      const userData = userDoc.data() as User;
      if (userData.referredBy) return { success: false, message: 'You have already used a referral code.' };
      if (userData.referralCode === code) return { success: false, message: 'You cannot use your own referral code.' };

      const referrerRef = doc(db, 'users', referrerId);
      
      const referralRewardAmount = 10;
      const referredRewardAmount = 5;

      transaction.update(userRef, {
        referredBy: referrerId,
        walletBalance: increment(referredRewardAmount),
        updatedAt: serverTimestamp()
      });

      transaction.update(referrerRef, {
        referralsCount: increment(1),
        walletBalance: increment(referralRewardAmount),
        updatedAt: serverTimestamp()
      });

      const referralRef = doc(collection(db, 'referrals'));
      transaction.set(referralRef, {
        referrerId,
        referredUserId: userId,
        amountEarned: referralRewardAmount,
        timestamp: serverTimestamp()
      });

      const transRef1 = doc(collection(db, 'transactions'));
      transaction.set(transRef1, {
        userId: referrerId,
        type: 'prize_win',
        amount: referralRewardAmount,
        description: 'Referral reward',
        status: 'completed',
        relatedEntityId: referralRef.id,
        transactionDate: serverTimestamp()
      });

      const transRef2 = doc(collection(db, 'transactions'));
      transaction.set(transRef2, {
        userId: userId,
        type: 'prize_win',
        amount: referredRewardAmount,
        description: 'Signup referral bonus',
        status: 'completed',
        relatedEntityId: referralRef.id,
        transactionDate: serverTimestamp()
      });

      const notifRef1 = doc(collection(db, 'notifications'));
      transaction.set(notifRef1, {
        userId: referrerId,
        title: 'Referral Bonus!',
        message: `You earned ₹${referralRewardAmount} for referring a new player. Keep it up!`,
        type: 'success',
        isRead: false,
        createdAt: serverTimestamp()
      });

      return { success: true, message: `Referral code applied! You earned ₹${referredRewardAmount}.` };
    });
  } catch (error: any) {
    handleFirestoreError(error, OperationType.WRITE, 'referrals');
    return { success: false, message: error.message || 'Error applying referral code.' };
  }
};

export const getReferralsByUserId = async (referrerId: string) => {
  try {
    const q = query(collection(db, 'referrals'), where('referrerId', '==', referrerId), orderBy('timestamp', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ ...d.data(), id: d.id, timestamp: (d.data().timestamp as Timestamp).toDate() }));
  } catch (error) {
    console.error('Error fetching referrals:', error);
    return [];
  }
};
