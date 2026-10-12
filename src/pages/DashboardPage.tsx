import {
  Package,
  Search,
  Wrench,
  CheckCircle,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  TrendingUp,
} from 'lucide-react';
import StatCard from '../components/ui/StatCard';
import StatusBadge from '../components/ui/StatusBadge';
import {
  dashboardStats,
  recentItems,
  recentActivity,
  statusDistribution,
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
  const totalCount = statusDistribution.reduce((sum, s) => sum + s.count, 0);

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <p className="text-sm text-gray-500">
          Welcome back — here's what's happening with your inventory today.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {dashboardStats.map((stat, i) => (
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
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Status Distribution</h2>
          <div className="space-y-3">
            {statusDistribution.map((item) => {
              const percentage = totalCount > 0 ? (item.count / totalCount) * 100 : 0;
              return (
                <div key={item.status} className="group">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-700 font-medium">{item.label}</span>
                    <span className="text-gray-500">
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
          <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-sm">
            <span className="text-gray-500">Total items tracked</span>
            <span className="font-semibold text-gray-900">{totalCount}</span>
          </div>
        </div>

        {/* Recent activity */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
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
                    <p className="text-sm text-gray-900 font-medium leading-tight truncate">
                      {event.item}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">{event.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-400 font-mono">{event.reference}</span>
                      <span className="text-xs text-gray-300">·</span>
                      <span className="text-xs text-gray-400 flex items-center gap-1">
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
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">Recent Items</h2>
          <span className="text-xs text-gray-400">{recentItems.length} items</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-100">
                <th className="px-5 py-3">Reference</th>
                <th className="px-5 py-3">Product</th>
                <th className="px-5 py-3 hidden sm:table-cell">Category</th>
                <th className="px-5 py-3 hidden md:table-cell">Condition</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 hidden lg:table-cell">Est. Value</th>
                <th className="px-5 py-3 hidden md:table-cell">Date Received</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recentItems.map((item) => (
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
                  <td className="px-5 py-3.5 text-gray-500 hidden sm:table-cell">
                    {item.category}
                  </td>
                  <td className="px-5 py-3.5 hidden md:table-cell">
                    <span className={`text-xs font-medium ${
                      item.condition === 'Good'
                        ? 'text-emerald-600'
                        : item.condition === 'Fair'
                        ? 'text-amber-600'
                        : 'text-red-500'
                    }`}>
                      {item.condition}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <StatusBadge status={item.status} />
                  </td>
                  <td className="px-5 py-3.5 text-gray-700 font-medium hidden lg:table-cell">
                    {formatPeso(item.resaleValue)}
                  </td>
                  <td className="px-5 py-3.5 text-gray-500 hidden md:table-cell">
                    {formatDate(item.dateReceived)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
