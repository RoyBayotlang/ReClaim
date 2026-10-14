import { OVERALL_CONDITION_META, OverallCondition } from '../../types';

interface OverallConditionBadgeProps {
  condition: OverallCondition | string | null | undefined;
  size?: 'sm' | 'md' | 'lg';
  showDescription?: boolean;
}

export default function OverallConditionBadge({
  condition,
  size = 'md',
  showDescription = false,
}: OverallConditionBadgeProps) {
  const safeCondition = (condition || 'UNASSESSED') as OverallCondition;
  const meta = OVERALL_CONDITION_META[safeCondition] || OVERALL_CONDITION_META.UNASSESSED;

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-semibold',
  };

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <span
        className={`inline-flex items-center font-medium rounded-full border shadow-2xs ${meta.cls} ${sizeClasses[size]}`}
      >
        <span className="text-xs leading-none">{meta.icon}</span>
        <span>{meta.label}</span>
      </span>
      {showDescription && (
        <span className="text-[11px] text-gray-500 max-w-xs">{meta.description}</span>
      )}
    </div>
  );
}
