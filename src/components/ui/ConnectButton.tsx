import { Smartphone, WalletCards } from 'lucide-react';

type ConnectButtonProps = {
  label: string;
  description: string;
  type: 'goodwallet' | 'minipay';
  onClick: () => void;
};

export function ConnectButton({ label, description, type, onClick }: ConnectButtonProps) {
  const Icon = type === 'goodwallet' ? WalletCards : Smartphone;

  return (
    <button className="connect-card" onClick={onClick}>
      <span className="connect-icon">
        <Icon size={20} />
      </span>
      <span>
        <strong>{label}</strong>
        <small>{description}</small>
      </span>
    </button>
  );
}
