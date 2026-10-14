import { COMPONENT_CONDITION_META, ComponentCondition } from '../../types';

interface ComponentConditionBadgeProps {
  condition: ComponentCondition | string | null | undefined;
  size?: 'sm' | 'md';
}

export default function ComponentConditionBadge({
  condition,
  size = 'md',
}: ComponentConditionBadgeProps) {
  const safeCondition = (condition || 'NOT_TESTED') as ComponentCondition;
  const meta = COMPONENT_CONDITION_META[safeCondition] || COMPONENT_CONDITION_META.NOT_TESTED;

  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5 gap-1',
    md: 'text-xs px-2 py-0.5 gap-1.5',
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded border ${meta.badgeCls} ${sizeClasses[size]}`}
    >
      <span className="font-bold">{meta.icon}</span>
      <span>{meta.label}</span>
    </span>
  );
}
