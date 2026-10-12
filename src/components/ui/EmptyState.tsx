import { LucideIcon, Inbox } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick?: () => void;
    disabled?: boolean;
  };
}

export default function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl py-16 px-6 text-center">
      <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <Icon size={24} className="text-gray-400" />
      </div>
      <h3 className="text-base font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 max-w-sm mx-auto">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          disabled={action.disabled}
          className="mt-5 inline-flex items-center px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg
                     hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
