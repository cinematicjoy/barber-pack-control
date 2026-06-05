interface StatusBadgeProps {
  label: string;
  tone?: 'success' | 'warning' | 'danger' | 'neutral';
}

export function StatusBadge({ label, tone = 'neutral' }: StatusBadgeProps) {
  return <span className={`badge badge--${tone}`}>{label}</span>;
}