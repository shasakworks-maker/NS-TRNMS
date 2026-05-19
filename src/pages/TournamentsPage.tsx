import React, { useEffect, useState } from 'react';
import { Tournament } from '../types';
import { getUpcomingTournaments, getCompletedTournaments, getOngoingTournaments, isUserRegisteredForTournament } from '../services/firebaseService';
import TournamentCard from '../components/TournamentCard';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { TournamentStatus, UserRole, TournamentCategory } from '../constants';
import { Search, Filter, LayoutGrid, User, Users, Target, Shield, Globe, Map } from 'lucide-react';
import { useFirebaseData } from '../hooks/useFirebaseData';

const CATEGORY_ICONS = {
  [TournamentCategory.ALL]: LayoutGrid,
  [TournamentCategory.CS_1V1]: User,
  [TournamentCategory.CS_2V2]: Users,
  [TournamentCategory.CS_3V3]: Users,
  [TournamentCategory.LONE_WOLF_1V1]: Target,
  [TournamentCategory.LONE_WOLF_2V2]: Shield,
  [TournamentCategory.BATTLE_ROYALE]: Globe,
};

interface TournamentsPageProps {
  currentUserId: string | null;
  currentUserRole: UserRole | null;
}

export default function TournamentsPage({ currentUserId, currentUserRole }: TournamentsPageProps) {
  const [upcomingTournaments, setUpcomingTournaments] = useState<Tournament[]>([]);
  const [ongoingTournaments, setOngoingTournaments] = useState<Tournament[]>([]);
  const [completedTournaments, setCompletedTournaments] = useState<Tournament[]>([]);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'ongoing' | 'completed'>('upcoming');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<TournamentCategory>(TournamentCategory.ALL);

  const dataVersion = useFirebaseData();

  useEffect(() => {
    setUpcomingTournaments(getUpcomingTournaments());
    setOngoingTournaments(getOngoingTournaments());
    setCompletedTournaments(getCompletedTournaments());
  }, [dataVersion]);

  const handleRegister = (tournamentId: string) => {
    console.log(`Attempting to register for tournament: ${tournamentId}`);
  };

  const filterTournaments = (tournaments: Tournament[]) => {
    return tournaments.filter(t => {
      const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.map.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === TournamentCategory.ALL || t.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  };

  const isAdmin = currentUserRole === UserRole.ADMIN;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto p-6"
    >
      <h1 className="text-4xl font-display font-bold text-[var(--color-text-primary)] mb-8 text-center">Tournaments</h1>

      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
        <input 
          type="text" 
          placeholder="Search matches or maps..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm text-white focus:border-[var(--color-accent)] focus:outline-none transition-all"
        />
      </div>

      {/* Category Filter */}
      <div className="flex gap-3 overflow-x-auto pb-6 mb-6 custom-scrollbar px-2 -mx-2">
        {Object.values(TournamentCategory).map((category) => {
          const Icon = CATEGORY_ICONS[category as TournamentCategory] || Map;
          const isActive = selectedCategory === category;
          
          return (
            <motion.button
              key={category}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedCategory(category as TournamentCategory)}
              className={`flex-shrink-0 flex items-center gap-2.5 px-5 py-3 rounded-2xl text-[11px] font-bold uppercase tracking-wider transition-all duration-300 border backdrop-blur-xl relative overflow-hidden group
                ${isActive 
                  ? 'bg-[var(--color-accent)]/20 border-[var(--color-accent)] text-[var(--color-accent)] shadow-[0_10px_30px_rgba(0,200,255,0.15)] ring-1 ring-[var(--color-accent)]/50' 
                  : 'bg-white/5 border-white/10 text-zinc-500 hover:border-white/30 hover:bg-white/10 hover:text-white'}`}
            >
              {isActive && (
                <motion.div
                  layoutId="category-glow"
                  className="absolute inset-0 bg-gradient-to-r from-[var(--color-accent)]/10 to-transparent opacity-50"
                  initial={false}
                />
              )}
              <Icon className={`w-4 h-4 ${isActive ? 'text-[var(--color-accent)]' : 'text-zinc-500 group-hover:text-white transition-colors'}`} />
              <span className="relative z-10">{category}</span>
            </motion.button>
          )
        })}
      </div>

      <div className="flex bg-white/5 p-1 rounded-2xl mb-8 relative">
        {(['upcoming', 'ongoing', 'completed'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`relative flex-1 py-3 text-xs font-bold uppercase tracking-widest transition-colors duration-300 z-10
              ${activeTab === tab ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            {activeTab === tab && (
              <motion.div
                layoutId="active-tab"
                className="absolute inset-0 bg-[var(--color-accent)] rounded-xl shadow-[0_0_20px_rgba(0,200,255,0.3)]"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span className="relative z-20">{tab}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activeTab === 'upcoming' && filterTournaments(upcomingTournaments).length > 0 ? (
          filterTournaments(upcomingTournaments).map(tournament => (
            <Link to={`/register/${tournament.id}`} key={tournament.id}>
              <TournamentCard 
                tournament={tournament} 
                showRegisterButton 
                onRegister={handleRegister}
                isRegistered={currentUserId ? isUserRegisteredForTournament(currentUserId, tournament.id) : false}
                isAdmin={isAdmin}
              />
            </Link>
          ))
        ) : activeTab === 'upcoming' ? (
          <p className="col-span-full text-center text-[var(--color-text-secondary)] text-lg">No upcoming tournaments at the moment. Check back soon!</p>
        ) : null}

        {activeTab === 'ongoing' && filterTournaments(ongoingTournaments).length > 0 ? (
          filterTournaments(ongoingTournaments).map((tournament: Tournament) => (
            <React.Fragment key={tournament.id}>
              <TournamentCard 
                tournament={tournament} 
                isRegistered={currentUserId ? isUserRegisteredForTournament(currentUserId, tournament.id) : false}
                isAdmin={isAdmin}
              />
            </React.Fragment>
          ))
        ) : activeTab === 'ongoing' ? (
          <p className="col-span-full text-center text-[var(--color-text-secondary)] text-lg">No ongoing tournaments right now.</p>
        ) : null}

        {activeTab === 'completed' && filterTournaments(completedTournaments).length > 0 ? (
          filterTournaments(completedTournaments).map((tournament: Tournament) => (
            <React.Fragment key={tournament.id}>
              <TournamentCard 
                tournament={tournament} 
                isRegistered={currentUserId ? isUserRegisteredForTournament(currentUserId, tournament.id) : false}
                isAdmin={isAdmin}
              />
            </React.Fragment>
          ))
        ) : activeTab === 'completed' ? (
          <p className="col-span-full text-center text-[var(--color-text-secondary)] text-lg">No completed tournaments yet.</p>
        ) : null}
      </div>
    </motion.div>
  );
}
