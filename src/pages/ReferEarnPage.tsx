import React from 'react';
import { motion } from 'motion/react';
import { Gift, Share2, Users, Trophy } from 'lucide-react';
import Button from '../components/Button';

interface ReferEarnPageProps {
  currentUserId: string | null;
}

export default function ReferEarnPage({ currentUserId }: ReferEarnPageProps) {
  const referralCode = "NASID100"; // Mock code for now

  return (
    <div className="pb-24 pt-4 px-4 max-w-lg mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="w-20 h-20 bg-[var(--color-accent)]/20 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-[var(--color-accent)]/30">
          <Gift className="w-10 h-10 text-[var(--color-accent)]" />
        </div>
        <h1 className="text-3xl font-display font-bold text-white mb-2">Refer & Earn</h1>
        <p className="text-[var(--color-text-secondary)]">Invite your friends and earn rewards for every successful referral.</p>
      </motion.div>

      <div className="space-y-6">
        <div className="bg-[var(--color-bg-secondary)] p-6 rounded-2xl border border-white/5 text-center">
          <p className="text-xs text-[var(--color-text-secondary)] uppercase tracking-widest font-bold mb-4">Your Referral Code</p>
          <div className="bg-black/40 border border-white/10 rounded-xl py-4 mb-4 relative overflow-hidden group">
            <span className="text-3xl font-display font-bold text-white tracking-widest">{referralCode}</span>
          </div>
          <Button className="w-full">
            <Share2 className="w-4 h-4 mr-2" /> Share with Friends
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[var(--color-bg-secondary)] p-4 rounded-xl border border-white/5">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-4 h-4 text-[var(--color-accent)]" />
              <span className="text-xs text-[var(--color-text-secondary)]">Referrals</span>
            </div>
            <p className="text-xl font-bold text-white">0</p>
          </div>
          <div className="bg-[var(--color-bg-secondary)] p-4 rounded-xl border border-white/5">
            <div className="flex items-center gap-3 mb-2">
              <Trophy className="w-4 h-4 text-[var(--color-accent)]" />
              <span className="text-xs text-[var(--color-text-secondary)]">Earnings</span>
            </div>
            <p className="text-xl font-bold text-white">₹0</p>
          </div>
        </div>
      </div>
    </div>
  );
}
