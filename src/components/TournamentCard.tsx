import React, { useState } from 'react';
import { Tournament } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, Clock, Map, Shield, Trophy, Key, Hash, Copy, Check, Info, X, Share2, Globe, Users, Target } from 'lucide-react';
import Button from './Button';
import { formatTimeString12h } from '../lib/dateUtils';

interface TournamentCardProps {
  tournament: Tournament;
  onRegister?: (tournamentId: string) => void;
  showRegisterButton?: boolean;
  isRegistered?: boolean;
  isAdmin?: boolean;
}

const getCategoryIcon = (category?: string) => {
  if (!category) return null;
  const upper = category.toUpperCase();
  if (upper.includes('BATTLE')) return <Globe className="w-2.5 h-2.5" />;
  if (upper.includes('CS')) return <Users className="w-2.5 h-2.5" />;
  if (upper.includes('LONE')) return <Target className="w-2.5 h-2.5" />;
  return <Shield className="w-2.5 h-2.5" />;
};

export default function TournamentCard({ 
  tournament, 
  onRegister, 
  showRegisterButton = false,
  isRegistered = false,
  isAdmin = false
}: TournamentCardProps) {
  const isUpcoming = tournament.status === 'upcoming';
  const isOngoing = tournament.status === 'ongoing';
  const isCompleted = tournament.status === 'completed';
  const [copiedId, setCopiedId] = useState(false);
  const [copiedPass, setCopiedPass] = useState(false);
  const [showRoomDetails, setShowRoomDetails] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const handleCopy = (text: string, type: 'id' | 'pass') => {
    navigator.clipboard.writeText(text);
    if (type === 'id') {
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    } else {
      setCopiedPass(true);
      setTimeout(() => setCopiedPass(false), 2000);
    }
  };

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (navigator.share) {
      navigator.share({
        title: tournament.name,
        text: `Join ${tournament.name} on NS Tournaments! Prize Pool: ₹${tournament.prizePool}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  const canSeeRoomDetails = isAdmin || isRegistered;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={`bg-white/5 backdrop-blur-sm p-6 rounded-2xl border ${isOngoing ? 'border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.1)]' : 'border-white/10'} hover:border-white/20 transition-all relative overflow-hidden group`}
      >
        {/* Background Glow */}
        <div className={`absolute -top-24 -right-24 w-48 h-48 rounded-full blur-[80px] opacity-20 transition-colors ${isOngoing ? 'bg-red-500' : 'bg-[var(--color-accent)]'}`} />

        <div className="absolute top-4 right-4 flex gap-2">
          {tournament.category && (
            <div className="bg-[var(--color-accent)]/10 text-[var(--color-accent)] text-[9px] font-black px-2.5 py-1 rounded-lg border border-[var(--color-accent)]/20 uppercase tracking-wider flex items-center gap-1.5 backdrop-blur-md shadow-lg shadow-[var(--color-accent)]/5">
              {getCategoryIcon(tournament.category)}
              {tournament.category}
            </div>
          )}
          <button 
            onClick={handleShare}
            className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors border border-white/5"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>
          {isOngoing && (
            <div className="bg-red-500 text-white text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-[0_0_15px_rgba(239,68,68,0.5)]">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
              LIVE
            </div>
          )}
        </div>

        <div className="relative z-10">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xl font-display font-bold text-white group-hover:text-[var(--color-accent)] transition-colors pr-10">{tournament.name}</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-y-3 gap-x-4 mb-6">
            <div className="flex items-center gap-2 text-zinc-400">
              <Calendar className="w-4 h-4 text-[var(--color-accent)]" />
              <span className="text-xs font-medium">{formatDate(tournament.date)}</span>
            </div>
            <div className="flex items-center gap-2 text-zinc-400">
              <Clock className="w-4 h-4 text-[var(--color-accent)]" />
              <span className="text-xs font-medium">{formatTimeString12h(tournament.time)}</span>
            </div>
            <div className="flex items-center gap-2 text-zinc-400">
              <Map className="w-4 h-4 text-[var(--color-accent)]" />
              <span className="text-xs font-medium">{tournament.map}</span>
            </div>
            <div className="flex items-center gap-2 text-zinc-400">
              <Shield className="w-4 h-4 text-[var(--color-accent)]" />
              <span className="text-xs font-medium">{tournament.version}</span>
            </div>
          </div>

          {/* Room Details Section */}
          {(isOngoing || isUpcoming) && (
            <div className="mb-4">
              {!showRoomDetails ? (
                <button 
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowRoomDetails(true); }}
                  className={`w-full py-3 rounded-xl border flex items-center justify-center gap-2 font-bold text-xs transition-all ${canSeeRoomDetails ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/20' : 'bg-zinc-500/10 border-zinc-500/30 text-zinc-500 cursor-not-allowed'}`}
                >
                  <Key className="w-4 h-4" />
                  {canSeeRoomDetails ? 'Show Room Details' : 'Register to see Room Details'}
                </button>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Hash className="w-4 h-4 text-indigo-400" />
                      <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest">Room ID</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono font-bold text-white">{tournament.roomId || 'TBA'}</span>
                      {tournament.roomId && (
                        <button 
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleCopy(tournament.roomId!, 'id'); }}
                          className="p-1 hover:bg-white/10 rounded transition-colors"
                        >
                          {copiedId ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3 text-zinc-400" />}
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Key className="w-4 h-4 text-indigo-400" />
                      <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest">Password</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono font-bold text-white">{tournament.roomPassword || 'TBA'}</span>
                      {tournament.roomPassword && (
                        <button 
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleCopy(tournament.roomPassword!, 'pass'); }}
                          className="p-1 hover:bg-white/10 rounded transition-colors"
                        >
                          {copiedPass ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3 text-zinc-400" />}
                        </button>
                      )}
                    </div>
                  </div>
                  <button 
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowRoomDetails(false); }}
                    className="w-full mt-2 text-[10px] text-zinc-500 hover:text-white transition-colors uppercase font-bold tracking-widest"
                  >
                    Hide Details
                  </button>
                </motion.div>
              )}
            </div>
          )}

          <div className="flex justify-between items-center p-4 rounded-xl bg-white/5 border border-white/5 mb-4">
            <div>
              <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mb-1">Prize Pool</p>
              <p className="text-lg font-bold text-green-400">₹{tournament.prizePool}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mb-1">Entry Fee</p>
              <p className="text-lg font-bold text-yellow-500">₹{tournament.entryFee}</p>
            </div>
          </div>

          {isUpcoming && (
            <div className="mb-4 space-y-2">
              <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                <span className="text-zinc-500">Slots Filled</span>
                <span className="text-white">{tournament.registeredCount}/{tournament.maxSlots}</span>
              </div>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(tournament.registeredCount / tournament.maxSlots) * 100}%` }}
                  className="h-full bg-gradient-to-r from-[var(--color-accent)] to-purple-500"
                />
              </div>
            </div>
          )}

          <button 
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowDetailsModal(true); }}
            className="w-full mb-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 hover:text-[var(--color-accent)] transition-colors flex items-center justify-center gap-2"
          >
            <Info className="w-3 h-3" /> View Rules & Prize Info
          </button>
        </div>

        {isUpcoming && showRegisterButton && onRegister && !isRegistered && (
          <Button 
            onClick={() => tournament.registeredCount < tournament.maxSlots && onRegister(tournament.id)} 
            className={`w-full relative z-10 transition-all ${tournament.registeredCount >= tournament.maxSlots ? 'bg-zinc-700 cursor-not-allowed opacity-50' : ''}`}
            disabled={tournament.registeredCount >= tournament.maxSlots}
          >
            {tournament.registeredCount >= tournament.maxSlots ? 'PLAYERS FULL' : 'Join Tournament'}
          </Button>
        )}

        {isOngoing && canSeeRoomDetails && (
          <Button 
            onClick={() => window.open('https://play.google.com/store/apps/details?id=com.dts.freefireth', '_blank')}
            className="w-full relative z-10 bg-red-600 hover:bg-red-700 shadow-[0_0_20px_rgba(220,38,38,0.4)]"
          >
            Join Match Now
          </Button>
        )}

        {isCompleted && (
          <div className={`mt-2 p-3 rounded-xl text-center flex items-center justify-center gap-2 ${tournament.winnerId ? 'bg-green-500/10 border border-green-500/20' : 'bg-zinc-500/10 border border-zinc-500/20'}`}>
            <Trophy className={`w-4 h-4 ${tournament.winnerId ? 'text-green-400' : 'text-zinc-400'}`} />
            <p className={`text-sm font-bold ${tournament.winnerId ? 'text-green-400' : 'text-zinc-400'}`}>
              {tournament.winnerId ? `Winner: ${tournament.winnerId}` : 'No Winner Declared'}
            </p>
          </div>
        )}
      </motion.div>

      {/* Details Modal */}
      <AnimatePresence>
        {showDetailsModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
            onClick={() => setShowDetailsModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-[var(--color-bg-primary)] w-full max-w-md rounded-3xl border border-white/10 overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-white/10 flex justify-between items-center">
                <h3 className="text-xl font-display font-bold text-white">Tournament Details</h3>
                <button onClick={() => setShowDetailsModal(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                  <X className="w-5 h-5 text-zinc-400" />
                </button>
              </div>
              
              <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                <section>
                  <h4 className="text-[10px] uppercase font-bold tracking-widest text-[var(--color-accent)] mb-3">Prize Distribution</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/5">
                      <span className="text-sm text-zinc-300">1st Place</span>
                      <span className="text-sm font-bold text-green-400">₹{Math.floor(tournament.prizePool * 0.5)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/5">
                      <span className="text-sm text-zinc-300">2nd Place</span>
                      <span className="text-sm font-bold text-zinc-300">₹{Math.floor(tournament.prizePool * 0.3)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/5">
                      <span className="text-sm text-zinc-300">3rd Place</span>
                      <span className="text-sm font-bold text-amber-700">₹{Math.floor(tournament.prizePool * 0.2)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/5">
                      <span className="text-sm text-zinc-300">Per Kill</span>
                      <span className="text-sm font-bold text-blue-400">₹10</span>
                    </div>
                  </div>
                </section>

                <section>
                  <h4 className="text-[10px] uppercase font-bold tracking-widest text-[var(--color-accent)] mb-3">Rules & Regulations</h4>
                  <ul className="space-y-3 text-sm text-zinc-400 list-disc pl-4">
                    <li>Teaming is strictly prohibited. Players found teaming will be disqualified.</li>
                    <li>Hackers will be banned permanently and prize money will be forfeited.</li>
                    <li>Room ID and Password will be shared 15 minutes before the match starts.</li>
                    <li>Ensure you have a stable internet connection. No refunds for disconnection.</li>
                    <li>Final decision rests with the tournament organizers.</li>
                  </ul>
                </section>
              </div>

              <div className="p-6 bg-white/5">
                <Button onClick={() => setShowDetailsModal(false)} className="w-full">
                  Close
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
