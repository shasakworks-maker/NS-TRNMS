import { useEffect, useState } from 'react';
import { getSystemNotifications, getUpcomingTournaments, isUserRegisteredForTournament, addTransaction } from '../services/firebaseService';
import { AppNotification, Tournament } from '../types';
import { Bell, Info, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface NotificationManagerProps {
  currentUserId: string | null;
}

export default function NotificationManager({ currentUserId }: NotificationManagerProps) {
  const [activeNotification, setActiveNotification] = useState<AppNotification | null>(null);
  const [remindedTournaments, setRemindedTournaments] = useState<Set<string>>(new Set());

  useEffect(() => {
    // 1. Poll for system notifications every 5 minutes
    const fetchSystemNotifs = async () => {
      const systemNotifs = await getSystemNotifications();
      if (systemNotifs.length > 0) {
        const latest = systemNotifs[0];
        // Only show if it's "new" (within the last 5 minutes)
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        if (latest.createdAt > fiveMinutesAgo) {
          showNotification(latest);
        }
      }
    };

    // 2. Check for upcoming tournament reminders every minute
    const checkMatchReminders = () => {
      if (!currentUserId) return;

      const upcoming = getUpcomingTournaments();
      const now = new Date();

      upcoming.forEach(tournament => {
        // Combine date and time string to get a proper Date object
        const [hours, minutes] = tournament.time.split(':').map(Number);
        const startTime = new Date(tournament.date);
        startTime.setHours(hours, minutes, 0, 0);
        
        const diffMinutes = (startTime.getTime() - now.getTime()) / (1000 * 60);

        // Reminder 15 minutes before match
        if (diffMinutes > 0 && diffMinutes <= 15 && !remindedTournaments.has(tournament.id)) {
          if (isUserRegisteredForTournament(currentUserId, tournament.id)) {
            showNotification({
              id: `reminder-${tournament.id}`,
              userId: currentUserId,
              title: 'Match Reminder!',
              message: `Your match for "${tournament.name}" starts in ${Math.round(diffMinutes)} minutes. Get ready!`,
              type: 'warning',
              isRead: false,
              createdAt: new Date()
            });
            setRemindedTournaments(prev => new Set(prev).add(tournament.id));
          }
        }
      });
    };

    const showNotification = (notif: AppNotification) => {
      setActiveNotification(notif);
      // Auto-hide after 10 seconds
      setTimeout(() => {
        setActiveNotification(null);
      }, 10000);
    };

    fetchSystemNotifs();
    checkMatchReminders();

    const systemInterval = setInterval(fetchSystemNotifs, 5 * 60 * 1000);
    const reminderInterval = setInterval(checkMatchReminders, 60 * 1000);

    return () => {
      clearInterval(systemInterval);
      clearInterval(reminderInterval);
    };
  }, [currentUserId, remindedTournaments]);

  return (
    <div className="fixed top-20 right-4 z-[100] pointer-events-none w-full max-w-sm">
      <AnimatePresence>
        {activeNotification && (
          <motion.div
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 50, scale: 0.9 }}
            className="pointer-events-auto bg-[var(--color-bg-secondary)] border border-[var(--color-border)] p-4 rounded-xl shadow-2xl flex items-start gap-3 mb-2"
          >
            <div className={`p-2 rounded-lg ${
              activeNotification.type === 'warning' ? 'bg-yellow-500/10 text-yellow-500' : 
              activeNotification.type === 'error' ? 'bg-red-500/10 text-red-500' : 
              'bg-[var(--color-accent)]/10 text-[var(--color-accent)]'
            }`}>
              {activeNotification.type === 'warning' ? <AlertTriangle className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-bold text-[var(--color-text-primary)]">{activeNotification.title}</h4>
              <p className="text-xs text-[var(--color-text-secondary)] mt-1">{activeNotification.message}</p>
            </div>
            <button 
              onClick={() => setActiveNotification(null)}
              className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            >
              &times;
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
