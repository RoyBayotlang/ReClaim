import { Status } from '../types';

// ─── Types for mock data ─────────────────────────────────────────────

export interface DashboardStat {
  label: string;
  value: number;
  change?: string;
  changeType?: 'up' | 'down' | 'neutral';
  icon: string;
}

export interface RecentItem {
  id: string;
  reference: string;
  product: string;
  category: string;
  condition: string;
  status: Status;
  dateReceived: string;
  purchaseCost: number;
  resaleValue: number;
}

export interface ActivityEvent {
  id: string;
  type: 'received' | 'inspection' | 'repair' | 'qc' | 'ready' | 'sold';
  description: string;
  item: string;
  reference: string;
  timestamp: string;
}

export interface StatusDistribution {
  status: Status;
  label: string;
  count: number;
  color: string;
}

// ─── Dashboard summary cards ─────────────────────────────────────────

export const dashboardStats: DashboardStat[] = [
  { label: 'Total Items', value: 128, change: '+12 this month', changeType: 'up', icon: 'package' },
  { label: 'Awaiting Inspection', value: 18, change: '3 urgent', changeType: 'neutral', icon: 'search' },
  { label: 'In Refurbishment', value: 24, change: '+5 this week', changeType: 'up', icon: 'wrench' },
  { label: 'Ready to Sell', value: 36, change: '₱142,800 est. value', changeType: 'up', icon: 'check-circle' },
];

// ─── Recent items table ──────────────────────────────────────────────

export const recentItems: RecentItem[] = [
  {
    id: '1',
    reference: 'REF-1001',
    product: 'Lenovo ThinkPad T480',
    category: 'Laptop',
    condition: 'Good',
    status: 'ready_to_sell',
    dateReceived: '2026-10-01',
    purchaseCost: 8500,
    resaleValue: 18000,
  },
  {
    id: '2',
    reference: 'REF-1002',
    product: 'Dell Latitude 5490',
    category: 'Laptop',
    condition: 'Fair',
    status: 'in_repair',
    dateReceived: '2026-10-03',
    purchaseCost: 6200,
    resaleValue: 14500,
  },
  {
    id: '3',
    reference: 'REF-1003',
    product: 'iPhone 11',
    category: 'Smartphone',
    condition: 'Good',
    status: 'quality_control',
    dateReceived: '2026-10-05',
    purchaseCost: 5800,
    resaleValue: 12000,
  },
  {
    id: '4',
    reference: 'REF-1004',
    product: 'Samsung Galaxy A52',
    category: 'Smartphone',
    condition: 'Fair',
    status: 'inspection',
    dateReceived: '2026-10-07',
    purchaseCost: 3200,
    resaleValue: 7500,
  },
  {
    id: '5',
    reference: 'REF-1005',
    product: 'Acer Aspire 5',
    category: 'Laptop',
    condition: 'Poor',
    status: 'needs_refurbishment',
    dateReceived: '2026-10-08',
    purchaseCost: 4500,
    resaleValue: 11000,
  },
  {
    id: '6',
    reference: 'REF-1006',
    product: 'iPad Air (4th Gen)',
    category: 'Tablet',
    condition: 'Good',
    status: 'ready_to_sell',
    dateReceived: '2026-10-09',
    purchaseCost: 9200,
    resaleValue: 19500,
  },
  {
    id: '7',
    reference: 'REF-1007',
    product: 'HP EliteBook 840 G5',
    category: 'Laptop',
    condition: 'Fair',
    status: 'in_repair',
    dateReceived: '2026-10-10',
    purchaseCost: 7100,
    resaleValue: 15800,
  },
  {
    id: '8',
    reference: 'REF-1008',
    product: 'Google Pixel 6',
    category: 'Smartphone',
    condition: 'Good',
    status: 'unknown',
    dateReceived: '2026-10-11',
    purchaseCost: 4800,
    resaleValue: 10500,
  },
];

// ─── Recent activity feed ────────────────────────────────────────────

export const recentActivity: ActivityEvent[] = [
  {
    id: 'a1',
    type: 'received',
    description: 'Item received and logged into inventory',
    item: 'Google Pixel 6',
    reference: 'REF-1008',
    timestamp: '2026-10-11T14:30:00',
  },
  {
    id: 'a2',
    type: 'ready',
    description: 'Passed quality control — ready for resale',
    item: 'iPad Air (4th Gen)',
    reference: 'REF-1006',
    timestamp: '2026-10-11T11:15:00',
  },
  {
    id: 'a3',
    type: 'repair',
    description: 'Battery replacement started',
    item: 'HP EliteBook 840 G5',
    reference: 'REF-1007',
    timestamp: '2026-10-10T16:45:00',
  },
  {
    id: 'a4',
    type: 'inspection',
    description: 'Inspection completed — needs refurbishment',
    item: 'Acer Aspire 5',
    reference: 'REF-1005',
    timestamp: '2026-10-09T09:20:00',
  },
  {
    id: 'a5',
    type: 'qc',
    description: 'Quality control check in progress',
    item: 'iPhone 11',
    reference: 'REF-1003',
    timestamp: '2026-10-08T13:00:00',
  },
  {
    id: 'a6',
    type: 'sold',
    description: 'Item sold via marketplace listing',
    item: 'Lenovo ThinkPad T480',
    reference: 'REF-1001',
    timestamp: '2026-10-07T10:30:00',
  },
];

// ─── Status distribution ─────────────────────────────────────────────

export const statusDistribution: StatusDistribution[] = [
  { status: 'unknown', label: 'Received', count: 14, color: '#6b7280' },
  { status: 'inspection', label: 'Inspection', count: 18, color: '#3b82f6' },
  { status: 'needs_refurbishment', label: 'Needs Refurbishment', count: 10, color: '#f59e0b' },
  { status: 'in_repair', label: 'In Repair', count: 24, color: '#f97316' },
  { status: 'quality_control', label: 'Quality Control', count: 12, color: '#a855f7' },
  { status: 'ready_to_sell', label: 'Ready to Sell', count: 36, color: '#10b981' },
  { status: 'parts_only', label: 'Parts Only', count: 6, color: '#ef4444' },
  { status: 'sold', label: 'Sold', count: 8, color: '#059669' },
];

// ─── Helper: format date for display ─────────────────────────────────

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-PH', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function formatPeso(amount: number): string {
  return '₱' + amount.toLocaleString('en-PH', { maximumFractionDigits: 0 });
}
