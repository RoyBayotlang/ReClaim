import { ClipboardCheck } from 'lucide-react';
import EmptyState from '../components/ui/EmptyState';

export default function InspectionsPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-gray-500">
          Review incoming items, assess their condition, and determine the refurbishment path.
        </p>
      </div>

      {/* Overview cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-sm font-medium text-gray-500">Pending Inspections</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">18</p>
          <p className="text-xs text-amber-600 mt-1">3 items waiting &gt; 48 hours</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-sm font-medium text-gray-500">Completed Today</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">4</p>
          <p className="text-xs text-emerald-600 mt-1">On track</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-sm font-medium text-gray-500">Avg. Inspection Time</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">25 min</p>
          <p className="text-xs text-gray-500 mt-1">Per item</p>
        </div>
      </div>

      <EmptyState
        icon={ClipboardCheck}
        title="Inspection Queue Coming Soon"
        description="The inspection workflow will allow you to assess incoming items, grade their condition, and route them for repair or direct resale."
        action={{ label: 'Coming in Phase 3', disabled: true }}
      />
    </div>
  );
}
