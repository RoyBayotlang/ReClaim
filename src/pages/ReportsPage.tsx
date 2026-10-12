import { BarChart3 } from 'lucide-react';
import EmptyState from '../components/ui/EmptyState';

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-gray-500">
          Generate reports on inventory turnover, refurbishment costs, profit margins, and operational efficiency.
        </p>
      </div>

      {/* Overview cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-sm font-medium text-gray-500">Total Revenue</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">₱284,500</p>
          <p className="text-xs text-emerald-600 mt-1">This month</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-sm font-medium text-gray-500">Avg. Margin</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">42%</p>
          <p className="text-xs text-emerald-600 mt-1">+3% from last month</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-sm font-medium text-gray-500">Items Processed</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">47</p>
          <p className="text-xs text-gray-500 mt-1">This month</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-sm font-medium text-gray-500">Avg. Turnaround</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">5.2 days</p>
          <p className="text-xs text-emerald-600 mt-1">-0.8 days improvement</p>
        </div>
      </div>

      <EmptyState
        icon={BarChart3}
        title="Reports & Analytics Coming Soon"
        description="View detailed charts and exportable reports on profitability, item throughput, category performance, and operational metrics."
        action={{ label: 'Coming in Phase 3', disabled: true }}
      />
    </div>
  );
}
