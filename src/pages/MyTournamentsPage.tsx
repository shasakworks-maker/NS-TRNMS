import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Calendar, Clock, Map, ChevronLeft, ChevronRight, Hash, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getMyTournaments, getRegistrationsByUserId } from '../services/firebaseService';
import { Tournament, Registration } from '../types';
import TournamentCard from '../components/TournamentCard';
import { useFirebaseData } from '../hooks/useFirebaseData';

interface MyTournamentsPageProps {
  currentUserId: string | null;
}

export default function MyTournamentsPage({ currentUserId }: MyTournamentsPageProps) {
  const [joinedTournaments, setJoinedTournaments] = useState<Tournament[]>([]);
  const [activeTab, setActiveTab] = useState<'active' | 'past'>('active');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const dataVersion = useFirebaseData();

  useEffect(() => {
    if (currentUserId) {
      const tournaments = getMyTournaments(currentUserId);
      setJoinedTournaments(tournaments);
      setLoading(false);
    }
  }, [currentUserId, dataVersion]);

  const activeTournaments = joinedTournaments.filter(t => t.status === 'upcoming' || t.status === 'ongoing');
  const pastTournaments = joinedTournaments.filter(t => t.status === 'completed' || t.status === 'cancelled');

  const displayList = activeTab === 'active' ? activeTournaments : pastTournaments;

  return (
    <div className="pb-20">
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl bg-white/5 border border-white/10 text-zinc-400 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-display font-black text-white uppercase tracking-tight">
            My <span className="text-[var(--color-accent)]">Tournaments</span>
          </h1>
          <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest mt-1">Your personal battle history</p>
        </div>
      </div>

      <div className="flex bg-white/5 p-1 rounded-2xl mb-8 relative">
        <button
          onClick={() => setActiveTab('active')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all z-10 ${activeTab === 'active' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          <Shield className="w-4 h-4" />
          Active ({activeTournaments.length})
        </button>
        <button
          onClick={() => setActiveTab('past')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all z-10 ${activeTab === 'past' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          <Trophy className="w-4 h-4" />
          Past ({pastTournaments.length})
        </button>
        <motion.div
          className="absolute inset-y-1 bg-[var(--color-accent)] rounded-xl shadow-[0_0_20px_rgba(0,200,255,0.3)]"
          initial={false}
          animate={{
            x: activeTab === 'active' ? '4px' : 'calc(100% - 4px)',
            left: activeTab === 'active' ? 0 : 'auto',
            right: activeTab === 'past' ? 0 : 'auto',
            width: 'calc(50% - 8px)'
          }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
      </div>

      <div className="grid grid-cols-1 gap-6">
        <AnimatePresence mode="popLayout">
          {displayList.length > 0 ? (
            displayList.map((tournament) => (
              <motion.div
                key={tournament.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                layout
              >
                <TournamentCard 
                  tournament={tournament} 
                  onRegister={() => navigate(`/tournaments/${tournament.id}`)}
                />
              </motion.div>
            ))
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-20 text-center space-y-4"
            >
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto border border-white/10">
                <Trophy className="w-8 h-8 text-zinc-700" />
              </div>
              <div>
                <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">No tournaments found</p>
                <p className="text-[10px] text-zinc-600 mt-2 max-w-[200px] mx-auto">You haven't joined any {activeTab} tournaments yet.</p>
              </div>
              <button 
                onClick={() => navigate('/tournaments')}
                className="text-[var(--color-accent)] text-[10px] font-black uppercase tracking-tighter border-b border-[var(--color-accent)]/30 pb-0.5"
              >
                Find Tournaments
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
