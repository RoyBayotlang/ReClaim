import { Status, STATUS_META } from '../../types';

interface StatusBadgeProps {
  status: Status;
  size?: 'sm' | 'md';
}

export default function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const meta = STATUS_META[status];
  const sizeClasses = size === 'md' ? 'px-2.5 py-1 text-xs' : 'px-2 py-0.5 text-xs';

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium whitespace-nowrap ${meta.cls} ${sizeClasses}`}
    >
      {meta.label}
    </span>
  );
}
