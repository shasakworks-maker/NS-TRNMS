import { motion } from 'motion/react';
import { ChevronLeft, Shield, Info, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function RulesPage() {
  const navigate = useNavigate();

  const rules = [
    {
      title: 'General Rules',
      items: [
        'Players must use their registered Game ID (IGN) and UID.',
        'Teaming with opponents is strictly prohibited and will lead to an immediate ban.',
        'Use of hacks, scripts, or any third-party tools is not allowed.',
        'Respect all players and administrators. Toxic behavior will not be tolerated.'
      ]
    },
    {
      title: 'Match Rules',
      items: [
        'Room ID and Password will be shared 15 minutes before the match starts.',
        'Players must join the room within 10 minutes of receiving the details.',
        'The match will start exactly at the scheduled time.',
        'If a player disconnects, the match will not be restarted.'
      ]
    },
    {
      title: 'Prize Distribution',
      items: [
        'Prizes will be credited to the winner\'s wallet within 24 hours of match completion.',
        'In case of any dispute, the administrator\'s decision will be final.',
        'Withdrawal requests are processed within 48 hours.'
      ]
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
        <h1 className="text-2xl font-display font-bold text-[var(--color-text-primary)]">Rules & Regulations</h1>
        <div className="w-10"></div>
      </div>

      <div className="space-y-6">
        {rules.map((section, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-[var(--color-bg-secondary)] p-6 rounded-2xl border border-[var(--color-border)] shadow-sm"
          >
            <h2 className="text-lg font-display font-bold text-[var(--color-accent)] mb-4 flex items-center gap-2">
              {idx === 0 ? <Shield className="w-5 h-5" /> : idx === 1 ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
              {section.title}
            </h2>
            <ul className="space-y-3">
              {section.items.map((item, i) => (
                <li key={i} className="flex gap-3 text-sm text-[var(--color-text-secondary)] leading-relaxed">
                  <span className="text-[var(--color-accent)] font-bold">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>
        ))}
      </div>

      <div className="p-6 bg-blue-900/10 border border-blue-900/20 rounded-2xl">
        <div className="flex gap-3">
          <Info className="w-5 h-5 text-blue-400 shrink-0" />
          <p className="text-xs text-blue-300 leading-relaxed">
            By participating in any tournament, you agree to abide by these rules. Failure to comply may result in disqualification and forfeiture of prizes.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
