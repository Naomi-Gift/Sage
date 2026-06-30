import type { ButtonHTMLAttributes, ReactNode } from 'react';

type PrimaryButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: 'primary' | 'outline' | 'soft' | 'pink';
  fullWidth?: boolean;
};

export function PrimaryButton({
  children,
  variant = 'primary',
  fullWidth = false,
  className = '',
  ...props
}: PrimaryButtonProps) {
  const variantClass = variant === 'primary' ? 'button-primary' : `button-${variant}`;
  const widthClass   = fullWidth ? 'button-full' : '';

  return (
    <button
      className={`button ${variantClass} ${widthClass} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
}
