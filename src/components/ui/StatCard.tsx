import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  subtitleType?: 'up' | 'down' | 'neutral';
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
}

export default function StatCard({
  label,
  value,
  subtitle,
  subtitleType = 'neutral',
  icon: Icon,
  iconColor = 'text-emerald-600',
  iconBg = 'bg-emerald-50',
}: StatCardProps) {
  const subtitleColors = {
    up: 'text-emerald-600',
    down: 'text-red-500',
    neutral: 'text-gray-500',
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-500 truncate">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && (
            <p className={`text-xs mt-1.5 ${subtitleColors[subtitleType]}`}>
              {subtitle}
            </p>
          )}
        </div>
        <div className={`${iconBg} ${iconColor} p-2.5 rounded-lg shrink-0 ml-3`}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}
