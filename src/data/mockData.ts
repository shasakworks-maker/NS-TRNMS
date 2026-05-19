import { User, Tournament, Registration, Transaction, AppNotification } from '../types';
import { UserRole, TournamentStatus, TransactionType, TransactionStatus } from '../constants';

const now = new Date();
const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

export const mockUsers: User[] = [
  {
    id: 'user123',
    displayId: 'NS-1001',
    email: 'player1@example.com',
    password: 'player123',
    username: 'PlayerOne',
    role: UserRole.PLAYER,
    walletBalance: 500,
    ign: 'ProGamer1',
    uid: 'FF123456789',
    stats: {
      totalMatches: 150,
      totalWins: 25,
      totalKills: 450,
      kdRatio: 3.0,
      winRate: 16.7
    },
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'user456',
    displayId: 'NS-1002',
    email: 'player2@example.com',
    password: 'player123',
    username: 'PlayerTwo',
    role: UserRole.PLAYER,
    walletBalance: 150,
    ign: 'NoobSlayer2',
    uid: 'FF987654321',
    stats: {
      totalMatches: 80,
      totalWins: 18,
      totalKills: 380,
      kdRatio: 4.75,
      winRate: 22.5
    },
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'admin789',
    displayId: 'NS-ADMIN',
    email: 'admin@example.com',
    password: 'admin123',
    username: 'AdminUser',
    role: UserRole.ADMIN,
    walletBalance: 0,
    ign: 'AdminFF',
    uid: 'FFADMIN001',
    createdAt: now,
    updatedAt: now,
  },
];

export const mockTournaments: Tournament[] = [
  {
    id: 'tourney001',
    name: 'Daily Scrims #1',
    date: tomorrow,
    time: '7:00 PM IST',
    prizePool: 1000,
    entryFee: 50,
    map: 'Bermuda',
    version: 'OB30',
    status: TournamentStatus.UPCOMING,
    category: 'BATTLE ROYALE',
    maxSlots: 48,
    registeredCount: 12,
    adminId: 'admin789',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'tourney002',
    name: 'Weekly Championship',
    date: new Date(tomorrow.getTime() + 7 * 24 * 60 * 60 * 1000),
    time: '8:00 PM IST',
    prizePool: 5000,
    entryFee: 100,
    map: 'Purgatory',
    version: 'OB30',
    status: TournamentStatus.UPCOMING,
    category: 'CS 1V1',
    maxSlots: 100,
    registeredCount: 45,
    adminId: 'admin789',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'tourney004',
    name: 'Elite Pro Scrims',
    date: now,
    time: 'Now Live',
    prizePool: 3000,
    entryFee: 150,
    map: 'Bermuda',
    version: 'OB30',
    status: TournamentStatus.ONGOING,
    category: 'CS 2V2',
    maxSlots: 48,
    registeredCount: 48,
    adminId: 'admin789',
    createdAt: yesterday,
    updatedAt: now,
  },
  {
    id: 'tourney003',
    name: 'Completed Battle',
    date: yesterday,
    time: '6:00 PM IST',
    prizePool: 2000,
    entryFee: 75,
    map: 'Kalahari',
    version: 'OB29',
    status: TournamentStatus.COMPLETED,
    category: 'LONE WOLF 1V1',
    maxSlots: 48,
    registeredCount: 48,
    winnerId: 'user123',
    matchResults: [
      { userId: 'user123', kills: 15, rank: 1 },
      { userId: 'user456', kills: 8, rank: 3 },
    ],
    adminId: 'admin789',
    createdAt: yesterday,
    updatedAt: yesterday,
  },
];

export const mockRegistrations: Registration[] = [
  {
    id: 'reg001',
    tournamentId: 'tourney001',
    userId: 'user123',
    ign: 'ProGamer1',
    uid: 'FF123456789',
    registrationDate: now,
    status: 'confirmed',
  },
  {
    id: 'reg002',
    tournamentId: 'tourney001',
    userId: 'user456',
    ign: 'NoobSlayer2',
    uid: 'FF987654321',
    registrationDate: now,
    status: 'confirmed',
  },
];

