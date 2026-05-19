import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, CheckCircle2, Info, AlertTriangle, XCircle, ChevronLeft, Trash2, Copy, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getNotificationsByUserId, markNotificationAsRead } from '../services/firebaseService';
import { AppNotification } from '../types';
import { formatTime12h } from '../lib/dateUtils';

interface NotificationsPageProps {
  currentUserId: string | null;
}

export default function NotificationsPage({ currentUserId }: NotificationsPageProps) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUserId) {
      setNotifications(getNotificationsByUserId(currentUserId));
    }
  }, [currentUserId]);

  const handleMarkAsRead = (id: string) => {
    markNotificationAsRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const handleCopyCode = (code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const extractCode = (message: string) => {
    // Look for patterns like "code is: XXXXXX" or just uppercase clusters
    const match = message.match(/: ([A-Z0-9]{8,12})/);
    return match ? match[1] : null;
  };

  const getIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'success': return <CheckCircle2 className="w-5 h-5 text-green-400" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
      case 'error': return <XCircle className="w-5 h-5 text-red-400" />;
      default: return <Info className="w-5 h-5 text-blue-400" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col space-y-6"
    >
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl bg-white/5 border border-white/10 text-zinc-400">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-display font-bold text-white">Notifications</h1>
      </div>

      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {notifications.length > 0 ? (
            notifications.map((notif) => (
              <motion.div
                key={notif.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={() => !notif.isRead && handleMarkAsRead(notif.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  notif.isRead 
                    ? 'bg-white/5 border-white/5 opacity-60' 
                    : 'bg-white/10 border-white/10 shadow-lg shadow-black/20'
                }`}
              >
                <div className="flex gap-4">
                  <div className={`p-2 rounded-xl bg-white/5 h-fit`}>
                    {getIcon(notif.type)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between items-start">
                      <h3 className={`text-sm font-bold ${notif.isRead ? 'text-zinc-400' : 'text-white'}`}>
                        {notif.title}
                      </h3>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        {formatTime12h(notif.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      {notif.message}
                    </p>
                    {extractCode(notif.message) && (
                      <div className="mt-2 flex items-center gap-2">
                        <div className="bg-zinc-900 px-3 py-1.5 rounded-lg border border-white/5 font-mono text-xs text-[var(--color-accent)] font-bold">
                          {extractCode(notif.message)}
                        </div>
                        <button 
                          onClick={(e) => handleCopyCode(extractCode(notif.message)!, e)}
                          className="p-1.5 rounded-lg bg-[var(--color-accent)] text-white hover:opacity-80 transition-all shadow-lg shadow-[var(--color-accent)]/20"
                        >
                          {copiedCode === extractCode(notif.message) ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-20 space-y-4">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto">
                <Bell className="w-8 h-8 text-zinc-600" />
              </div>
              <p className="text-zinc-500 font-medium">No new notifications</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
