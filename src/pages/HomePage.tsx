import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { Trophy, Users, Zap, ChevronRight, ChevronLeft, Gift } from 'lucide-react';
import Button from '../components/Button';
import { getUserById, getNews, getLeaderboard, getCompletedTournaments } from '../services/firebaseService';
import { User, Tournament } from '../types';
import { useFirebaseData } from '../hooks/useFirebaseData';

const SLIDES = [
  {
    url: 'https://picsum.photos/seed/gaming1/800/450',
    title: 'Daily Scrims',
    subtitle: 'Compete every day and win big'
  },
  {
    url: 'https://picsum.photos/seed/gaming2/800/450',
    title: 'Weekly Championship',
    subtitle: 'The ultimate battle for glory'
  },
  {
    url: 'https://picsum.photos/seed/gaming3/800/450',
    title: 'Pro League',
    subtitle: 'Join the elite ranks'
  }
];

export default function HomePage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [news, setNews] = useState(getNews());
  const [topPlayers, setTopPlayers] = useState<any[]>([]);
  const [latestWinners, setLatestWinners] = useState<any[]>([]);
  const dataVersion = useFirebaseData();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
    }, 5000);

    const handleNewsUpdate = (e: any) => {
      setNews(e.detail.news);
    };

    window.addEventListener('news-updated', handleNewsUpdate);

    // Dynamic Data
    setTopPlayers(getLeaderboard().slice(0, 6));
    
    const completed = getCompletedTournaments().slice(0, 3);
    setLatestWinners(completed.map(t => {
      const winner = t.winnerId ? getUserById(t.winnerId) : null;
      return {
        name: winner?.username || winner?.ign || 'Unknown',
        tourney: t.name,
        prize: `₹${t.prizePool}`,
        date: t.date.toLocaleDateString()
      };
    }).filter(w => w.name !== 'Unknown'));

    return () => {
      clearInterval(timer);
      window.removeEventListener('news-updated', handleNewsUpdate);
    };
  }, [dataVersion]);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col space-y-8 pb-10"
    >
      {/* Hero Carousel */}
      <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden shadow-2xl border border-[var(--color-border)] group">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0"
          >
            <img 
              src={SLIDES[currentSlide].url} 
              alt={SLIDES[currentSlide].title}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6">
              <motion.h2 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-2xl font-display font-bold text-white mb-1"
              >
                {SLIDES[currentSlide].title}
              </motion.h2>
              <motion.p 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-sm text-gray-300"
              >
                {SLIDES[currentSlide].subtitle}
              </motion.p>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Carousel Controls */}
        <button 
          onClick={prevSlide}
          className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/30 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/50"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button 
          onClick={nextSlide}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/30 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/50"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Indicators */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
          {SLIDES.map((_, i) => (
            <div 
              key={i}
              className={`w-2 h-2 rounded-full transition-all ${i === currentSlide ? 'bg-[var(--color-accent)] w-4' : 'bg-white/50'}`}
            />
          ))}
        </div>
      </div>

      {/* Announcement Ticker */}
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex items-center gap-3 overflow-hidden">
        <div className="bg-amber-500 text-black text-[10px] font-bold px-2 py-0.5 rounded uppercase shrink-0 animate-pulse">
          News
        </div>
        <div className="flex-1 overflow-hidden">
          <motion.p 
            animate={{ x: [400, -600] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="text-xs text-amber-200 whitespace-nowrap font-medium"
          >
            {news}
          </motion.p>
        </div>
      </div>

      {/* Welcome Section */}
      <div className="text-center space-y-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mb-2"
        >
          <img 
            src="https://i.postimg.cc/fzk0J1zg/IMG-20260219-183118-760.webp" 
            alt="NS Tournaments Logo" 
            className="w-16 h-16 object-contain mx-auto"
            referrerPolicy="no-referrer"
          />
        </motion.div>
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-[var(--color-accent)] font-mono text-xs uppercase tracking-[0.4em] block"
        >
          Welcome to NS Tournaments
        </motion.span>
        <h1 className="text-3xl font-display font-bold text-[var(--color-text-primary)] leading-tight">
          Dominate the <span className="text-[var(--color-accent)]">Free Fire</span> Arena
        </h1>
        <p className="text-[var(--color-text-secondary)] text-sm max-w-xs mx-auto">
          Compete in high-stakes tournaments, climb the leaderboards, and win real cash prizes.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <Link to="/tournaments" className="block">
          <div className="bg-[var(--color-bg-secondary)] p-5 rounded-2xl border border-[var(--color-border)] hover:border-[var(--color-accent)] transition-all group">
            <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center text-yellow-500 mb-3 group-hover:scale-110 transition-transform">
              <Trophy className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-[var(--color-text-primary)] mb-1">Tournaments</h3>
            <p className="text-[10px] text-[var(--color-text-secondary)] uppercase font-bold tracking-wider">Join Now</p>
          </div>
        </Link>
        <Link to="/wallet" className="block">
          <div className="bg-[var(--color-bg-secondary)] p-5 rounded-2xl border border-[var(--color-border)] hover:border-[var(--color-accent)] transition-all group">
            <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center text-green-500 mb-3 group-hover:scale-110 transition-transform">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-[var(--color-text-primary)] mb-1">My Wallet</h3>
            <p className="text-[10px] text-[var(--color-text-secondary)] uppercase font-bold tracking-wider">Check Balance</p>
          </div>
        </Link>
      </div>

      {/* Refer & Earn */}
      <Link to="/refer-earn" className="block">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-900/40 to-indigo-900/40 border border-white/10 p-6 group hover:border-[var(--color-accent)] transition-all">
          <div className="relative z-10 flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white group-hover:text-[var(--color-accent)] transition-colors">Refer & Earn</h3>
              <p className="text-xs text-gray-400">Get ₹10 for every friend who joins!</p>
              <div className="pt-2">
                <span className="text-[10px] font-bold text-[var(--color-accent)] uppercase tracking-widest flex items-center gap-1 group-hover:gap-2 transition-all">
                  Get Started <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </div>
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg transform rotate-12 group-hover:rotate-0 transition-transform">
              <Gift className="w-8 h-8 text-white" />
            </div>
          </div>
          <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl" />
        </div>
      </Link>

      {/* How to Play */}
      <div className="space-y-4">
        <h2 className="text-xl font-display font-bold text-white px-2">How to Play</h2>
        <div className="grid grid-cols-1 gap-3">
          {[
            { step: '01', title: 'Register', desc: 'Choose a tournament and join with your Free Fire UID.' },
            { step: '02', title: 'Get Room ID', desc: 'Room ID & Password will be shared 15 mins before match.' },
            { step: '03', title: 'Battle', desc: 'Enter the room in Free Fire and play your best game.' },
            { step: '04', title: 'Win Cash', desc: 'Prizes are credited to your wallet after match verification.' },
          ].map((item) => (
            <div key={item.step} className="flex gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
              <span className="text-2xl font-display font-black text-white/10">{item.step}</span>
              <div>
                <h4 className="font-bold text-white text-sm">{item.title}</h4>
                <p className="text-xs text-zinc-500">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Players Preview */}
      <div className="space-y-4">
        <div className="flex justify-between items-center px-2">
          <h2 className="text-xl font-display font-bold text-white">Top Warriors</h2>
          <Link to="/leaderboard" className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-accent)]">View All</Link>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
          {topPlayers.length > 0 ? (
            topPlayers.map((player) => (
              <div key={player.id} className="flex-shrink-0 w-24 text-center space-y-2">
                <div className="w-20 h-20 mx-auto rounded-2xl border-2 border-white/10 overflow-hidden">
                  <img src={player.avatar} alt={player.username} className="w-full h-full object-cover" />
                </div>
                <p className="text-[10px] font-bold text-white truncate">{player.username}</p>
                <p className="text-[10px] text-[var(--color-accent)] font-bold">{player.kills} Kills</p>
              </div>
            ))
          ) : (
            <p className="text-[10px] text-[var(--color-text-secondary)] px-2">No warriors yet. Join a tournament to start your climb!</p>
          )}
        </div>
      </div>

      {/* Latest Winners */}
      <div className="space-y-4">
        <h2 className="text-xl font-display font-bold text-white px-2">Hall of Fame</h2>
        <div className="space-y-3">
          {latestWinners.length > 0 ? (
            latestWinners.map((winner, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 group hover:border-yellow-500/30 transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center text-yellow-500">
                    <Trophy className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">{winner.name}</h4>
                    <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">{winner.tourney}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-green-400">{winner.prize}</p>
                  <p className="text-[10px] text-zinc-500 font-bold">{winner.date}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-[10px] text-[var(--color-text-secondary)] px-2">Greatness awaits. Will you be next?</p>
          )}
        </div>
      </div>

      {/* Stats/Trust Section */}
      <div className="bg-[var(--color-bg-secondary)] rounded-2xl border border-[var(--color-border)] p-6 flex justify-around items-center">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-[var(--color-accent)] mb-1">
            <Users className="w-4 h-4" />
            <span className="text-xl font-bold">10K+</span>
          </div>
          <p className="text-[10px] text-[var(--color-text-secondary)] uppercase font-bold tracking-widest">Players</p>
        </div>
        <div className="w-px h-10 bg-[var(--color-border)]" />
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-green-400 mb-1">
            <Trophy className="w-4 h-4" />
            <span className="text-xl font-bold">₹5L+</span>
          </div>
          <p className="text-[10px] text-[var(--color-text-secondary)] uppercase font-bold tracking-widest">Paid Out</p>
        </div>
      </div>

      <div className="pt-4">
        <Link to="/tournaments">
          <Button className="w-full flex items-center justify-center gap-2 py-4 text-lg">
            Start Competing <ChevronRight className="w-5 h-5" />
          </Button>
        </Link>
      </div>
    </motion.div>
  );
}
