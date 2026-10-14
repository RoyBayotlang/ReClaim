export type Status =
  | 'unknown'
  | 'inspection'
  | 'needs_refurbishment'
  | 'in_repair'
  | 'quality_control'
  | 'ready_to_sell'
  | 'parts_only'
  | 'disposed'
  | 'sold';

export interface Item {
  id: string;
  owner_id?: string;
  reference: string;
  name: string;
  category: string | null;
  brand: string | null;
  model: string | null;
  serial_number: string | null;
  description: string | null;
  purchase_cost: number;
  resale_value: number;
  repair_estimate: number;
  status: Status;
  image_url: string | null;
  notes: string | null;
  received_at: string;
  created_at: string;
  updated_at?: string;
}

export interface HistoryEntry {
  id: string;
  owner_id?: string;
  item_id?: string;
  from_status: Status | null;
  to_status: Status;
  note: string | null;
  created_at: string;
}

export const CATEGORIES = [
  'Laptop',
  'Smartphone',
  'Tablet',
  'Desktop PC',
  'Monitor',
  'Audio & Headphones',
  'Networking',
  'Peripherals',
  'Other',
] as const;

export const STATUS_META: Record<Status, { label: string; cls: string; icon: string }> = {
  unknown: { label: 'Unknown Condition', cls: 'bg-gray-100 text-gray-700', icon: '📦' },
  inspection: { label: 'Inspection', cls: 'bg-blue-100 text-blue-700', icon: '🔍' },
  needs_refurbishment: { label: 'Needs Refurbishment', cls: 'bg-amber-100 text-amber-800', icon: '⚠️' },
  in_repair: { label: 'In Repair', cls: 'bg-orange-100 text-orange-700', icon: '🔧' },
  quality_control: { label: 'Quality Control', cls: 'bg-purple-100 text-purple-700', icon: '🧪' },
  ready_to_sell: { label: 'Ready to Sell', cls: 'bg-green-100 text-green-700', icon: '🏷️' },
  parts_only: { label: 'Parts Only', cls: 'bg-red-100 text-red-800', icon: '🧩' },
  disposed: { label: 'Disposed', cls: 'bg-gray-200 text-gray-600', icon: '🗑️' },
  sold: { label: 'Sold', cls: 'bg-green-200 text-green-800', icon: '💰' },
};

// Allowed next steps in the main workflow
export const NEXT: Record<Status, Status[]> = {
  unknown: ['inspection'],
  inspection: ['needs_refurbishment', 'ready_to_sell', 'parts_only', 'disposed'],
  needs_refurbishment: ['in_repair', 'parts_only', 'disposed'],
  in_repair: ['quality_control'],
  quality_control: ['ready_to_sell', 'in_repair'],
  ready_to_sell: ['sold'],
  parts_only: ['disposed'],
  disposed: [],
  sold: [],
};

// =============================================================
// Phase 5: Inspections & Financial Assessment Types
// =============================================================

export type OverallCondition =
  | 'GOOD'
  | 'FAIR'
  | 'POOR'
  | 'NON_FUNCTIONAL'
  | 'UNASSESSED';

export type ComponentCondition =
  | 'GOOD'
  | 'MINOR_ISSUE'
  | 'DAMAGED'
  | 'NOT_TESTED'
  | 'NOT_APPLICABLE';

export type ComponentType = 'physical' | 'functional' | 'custom' | string;

export interface InspectionResult {
  id?: string;
  inspection_id?: string;
  component_name: string;
  component_type: ComponentType;
  condition: ComponentCondition;
  notes: string | null;
  created_at?: string;
}

export interface Inspection {
  id: string;
  item_id: string;
  user_id: string;
  inspected_by: string | null;
  inspection_date: string;
  overall_condition: OverallCondition;
  general_notes: string | null;
  created_at: string;
  updated_at?: string;
  results?: InspectionResult[];
  item?: Item;
}

export const OVERALL_CONDITION_META: Record<
  OverallCondition,
  { label: string; cls: string; icon: string; description: string }
> = {
  GOOD: {
    label: 'Good',
    cls: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    icon: '🟢',
    description: 'Minor or cosmetic wear only. Hardware intact and fully operational.',
  },
  FAIR: {
    label: 'Fair',
    cls: 'bg-amber-100 text-amber-800 border-amber-300',
    icon: '🟡',
    description: 'Moderate wear, minor defects or aging components present.',
  },
  POOR: {
    label: 'Poor',
    cls: 'bg-orange-100 text-orange-800 border-orange-300',
    icon: '🟠',
    description: 'Heavy wear, structural damage or multiple degraded components.',
  },
  NON_FUNCTIONAL: {
    label: 'Non-Functional',
    cls: 'bg-red-100 text-red-800 border-red-300',
    icon: '🔴',
    description: 'Fails to boot, power on, or has catastrophic core hardware failures.',
  },
  UNASSESSED: {
    label: 'Unassessed',
    cls: 'bg-gray-100 text-gray-700 border-gray-300',
    icon: '⚪',
    description: 'Intake pending diagnostic assessment or incomplete checklist.',
  },
};

export const COMPONENT_CONDITION_META: Record<
  ComponentCondition,
  { label: string; badgeCls: string; activeCls: string; textCls: string; icon: string }
> = {
  GOOD: {
    label: 'Good',
    badgeCls: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    activeCls: 'bg-emerald-600 text-white border-emerald-600 shadow-sm',
    textCls: 'text-emerald-700',
    icon: '✓',
  },
  MINOR_ISSUE: {
    label: 'Minor Issue',
    badgeCls: 'bg-amber-50 text-amber-700 border-amber-200',
    activeCls: 'bg-amber-500 text-white border-amber-500 shadow-sm',
    textCls: 'text-amber-700',
    icon: '⚠',
  },
  DAMAGED: {
    label: 'Damaged',
    badgeCls: 'bg-red-50 text-red-700 border-red-200',
    activeCls: 'bg-red-600 text-white border-red-600 shadow-sm',
    textCls: 'text-red-700',
    icon: '✗',
  },
  NOT_TESTED: {
    label: 'Not Tested',
    badgeCls: 'bg-gray-100 text-gray-600 border-gray-200',
    activeCls: 'bg-gray-700 text-white border-gray-700 shadow-sm',
    textCls: 'text-gray-500',
    icon: '—',
  },
  NOT_APPLICABLE: {
    label: 'Not Applicable',
    badgeCls: 'bg-slate-100 text-slate-500 border-slate-200',
    activeCls: 'bg-slate-500 text-white border-slate-500 shadow-sm',
    textCls: 'text-slate-400',
    icon: '⊘',
  },
};


