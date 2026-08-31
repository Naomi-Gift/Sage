type SolarIconProps = {
  icon: string;
  className?: string;
  width?: number;
  height?: number;
};

export function SolarIcon({ icon, className, width = 20, height = 20 }: SolarIconProps) {
  return (
    <iconify-icon
      icon={icon}
      className={className}
      width={width}
      height={height}
      style={{
        strokeWidth: 1.5,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    />
  );
}
