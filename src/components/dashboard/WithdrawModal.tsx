import { useState } from 'react';
import { X } from 'lucide-react';
import { motion } from 'framer-motion';
import { PrimaryButton } from '../ui/PrimaryButton';

type WithdrawModalProps = {
  open: boolean;
  maxAmount: number;
  onClose: () => void;
  onWithdraw: (amount: number) => void;
};

export function WithdrawModal({ open, maxAmount, onClose, onWithdraw }: WithdrawModalProps) {
  const [value, setValue] = useState('');

  if (!open) return null;

  const amount  = Number(value);
  const valid   = amount > 0 && amount <= maxAmount;
  const display = Math.floor(maxAmount).toLocaleString();

  function handleWithdraw() {
    if (!valid) return;
    onWithdraw(amount);
    onClose();
    setValue('');
  }

  function setMax() {
    setValue(String(Math.floor(maxAmount)));
  }

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <motion.div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="withdraw-title"
        onClick={(e) => e.stopPropagation()}
        initial={{ y: 40, opacity: 0, scale: 0.98 }}
        animate={{ y: 0,  opacity: 1, scale: 1 }}
        exit={{   y: 20, opacity: 0, scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 280, damping: 22 }}
      >
        <button className="modal-close" onClick={onClose} aria-label="Close">
          <X size={16} />
        </button>

        <h2 id="withdraw-title">Withdraw G$</h2>
        <p>Your savings convert back automatically. You only ever receive G$.</p>

        <div className="modal-input-wrap">
          <input
            className="modal-input"
            inputMode="decimal"
            placeholder="0"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            aria-label="Withdrawal amount in G$"
          />
          <button className="modal-max-btn" onClick={setMax} type="button">
            Max
          </button>
        </div>

        <p className="modal-balance">
          Available: <strong>G$ {display}</strong>
        </p>

        <PrimaryButton fullWidth disabled={!valid} onClick={handleWithdraw}>
          Withdraw G$ {valid ? amount.toLocaleString() : ''}
        </PrimaryButton>
      </motion.div>
    </div>
  );
}
