import { useState, useEffect } from 'react';
import { User, Referral } from '../types';
import { getUserById, fetchUserById, applyReferralCode, getReferralsByUserId } from '../services/firebaseService';
import Button from '../components/Button';
import { motion } from 'motion/react';
import { Share2, Users, Gift, Copy, CheckCircle2, ChevronRight } from 'lucide-react';
import { useFirebaseData } from '../hooks/useFirebaseData';
import { formatDateTime12h } from '../lib/dateUtils';

interface ReferEarnPageProps {
  currentUserId: string | null;
}

const ReferEarnPage = ({ currentUserId }: ReferEarnPageProps) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [referralCode, setReferralCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingUser, setFetchingUser] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [referrals, setReferrals] = useState<Referral[]>([]);

  const dataVersion = useFirebaseData();

  useEffect(() => {
    const syncUser = async () => {
      if (currentUserId) {
        // Try local cache first
        let user = getUserById(currentUserId);
        
        if (!user) {
          // If not in cache (e.g. initial load), fetch from Firestore directly
          user = await fetchUserById(currentUserId);
        }

        if (user) {
          setCurrentUser(user);
          fetchReferrals(user.id);
        }
        setFetchingUser(false);
      } else {
        setFetchingUser(false);
      }
    };

    syncUser();
  }, [currentUserId, dataVersion]);

  const fetchReferrals = async (userId: string) => {
    const data = await getReferralsByUserId(userId);
    setReferrals(data as Referral[]);
  };

  const handleApplyCode = async () => {
    if (!referralCode.trim()) {
      setError('Please enter a referral code.');
      return;
    }

    if (!currentUserId) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await applyReferralCode(currentUserId, referralCode.trim().toUpperCase());
      if (result.success) {
        setSuccess(result.message);
        setReferralCode('');
      } else {
        setError(result.message);
      }
    } catch (err: any) {
      setError(err.message || 'Error applying code');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (currentUser?.referralCode) {
      navigator.clipboard.writeText(currentUser.referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (fetchingUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs animate-pulse">Loading Rewards...</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto border border-white/10">
          <Users className="w-10 h-10 text-zinc-700" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white mb-2">Login Required</h2>
          <p className="text-zinc-500 text-sm">Please log in to participate in our Refer & Earn program and claim your rewards.</p>
        </div>
        <Button onClick={() => window.location.href = '/'} className="w-full">Go to Login</Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-10"
      >
        <h1 className="text-4xl md:text-5xl font-display font-black text-white mb-4 tracking-tight italic">
          REFER & <span className="text-[var(--color-accent)]">EARN</span>
        </h1>
        <p className="text-[var(--color-text-secondary)] max-w-xl mx-auto">
          Invite your friends to join the arena and earn rewards together. Every successful referral brings you closer to your next tournament victory!
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        {/* Referral Card */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-[var(--color-bg-secondary)] p-8 rounded-2xl border border-[var(--color-border)] shadow-xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Share2 className="w-24 h-24 text-[var(--color-accent)]" />
          </div>
          
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Gift className="w-5 h-5 text-[var(--color-accent)]" />
            Your Referral Code
          </h2>
          
          <div className="relative mb-6">
            <div className="bg-[var(--color-bg-primary)] p-5 rounded-xl border-2 border-dashed border-[var(--color-border)] flex items-center justify-between group hover:border-[var(--color-accent)] transition-all cursor-pointer" onClick={copyToClipboard}>
              <span className="text-2xl font-mono font-bold text-white tracking-[0.2em]">
                {currentUser.referralCode || 'GENERATING...'}
              </span>
              <div className="p-2 rounded-lg bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] group-hover:text-[var(--color-accent)] transition-colors">
                {copied ? <CheckCircle2 className="w-6 h-6 text-green-500" /> : <Copy className="w-6 h-6" />}
              </div>
            </div>
            {copied && (
              <motion.span 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-green-500 font-bold uppercase tracking-widest"
              >
                Copied to clipboard!
              </motion.span>
            )}
          </div>

          <div className="space-y-4 pt-4 border-t border-[var(--color-border)]">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--color-text-secondary)]">Reward for you:</span>
              <span className="text-lg font-bold text-green-500">₹10.00</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--color-text-secondary)]">Reward for friend:</span>
              <span className="text-lg font-bold text-blue-400">₹5.00</span>
            </div>
          </div>
        </motion.div>

        {/* Apply Code Card */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-[var(--color-bg-secondary)] p-8 rounded-2xl border border-[var(--color-border)] shadow-xl"
        >
          <h2 className="text-xl font-bold text-white mb-6">Got a referral code?</h2>
          <p className="text-sm text-[var(--color-text-secondary)] mb-6">
            If a friend invited you, enter their code below to instantly claim your signup bonus of ₹5.00.
          </p>
          
          <div className="space-y-4">
            <input
              type="text"
              placeholder="ENTER CODE"
              value={referralCode}
              disabled={!!currentUser.referredBy}
              onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
              className={`w-full p-4 rounded-xl bg-[var(--color-bg-primary)] text-white border border-[var(--color-border)] focus:border-[var(--color-accent)] outline-none text-center font-mono text-xl tracking-widest transition-all ${currentUser.referredBy ? 'opacity-50 grayscale' : ''}`}
            />
            
            <Button 
              onClick={handleApplyCode} 
              disabled={loading || !!currentUser.referredBy} 
              className="w-full py-4 text-lg font-bold shadow-lg"
            >
              {currentUser.referredBy ? 'CODE ALREADY APPLIED' : (loading ? 'PROCESSING...' : 'CLAIM BONUS')}
            </Button>
          </div>

          {error && <p className="text-red-500 mt-4 text-sm text-center font-semibold">{error}</p>}
          {success && <p className="text-green-500 mt-4 text-sm text-center font-semibold">{success}</p>}
          
          {currentUser.referredBy && (
            <div className="mt-6 p-4 bg-green-500/10 rounded-xl border border-green-500/20 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <p className="text-xs text-green-500">You have successfully claimed your referral bonus!</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Stats Section */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12"
      >
        <div className="bg-white/5 p-6 rounded-2xl border border-white/5 flex flex-col items-center">
          <Users className="w-8 h-8 text-[var(--color-accent)] mb-2" />
          <span className="text-2xl font-black text-white">{currentUser.referralsCount || 0}</span>
          <span className="text-[10px] text-[var(--color-text-secondary)] uppercase tracking-[0.2em]">Total Referrals</span>
        </div>
        <div className="bg-white/5 p-6 rounded-2xl border border-white/5 flex flex-col items-center">
          <Gift className="w-8 h-8 text-green-500 mb-2" />
          <span className="text-2xl font-black text-white">₹{(currentUser.referralsCount || 0) * 10}</span>
          <span className="text-[10px] text-[var(--color-text-secondary)] uppercase tracking-[0.2em]">Total Earned</span>
        </div>
        <div className="bg-white/5 p-6 rounded-2xl border border-white/5 flex flex-col items-center">
          <Share2 className="w-8 h-8 text-blue-400 mb-2" />
          <span className="text-2xl font-black text-white">∞</span>
          <span className="text-[10px] text-[var(--color-text-secondary)] uppercase tracking-[0.2em]">Monthly Limit</span>
        </div>
      </motion.div>

      {/* History */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[var(--color-bg-secondary)] rounded-2xl border border-[var(--color-border)] shadow-xl overflow-hidden"
      >
        <div className="p-6 border-b border-[var(--color-border)] flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">Referral History</h2>
          <span className="text-[10px] text-[var(--color-text-secondary)] font-bold uppercase">Last 10 successful refers</span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/5 text-[10px] uppercase font-bold text-[var(--color-text-secondary)]">
                <th className="p-4">User</th>
                <th className="p-4">Reward</th>
                <th className="p-4">Date</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {referrals.length > 0 ? (
                referrals.map((ref) => (
                  <tr key={ref.id} className="hover:bg-white/5 transition-colors group">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-xs font-bold text-white">
                          {getUserById(ref.referredUserId)?.username?.substring(0, 1) || '?'}
                        </div>
                        <span className="text-sm font-bold text-white">
                          {getUserById(ref.referredUserId)?.username || 'Unknown Player'}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-sm font-bold text-green-500">₹{ref.amountEarned}.00</span>
                    </td>
                    <td className="p-4 text-xs text-[var(--color-text-secondary)]">
                      {formatDateTime12h(ref.timestamp)}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-green-500 uppercase">
                        <CheckCircle2 className="w-3 h-3" />
                        COMPLETED
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="p-10 text-center text-[var(--color-text-secondary)] italic">
                    <div className="flex flex-col items-center gap-3">
                      <Users className="w-12 h-12 opacity-20" />
                      <p>No referrals yet. Start sharing your code to earn rewards!</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
};

export default ReferEarnPage;
