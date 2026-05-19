import { motion } from 'motion/react';
import { ChevronLeft, Info, Users, Shield, Trophy, Target, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AboutPage() {
  const navigate = useNavigate();

  const values = [
    {
      title: 'Fair Play',
      description: 'We prioritize a fair and competitive environment for all players. Our anti-cheat measures and strict rules ensure a level playing field.',
      icon: <Shield className="w-5 h-5 text-blue-400" />
    },
    {
      title: 'Community First',
      description: 'Our platform is built for gamers, by gamers. We listen to our community and strive to provide the best experience possible.',
      icon: <Users className="w-5 h-5 text-green-400" />
    },
    {
      title: 'Transparency',
      description: 'From prize distribution to match results, we maintain complete transparency in all our operations.',
      icon: <Target className="w-5 h-5 text-red-400" />
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col space-y-6"
    >
      <div className="flex items-center justify-between mb-2">
        <button 
          onClick={() => navigate('/menu')}
          className="p-2 rounded-full bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition-colors"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-2xl font-display font-bold text-[var(--color-text-primary)]">About Us</h1>
        <div className="w-10"></div>
      </div>

      <div className="bg-[var(--color-bg-secondary)] p-8 rounded-2xl border border-[var(--color-border)] shadow-sm text-center space-y-4">
        <div className="w-20 h-20 bg-[var(--color-accent)]/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Trophy className="w-10 h-10 text-[var(--color-accent)]" />
        </div>
        <h2 className="text-2xl font-display font-bold text-[var(--color-text-primary)]">NS Tournaments</h2>
        <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
          NS Tournaments is a premier platform for Free Fire enthusiasts to showcase their skills, compete in high-stakes matches, and win exciting prizes. Our mission is to provide a professional and fair competitive environment for all players.
        </p>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-display font-bold text-white px-2">Our Core Values</h3>
        <div className="grid grid-cols-1 gap-4">
          {values.map((value, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-[var(--color-bg-secondary)] p-6 rounded-2xl border border-[var(--color-border)] flex gap-4 items-start"
            >
              <div className="p-3 bg-white/5 rounded-xl">
                {value.icon}
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white">{value.title}</h4>
                <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                  {value.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="bg-gradient-to-br from-[var(--color-accent)] to-purple-600 p-8 rounded-2xl text-white text-center space-y-4 shadow-xl">
        <Heart className="w-10 h-10 mx-auto opacity-50" />
        <h3 className="text-xl font-display font-bold">Join Our Community</h3>
        <p className="text-sm opacity-90">
          Be a part of the fastest-growing Free Fire community. Join us today and start your journey to become a pro player!
        </p>
        <div className="pt-2">
          <p className="text-[10px] uppercase font-bold tracking-widest opacity-70">
            © 2024 NS Tournaments. All rights reserved.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
