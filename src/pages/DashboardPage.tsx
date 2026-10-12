import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  Search,
  Wrench,
  CheckCircle,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  TrendingUp,
  Plus,
  ExternalLink,
} from 'lucide-react';
import StatCard from '../components/ui/StatCard';
import StatusBadge from '../components/ui/StatusBadge';
import { listItems } from '../lib/itemsApi';
import { Item, Status, STATUS_META } from '../types';
import {
  dashboardStats as mockDashboardStats,
  recentItems as mockRecentItems,
  recentActivity,
  statusDistribution as mockStatusDistribution,
  formatDate,
  formatDateTime,
  formatPeso,
} from '../data/mockData';

const statIcons = [Package, Search, Wrench, CheckCircle];
const statColors: Array<{ iconColor: string; iconBg: string }> = [
  { iconColor: 'text-blue-600', iconBg: 'bg-blue-50' },
  { iconColor: 'text-amber-600', iconBg: 'bg-amber-50' },
  { iconColor: 'text-orange-600', iconBg: 'bg-orange-50' },
  { iconColor: 'text-emerald-600', iconBg: 'bg-emerald-50' },
];

const activityIcons: Record<string, { icon: typeof ArrowUpRight; color: string; bg: string }> = {
  received: { icon: ArrowDownRight, color: 'text-blue-600', bg: 'bg-blue-50' },
  inspection: { icon: Search, color: 'text-amber-600', bg: 'bg-amber-50' },
  repair: { icon: Wrench, color: 'text-orange-600', bg: 'bg-orange-50' },
  qc: { icon: CheckCircle, color: 'text-purple-600', bg: 'bg-purple-50' },
  ready: { icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  sold: { icon: ArrowUpRight, color: 'text-green-600', bg: 'bg-green-50' },
};

export default function Dashboard() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    listItems()
      .then((data) => {
        if (mounted) setItems(data);
      })
      .catch((err) => {
        console.warn('Dashboard items fetch error:', err);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const hasRealItems = items.length > 0;

  // Real stats calculation
  const computedStats = useMemo(() => {
    if (!hasRealItems) return mockDashboardStats;

    const totalCount = items.length;
    const awaitingInspection = items.filter(
      (i) => i.status === 'unknown' || i.status === 'inspection'
    ).length;
    const inRefurbishment = items.filter(
      (i) => i.status === 'needs_refurbishment' || i.status === 'in_repair'
    ).length;
    const readyToSell = items.filter((i) => i.status === 'ready_to_sell');
    const readyToSellValue = readyToSell.reduce(
      (sum, i) => sum + (Number(i.resale_value) || 0),
      0
    );

    return [
      {
        label: 'Total Items',
        value: totalCount,
        change: `${totalCount} registered in inventory`,
        changeType: 'up' as const,
        icon: 'package',
      },
      {
        label: 'Awaiting Inspection',
        value: awaitingInspection,
        change: `${awaitingInspection} pending assessment`,
        changeType: 'neutral' as const,
        icon: 'search',
      },
      {
        label: 'In Refurbishment',
        value: inRefurbishment,
        change: `${inRefurbishment} active repair units`,
        changeType: 'up' as const,
        icon: 'wrench',
      },
      {
        label: 'Ready to Sell',
        value: readyToSell.length,
        change: `${formatPeso(readyToSellValue)} est. value`,
        changeType: 'up' as const,
        icon: 'check-circle',
      },
    ];
  }, [items, hasRealItems]);

  // Real status distribution
  const computedDistribution = useMemo(() => {
    if (!hasRealItems) return mockStatusDistribution;

    const statusColors: Record<Status, string> = {
      unknown: '#6b7280',
      inspection: '#3b82f6',
      needs_refurbishment: '#f59e0b',
      in_repair: '#f97316',
      quality_control: '#a855f7',
      ready_to_sell: '#10b981',
      parts_only: '#ef4444',
      disposed: '#9ca3af',
      sold: '#059669',
    };

    const statuses: Status[] = [
      'unknown',
      'inspection',
      'needs_refurbishment',
      'in_repair',
      'quality_control',
      'ready_to_sell',
      'parts_only',
      'sold',
    ];

    return statuses.map((st) => {
      const count = items.filter((i) => i.status === st).length;
      return {
        status: st,
        label: STATUS_META[st].label,
        count,
        color: statusColors[st],
      };
    });
  }, [items, hasRealItems]);

  const totalTrackedCount = hasRealItems
    ? items.length
    : mockStatusDistribution.reduce((sum, s) => sum + s.count, 0);

  const displayRecentItems = hasRealItems ? items.slice(0, 8) : null;

  return (
    <div className="space-y-6 pb-12">
      {/* Welcome Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Refurbishment Overview</h1>
          <p className="text-sm text-gray-500">
            Welcome back — here's what's happening with your inventory today.
          </p>
        </div>

        <Link
          to="/items/new"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors self-start sm:self-auto"
        >
          <Plus size={15} />
          Receive Item
        </Link>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {computedStats.map((stat, i) => (
          <StatCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            subtitle={stat.change}
            subtitleType={stat.changeType}
            icon={statIcons[i]}
            iconColor={statColors[i].iconColor}
            iconBg={statColors[i].iconBg}
          />
        ))}
      </div>

      {/* Status distribution + Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status distribution */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900">Status Distribution</h2>
            <span className="text-xs text-gray-400">
              {hasRealItems ? 'Live from Supabase' : 'Sample preview'}
            </span>
          </div>

          <div className="space-y-3">
            {computedDistribution.map((item) => {
              const percentage = totalTrackedCount > 0 ? (item.count / totalTrackedCount) * 100 : 0;
              return (
                <div key={item.status} className="group">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-700 font-medium">{item.label}</span>
                    <span className="text-gray-500 font-mono">
                      {item.count} <span className="text-gray-400">({percentage.toFixed(0)}%)</span>
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all duration-500 ease-out"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: item.color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
            <span className="text-gray-500">Total items tracked</span>
            <span className="font-bold text-gray-900">{totalTrackedCount}</span>
          </div>
        </div>

        {/* Recent activity */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {recentActivity.slice(0, 5).map((event) => {
              const activityMeta = activityIcons[event.type] ?? activityIcons.received;
              const Icon = activityMeta.icon;
              return (
                <div key={event.id} className="flex gap-3">
                  <div className={`${activityMeta.bg} ${activityMeta.color} p-1.5 rounded-lg h-fit shrink-0`}>
                    <Icon size={14} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-gray-900 font-medium leading-tight truncate">
                      {event.item}
                    </p>
                    <p className="text-[11px] text-gray-500 mt-0.5 truncate">{event.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-gray-400 font-mono">{event.reference}</span>
                      <span className="text-xs text-gray-300">·</span>
                      <span className="text-[10px] text-gray-400 flex items-center gap-1">
                        <Clock size={10} />
                        {formatDateTime(event.timestamp)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent items table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package size={16} className="text-emerald-600" />
            <h2 className="text-sm font-semibold text-gray-900">Recent Items</h2>
          </div>
          <Link
            to="/items"
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-800 transition-colors"
          >
            View all items &rarr;
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-100 bg-gray-50/50">
                <th className="px-5 py-3">Reference</th>
                <th className="px-5 py-3">Product</th>
                <th className="px-5 py-3 hidden sm:table-cell">Category</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 hidden lg:table-cell">Est. Resale</th>
                <th className="px-5 py-3 hidden md:table-cell">Date Received</th>
                <th className="px-5 py-3 text-right">View</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {displayRecentItems ? (
                displayRecentItems.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-gray-50/60 transition-colors group cursor-pointer"
                  >
                    <td className="px-5 py-3.5">
                      <Link
                        to={`/items/${item.id}`}
                        className="text-emerald-700 font-medium font-mono text-xs hover:underline"
                      >
                        {item.reference}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5">
                      <Link
                        to={`/items/${item.id}`}
                        className="font-medium text-gray-900 hover:text-emerald-700 text-xs sm:text-sm transition-colors"
                      >
                        {item.name}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 text-xs hidden sm:table-cell">
                      {item.category || '—'}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={item.status} size="sm" />
                    </td>
                    <td className="px-5 py-3.5 text-gray-800 font-semibold text-xs hidden lg:table-cell">
                      {formatPeso(item.resale_value)}
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 text-xs hidden md:table-cell">
                      {formatDate(item.received_at || item.created_at)}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        to={`/items/${item.id}`}
                        className="text-gray-400 hover:text-emerald-600 transition-colors"
                        title="View details"
                      >
                        <ExternalLink size={14} className="inline" />
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                mockRecentItems.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <span className="text-emerald-600 font-medium font-mono text-xs">
                        {item.reference}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-medium text-gray-900">{item.product}</span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 hidden sm:table-cell text-xs">
                      {item.category}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={item.status} size="sm" />
                    </td>
                    <td className="px-5 py-3.5 text-gray-700 font-medium hidden lg:table-cell text-xs">
                      {formatPeso(item.resaleValue)}
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 hidden md:table-cell text-xs">
                      {formatDate(item.dateReceived)}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        to="/items"
                        className="text-gray-400 hover:text-emerald-600 transition-colors"
                      >
                        <ExternalLink size={14} className="inline" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
