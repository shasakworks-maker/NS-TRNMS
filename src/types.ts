export interface User {
  id: string;
  displayId: string;
  email: string;
  password?: string; // Optional because we might not always want to fetch it or for older users
  username?: string;
  fullName?: string;
  phoneNumber?: string;
  profileImage?: string;
  role: 'player' | 'admin';
  walletBalance: number;
  ign: string;
  uid: string;
  stats?: UserStats;
  referralCode?: string;
  referredBy?: string;
  referralsCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Referral {
  id: string;
  referrerId: string;
  referredUserId: string;
  amountEarned: number;
  timestamp: Date;
}

export interface UserStats {
  totalMatches: number;
  totalWins: number;
  totalKills: number;
  kdRatio: number;
  winRate: number;
}

export interface Tournament {
  id: string;
  name: string;
  date: Date;
  time: string;
  prizePool: number;
  entryFee: number;
  map: string;
  version: string;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  maxSlots: number;
  registeredCount: number;
  winnerId?: string;
  category?: string;
  matchResults?: MatchResult[];
  adminId: string;
  roomId?: string;
  roomPassword?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MatchResult {
  userId: string;
  kills: number;
  rank: number;
}

export interface Registration {
  id: string;
  tournamentId: string;
  userId: string;
  ign: string;
  uid: string;
  registrationDate: Date;
  status: 'pending' | 'confirmed' | 'cancelled';
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'deposit' | 'withdrawal' | 'entry_fee' | 'prize_win' | 'redeem_code';
  amount: number;
  relatedEntityId?: string;
  description: string;
  transactionDate: Date;
  status: 'completed' | 'pending' | 'failed';
}

export interface RedeemCode {
  id: string;
  code: string;
  amount: number;
  isUsed: boolean;
  usedBy?: string;
  usedAt?: Date;
  createdAt: Date;
}

export interface UserPaymentRequest {
  id: string;
  userId: string;
  amount: number;
  utr: string;
  qrCodeUrl: string; // URL of the QR code image
  status: 'pending' | 'accepted' | 'declined';
  requestDate: Date;
  processedByAdminId?: string;
  processedDate?: Date;
}

export interface WithdrawalRequest {
  id: string;
  userId: string;
  amount: number;
  method: 'upi' | 'redeem_code';
  upiId?: string;
  redeemCode?: string;
  status: 'pending' | 'accepted' | 'declined';
  requestDate: Date;
  processedByAdminId?: string;
  processedDate?: Date;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  createdAt: Date;
}