export const mockTransactions: Transaction[] = [
  {
    id: 'trans001',
    userId: 'user123',
    type: TransactionType.DEPOSIT,
    amount: 200,
    description: 'Initial deposit',
    transactionDate: yesterday,
    status: TransactionStatus.COMPLETED,
  },
  {
    id: 'trans002',
    userId: 'user123',
    type: TransactionType.ENTRY_FEE,
    amount: 50,
    relatedEntityId: 'tourney003',
    description: 'Entry fee for Completed Battle',
    transactionDate: yesterday,
    status: TransactionStatus.COMPLETED,
  },
  {
    id: 'trans003',
    userId: 'user456',
    type: TransactionType.DEPOSIT,
    amount: 100,
    description: 'Initial deposit',
    transactionDate: yesterday,
    status: TransactionStatus.COMPLETED,
  },
];

import { PaymentRequestStatus } from '../constants';
import { UserPaymentRequest, WithdrawalRequest } from '../types';

export const mockQrCodeUrl = 'https://brave-purple-opelx9oumv.edgeone.app/IMG_20260220_192613.jpg'; // User provided QR code image URL (direct link)

export const mockPaymentRequests: UserPaymentRequest[] = [
  {
    id: 'payreq001',
    userId: 'user123',
    amount: 100,
    utr: 'UTR1234567890',
    qrCodeUrl: mockQrCodeUrl,
    status: PaymentRequestStatus.PENDING,
    requestDate: now,
  },
  {
    id: 'payreq002',
    userId: 'user456',
    amount: 200,
    utr: 'UTR0987654321',
    qrCodeUrl: mockQrCodeUrl,
    status: PaymentRequestStatus.PENDING,
    requestDate: now,
  },
];

export const mockWithdrawalRequests: WithdrawalRequest[] = [
  {
    id: 'withdraw001',
    userId: 'user123',
    amount: 50,
    method: 'upi',
    upiId: 'user123@upi',
    status: PaymentRequestStatus.PENDING,
    requestDate: now,
  },
];

export const mockLeaderboard = [
  { id: '1', username: 'ProGamer1', kills: 450, wins: 25, avatar: 'https://picsum.photos/seed/p1/100' },
  { id: '2', username: 'NoobSlayer2', kills: 380, wins: 18, avatar: 'https://picsum.photos/seed/p2/100' },
  { id: '3', username: 'HeadshotKing', kills: 350, wins: 15, avatar: 'https://picsum.photos/seed/p3/100' },
  { id: '4', username: 'ShadowNinja', kills: 310, wins: 12, avatar: 'https://picsum.photos/seed/p4/100' },
  { id: '5', username: 'FireStorm', kills: 290, wins: 10, avatar: 'https://picsum.photos/seed/p5/100' },
  { id: '6', username: 'GhostRider', kills: 270, wins: 8, avatar: 'https://picsum.photos/seed/p6/100' },
  { id: '7', username: 'DragonSlayer', kills: 250, wins: 7, avatar: 'https://picsum.photos/seed/p7/100' },
  { id: '8', username: 'ThunderBolt', kills: 230, wins: 6, avatar: 'https://picsum.photos/seed/p8/100' },
];

export const mockNotifications: AppNotification[] = [
  {
    id: 'notif001',
    userId: 'user123',
    title: 'Registration Confirmed',
    message: 'You have successfully registered for Daily Scrims #1.',
    type: 'success',
    isRead: false,
    createdAt: now,
  },
  {
    id: 'notif002',
    userId: 'user123',
    title: 'Payment Approved',
    message: 'Your deposit of ₹200 has been approved.',
    type: 'success',
    isRead: true,
    createdAt: yesterday,
  },
  {
    id: 'notif003',
    userId: 'user123',
    title: 'New Tournament',
    message: 'A new Mega Tournament has been announced! Check it out.',
    type: 'info',
    isRead: false,
    createdAt: now,
  },
];

export const mockNews = "🔥 New Mega Tournament starting this Sunday! Prize Pool ₹10,000! Register now to secure your slot. 🔥";
