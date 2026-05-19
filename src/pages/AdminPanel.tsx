import { useEffect, useState } from 'react';
import { WithdrawalRequest, Tournament, User, MatchResult, Registration, UserPaymentRequest, RedeemCode } from '../types';
import TournamentCard from '../components/TournamentCard';
import { createTournament, getUpcomingTournaments, getOngoingTournaments, getCompletedTournaments, updateTournamentStatus, updateTournamentRoomInfo, getUserById, getRegistrationsByTournamentId, removeRegistration, adminRegisterUserForTournament, getPendingPaymentRequests, updatePaymentRequestStatus, updateUserWalletBalance, addTransaction, updateAdminCredentials, updatePlayerCredentials, getPendingWithdrawalRequests, updateWithdrawalRequestStatus, getNews, updateNews, getTotalUserCount, getAllUsers, getQrCodeUrl, updateQrCodeUrl, getAllRedeemCodes, generateRedeemCode, deleteUser } from '../services/firebaseService';
import Button from '../components/Button';
import { motion, AnimatePresence } from 'motion/react';
import { TournamentStatus, UserRole, PaymentRequestStatus, TransactionType, TransactionStatus, TournamentCategory } from '../constants';
import { Users, Trophy, Wallet, Bell, Search, Plus, Minus, Key, Ticket, Trash2 } from 'lucide-react';
import { useFirebaseData } from '../hooks/useFirebaseData';
import { formatDateTime12h, formatTimeString12h } from '../lib/dateUtils';

interface AdminPanelProps {
  currentUserId: string | null;
}

