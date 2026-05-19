import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Tournament, User } from '../types';
import { getTournamentById, getUserById, registerUserForTournament, updateUserWalletBalance, addTransaction } from '../services/firebaseService';
import Button from '../components/Button';
import { motion } from 'motion/react';
import { TransactionType, TransactionStatus } from '../constants';
import { useFirebaseData } from '../hooks/useFirebaseData';
import { formatTimeString12h } from '../lib/dateUtils';

interface RegistrationFormProps {
  currentUserId: string | null;
}

export default function RegistrationForm({ currentUserId }: RegistrationFormProps) {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const navigate = useNavigate();

  const [tournament, setTournament] = useState<Tournament | undefined>(undefined);
  const [currentUser, setCurrentUser] = useState<User | undefined>(undefined);
  const [ign, setIgn] = useState<string>('');
  const [uid, setUid] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const dataVersion = useFirebaseData();

  useEffect(() => {
    if (tournamentId) {
      setTournament(getTournamentById(tournamentId));
    }
    if (currentUserId) {
      setCurrentUser(getUserById(currentUserId));
    }
  }, [tournamentId, currentUserId, dataVersion]);

  const handleRegistration = async () => {
    setError(null);
    setSuccess(null);
    setLoading(true);

    if (!tournament || !currentUser) {
      setError('Tournament or user data not available.');
      setLoading(false);
      return;
    }

    if (!ign.trim() || !uid.trim()) {
      setError('Please enter your In-Game Name and UID.');
      setLoading(false);
      return;
    }

    if (tournament.registeredCount >= tournament.maxSlots) {
      setError('Tournament is full. You cannot register.');
      setLoading(false);
      return;
    }

    if (currentUser.walletBalance < tournament.entryFee) {
      setError('Insufficient wallet balance. Please add funds.');
      setLoading(false);
      return;
    }

    try {
      // Register user for tournament (now atomic: handles fee deduction, transaction log, and registration)
      await registerUserForTournament({
        tournamentId: tournament.id,
        userId: currentUser.id,
        ign: ign,
        uid: uid,
        status: 'confirmed',
      }, tournament.entryFee, tournament.name);

      setSuccess('Registration successful! Good luck!');
      setCurrentUser({ ...currentUser, walletBalance: currentUser.walletBalance - tournament.entryFee }); // Update local state
      setTimeout(() => navigate('/tournaments'), 2000); // Redirect after 2 seconds
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
      // In a real app, you might want to revert wallet balance if transaction fails
    } finally {
      setLoading(false);
    }
  };

  if (!tournament) {
    return <div className="text-center text-[var(--color-text-secondary)] mt-10">Loading tournament details...</div>;
  }
  if (!currentUser) {
    return <div className="text-center text-[var(--color-text-secondary)] mt-10">Please log in to register.</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto p-6 max-w-2xl"
    >
      <h1 className="text-4xl font-display font-bold text-[var(--color-text-primary)] mb-8 text-center">Register for {tournament.name}</h1>

      <div className="bg-[var(--color-bg-secondary)] p-6 rounded-xl border border-[var(--color-border)] shadow-lg mb-8">
        <h2 className="text-2xl font-display text-[var(--color-accent)] mb-4">Tournament Details</h2>
        <p className="text-[var(--color-text-secondary)] text-sm mb-1">Date: <span className="font-mono text-[var(--color-text-primary)]">{new Date(tournament.date).toLocaleDateString()}</span></p>
        <p className="text-[var(--color-text-secondary)] text-sm mb-1">Time: <span className="font-mono text-[var(--color-text-primary)]">{formatTimeString12h(tournament.time)}</span></p>
        <p className="text-[var(--color-text-secondary)] text-sm mb-1">Entry Fee: <span className="font-bold text-yellow-400">₹{tournament.entryFee}</span></p>
        <p className="text-[var(--color-text-secondary)] text-sm mb-4">Your Balance: <span className="font-bold text-green-400">₹{currentUser.walletBalance}</span></p>

        {currentUser.walletBalance < tournament.entryFee && (
          <p className="text-red-500 text-sm mt-4">You need ₹{tournament.entryFee - currentUser.walletBalance} more to register.</p>
        )}
      </div>

      <div className="bg-[var(--color-bg-secondary)] p-6 rounded-xl border border-[var(--color-border)] shadow-lg">
        <h2 className="text-2xl font-display text-[var(--color-text-primary)] mb-4">Your Details</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="ign" className="block text-[var(--color-text-secondary)] text-sm font-semibold mb-2">In-Game Name (IGN)</label>
            <input
              type="text"
              id="ign"
              value={ign}
              onChange={(e) => setIgn(e.target.value)}
              placeholder="Your Free Fire IGN"
              className="w-full p-3 rounded-lg bg-[var(--color-border)] text-[var(--color-text-primary)] border border-transparent focus:border-[var(--color-accent)] focus:outline-none transition-colors duration-200"
            />
          </div>
          <div>
            <label htmlFor="uid" className="block text-[var(--color-text-secondary)] text-sm font-semibold mb-2">In-Game UID</label>
            <input
              type="text"
              id="uid"
              value={uid}
              onChange={(e) => setUid(e.target.value)}
              placeholder="Your Free Fire UID"
              className="w-full p-3 rounded-lg bg-[var(--color-border)] text-[var(--color-text-primary)] border border-transparent focus:border-[var(--color-accent)] focus:outline-none transition-colors duration-200"
            />
          </div>
          <Button onClick={handleRegistration} disabled={loading || currentUser.walletBalance < tournament.entryFee || tournament.registeredCount >= tournament.maxSlots}>
            {tournament.registeredCount >= tournament.maxSlots ? 'TOURNAMENT FULL' : (loading ? 'Registering...' : 'Confirm Registration')}
          </Button>
        </div>
        {error && <p className="text-red-500 mt-4 text-sm">{error}</p>}
        {success && <p className="text-green-500 mt-4 text-sm">{success}</p>}
        {tournament.registeredCount >= tournament.maxSlots && (
          <p className="text-red-500 mt-4 text-sm font-bold text-center uppercase tracking-widest">
            Registration is closed as all slots are filled.
          </p>
        )}
      </div>
    </motion.div>
  );
}
