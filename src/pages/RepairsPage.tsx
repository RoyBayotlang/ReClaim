import { Wrench } from 'lucide-react';
import EmptyState from '../components/ui/EmptyState';

export default function RepairsPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-gray-500">
          Track repair jobs, parts usage, and technician assignments for items under refurbishment.
        </p>
      </div>

      {/* Overview cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-sm font-medium text-gray-500">Active Repairs</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">24</p>
          <p className="text-xs text-orange-600 mt-1">6 awaiting parts</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-sm font-medium text-gray-500">Completed This Week</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">11</p>
          <p className="text-xs text-emerald-600 mt-1">+3 from last week</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-sm font-medium text-gray-500">Avg. Repair Cost</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">₱1,850</p>
          <p className="text-xs text-gray-500 mt-1">Per item</p>
        </div>
      </div>

      <EmptyState
        icon={Wrench}
        title="Repair Tracking Coming Soon"
        description="Manage repair assignments, log parts used, track labor time, and monitor repair costs for each item in the refurbishment pipeline."
        action={{ label: 'Coming in Phase 3', disabled: true }}
      />
    </div>
  );
}
