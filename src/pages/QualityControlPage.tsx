import { ShieldCheck } from 'lucide-react';
import EmptyState from '../components/ui/EmptyState';

export default function QualityControlPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-gray-500">
          Verify repaired items meet resale standards before listing them as ready to sell.
        </p>
      </div>

      {/* Overview cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-sm font-medium text-gray-500">Awaiting QC</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">12</p>
          <p className="text-xs text-purple-600 mt-1">5 new today</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-sm font-medium text-gray-500">Pass Rate</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">87%</p>
          <p className="text-xs text-emerald-600 mt-1">Above 85% target</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-sm font-medium text-gray-500">Sent Back for Repair</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">3</p>
          <p className="text-xs text-red-500 mt-1">This week</p>
        </div>
      </div>

      <EmptyState
        icon={ShieldCheck}
        title="Quality Control Module Coming Soon"
        description="Run standardized QC checklists, flag issues, and approve or reject items before they move to the ready-to-sell stage."
        action={{ label: 'Coming in Phase 3', disabled: true }}
      />
    </div>
  );
}
