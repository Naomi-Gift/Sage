type ShellProps = {
  children: React.ReactNode;
};

export function Shell({ children }: ShellProps) {
  return <div className="app-shell landing-mode">{children}</div>;
}
