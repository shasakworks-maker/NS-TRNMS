import { motion } from 'motion/react';
import { ChevronLeft, Settings, Bell, Shield, Info, LogOut, Moon, Sun, Globe, HelpCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import Button from '../components/Button';

export default function SettingsPage() {
  const navigate = useNavigate();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(true);

  const settings = [
    {
      title: 'General',
      items: [
        {
          label: 'Notifications',
          icon: <Bell className="w-5 h-5 text-blue-400" />,
          type: 'toggle',
          value: notificationsEnabled,
          onChange: () => setNotificationsEnabled(!notificationsEnabled)
        },
        {
          label: 'Dark Mode',
          icon: <Moon className="w-5 h-5 text-purple-400" />,
          type: 'toggle',
          value: darkMode,
          onChange: () => setDarkMode(!darkMode)
        },
        {
          label: 'Language',
          icon: <Globe className="w-5 h-5 text-green-400" />,
          type: 'select',
          value: 'English'
        }
      ]
    },
    {
      title: 'Security',
      items: [
        {
          label: 'Change Password',
          icon: <Shield className="w-5 h-5 text-red-400" />,
          type: 'link',
          path: '/profile'
        },
        {
          label: 'Privacy Policy',
          icon: <Info className="w-5 h-5 text-gray-400" />,
          type: 'link',
          path: '/rules'
        }
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
        <h1 className="text-2xl font-display font-bold text-[var(--color-text-primary)]">Settings</h1>
        <div className="w-10"></div>
      </div>

      <div className="space-y-6">
        {settings.map((section, idx) => (
          <div key={idx} className="space-y-4">
            <h2 className="text-sm font-bold text-[var(--color-text-secondary)] px-4 uppercase tracking-widest">{section.title}</h2>
            <div className="bg-[var(--color-bg-secondary)] rounded-2xl border border-[var(--color-border)] overflow-hidden shadow-sm">
              {section.items.map((item, i) => (
                <div 
                  key={i}
                  className={`flex items-center justify-between p-4 ${
                    i !== section.items.length - 1 ? 'border-b border-[var(--color-border)]' : ''
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-white/5 rounded-xl">
                      {item.icon}
                    </div>
                    <span className="text-sm font-semibold text-white">{item.label}</span>
                  </div>
                  
                  {item.type === 'toggle' ? (
                    <button 
                      onClick={item.onChange}
                      className={`w-12 h-6 rounded-full relative transition-colors duration-300 ${
                        item.value ? 'bg-[var(--color-accent)]' : 'bg-white/10'
                      }`}
                    >
                      <motion.div 
                        animate={{ x: item.value ? 24 : 4 }}
                        className="w-4 h-4 bg-white rounded-full absolute top-1"
                      />
                    </button>
                  ) : item.type === 'select' ? (
                    <span className="text-xs text-[var(--color-text-secondary)] font-bold">{item.value}</span>
                  ) : (
                    <button 
                      onClick={() => item.path && navigate(item.path)}
                      className="text-xs text-[var(--color-accent)] font-bold hover:underline"
                    >
                      Manage
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-[var(--color-bg-secondary)] p-6 rounded-2xl border border-[var(--color-border)] text-center space-y-4 shadow-sm">
        <HelpCircle className="w-8 h-8 text-[var(--color-accent)] mx-auto opacity-50" />
        <h3 className="text-sm font-bold text-white">Need Help?</h3>
        <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
          If you have any questions or issues, please contact our support team. We are available 24/7 to assist you.
        </p>
        <Button 
          variant="secondary" 
          className="w-full text-xs"
          onClick={() => window.open('https://wa.me/918318235153', '_blank')}
        >
          Contact Support
        </Button>
      </div>
    </motion.div>
  );
}
