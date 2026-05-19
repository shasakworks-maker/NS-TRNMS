export enum UserRole {
  ADMIN = 'admin',
  PLAYER = 'player',
}

export enum TournamentStatus {
  UPCOMING = 'upcoming',
  ONGOING = 'ongoing',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum TransactionType {
  DEPOSIT = 'deposit',
  WITHDRAWAL = 'withdrawal',
  ENTRY_FEE = 'entry_fee',
  PRIZE_WIN = 'prize_win',
  REDEEM_CODE = 'redeem_code',
}

export enum TransactionStatus {
  COMPLETED = 'completed',
  PENDING = 'pending',
  FAILED = 'failed',
}

export enum PaymentRequestStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
}

export enum TournamentCategory {
  ALL = 'ALL',
  CS_1V1 = 'CS 1V1',
  CS_2V2 = 'CS 2V2',
  CS_3V3 = 'CS 3V3',
  LONE_WOLF_1V1 = 'LONE WOLF 1V1',
  LONE_WOLF_2V2 = 'LONE WOLF 2V2',
  BATTLE_ROYALE = 'BATTLE ROYALE',
}
