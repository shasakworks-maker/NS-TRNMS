import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Trophy, Medal, Target, Crown } from 'lucide-react';
import { getLeaderboard } from '../services/firebaseService';
import { useFirebaseData } from '../hooks/useFirebaseData';

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const dataVersion = useFirebaseData();

  useEffect(() => {
    setLeaderboard(getLeaderboard());
  }, [dataVersion]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col space-y-6"
    >
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-display font-bold text-white">Global Leaderboard</h1>
        <p className="text-sm text-[var(--color-text-secondary)]">Top warriors of NS Tournaments</p>
      </div>

      {/* Top 3 Podium */}
      <div className="flex justify-center items-end gap-4 pt-10 pb-6">
        {/* 2nd Place */}
        {leaderboard[1] && (
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col items-center"
          >
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-zinc-400 overflow-hidden shadow-lg">
                <img src={leaderboard[1].avatar} alt={leaderboard[1].username} className="w-full h-full object-cover" />
              </div>
              <div className="absolute -bottom-2 -right-2 bg-zinc-400 text-black w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs">2</div>
            </div>
            <span className="mt-3 text-xs font-bold text-white">{leaderboard[1].username}</span>
            <span className="text-[10px] text-zinc-400 font-bold uppercase">{leaderboard[1].kills} Kills</span>
            <div className="h-16 w-12 bg-zinc-400/20 rounded-t-lg mt-2 border-t border-zinc-400/30" />
          </motion.div>
        )}

        {/* 1st Place */}
        {leaderboard[0] && (
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex flex-col items-center"
          >
            <div className="relative">
              <Crown className="absolute -top-8 left-1/2 -translate-x-1/2 w-8 h-8 text-yellow-500 drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]" />
              <div className="w-20 h-20 rounded-full border-4 border-yellow-500 overflow-hidden shadow-[0_0_20px_rgba(234,179,8,0.3)]">
                <img src={leaderboard[0].avatar} alt={leaderboard[0].username} className="w-full h-full object-cover" />
              </div>
              <div className="absolute -bottom-2 -right-2 bg-yellow-500 text-black w-7 h-7 rounded-full flex items-center justify-center font-bold text-sm">1</div>
            </div>
            <span className="mt-3 text-sm font-bold text-white">{leaderboard[0].username}</span>
            <span className="text-[10px] text-yellow-500 font-bold uppercase">{leaderboard[0].kills} Kills</span>
            <div className="h-24 w-16 bg-yellow-500/20 rounded-t-lg mt-2 border-t border-yellow-500/30" />
          </motion.div>
        )}

        {/* 3rd Place */}
        {leaderboard[2] && (
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col items-center"
          >
            <div className="relative">
              <div className="w-14 h-14 rounded-full border-4 border-amber-700 overflow-hidden shadow-lg">
                <img src={leaderboard[2].avatar} alt={leaderboard[2].username} className="w-full h-full object-cover" />
              </div>
              <div className="absolute -bottom-2 -right-2 bg-amber-700 text-white w-5 h-5 rounded-full flex items-center justify-center font-bold text-xs">3</div>
            </div>
            <span className="mt-3 text-xs font-bold text-white">{leaderboard[2].username}</span>
            <span className="text-[10px] text-amber-700 font-bold uppercase">{leaderboard[2].kills} Kills</span>
            <div className="h-12 w-10 bg-amber-700/20 rounded-t-lg mt-2 border-t border-amber-700/30" />
          </motion.div>
        )}
      </div>

      {/* List */}
      <div className="bg-[var(--color-bg-secondary)] rounded-2xl border border-[var(--color-border)] overflow-hidden">
        <div className="grid grid-cols-12 p-4 border-b border-[var(--color-border)] text-[10px] uppercase font-bold tracking-widest text-zinc-500">
          <div className="col-span-2">Rank</div>
          <div className="col-span-6">Player</div>
          <div className="col-span-2 text-center">Kills</div>
          <div className="col-span-2 text-center">Wins</div>
        </div>
        <div className="divide-y divide-[var(--color-border)]">
          {leaderboard.slice(3).map((player, index) => (
            <div key={player.id} className="grid grid-cols-12 p-4 items-center hover:bg-white/5 transition-colors">
              <div className="col-span-2 font-mono font-bold text-zinc-400">#{index + 4}</div>
              <div className="col-span-6 flex items-center gap-3">
                <img src={player.avatar} alt={player.username} className="w-8 h-8 rounded-lg object-cover" />
                <span className="font-bold text-white text-sm">{player.username}</span>
              </div>
              <div className="col-span-2 text-center font-bold text-[var(--color-accent)] text-sm">{player.kills}</div>
              <div className="col-span-2 text-center font-bold text-green-400 text-sm">{player.wins}</div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
