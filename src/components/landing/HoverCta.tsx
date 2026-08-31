import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { SolarIcon } from './SolarIcon';

type HoverCtaProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  size?: 'nav' | 'hero' | 'icon';
  showArrow?: boolean;
};

export function HoverCta({
  children,
  size = 'hero',
  showArrow = true,
  className = '',
  ...props
}: HoverCtaProps) {
  const arrow = showArrow ? (
    <SolarIcon
      icon="solar:arrow-right-linear"
      width={size === 'hero' ? 20 : 16}
      height={size === 'hero' ? 20 : 16}
    />
  ) : null;

  return (
    <button type="button" className={`ln-hover-cta ln-hover-cta-${size} ${className}`.trim()} {...props}>
      <span className="ln-hover-cta-label">
        {children}
        {arrow}
      </span>
      <span className="ln-hover-cta-clone" aria-hidden="true">
        {children}
        {arrow}
      </span>
      <span className="ln-hover-cta-line" aria-hidden="true" />
      <span className="ln-hover-cta-wash" aria-hidden="true" />
    </button>
  );
}