export default function AdminPanel({ currentUserId }: AdminPanelProps) {
  const [currentUser, setCurrentUser] = useState<User | null | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  const [upcomingTournaments, setUpcomingTournaments] = useState<Tournament[]>([]);
  const [ongoingTournaments, setOngoingTournaments] = useState<Tournament[]>([]);
  const [completedTournaments, setCompletedTournaments] = useState<Tournament[]>([]);
  const [pendingPaymentRequests, setPendingPaymentRequests] = useState<UserPaymentRequest[]>([]);
  const [pendingWithdrawalRequests, setPendingWithdrawalRequests] = useState<WithdrawalRequest[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [redeemCodes, setRedeemCodes] = useState<RedeemCode[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'create' | 'manage_upcoming' | 'manage_ongoing' | 'manage_completed' | 'payment_requests' | 'withdrawal_requests' | 'admin_settings' | 'room_control' | 'redeem_codes' | 'news' | 'users'>('create');
 
  // Redeem Code Generation State
  const [newRedeemCode, setNewRedeemCode] = useState('');
  const [newRedeemAmount, setNewRedeemAmount] = useState('');

  // Wallet Adjustment State
  const [adjustingUserId, setAdjustingUserId] = useState<string | null>(null);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustType, setAdjustType] = useState<'add' | 'deduct'>('add');

  const [newsInput, setNewsInput] = useState('');
  
  // Admin Settings State
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [confirmNewAdminPassword, setConfirmNewAdminPassword] = useState('');
  
  const [newPlayerEmail, setNewPlayerEmail] = useState('');
  const [newPlayerPassword, setNewPlayerPassword] = useState('');
  const [confirmNewPlayerPassword, setConfirmNewPlayerPassword] = useState('');
  
  const [newQrCodeUrl, setNewQrCodeUrl] = useState('');

  const [adminSettingsError, setAdminSettingsError] = useState<string | null>(null);
  const [adminSettingsSuccess, setAdminSettingsSuccess] = useState<string | null>(null);

  // New Tournament Form State
  const [newTournamentName, setNewTournamentName] = useState('');
  const [newTournamentDate, setNewTournamentDate] = useState('');
  const [newTournamentTime, setNewTournamentTime] = useState('');
  const [newTournamentPrizePool, setNewTournamentPrizePool] = useState('');
  const [newTournamentEntryFee, setNewTournamentEntryFee] = useState('');
  const [newTournamentMap, setNewTournamentMap] = useState('');
  const [newTournamentVersion, setNewTournamentVersion] = useState('');
  const [newTournamentCategory, setNewTournamentCategory] = useState<TournamentCategory>(TournamentCategory.BATTLE_ROYALE);
  const [newMaxSlots, setNewMaxSlots] = useState('48');
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);

  // Manage Tournament State
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [tournamentRegistrations, setTournamentRegistrations] = useState<Registration[]>([]);
  const [winnerId, setWinnerId] = useState('');
  const [roomId, setRoomId] = useState('');
  const [roomPassword, setRoomPassword] = useState('');
  const [matchResultsInput, setMatchResultsInput] = useState(''); // JSON string input
  const [manageLoading, setManageLoading] = useState(false);
  const [manageError, setManageError] = useState<string | null>(null);
  const [manageSuccess, setManageSuccess] = useState<string | null>(null);
  const [showAddParticipant, setShowAddParticipant] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState('');

  // Room Control State
  const [roomEdits, setRoomEdits] = useState<Record<string, { roomId: string; roomPassword: string }>>({});

  // Withdrawal Processing State
  const [redeemCodeInputs, setRedeemCodeInputs] = useState<Record<string, string>>({});

  const dataVersion = useFirebaseData();


  useEffect(() => {
    const fetchData = async () => {
      if (currentUserId) {
        const user = getUserById(currentUserId);
        setCurrentUser(user || null);
        setIsLoading(false);
        if (user && user.role !== UserRole.ADMIN) {
          console.error('Access Denied: Only admins can view this page.');
        }
      } else {
        setIsLoading(false);
        setCurrentUser(null);
      }
      
      fetchTournaments();
      fetchPaymentRequests();
      setRedeemCodes(getAllRedeemCodes());
      setTotalUsers(getTotalUserCount());
      setAllUsers(getAllUsers());
      setNewsInput(getNews());
      
      const qrUrl = await getQrCodeUrl();
      setNewQrCodeUrl(qrUrl);
    };
    
    fetchData();
  }, [currentUserId, dataVersion]);

  const fetchTournaments = () => {
    setUpcomingTournaments(getUpcomingTournaments());
    setOngoingTournaments(getOngoingTournaments());
    setCompletedTournaments(getCompletedTournaments());
  };

  const fetchPaymentRequests = () => {
    setPendingPaymentRequests(getPendingPaymentRequests());
    setPendingWithdrawalRequests(getPendingWithdrawalRequests());
  };

  const handleCreateTournament = async () => {
    setCreateError(null);
    setCreateSuccess(null);
    setCreateLoading(true);

    if (!currentUser || currentUser.role !== UserRole.ADMIN) {
      setCreateError('Admin access required.');
      setCreateLoading(false);
      return;
    }

    const prizePool = parseFloat(newTournamentPrizePool);
    const entryFee = parseFloat(newTournamentEntryFee);
    const maxSlots = parseInt(newMaxSlots);
    const date = new Date(newTournamentDate);

    if (!newTournamentName || !newTournamentDate || !newTournamentTime || isNaN(prizePool) || isNaN(entryFee) || isNaN(maxSlots) || !newTournamentMap || !newTournamentVersion) {
      setCreateError('Please fill all fields correctly.');
      setCreateLoading(false);
      return;
    }

    try {
      const newTournament = await createTournament({
        name: newTournamentName,
        date: date,
        time: newTournamentTime,
        prizePool: prizePool,
        entryFee: entryFee,
        map: newTournamentMap,
        version: newTournamentVersion,
        category: newTournamentCategory,
        maxSlots: maxSlots,
        registeredCount: 0,
        status: TournamentStatus.UPCOMING,
        adminId: currentUser.id,
      });
      setCreateSuccess(`Tournament '${newTournament.name}' created successfully!`);
      fetchTournaments(); // Refresh list
      // Clear form
      setNewTournamentName('');
      setNewTournamentDate('');
      setNewTournamentTime('');
      setNewTournamentPrizePool('');
      setNewTournamentEntryFee('');
      setNewTournamentMap('');
      setNewTournamentVersion('');
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create tournament.');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleSelectTournament = (tournament: Tournament) => {
    setSelectedTournament(tournament);
    setWinnerId(tournament.winnerId || '');
    setRoomId(tournament.roomId || '');
    setRoomPassword(tournament.roomPassword || '');
    setMatchResultsInput(tournament.matchResults ? JSON.stringify(tournament.matchResults, null, 2) : '');
    setTournamentRegistrations(getRegistrationsByTournamentId(tournament.id));
  };

  const handleUpdateTournamentStatus = async (status: TournamentStatus) => {
    if (!selectedTournament) return;

    setManageError(null);
    setManageSuccess(null);
    setManageLoading(true);

    let parsedMatchResults: MatchResult[] | undefined = undefined;
    if (matchResultsInput) {
      try {
        parsedMatchResults = JSON.parse(matchResultsInput);
        // Basic validation for match results structure
        if (!Array.isArray(parsedMatchResults) || !parsedMatchResults.every(r => 'userId' in r && 'kills' in r && 'rank' in r)) {
          throw new Error('Invalid match results format.');
        }
      } catch (e: any) {
        setManageError('Invalid JSON for match results: ' + e.message);
        setManageLoading(false);
        return;
      }
    }

    try {
      const updated = await updateTournamentStatus(
        selectedTournament.id,
        status,
        winnerId || undefined,
        parsedMatchResults,
        roomId || undefined,
        roomPassword || undefined
      );
      if (updated) {
        setManageSuccess(`Tournament '${selectedTournament.name}' status updated to ${status}.`);
        fetchTournaments(); // Refresh list
        setSelectedTournament(null); // Clear selection
      } else {
        throw new Error('Failed to update tournament status.');
      }
    } catch (err: any) {
      setManageError(err.message || 'Failed to update tournament.');
    } finally {
      setManageLoading(false);
    }
  };

  const handleChangeAdminCredentials = async () => {
    setAdminSettingsError(null);
    setAdminSettingsSuccess(null);

    if (!newAdminEmail || !newAdminPassword || !confirmNewAdminPassword) {
      setAdminSettingsError('All fields are required.');
      return;
    }

    if (newAdminPassword !== confirmNewAdminPassword) {
      setAdminSettingsError('New password and confirm password do not match.');
      return;
    }

    try {
      const updated = await updateAdminCredentials(newAdminEmail, newAdminPassword);
      if (updated) {
        setAdminSettingsSuccess('Admin credentials updated successfully!');
        setNewAdminEmail('');
        setNewAdminPassword('');
        setConfirmNewAdminPassword('');
      } else {
        setAdminSettingsError('Failed to update admin credentials.');
      }
    } catch (error: any) {
      setAdminSettingsError(error.message || 'An unexpected error occurred.');
    }
  };

  const handleChangePlayerCredentials = async () => {
    setAdminSettingsError(null);
    setAdminSettingsSuccess(null);

    if (!newPlayerEmail || !newPlayerPassword || !confirmNewPlayerPassword) {
      setAdminSettingsError('All player fields are required.');
      return;
    }

    if (newPlayerPassword !== confirmNewPlayerPassword) {
      setAdminSettingsError('New player password and confirm password do not match.');
      return;
    }

    try {
      const updated = await updatePlayerCredentials(newPlayerEmail, newPlayerPassword);
      if (updated) {
        setAdminSettingsSuccess('Player credentials updated successfully!');
        setNewPlayerEmail('');
        setNewPlayerPassword('');
        setConfirmNewPlayerPassword('');
      } else {
        setAdminSettingsError('Failed to update player credentials.');
      }
    } catch (error: any) {
      setAdminSettingsError(error.message || 'An unexpected error occurred.');
    }
  };

  const handleUpdateQrCode = async () => {
    if (!newQrCodeUrl) {
      setAdminSettingsError('QR Code URL is required.');
      return;
    }
    
    if (newQrCodeUrl.length > 500000) {
      setAdminSettingsError('QR Code data is too large. Please use an external link or a smaller image.');
      return;
    }

    const updated = await updateQrCodeUrl(newQrCodeUrl);
    if (updated) {
      setAdminSettingsSuccess('QR Code URL updated successfully!');
      setTimeout(() => setAdminSettingsSuccess(null), 3000);
    } else {
      setAdminSettingsError('Failed to update QR Code URL.');
    }
  };

  const handleProcessWithdrawalRequest = async (requestId: string, status: PaymentRequestStatus) => {
    if (!currentUser || currentUser.role !== UserRole.ADMIN) {
      setManageError('Admin access required.');
      return;
    }

    setManageLoading(true);
    setManageError(null);
    setManageSuccess(null);

    try {
      const request = pendingWithdrawalRequests.find(req => req.id === requestId);
      if (!request) {
        throw new Error('Withdrawal request not found.');
      }

      const redeemCode = redeemCodeInputs[requestId];
      if (status === PaymentRequestStatus.ACCEPTED && request.method === 'redeem_code' && !redeemCode) {
        throw new Error('Redeem code is required for this withdrawal.');
      }

      const updated = await updateWithdrawalRequestStatus(requestId, status, currentUser.id, redeemCode);

      if (updated) {
        setManageSuccess(`Withdrawal request ${requestId} ${status === PaymentRequestStatus.ACCEPTED ? 'accepted' : 'declined'}.`);
      } else {
        throw new Error('Failed to process withdrawal request.');
      }
      fetchPaymentRequests(); // Refresh list
    } catch (err: any) {
      setManageError(err.message || 'Failed to process withdrawal request.');
    } finally {
      setManageLoading(false);
    }
  };

  const handleProcessPaymentRequest = async (requestId: string, status: PaymentRequestStatus) => {
    if (!currentUser || currentUser.role !== UserRole.ADMIN) {
      setManageError('Admin access required.');
      return;
    }

    setManageLoading(true);
    setManageError(null);
    setManageSuccess(null);

    try {
      const request = pendingPaymentRequests.find(req => req.id === requestId);
      if (!request) {
        throw new Error('Payment request not found.');
      }

      const updated = await updatePaymentRequestStatus(requestId, status, currentUser.id);

      if (updated && status === PaymentRequestStatus.ACCEPTED) {
        setManageSuccess(`Payment request ${requestId} accepted. User wallet updated.`);
      } else if (updated && status === PaymentRequestStatus.DECLINED) {
        setManageSuccess(`Payment request ${requestId} declined.`);
      } else {
        throw new Error('Failed to process payment request.');
      }
      fetchPaymentRequests(); // Refresh list
      fetchTournaments(); // Refresh user data if needed (e.g. for updated wallet in other views)
    } catch (err: any) {
      setManageError(err.message || 'Failed to process payment request.');
    } finally {
      setManageLoading(false);
    }
  };

  const handleUpdateNews = async () => {
    if (!newsInput.trim()) {
      setAdminSettingsError('News content cannot be empty.');
      return;
    }
    
    if (newsInput.length > 50000) {
      setAdminSettingsError('News content is too long. Please keep it under 50,000 characters.');
      return;
    }

    const success = await updateNews(newsInput);
    if (success) {
      setAdminSettingsSuccess('News updated successfully!');
      setTimeout(() => setAdminSettingsSuccess(null), 3000);
    } else {
      setAdminSettingsError('Failed to update news.');
      setTimeout(() => setAdminSettingsError(null), 3000);
    }
  };

  const handleUpdateRoomInfoQuick = async (tournamentId: string) => {
    const edits = roomEdits[tournamentId];
    if (!edits) return;
    
    setManageLoading(true);
    try {
      const success = await updateTournamentRoomInfo(tournamentId, edits.roomId, edits.roomPassword);
      if (success) {
        setManageSuccess('Room info updated!');
        setTimeout(() => setManageSuccess(null), 2000);
      }
    } catch (err: any) {
      setManageError(err.message || 'Failed to update room');
    } finally {
      setManageLoading(false);
    }
  };

  const handleAdjustWallet = async () => {
    if (!adjustingUserId || !adjustAmount) return;
    const amount = parseFloat(adjustAmount);
    if (isNaN(amount) || amount <= 0) {
      setAdminSettingsError('Invalid amount.');
      return;
    }

    const finalAmount = adjustType === 'add' ? amount : -amount;
    const success = await updateUserWalletBalance(adjustingUserId, finalAmount);
    
    if (success) {
      await addTransaction({
        userId: adjustingUserId,
        type: adjustType === 'add' ? TransactionType.DEPOSIT : TransactionType.WITHDRAWAL,
        amount: amount,
        description: `Admin adjustment: ${adjustType === 'add' ? 'Added' : 'Deducted'} by admin`,
        status: TransactionStatus.COMPLETED,
      });
      setAdminSettingsSuccess(`Wallet updated successfully!`);
      setAllUsers(getAllUsers()); // Refresh list
      setAdjustingUserId(null);
      setAdjustAmount('');
      setTimeout(() => setAdminSettingsSuccess(null), 3000);
    } else {
      setAdminSettingsError('Failed to update wallet.');
    }
  };

  const handleRemoveParticipant = async (registrationId: string) => {
    if (!selectedTournament) return;
    if (!window.confirm('Are you sure you want to remove this participant?')) return;

    setManageLoading(true);
    setManageError(null);
    try {
      const success = await removeRegistration(registrationId, selectedTournament.id);
      if (success) {
        setManageSuccess('Participant removed successfully.');
        setTournamentRegistrations(prev => prev.filter(r => r.id !== registrationId));
        fetchTournaments(); // Refresh counts
      }
    } catch (err: any) {
      setManageError(err.message || 'Failed to remove participant.');
    } finally {
      setManageLoading(false);
    }
  };

  const handleAddParticipant = async (user: User) => {
    if (!selectedTournament) return;
    
    // Check if already registered
    if (tournamentRegistrations.some(r => r.uid === user.uid)) {
      setManageError('User is already registered for this tournament.');
      return;
    }

    setManageLoading(true);
    setManageError(null);
    try {
      const success = await adminRegisterUserForTournament(selectedTournament.id, user.uid, user.ign);
      if (success) {
        setManageSuccess(`${user.ign} added successfully.`);
        // Refresh registrations
        const updated = getRegistrationsByTournamentId(selectedTournament.id);
        setTournamentRegistrations(updated);
        setShowAddParticipant(false);
        setUserSearchTerm('');
        fetchTournaments(); // Refresh counts
      }
    } catch (err: any) {
      setManageError(err.message || 'Failed to add participant.');
    } finally {
      setManageLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string, username: string) => {
    if (!window.confirm(`Are you sure you want to delete user ${username}? This action cannot be undone.`)) return;

    setIsLoading(true);
    try {
      const success = await deleteUser(userId);
      if (success) {
        setAdminSettingsSuccess('User deleted successfully.');
        setAllUsers(getAllUsers());
        setTotalUsers(getTotalUserCount());
      } else {
        setAdminSettingsError('Failed to delete user.');
      }
    } catch (err: any) {
      setAdminSettingsError(err.message || 'An error occurred while deleting user.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateRedeemCode = async () => {
    if (!newRedeemCode || !newRedeemAmount) {
      setAdminSettingsError('Code and amount are required.');
      return;
    }

    const amount = parseFloat(newRedeemAmount);
    if (isNaN(amount) || amount <= 0) {
      setAdminSettingsError('Invalid amount.');
      return;
    }

    setManageLoading(true);
    try {
      const success = await generateRedeemCode(newRedeemCode.trim().toUpperCase(), amount);
      if (success) {
        setAdminSettingsSuccess(`Code ${newRedeemCode} generated!`);
        setNewRedeemCode('');
        setNewRedeemAmount('');
        setRedeemCodes(getAllRedeemCodes());
        setTimeout(() => setAdminSettingsSuccess(null), 3000);
      } else {
        setAdminSettingsError('Failed to generate code (Code might already exist).');
      }
    } catch (err: any) {
      setAdminSettingsError(err.message || 'Error generating code');
    } finally {
      setManageLoading(false);
    }
  };

  const filteredUsers = allUsers.filter(u => 
    (u.displayId?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (u.email?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (u.username?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 border-4 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-[var(--color-text-secondary)] font-medium">Loading Admin Panel...</p>
      </div>
    );
  }

  if (!currentUser || currentUser.role !== UserRole.ADMIN) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-center max-w-md">
          <h2 className="text-xl font-bold mb-2">Access Denied</h2>
          <p className="text-sm">You do not have permission to access the Admin Panel. Please log in with an admin account.</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto p-6"
    >
      <h1 className="text-4xl font-display font-bold text-[var(--color-text-primary)] mb-8 text-center">Admin Panel</h1>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-[var(--color-bg-secondary)] p-4 rounded-2xl border border-[var(--color-border)] flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] text-[var(--color-text-secondary)] uppercase font-bold tracking-wider">Total Users</p>
            <p className="text-xl font-bold text-white">{totalUsers}</p>
          </div>
        </div>
        <div className="bg-[var(--color-bg-secondary)] p-4 rounded-2xl border border-[var(--color-border)] flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center text-yellow-500">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] text-[var(--color-text-secondary)] uppercase font-bold tracking-wider">Tournaments</p>
            <p className="text-xl font-bold text-white">{upcomingTournaments.length + ongoingTournaments.length + completedTournaments.length}</p>
          </div>
        </div>
        <div className="bg-[var(--color-bg-secondary)] p-4 rounded-2xl border border-[var(--color-border)] flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] text-[var(--color-text-secondary)] uppercase font-bold tracking-wider">Pending Deposits</p>
            <p className="text-xl font-bold text-white">{pendingPaymentRequests.length}</p>
          </div>
        </div>
        <div className="bg-[var(--color-bg-secondary)] p-4 rounded-2xl border border-[var(--color-border)] flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500">
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] text-[var(--color-text-secondary)] uppercase font-bold tracking-wider">Pending Withdrawals</p>
            <p className="text-xl font-bold text-white">{pendingWithdrawalRequests.length}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-2 mb-8">
        <button
          onClick={() => setActiveTab('create')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors duration-200
            ${activeTab === 'create' ? 'bg-[var(--color-accent)] text-white' : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]'}`}
        >
          Create
        </button>
        <button
          onClick={() => setActiveTab('manage_upcoming')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors duration-200
            ${activeTab === 'manage_upcoming' ? 'bg-[var(--color-accent)] text-white' : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]'}`}
        >
          Upcoming
        </button>
        <button
          onClick={() => setActiveTab('manage_ongoing')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors duration-200
            ${activeTab === 'manage_ongoing' ? 'bg-[var(--color-accent)] text-white' : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]'}`}
        >
          Ongoing
        </button>
        <button
          onClick={() => setActiveTab('manage_completed')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors duration-200
            ${activeTab === 'manage_completed' ? 'bg-[var(--color-accent)] text-white' : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]'}`}
        >
          Completed
        </button>
        <button
          onClick={() => setActiveTab('payment_requests')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors duration-200
            ${activeTab === 'payment_requests' ? 'bg-[var(--color-accent)] text-white' : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]'}`}
        >
          Deposits
        </button>
        <button
          onClick={() => setActiveTab('withdrawal_requests')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors duration-200
            ${activeTab === 'withdrawal_requests' ? 'bg-[var(--color-accent)] text-white' : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]'}`}
        >
          Withdrawals
        </button>
        <button
          onClick={() => setActiveTab('room_control')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors duration-200
            ${activeTab === 'room_control' ? 'bg-[var(--color-accent)] text-white' : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]'}`}
        >
          Room Control
        </button>
        <button
          onClick={() => setActiveTab('redeem_codes')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors duration-200
            ${activeTab === 'redeem_codes' ? 'bg-[var(--color-accent)] text-white' : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]'}`}
        >
          Redeem Codes
        </button>
        <button
          onClick={() => setActiveTab('news')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors duration-200
            ${activeTab === 'news' ? 'bg-[var(--color-accent)] text-white' : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]'}`}
        >
          News
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors duration-200
            ${activeTab === 'users' ? 'bg-[var(--color-accent)] text-white' : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]'}`}
        >
          Users
        </button>
        <button
          onClick={() => setActiveTab('admin_settings')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors duration-200
            ${activeTab === 'admin_settings' ? 'bg-[var(--color-accent)] text-white' : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]'}`}
        >
          Settings
        </button>
      </div>

      {/* Create Tournament Form */}
      {activeTab === 'create' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-[var(--color-bg-secondary)] p-6 rounded-xl border border-[var(--color-border)] shadow-lg max-w-2xl mx-auto"
        >
          <h2 className="text-2xl font-display text-[var(--color-text-primary)] mb-6">New Tournament</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <input type="text" placeholder="Tournament Name" value={newTournamentName} onChange={(e) => setNewTournamentName(e.target.value)} className="p-3 rounded-lg bg-[var(--color-border)] text-[var(--color-text-primary)] focus:border-[var(--color-accent)] focus:outline-none" />
            <input type="date" value={newTournamentDate} onChange={(e) => setNewTournamentDate(e.target.value)} className="p-3 rounded-lg bg-[var(--color-border)] text-[var(--color-text-primary)] focus:border-[var(--color-accent)] focus:outline-none" />
            <input type="time" value={newTournamentTime} onChange={(e) => setNewTournamentTime(e.target.value)} className="p-3 rounded-lg bg-[var(--color-border)] text-[var(--color-text-primary)] focus:border-[var(--color-accent)] focus:outline-none" />
            <input type="number" placeholder="Prize Pool" value={newTournamentPrizePool} onChange={(e) => setNewTournamentPrizePool(e.target.value)} className="p-3 rounded-lg bg-[var(--color-border)] text-[var(--color-text-primary)] focus:border-[var(--color-accent)] focus:outline-none" />
            <input type="number" placeholder="Entry Fee" value={newTournamentEntryFee} onChange={(e) => setNewTournamentEntryFee(e.target.value)} className="p-3 rounded-lg bg-[var(--color-border)] text-[var(--color-text-primary)] focus:border-[var(--color-accent)] focus:outline-none" />
            <input type="text" placeholder="Map (e.g., Bermuda)" value={newTournamentMap} onChange={(e) => setNewTournamentMap(e.target.value)} className="p-3 rounded-lg bg-[var(--color-border)] text-[var(--color-text-primary)] focus:border-[var(--color-accent)] focus:outline-none" />
            <input type="text" placeholder="Version (e.g., OB30)" value={newTournamentVersion} onChange={(e) => setNewTournamentVersion(e.target.value)} className="p-3 rounded-lg bg-[var(--color-border)] text-[var(--color-text-primary)] focus:border-[var(--color-accent)] focus:outline-none" />
            <select 
              value={newTournamentCategory} 
              onChange={(e) => setNewTournamentCategory(e.target.value as TournamentCategory)}
              className="p-3 rounded-lg bg-[var(--color-border)] text-[var(--color-text-primary)] focus:border-[var(--color-accent)] focus:outline-none"
            >
              {Object.values(TournamentCategory).filter(c => c !== TournamentCategory.ALL).map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <input type="number" placeholder="Max Slots" value={newMaxSlots} onChange={(e) => setNewMaxSlots(e.target.value)} className="p-3 rounded-lg bg-[var(--color-border)] text-[var(--color-text-primary)] focus:border-[var(--color-accent)] focus:outline-none" />
          </div>
          <Button onClick={handleCreateTournament} disabled={createLoading} className="w-full">
            {createLoading ? 'Creating...' : 'Create Tournament'}
          </Button>
          {createError && <p className="text-red-500 mt-4 text-sm text-center">{createError}</p>}
          {createSuccess && <p className="text-green-500 mt-4 text-sm text-center">{createSuccess}</p>}
        </motion.div>
      )}

      {/* Manage Upcoming Tournaments */}
      {activeTab === 'manage_upcoming' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {upcomingTournaments.length > 0 ? (
            upcomingTournaments.map(tournament => (
              <div key={tournament.id} className="flex flex-col gap-3">
                <TournamentCard tournament={tournament} />
                <Button
                  onClick={() => handleSelectTournament(tournament)}
                  className="w-full"
                  variant="secondary"
                >
                  Manage
                </Button>
              </div>
            ))
          ) : (
            <p className="col-span-full text-center text-[var(--color-text-secondary)] text-lg">No upcoming tournaments to manage.</p>
          )}
        </motion.div>
      )}

      {/* Manage Ongoing Tournaments */}
      {activeTab === 'manage_ongoing' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {ongoingTournaments.length > 0 ? (
            ongoingTournaments.map(tournament => (
              <div key={tournament.id} className="flex flex-col gap-3">
                <TournamentCard tournament={tournament} />
                <Button
                  onClick={() => handleSelectTournament(tournament)}
                  className="w-full"
                  variant="secondary"
                >
                  Manage
                </Button>
              </div>
            ))
          ) : (
            <p className="col-span-full text-center text-[var(--color-text-secondary)] text-lg">No ongoing tournaments to manage.</p>
          )}
        </motion.div>
      )}

      {/* Manage Completed Tournaments */}
      {activeTab === 'manage_completed' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {completedTournaments.length > 0 ? (
            completedTournaments.map(tournament => (
              <div key={tournament.id} className="flex flex-col gap-3">
                <TournamentCard tournament={tournament} />
                <Button
                  onClick={() => handleSelectTournament(tournament)}
                  className="w-full"
                  variant="secondary"
                >
                  View Results
                </Button>
              </div>
            ))
          ) : (
            <p className="col-span-full text-center text-[var(--color-text-secondary)] text-lg">No completed tournaments to manage.</p>
          )}
        </motion.div>
      )}

      {/* Payment Requests Tab */}
      {activeTab === 'payment_requests' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-[var(--color-bg-secondary)] p-6 rounded-xl border border-[var(--color-border)] shadow-lg max-w-3xl mx-auto"
        >
          <h2 className="text-2xl font-display text-[var(--color-text-primary)] mb-6">Pending Payment Requests</h2>
          {pendingPaymentRequests.length > 0 ? (
            <ul className="space-y-4">
              {pendingPaymentRequests.map((request: UserPaymentRequest) => (
                <li key={request.id} className="bg-[var(--color-border)] p-4 rounded-md flex flex-col md:flex-row justify-between items-start md:items-center">
                  <div>
                    <p className="text-lg font-semibold text-[var(--color-accent)]">Amount: ₹{request.amount}</p>
                    <p className="text-sm text-[var(--color-text-secondary)]">UTR: <span className="font-mono text-[var(--color-text-primary)]">{request.utr}</span></p>
                    <p className="text-sm text-[var(--color-text-secondary)]">User ID: <span className="font-mono text-[var(--color-text-primary)]">{request.userId}</span></p>
                    <p className="text-xs text-[var(--color-text-secondary)]">Requested: {formatDateTime12h(request.requestDate)}</p>
                  </div>
                  <div className="flex space-x-2 mt-3 md:mt-0">
                    <Button onClick={() => handleProcessPaymentRequest(request.id, PaymentRequestStatus.ACCEPTED)} disabled={manageLoading} className="px-4 py-2 text-sm">
                      Accept
                    </Button>
                    <Button onClick={() => handleProcessPaymentRequest(request.id, PaymentRequestStatus.DECLINED)} disabled={manageLoading} variant="danger" className="px-4 py-2 text-sm">
                      Decline
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[var(--color-text-secondary)] text-center">No pending payment requests.</p>
          )}
          {manageError && <p className="text-red-500 mt-4 text-sm text-center">{manageError}</p>}
          {manageSuccess && <p className="text-green-500 mt-4 text-sm text-center">{manageSuccess}</p>}
        </motion.div>
      )}

      {/* Withdrawal Requests Tab */}
      {activeTab === 'withdrawal_requests' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-[var(--color-bg-secondary)] p-6 rounded-xl border border-[var(--color-border)] shadow-lg max-w-3xl mx-auto"
        >
          <h2 className="text-2xl font-display text-[var(--color-text-primary)] mb-6">Pending Withdrawal Requests</h2>
          {pendingWithdrawalRequests.length > 0 ? (
            <ul className="space-y-4">
              {pendingWithdrawalRequests.map((request: WithdrawalRequest) => (
                <li key={request.id} className="bg-[var(--color-border)] p-4 rounded-xl flex flex-col gap-4 border border-white/5">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold ${request.method === 'upi' ? 'bg-blue-500/10 text-blue-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                          {request.method === 'upi' ? 'UPI' : 'Redeem Code'}
                        </span>
                        <p className="text-xl font-bold font-mono text-white">₹{request.amount}</p>
                      </div>
                      {request.method === 'upi' ? (
                        <p className="text-sm text-[var(--color-text-secondary)]">UPI: <span className="font-mono text-white select-all">{request.upiId}</span></p>
                      ) : (
                        <p className="text-sm text-yellow-500/80 italic">Redeem code withdrawal</p>
                      )}
                      <p className="text-xs text-[var(--color-text-secondary)]">User: <span className="font-bold">{getUserById(request.userId)?.username || request.userId}</span></p>
                      <p className="text-[10px] text-[var(--color-text-secondary)]">Requested: {formatDateTime12h(request.requestDate)}</p>
                    </div>

                    <div className="flex flex-col gap-2 w-full md:w-auto">
                      {request.method === 'redeem_code' && (
                        <input
                          type="text"
                          placeholder="Enter Redeem Code"
                          value={redeemCodeInputs[request.id] || ''}
                          onChange={(e) => setRedeemCodeInputs(prev => ({ ...prev, [request.id]: e.target.value }))}
                          className="p-2 rounded-lg bg-[var(--color-bg-primary)] border border-white/10 text-sm focus:border-[var(--color-accent)] outline-none min-w-[200px]"
                        />
                      )}
                      <div className="flex gap-2">
                        <Button onClick={() => handleProcessWithdrawalRequest(request.id, PaymentRequestStatus.ACCEPTED)} disabled={manageLoading} className="flex-1 py-2 text-xs">
                          Approve
                        </Button>
                        <Button onClick={() => handleProcessWithdrawalRequest(request.id, PaymentRequestStatus.DECLINED)} disabled={manageLoading} variant="danger" className="flex-1 py-2 text-xs">
                          Decline
                        </Button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[var(--color-text-secondary)] text-center">No pending withdrawal requests.</p>
          )}
          {manageError && <p className="text-red-500 mt-4 text-sm text-center">{manageError}</p>}
          {manageSuccess && <p className="text-green-500 mt-4 text-sm text-center">{manageSuccess}</p>}
        </motion.div>
      )}

      {/* Room Control Tab */}
      {activeTab === 'room_control' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-[var(--color-bg-secondary)] p-6 rounded-xl border border-[var(--color-border)] shadow-lg max-w-4xl mx-auto"
        >
          <div className="flex items-center gap-2 mb-6 text-[var(--color-accent)]">
            <Key className="w-6 h-6" />
            <h2 className="text-2xl font-display text-[var(--color-text-primary)]">Room ID & Password Control</h2>
          </div>
          
          <div className="space-y-4">
            {[...upcomingTournaments, ...ongoingTournaments].length > 0 ? (
              [...upcomingTournaments, ...ongoingTournaments].map(tournament => {
                const edits = roomEdits[tournament.id] || { roomId: tournament.roomId || '', roomPassword: tournament.roomPassword || '' };
                
                return (
                  <div key={tournament.id} className="bg-[var(--color-border)] p-4 rounded-xl flex flex-col md:flex-row items-center gap-4">
                    <div className="flex-1">
                      <p className="text-sm font-bold text-white mb-1">{tournament.name}</p>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold ${tournament.status === 'ongoing' ? 'bg-yellow-500/20 text-yellow-500' : 'bg-blue-500/20 text-blue-500'}`}>
                          {tournament.status}
                        </span>
                        <span className="text-[10px] text-[var(--color-text-secondary)]">
                          {new Date(tournament.date).toLocaleDateString()} at {formatTimeString12h(tournament.time)}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                      <input
                        type="text"
                        placeholder="Room ID"
                        value={edits.roomId}
                        onChange={(e) => setRoomEdits(prev => ({ 
                          ...prev, 
                          [tournament.id]: { ...edits, roomId: e.target.value } 
                        }))}
                        className="bg-[var(--color-bg-primary)] border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-accent)] w-full md:w-32"
                      />
                      <input
                        type="text"
                        placeholder="Password"
                        value={edits.roomPassword}
                        onChange={(e) => setRoomEdits(prev => ({ 
                          ...prev, 
                          [tournament.id]: { ...edits, roomPassword: e.target.value } 
                        }))}
                        className="bg-[var(--color-bg-primary)] border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-accent)] w-full md:w-32"
                      />
                      <Button
                        onClick={() => handleUpdateRoomInfoQuick(tournament.id)}
                        disabled={manageLoading}
                        className="px-4 py-2 text-xs"
                      >
                        {manageLoading ? '...' : 'Update'}
                      </Button>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-center text-[var(--color-text-secondary)] py-8 italic">No active tournaments to manage rooms for.</p>
            )}
          </div>
          {manageError && <p className="text-red-500 mt-4 text-sm text-center">{manageError}</p>}
          {manageSuccess && <p className="text-green-500 mt-4 text-sm text-center">{manageSuccess}</p>}
        </motion.div>
      )}

      {/* Redeem Codes Tab */}
      {activeTab === 'redeem_codes' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-[var(--color-bg-secondary)] p-6 rounded-xl border border-[var(--color-border)] shadow-lg max-w-4xl mx-auto"
        >
          <div className="flex items-center gap-2 mb-6 text-[var(--color-accent)]">
            <Ticket className="w-6 h-6" />
            <h2 className="text-2xl font-display text-[var(--color-text-primary)]">Redeem Code Management</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 p-4 bg-white/5 rounded-xl border border-white/5 shadow-inner">
            <div className="flex flex-col">
              <label className="text-[10px] uppercase font-bold text-[var(--color-text-secondary)] mb-1">Promo Code</label>
              <input
                type="text"
                placeholder="e.g. WELCOME100"
                value={newRedeemCode}
                onChange={(e) => setNewRedeemCode(e.target.value.toUpperCase())}
                className="p-3 rounded-lg bg-[var(--color-bg-primary)] border border-white/10 text-white focus:border-[var(--color-accent)] outline-none font-mono"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-[10px] uppercase font-bold text-[var(--color-text-secondary)] mb-1">Amount (₹)</label>
              <input
                type="number"
                placeholder="Amount"
                value={newRedeemAmount}
                onChange={(e) => setNewRedeemAmount(e.target.value)}
                className="p-3 rounded-lg bg-[var(--color-bg-primary)] border border-white/10 text-white focus:border-[var(--color-accent)] outline-none"
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={handleGenerateRedeemCode}
                disabled={manageLoading}
                className="w-full h-[46px]"
              >
                {manageLoading ? 'Generating...' : 'Generate Code'}
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-[var(--color-text-secondary)] uppercase tracking-wider mb-2">Active Codes</h3>
            <div className="bg-white/5 rounded-xl overflow-hidden border border-white/5">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-white/5 text-[10px] uppercase font-bold text-[var(--color-text-secondary)]">
                    <th className="p-3">Code</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Used By</th>
                    <th className="p-3">Created</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {redeemCodes.length > 0 ? (
                    redeemCodes.sort((a,b) => b.createdAt.getTime() - a.createdAt.getTime()).map(code => (
                      <tr key={code.id} className="border-t border-white/5 hover:bg-white/5 transition-colors">
                        <td className="p-3 font-mono font-bold text-[var(--color-accent)]">{code.code}</td>
                        <td className="p-3 font-bold text-white">₹{code.amount}</td>
                        <td className="p-3">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold ${code.isUsed ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>
                            {code.isUsed ? 'Used' : 'Active'}
                          </span>
                        </td>
                        <td className="p-3 text-xs text-[var(--color-text-secondary)]">
                          {code.isUsed ? (
                            <div className="flex flex-col">
                              <span>{code.usedBy}</span>
                              <span className="text-[10px]">{formatDateTime12h(code.usedAt)}</span>
                            </div>
                          ) : '-'}
                        </td>
                        <td className="p-3 text-[10px] text-[var(--color-text-secondary)]">
                          {new Date(code.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-[var(--color-text-secondary)] italic">No redeem codes generated yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          {adminSettingsError && <p className="text-red-500 mt-4 text-sm text-center">{adminSettingsError}</p>}
          {adminSettingsSuccess && <p className="text-green-500 mt-4 text-sm text-center">{adminSettingsSuccess}</p>}
        </motion.div>
      )}

      {/* News Tab */}
      {activeTab === 'news' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-[var(--color-bg-secondary)] p-6 rounded-xl border border-[var(--color-border)] shadow-lg max-w-2xl mx-auto"
        >
          <h2 className="text-2xl font-display text-[var(--color-text-primary)] mb-6">Edit Announcement Ticker</h2>
          <div className="space-y-4 mb-6">
            <textarea
              value={newsInput}
              onChange={(e) => setNewsInput(e.target.value)}
              placeholder="Enter news text here..."
              rows={4}
              className="w-full p-3 rounded-lg bg-[var(--color-border)] text-[var(--color-text-primary)] focus:border-[var(--color-accent)] focus:outline-none"
            ></textarea>
          </div>
          <Button onClick={handleUpdateNews} className="w-full">
            Update News
          </Button>
          {adminSettingsError && <p className="text-red-500 mt-4 text-sm text-center">{adminSettingsError}</p>}
          {adminSettingsSuccess && <p className="text-green-500 mt-4 text-sm text-center">{adminSettingsSuccess}</p>}
        </motion.div>
      )}

      {/* User Management Tab */}
      {activeTab === 'users' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-[var(--color-bg-secondary)] p-6 rounded-xl border border-[var(--color-border)] shadow-lg max-w-4xl mx-auto"
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <h2 className="text-2xl font-display text-[var(--color-text-primary)]">User Management</h2>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-secondary)]" />
              <input
                type="text"
                placeholder="Search by ID, Email, Name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-[var(--color-border)] text-[var(--color-text-primary)] focus:border-[var(--color-accent)] focus:outline-none text-sm"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--color-border)]">
                  <th className="py-3 px-4 text-[var(--color-text-secondary)] font-bold text-xs uppercase tracking-wider">ID</th>
                  <th className="py-3 px-4 text-[var(--color-text-secondary)] font-bold text-xs uppercase tracking-wider">User</th>
                  <th className="py-3 px-4 text-[var(--color-text-secondary)] font-bold text-xs uppercase tracking-wider">Wallet</th>
                  <th className="py-3 px-4 text-[var(--color-text-secondary)] font-bold text-xs uppercase tracking-wider">Stats</th>
                  <th className="py-3 px-4 text-[var(--color-text-secondary)] font-bold text-xs uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(user => (
                  <tr key={user.id} className="border-b border-[var(--color-border)] hover:bg-white/5 transition-colors">
                    <td className="py-4 px-4">
                      <span className="font-mono text-xs font-bold text-[var(--color-accent)]">{user.displayId}</span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-white">{user.username || 'No Username'}</span>
                        <span className="text-[10px] text-[var(--color-text-secondary)]">{user.email}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm font-bold text-green-400">₹{user.walletBalance}</span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex flex-col text-[10px] text-[var(--color-text-secondary)] leading-tight">
                        <div className="flex justify-between gap-2"><span>Kills:</span> <strong className="text-white">{user.stats?.totalKills || 0}</strong></div>
                        <div className="flex justify-between gap-2"><span>Wins:</span> <strong className="text-white">{user.stats?.totalWins || 0}</strong></div>
                        <div className="flex justify-between gap-2"><span>Matches:</span> <strong className="text-white">{user.stats?.totalMatches || 0}</strong></div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            setAdjustingUserId(user.id);
                            setAdjustType('add');
                          }}
                          className="p-2 rounded-lg bg-green-500/10 text-green-500 hover:bg-green-500/20 transition-colors"
                          title="Add Funds"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setAdjustingUserId(user.id);
                            setAdjustType('deduct');
                          }}
                          className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                          title="Deduct Funds"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id, user.username || user.ign || user.displayId)}
                          className="p-2 rounded-lg bg-red-600/10 text-red-600 hover:bg-red-600/20 transition-colors"
                          title="Delete User"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-[var(--color-text-secondary)]">No users found matching your search.</p>
            </div>
          )}

          {/* Wallet Adjustment Modal */}
          <AnimatePresence>
            {adjustingUserId && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
              >
                <motion.div
                  initial={{ scale: 0.9, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.9, y: 20 }}
                  className="bg-[var(--color-bg-secondary)] p-6 rounded-2xl border border-[var(--color-border)] shadow-2xl w-full max-w-sm"
                >
                  <h3 className="text-xl font-display font-bold text-white mb-4">
                    {adjustType === 'add' ? 'Add Funds' : 'Deduct Funds'}
                  </h3>
                  <p className="text-sm text-[var(--color-text-secondary)] mb-6">
                    Adjusting wallet for <span className="text-white font-bold">{allUsers.find(u => u.id === adjustingUserId)?.username}</span>
                  </p>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-[var(--color-text-secondary)] mb-1">Amount (₹)</label>
                      <input
                        type="number"
                        placeholder="Enter amount"
                        value={adjustAmount}
                        onChange={(e) => setAdjustAmount(e.target.value)}
                        className="w-full p-3 rounded-xl bg-[var(--color-border)] text-white focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                        autoFocus
                      />
                    </div>
                    
                    <div className="flex gap-3">
                      <Button
                        variant="secondary"
                        className="flex-1"
                        onClick={() => {
                          setAdjustingUserId(null);
                          setAdjustAmount('');
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        className="flex-1"
                        onClick={handleAdjustWallet}
                      >
                        Confirm
                      </Button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {adminSettingsError && <p className="text-red-500 mt-4 text-sm text-center">{adminSettingsError}</p>}
          {adminSettingsSuccess && <p className="text-green-500 mt-4 text-sm text-center">{adminSettingsSuccess}</p>}
        </motion.div>
      )}

      {/* Admin Settings Tab */}
      {activeTab === 'admin_settings' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-[var(--color-bg-secondary)] p-6 rounded-xl border border-[var(--color-border)] shadow-lg max-w-2xl mx-auto"
        >
          <h2 className="text-2xl font-display text-[var(--color-text-primary)] mb-6">Admin Login Settings</h2>
          <div className="space-y-4 mb-6">
            <input
              type="email"
              placeholder="New Admin Email"
              value={newAdminEmail}
              onChange={(e) => setNewAdminEmail(e.target.value)}
              className="w-full p-3 rounded-lg bg-[var(--color-border)] text-[var(--color-text-primary)] focus:border-[var(--color-accent)] focus:outline-none"
            />
            <input
              type="password"
              placeholder="New Admin Password"
              value={newAdminPassword}
              onChange={(e) => setNewAdminPassword(e.target.value)}
              className="w-full p-3 rounded-lg bg-[var(--color-border)] text-[var(--color-text-primary)] focus:border-[var(--color-accent)] focus:outline-none"
            />
            <input
              type="password"
              placeholder="Confirm New Admin Password"
              value={confirmNewAdminPassword}
              onChange={(e) => setConfirmNewAdminPassword(e.target.value)}
              className="w-full p-3 rounded-lg bg-[var(--color-border)] text-[var(--color-text-primary)] focus:border-[var(--color-accent)] focus:outline-none"
            />
          </div>
          <Button onClick={handleChangeAdminCredentials} className="w-full">
            Change Admin Credentials
          </Button>

          <hr className="my-8 border-[var(--color-border)]" />

          <h2 className="text-2xl font-display text-[var(--color-text-primary)] mb-6">Player Login Settings</h2>
          <div className="space-y-4 mb-6">
            <input
              type="email"
              placeholder="New Player Email"
              value={newPlayerEmail}
              onChange={(e) => setNewPlayerEmail(e.target.value)}
              className="w-full p-3 rounded-lg bg-[var(--color-border)] text-[var(--color-text-primary)] focus:border-[var(--color-accent)] focus:outline-none"
            />
            <input
              type="password"
              placeholder="New Player Password"
              value={newPlayerPassword}
              onChange={(e) => setNewPlayerPassword(e.target.value)}
              className="w-full p-3 rounded-lg bg-[var(--color-border)] text-[var(--color-text-primary)] focus:border-[var(--color-accent)] focus:outline-none"
            />
            <input
              type="password"
              placeholder="Confirm New Player Password"
              value={confirmNewPlayerPassword}
              onChange={(e) => setConfirmNewPlayerPassword(e.target.value)}
              className="w-full p-3 rounded-lg bg-[var(--color-border)] text-[var(--color-text-primary)] focus:border-[var(--color-accent)] focus:outline-none"
            />
          </div>
          <Button onClick={handleChangePlayerCredentials} className="w-full">
            Change Player Credentials
          </Button>

          <hr className="my-8 border-[var(--color-border)]" />

          <h2 className="text-2xl font-display text-[var(--color-text-primary)] mb-6">Payment Settings</h2>
          <div className="space-y-4 mb-6">
            <label className="block text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-widest">Deposit QR Code URL</label>
            <input
              type="text"
              placeholder="Enter QR Code Image URL"
              value={newQrCodeUrl}
              onChange={(e) => setNewQrCodeUrl(e.target.value)}
              className="w-full p-3 rounded-lg bg-[var(--color-border)] text-[var(--color-text-primary)] focus:border-[var(--color-accent)] focus:outline-none"
            />
            <div className="mt-2 p-4 bg-white/5 rounded-xl border border-white/5 flex items-center justify-center">
              {newQrCodeUrl ? (
                <img src={newQrCodeUrl} alt="QR Preview" className="w-32 h-32 object-contain bg-white p-2 rounded-lg" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-32 h-32 flex items-center justify-center text-[var(--color-text-secondary)] text-xs">No Preview</div>
              )}
            </div>
          </div>
          <Button onClick={handleUpdateQrCode} className="w-full">
            Update QR Code URL
          </Button>

          {adminSettingsError && <p className="text-red-500 mt-4 text-sm text-center">{adminSettingsError}</p>}
          {adminSettingsSuccess && <p className="text-green-500 mt-4 text-sm text-center">{adminSettingsSuccess}</p>}
        </motion.div>
      )}

      {/* Tournament Management Modal/Panel */}
      {selectedTournament && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-[60]"
        >
          <div className="bg-[var(--color-bg-primary)] p-8 rounded-xl border border-[var(--color-border)] shadow-2xl max-w-3xl w-full relative">
            <button
              onClick={() => setSelectedTournament(null)}
              className="absolute top-4 right-4 text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] text-xl"
            >
              &times;
            </button>
            <h2 className="text-3xl font-display text-[var(--color-accent)] mb-6">Manage: {selectedTournament.name}</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="text-xl font-display text-[var(--color-text-primary)] mb-3 flex items-center justify-between">
                  Registrations
                  <div className="flex items-center gap-3">
                    <span className="text-xs bg-[var(--color-accent)]/10 text-[var(--color-accent)] px-2 py-0.5 rounded-full">
                      {tournamentRegistrations.length} / {selectedTournament.maxSlots}
                    </span>
                    <button 
                      onClick={() => setShowAddParticipant(!showAddParticipant)}
                      className={`p-1.5 rounded-lg border transition-all ${showAddParticipant ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-green-500/10 border-green-500/20 text-green-500'}`}
                    >
                      {showAddParticipant ? <Minus className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </h3>

                {showAddParticipant && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 bg-[var(--color-bg-secondary)] p-3 rounded-xl border border-[var(--color-accent)]/20"
                  >
                    <p className="text-[10px] font-bold text-[var(--color-accent)] uppercase mb-2">Search Player to Add</p>
                    <div className="flex gap-2 mb-3">
                      <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
                        <input
                          type="text"
                          placeholder="Name or UID..."
                          value={userSearchTerm}
                          onChange={(e) => setUserSearchTerm(e.target.value)}
                          className="w-full bg-black/40 border border-white/5 rounded-lg py-2 pl-9 pr-3 text-xs text-white focus:border-[var(--color-accent)] outline-none"
                        />
                      </div>
                    </div>
                    
                    {userSearchTerm && (
                      <div className="max-h-[150px] overflow-y-auto space-y-1">
                        {allUsers
                          .filter(u => u.role === UserRole.PLAYER)
                          .filter(u => 
                            u.username.toLowerCase().includes(userSearchTerm.toLowerCase()) || 
                            u.ign.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
                            u.uid.includes(userSearchTerm)
                          )
                          .map(player => (
                            <button
                              key={player.uid}
                              onClick={() => handleAddParticipant(player)}
                              className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-all text-left group"
                            >
                              <div>
                                <p className="text-xs font-bold text-white">{player.ign}</p>
                                <p className="text-[10px] text-zinc-500">{player.uid.substring(0, 8)}...</p>
                              </div>
                              <Plus className="w-3.5 h-3.5 text-green-500 opacity-0 group-hover:opacity-100" />
                            </button>
                          ))
                        }
                      </div>
                    )}
                  </motion.div>
                )}

                {tournamentRegistrations.length > 0 ? (
                  <div className="max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    <ul className="space-y-2 text-sm text-[var(--color-text-secondary)]">
                      {tournamentRegistrations.map(reg => (
                        <li key={reg.id} className="bg-[var(--color-border)] p-3 rounded-xl flex justify-between items-center group hover:border-[var(--color-accent)]/30 border border-transparent transition-all">
                          <div className="flex flex-col">
                            <span className="text-white font-bold">{reg.ign}</span>
                            <span className="text-[10px] opacity-50 font-mono">{reg.uid}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold ${reg.status === 'confirmed' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                              {reg.status}
                            </span>
                            <button
                              onClick={() => handleRemoveParticipant(reg.id)}
                              className="p-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                              title="Remove Participant"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="text-[var(--color-text-secondary)] py-8 text-center italic border border-dashed border-[var(--color-border)] rounded-xl">No registrations yet.</p>
                )}
              </div>

              <div>
                <h3 className="text-xl font-display text-[var(--color-text-primary)] mb-3">Update Status & Results</h3>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="winnerId" className="block text-[var(--color-text-secondary)] text-sm font-semibold mb-2">Winner User ID (Optional)</label>
                    <input
                      type="text"
                      id="winnerId"
                      value={winnerId}
                      onChange={(e) => setWinnerId(e.target.value)}
                      placeholder="e.g., user123"
                      className="w-full p-3 rounded-lg bg-[var(--color-border)] text-[var(--color-text-primary)] focus:border-[var(--color-accent)] focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="roomId" className="block text-[var(--color-text-secondary)] text-sm font-semibold mb-2">Room ID</label>
                      <input
                        type="text"
                        id="roomId"
                        value={roomId}
                        onChange={(e) => setRoomId(e.target.value)}
                        placeholder="Room ID"
                        className="w-full p-3 rounded-lg bg-[var(--color-border)] text-[var(--color-text-primary)] focus:border-[var(--color-accent)] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label htmlFor="roomPassword" className="block text-[var(--color-text-secondary)] text-sm font-semibold mb-2">Room Password</label>
                      <input
                        type="text"
                        id="roomPassword"
                        value={roomPassword}
                        onChange={(e) => setRoomPassword(e.target.value)}
                        placeholder="Password"
                        className="w-full p-3 rounded-lg bg-[var(--color-border)] text-[var(--color-text-primary)] focus:border-[var(--color-accent)] focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="matchResults" className="block text-[var(--color-text-secondary)] text-sm font-semibold mb-2">Match Results (JSON Array)</label>
                    <textarea
                      id="matchResults"
                      value={matchResultsInput}
                      onChange={(e) => setMatchResultsInput(e.target.value)}
                      placeholder='[ { "userId": "user123", "kills": 15, "rank": 1 } ]'
                      rows={5}
                      className="w-full p-3 rounded-lg bg-[var(--color-border)] text-[var(--color-text-primary)] font-mono text-xs focus:border-[var(--color-accent)] focus:outline-none"
                    ></textarea>
                    <p className="text-[var(--color-text-secondary)] text-xs mt-1">Format: {'`[ { "userId": "string", "kills": number, "rank": number } ]`'}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Button onClick={() => handleUpdateTournamentStatus(selectedTournament.status)} disabled={manageLoading} variant="secondary" className="w-full">
                      {manageLoading ? 'Updating...' : 'Update Details'}
                    </Button>
                    <Button onClick={() => handleUpdateTournamentStatus(TournamentStatus.ONGOING)} disabled={manageLoading || selectedTournament.status === TournamentStatus.ONGOING} variant="secondary" className="w-full">
                      {manageLoading ? 'Updating...' : 'Mark as Ongoing'}
                    </Button>
                  </div>
                  <Button onClick={() => handleUpdateTournamentStatus(TournamentStatus.COMPLETED)} disabled={manageLoading || selectedTournament.status === TournamentStatus.COMPLETED} className="w-full">
                    {manageLoading ? 'Updating...' : 'Mark as Completed'}
                  </Button>
                  <Button onClick={() => handleUpdateTournamentStatus(TournamentStatus.CANCELLED)} disabled={manageLoading} variant="danger" className="w-full">
                    Cancel Tournament
                  </Button>
                </div>
                {manageError && <p className="text-red-500 mt-4 text-sm">{manageError}</p>}
                {manageSuccess && <p className="text-green-500 mt-4 text-sm">{manageSuccess}</p>}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
