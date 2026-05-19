import React, { useEffect, useState } from 'react';
import { User, Transaction, UserPaymentRequest, WithdrawalRequest } from '../types';
import { getUserById, updateUserWalletBalance, addTransaction, getTransactionsByUserId, getQrCodeUrl, createPaymentRequest, createWithdrawalRequest, getWithdrawalRequestsByUserId } from '../services/firebaseService';
import Button from '../components/Button';
import { motion } from 'motion/react';
import { TransactionType, TransactionStatus, PaymentRequestStatus } from '../constants';
import { useFirebaseData } from '../hooks/useFirebaseData';
import { formatTime12h } from '../lib/dateUtils';
import { Copy, Check } from 'lucide-react';

interface WalletPageProps {
  currentUserId: string | null;
}

export default function WalletPage({ currentUserId }: WalletPageProps) {
  const [currentUser, setCurrentUser] = useState<User | undefined>(undefined);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  
  // New state variables for payment request
  const [amountToRequest, setAmountToRequest] = useState<string>('');
  const [utrNumber, setUtrNumber] = useState<string>('');
  const [paymentLoading, setPaymentLoading] = useState<boolean>(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  // New state variables for withdrawal request
  const [withdrawAmount, setWithdrawAmount] = useState<string>('');
  const [upiId, setUpiId] = useState<string>('');
  const [withdrawalMethod, setWithdrawalMethod] = useState<'upi' | 'redeem_code'>('upi');
  const [withdrawLoading, setWithdrawLoading] = useState<boolean>(false);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);
  const [withdrawSuccess, setWithdrawSuccess] = useState<string | null>(null);
  
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdrawal'>('deposit');

  const dataVersion = useFirebaseData();

  useEffect(() => {
    const fetchData = async () => {
      if (currentUserId) {
        setCurrentUser(getUserById(currentUserId));
        setTransactions(getTransactionsByUserId(currentUserId).sort((a, b) => b.transactionDate.getTime() - a.transactionDate.getTime()));
        setWithdrawals(getWithdrawalRequestsByUserId(currentUserId));
        const url = await getQrCodeUrl();
        setQrCodeUrl(url);
      }
    };
    fetchData();
  }, [currentUserId, dataVersion]);

  const handleSubmitPaymentRequest = async () => {
    setPaymentError(null);
    setPaymentSuccess(null);
    setPaymentLoading(true);
    const amount = parseFloat(amountToRequest);

    if (isNaN(amount) || amount <= 0) {
      setPaymentError('Please enter a valid amount.');
      setPaymentLoading(false);
      return;
    }

    if (!utrNumber.trim()) {
      setPaymentError('Please enter the UTR number.');
      setPaymentLoading(false);
      return;
    }

    if (currentUser) {
      try {
        await createPaymentRequest({
          userId: currentUser.id,
          amount: amount,
          utr: utrNumber,
          qrCodeUrl: qrCodeUrl,
        });
        setPaymentSuccess('Payment request submitted successfully! Awaiting admin approval.');
        setAmountToRequest('');
        setUtrNumber('');
      } catch (err: any) {
        setPaymentError(err.message || 'Failed to submit payment request.');
      } finally {
        setPaymentLoading(false);
      }
    } else {
      setPaymentError('User not found.');
      setPaymentLoading(false);
    }
  };

  const handleCopyCode = (code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleSubmitWithdrawalRequest = async () => {
    setWithdrawError(null);
    setWithdrawSuccess(null);
    setWithdrawLoading(true);
    const amount = parseFloat(withdrawAmount);

    if (isNaN(amount) || amount <= 0) {
      setWithdrawError('Please enter a valid amount.');
      setWithdrawLoading(false);
      return;
    }

    if (withdrawalMethod === 'upi' && !upiId.trim()) {
      setWithdrawError('Please enter your UPI ID.');
      setWithdrawLoading(false);
      return;
    }

    if (currentUser) {
      if (amount > currentUser.walletBalance) {
        setWithdrawError('Insufficient balance.');
        setWithdrawLoading(false);
        return;
      }

      try {
        await createWithdrawalRequest({
          userId: currentUser.id,
          amount: amount,
          method: withdrawalMethod,
          upiId: withdrawalMethod === 'upi' ? upiId : undefined,
        });
        setWithdrawSuccess('Withdrawal request submitted successfully! Awaiting admin approval.');
        setWithdrawAmount('');
        setUpiId('');
      } catch (err: any) {
        setWithdrawError(err.message || 'Failed to submit withdrawal request.');
      } finally {
        setWithdrawLoading(false);
      }
    } else {
      setWithdrawError('User not found.');
      setWithdrawLoading(false);
    }
  };

  if (!currentUser) {
    return <div className="text-center text-[var(--color-text-secondary)] mt-10">Please log in to view your wallet.</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto p-6 max-w-3xl"
    >
      <h1 className="text-4xl font-display font-bold text-[var(--color-text-primary)] mb-8 text-center">My Wallet</h1>

      <div className="bg-[var(--color-bg-secondary)] p-6 rounded-xl border border-[var(--color-border)] shadow-lg mb-8 text-center">
        <p className="text-[var(--color-text-secondary)] text-lg uppercase tracking-wider">Current Balance</p>
        <p className="text-5xl font-bold font-mono text-yellow-400 mt-2">₹{currentUser.walletBalance}</p>
      </div>

      <div className="flex justify-center mb-8 gap-4">
        <button
          onClick={() => setActiveTab('deposit')}
          className={`flex-1 py-3 rounded-xl font-display font-bold text-lg transition-all duration-300 border ${
            activeTab === 'deposit'
              ? 'bg-[var(--color-accent)] text-white border-[var(--color-accent)] shadow-[0_0_15px_rgba(242,125,38,0.3)]'
              : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] border-[var(--color-border)] hover:border-[var(--color-accent)]'
          }`}
        >
          Deposit
        </button>
        <button
          onClick={() => setActiveTab('withdrawal')}
          className={`flex-1 py-3 rounded-xl font-display font-bold text-lg transition-all duration-300 border ${
            activeTab === 'withdrawal'
              ? 'bg-[var(--color-accent)] text-white border-[var(--color-accent)] shadow-[0_0_15px_rgba(242,125,38,0.3)]'
              : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] border-[var(--color-border)] hover:border-[var(--color-accent)]'
          }`}
        >
          Withdrawal
        </button>
      </div>

      {activeTab === 'deposit' && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-[var(--color-bg-secondary)] p-6 rounded-xl border border-[var(--color-border)] shadow-lg mb-8"
        >
          <h2 className="text-2xl font-display text-[var(--color-text-primary)] mb-4">Add Funds via QR Code</h2>
          <div className="flex flex-col items-center mb-6">
            {qrCodeUrl ? (
              <img src={qrCodeUrl} alt="Payment QR Code" className="w-48 h-48 object-contain rounded-lg border border-[var(--color-border)] p-2 bg-white" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-48 h-48 bg-[var(--color-border)] flex items-center justify-center rounded-lg text-[var(--color-text-secondary)]">Loading QR...</div>
            )}
            <p className="text-[var(--color-text-secondary)] text-sm mt-4">Scan this QR code to make your payment.</p>
          </div>
          <div className="space-y-4">
            <div>
              <label htmlFor="amount" className="block text-[var(--color-text-secondary)] text-sm font-semibold mb-2">Amount Paid</label>
              <input
                type="number"
                id="amount"
                placeholder="Enter amount paid"
                value={amountToRequest}
                onChange={(e) => setAmountToRequest(e.target.value)}
                className="w-full p-3 rounded-lg bg-[var(--color-border)] text-[var(--color-text-primary)] border border-transparent focus:border-[var(--color-accent)] focus:outline-none transition-colors duration-200"
              />
            </div>
            <div>
              <label htmlFor="utr" className="block text-[var(--color-text-secondary)] text-sm font-semibold mb-2">UTR Number</label>
              <input
                type="text"
                id="utr"
                placeholder="Enter UTR / Transaction ID"
                value={utrNumber}
                onChange={(e) => setUtrNumber(e.target.value)}
                className="w-full p-3 rounded-lg bg-[var(--color-border)] text-[var(--color-text-primary)] border border-transparent focus:border-[var(--color-accent)] focus:outline-none transition-colors duration-200"
              />
            </div>
            <Button onClick={handleSubmitPaymentRequest} disabled={paymentLoading} className="w-full">
              {paymentLoading ? 'Submitting Request...' : 'Submit Payment Request'}
            </Button>
          </div>
          {paymentError && <p className="text-red-500 mt-4 text-sm text-center">{paymentError}</p>}
          {paymentSuccess && <p className="text-green-500 mt-4 text-sm text-center">{paymentSuccess}</p>}
        </motion.div>
      )}

      {activeTab === 'withdrawal' && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-[var(--color-bg-secondary)] p-6 rounded-xl border border-[var(--color-border)] shadow-lg mb-8"
        >
          <h2 className="text-2xl font-display text-[var(--color-text-primary)] mb-4">Withdraw Funds</h2>
          <p className="text-[var(--color-text-secondary)] text-sm mb-6">Choose your preferred withdrawal method and enter the amount.</p>
          
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setWithdrawalMethod('upi')}
              className={`flex-1 py-2 rounded-lg text-sm font-bold border transition-all ${
                withdrawalMethod === 'upi' 
                  ? 'bg-zinc-700 text-white border-[var(--color-accent)]' 
                  : 'bg-zinc-800 text-zinc-500 border-zinc-700 hover:border-zinc-500'
              }`}
            >
              UPI Payout
            </button>
            <button
              onClick={() => setWithdrawalMethod('redeem_code')}
              className={`flex-1 py-2 rounded-lg text-sm font-bold border transition-all ${
                withdrawalMethod === 'redeem_code' 
                  ? 'bg-zinc-700 text-white border-[var(--color-accent)]' 
                  : 'bg-zinc-800 text-zinc-500 border-zinc-700 hover:border-zinc-500'
              }`}
            >
              Redeem Code
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="withdrawAmount" className="block text-[var(--color-text-secondary)] text-sm font-semibold mb-2">Withdrawal Amount (₹)</label>
              <input
                type="number"
                id="withdrawAmount"
                placeholder="Enter amount to withdraw"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                className="w-full p-3 rounded-lg bg-[var(--color-border)] text-[var(--color-text-primary)] border border-transparent focus:border-[var(--color-accent)] focus:outline-none transition-colors duration-200"
              />
            </div>
            
            {withdrawalMethod === 'upi' ? (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                <label htmlFor="upiId" className="block text-[var(--color-text-secondary)] text-sm font-semibold mb-2">UPI ID</label>
                <input
                  type="text"
                  id="upiId"
                  placeholder="e.g., username@upi"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className="w-full p-3 rounded-lg bg-[var(--color-border)] text-[var(--color-text-primary)] border border-transparent focus:border-[var(--color-accent)] focus:outline-none transition-colors duration-200"
                />
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                <p className="text-xs text-zinc-400">
                  <span className="text-[var(--color-accent)] font-bold">INFO:</span> You will receive a Google Play / Brand redeem code in your notifications once the admin approves your request.
                </p>
              </motion.div>
            )}

            <Button onClick={handleSubmitWithdrawalRequest} disabled={withdrawLoading} variant="secondary" className="w-full">
              {withdrawLoading ? 'Submitting Request...' : 'Submit Withdrawal Request'}
            </Button>
          </div>
          {withdrawError && <p className="text-red-500 mt-4 text-sm text-center">{withdrawError}</p>}
          {withdrawSuccess && <p className="text-green-500 mt-4 text-sm text-center">{withdrawSuccess}</p>}
        </motion.div>
      )}

      <div className="bg-[var(--color-bg-secondary)] p-6 rounded-xl border border-[var(--color-border)] shadow-lg">
        <h2 className="text-2xl font-display text-[var(--color-text-primary)] mb-4">Transaction History</h2>
        {
          transactions.length > 0 ? (
            <div className="space-y-4">
              {transactions.map(transaction => (
                <div key={transaction.id} className="bg-white/5 p-4 rounded-xl border border-white/5 flex flex-col gap-3 group hover:border-[var(--color-accent)] transition-all">
                  <div className="flex justify-between items-center">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">
                        {new Date(transaction.transactionDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - {formatTime12h(transaction.transactionDate)}
                      </span>
                      <span className="text-sm font-bold text-white">{transaction.description}</span>
                      <span className="text-[10px] text-zinc-500 font-mono mt-1">ID: {transaction.id}</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className={`${transaction.type === TransactionType.DEPOSIT || transaction.type === TransactionType.PRIZE_WIN ? 'text-green-400' : 'text-red-400'} text-lg font-bold font-mono`}>
                        {transaction.type === TransactionType.DEPOSIT || transaction.type === TransactionType.PRIZE_WIN ? '+' : '-'}₹{transaction.amount}
                      </span>
                      <span className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${
                        transaction.status === TransactionStatus.COMPLETED ? 'text-green-500' : 
                        transaction.status === TransactionStatus.PENDING ? 'text-yellow-500' : 'text-red-500'
                      }`}>
                        {transaction.status}
                      </span>
                    </div>
                  </div>
                  
                  {/* Redeem Code Display */}
                  {(() => {
                    const wr = withdrawals.find(w => w.id === transaction.relatedEntityId);
                    if (wr?.redeemCode && transaction.status === TransactionStatus.COMPLETED) {
                      return (
                        <div className="flex items-center justify-between bg-black/40 p-2 rounded-lg border border-white/5 mt-1">
                          <div className="flex flex-col">
                            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-tighter">Redeem Code</span>
                            <span className="text-xs font-mono font-bold text-[var(--color-accent)]">{wr.redeemCode}</span>
                          </div>
                          <button 
                            onClick={(e) => handleCopyCode(wr.redeemCode!, e)}
                            className="p-1 px-3 rounded-lg bg-[var(--color-accent)] text-white text-[10px] font-bold hover:opacity-80 transition-all flex items-center gap-1.5 shadow-lg shadow-[var(--color-accent)]/20"
                          >
                            {copiedCode === wr.redeemCode ? (
                              <><Check className="w-3 h-3" /> Copied</>
                            ) : (
                              <><Copy className="w-3 h-3" /> Copy</>
                            )}
                          </button>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[var(--color-text-secondary)] text-center py-10">No transactions yet.</p>
          )
        }
      </div>
    </motion.div>
  );
}
