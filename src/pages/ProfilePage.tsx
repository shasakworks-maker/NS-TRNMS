import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { User, Phone, Gamepad2, IdCard, Mail, Save, Camera, ChevronLeft, Trophy, Target, Shield } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { getUserById, updateUserProfileImage, updateUserProfile } from '../services/firebaseService';
import { User as UserType } from '../types';
import Button from '../components/Button';
import { useFirebaseData } from '../hooks/useFirebaseData';

interface ProfilePageProps {
  currentUserId: string | null;
}

export default function ProfilePage({ currentUserId }: ProfilePageProps) {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [user, setUser] = useState<UserType | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const dataVersion = useFirebaseData();
  
  // Form State
  const [formData, setFormData] = useState({
    username: '',
    fullName: '',
    phoneNumber: '',
    ign: '',
    uid: '',
    email: '',
    profileImage: ''
  });

  useEffect(() => {
    if (currentUserId) {
      const currentUser = getUserById(currentUserId);
      if (currentUser) {
        setUser(currentUser);
        setFormData({
          username: currentUser.username || '',
          fullName: currentUser.fullName || 'John Doe',
          phoneNumber: currentUser.phoneNumber || '+91 98765 43210',
          ign: currentUser.ign || '',
          uid: currentUser.uid || '',
          email: currentUser.email || '',
          profileImage: currentUser.profileImage || ''
        });
      }
    }
  }, [currentUserId, dataVersion]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!user) return;
    setSaveLoading(true);
    
    const success = await updateUserProfile(user.id, {
      username: formData.username,
      fullName: formData.fullName,
      phoneNumber: formData.phoneNumber,
      ign: formData.ign,
      uid: formData.uid,
    });

    if (success) {
      setIsEditing(false);
      // In a real app, we might fetch the user again or update local state
      const updatedUser = getUserById(user.id);
      if (updatedUser) setUser(updatedUser);
    }
    setSaveLoading(false);
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && user) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const img = new Image();
        img.src = reader.result as string;
        img.onload = async () => {
          // Create canvas for resizing
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 400;
          const MAX_HEIGHT = 400;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          // Get compressed base64 string
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7); // 0.7 quality factor
          
          setFormData(prev => ({ ...prev, profileImage: compressedBase64 }));
          await updateUserProfileImage(user.id, compressedBase64);
        };
      };
      reader.readAsDataURL(file);
    }
  };

  if (!user) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex flex-col space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <button 
          onClick={() => navigate('/menu')}
          className="p-2 rounded-full bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition-colors"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-2xl font-display font-bold text-[var(--color-text-primary)]">Profile</h1>
        <div className="w-10"></div> {/* Spacer for centering */}
      </div>

      {/* Profile Picture Section */}
      <div className="flex flex-col items-center space-y-4 py-6">
        <div className="relative">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImageChange} 
            accept="image/*" 
            className="hidden" 
          />
          <div 
            onClick={handleImageClick}
            className="w-28 h-28 rounded-full bg-gradient-to-br from-[var(--color-accent)] to-purple-600 flex items-center justify-center text-white text-4xl font-bold border-4 border-[var(--color-bg-secondary)] shadow-xl overflow-hidden cursor-pointer group"
          >
            {formData.profileImage ? (
              <img src={formData.profileImage} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              formData.username.charAt(0).toUpperCase()
            )}
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="w-8 h-8 text-white" />
            </div>
          </div>
          <button 
            onClick={handleImageClick}
            className="absolute bottom-0 right-0 p-2 bg-[var(--color-accent)] rounded-full text-white shadow-lg border-2 border-[var(--color-bg-primary)] hover:scale-110 transition-transform"
          >
            <Camera className="w-4 h-4" />
          </button>
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-[var(--color-text-primary)]">{formData.username}</h2>
          <div className="flex items-center justify-center gap-2 mt-1">
            <span className="px-2 py-0.5 rounded bg-[var(--color-accent)]/10 text-[var(--color-accent)] text-[10px] font-bold font-mono border border-[var(--color-accent)]/20">
              ID: {user.displayId}
            </span>
            <span className="text-[10px] text-[var(--color-text-secondary)] font-bold uppercase tracking-wider">
              Member since Feb 2024
            </span>
          </div>
        </div>
      </div>

      {/* Professional Info Form */}
      <div className="bg-[var(--color-bg-secondary)] rounded-2xl border border-[var(--color-border)] p-6 space-y-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-4">
          <h3 className="text-lg font-display font-semibold text-[var(--color-accent)] flex items-center gap-2">
            <IdCard className="w-5 h-5" /> Professional Details
          </h3>
          <button 
            onClick={() => setIsEditing(!isEditing)}
            className="text-sm font-bold text-[var(--color-accent)] hover:underline"
          >
            {isEditing ? 'Cancel' : 'Edit'}
          </button>
        </div>

        <div className="space-y-5">
          {/* Full Name */}
          <ProfileField 
            label="Full Name" 
            name="fullName"
            value={formData.fullName} 
            icon={<User className="w-4 h-4" />} 
            isEditing={isEditing}
            onChange={handleInputChange}
          />

          {/* Phone Number */}
          <ProfileField 
            label="Phone Number" 
            name="phoneNumber"
            value={formData.phoneNumber} 
            icon={<Phone className="w-4 h-4" />} 
            isEditing={isEditing}
            onChange={handleInputChange}
            placeholder="+91 XXXXX XXXXX"
          />

          {/* Game ID (IGN) */}
          <ProfileField 
            label="Game ID (IGN)" 
            name="ign"
            value={formData.ign} 
            icon={<Gamepad2 className="w-4 h-4" />} 
            isEditing={isEditing}
            onChange={handleInputChange}
          />

          {/* Game UID */}
          <ProfileField 
            label="Game UID" 
            name="uid"
            value={formData.uid} 
            icon={<IdCard className="w-4 h-4" />} 
            isEditing={isEditing}
            onChange={handleInputChange}
          />
          
          {/* Referral Code */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-widest flex items-center gap-1.5">
              <Shield className="w-4 h-4" /> Referral Code
            </label>
            <div className="bg-white/5 border border-dashed border-[var(--color-accent)]/30 rounded-xl p-3 text-sm text-[var(--color-accent)] font-mono font-bold flex justify-between items-center">
              {user.referralCode || 'NOT SET'}
              <Link to="/refer-earn" className="text-[10px] text-zinc-500 hover:text-white transition-colors">SHARE & EARN</Link>
            </div>
          </div>

          {/* Email */}
          <ProfileField 
            label="Email Address" 
            name="email"
            value={formData.email} 
            icon={<Mail className="w-4 h-4" />} 
            isEditing={false} // Email usually not editable directly
            onChange={handleInputChange}
          />
        </div>

        {isEditing && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="pt-4"
          >
            <Button onClick={handleSave} className="w-full flex items-center justify-center gap-2">
              <Save className="w-4 h-4" /> Save Professional Profile
            </Button>
          </motion.div>
        )}
      </div>

      {/* Stats Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-display font-semibold text-white px-2 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" /> Battle Statistics
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <StatCard label="Matches" value={user.stats?.totalMatches || 0} icon={<Gamepad2 className="w-4 h-4" />} />
          <StatCard label="Wins" value={user.stats?.totalWins || 0} icon={<Trophy className="w-4 h-4" />} color="text-green-400" />
          <StatCard label="Kills" value={user.stats?.totalKills || 0} icon={<Target className="w-4 h-4" />} color="text-red-400" />
          <StatCard label="K/D Ratio" value={user.stats?.kdRatio || 0} icon={<Shield className="w-4 h-4" />} color="text-blue-400" />
        </div>
        
        {/* Win Rate Progress */}
        <div className="bg-[var(--color-bg-secondary)] p-6 rounded-2xl border border-[var(--color-border)] space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-bold text-white">Win Rate</span>
            <span className="text-lg font-bold text-[var(--color-accent)]">{user.stats?.winRate || 0}%</span>
          </div>
          <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${user.stats?.winRate || 0}%` }}
              className="h-full bg-gradient-to-r from-[var(--color-accent)] to-purple-500"
            />
          </div>
          <p className="text-[10px] text-zinc-500 text-center uppercase font-bold tracking-widest">
            Top 5% of all players this season
          </p>
        </div>
      </div>
    </motion.div>
  );
}

function StatCard({ label, value, icon, color = "text-[var(--color-accent)]" }: { label: string, value: string | number, icon: React.ReactNode, color?: string }) {
  return (
    <div className="bg-[var(--color-bg-secondary)] p-4 rounded-2xl border border-[var(--color-border)] space-y-2">
      <div className={`p-2 rounded-lg bg-white/5 w-fit ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-white font-mono">{value}</p>
        <p className="text-[10px] text-[var(--color-text-secondary)] uppercase font-bold tracking-widest">{label}</p>
      </div>
    </div>
  );
}

interface ProfileFieldProps {
  label: string;
  name: string;
  value: string;
  icon: React.ReactNode;
  isEditing: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
}

function ProfileField({ label, name, value, icon, isEditing, onChange, placeholder }: ProfileFieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-widest flex items-center gap-1.5">
        {icon} {label}
      </label>
      {isEditing ? (
        <input
          type="text"
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-xl p-3 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-accent)] focus:outline-none transition-colors"
        />
      ) : (
        <div className="bg-[var(--color-bg-primary)] border border-transparent rounded-xl p-3 text-sm text-[var(--color-text-primary)] font-medium">
          {value || <span className="text-[var(--color-text-secondary)] italic">Not set</span>}
        </div>
      )}
    </div>
  );
}
