import { Package, Plus, Search } from 'lucide-react';
import StatusBadge from '../components/ui/StatusBadge';
import { recentItems, formatDate, formatPeso } from '../data/mockData';

export default function ItemsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="text-sm text-gray-500">
            Track and manage all received items through the refurbishment pipeline.
          </p>
        </div>
        <button
          disabled
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg
                     opacity-50 cursor-not-allowed shrink-0"
          title="Item creation will be available in a future update"
        >
          <Plus size={16} />
          Receive Item
        </button>
      </div>

      {/* Search bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by reference, product name, or category..."
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-lg
                       focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500
                       transition-colors"
            readOnly
          />
        </div>
        <select
          disabled
          className="px-3 py-2.5 text-sm bg-white border border-gray-200 rounded-lg text-gray-500 cursor-not-allowed"
        >
          <option>All Statuses</option>
        </select>
      </div>

      {/* Items table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package size={16} className="text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-900">All Items</h2>
          </div>
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
            {recentItems.length} items
          </span>
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
                <th className="px-5 py-3 hidden md:table-cell">Cost</th>
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
                  <td className="px-5 py-3.5 text-gray-500 hidden md:table-cell">
                    {formatPeso(item.purchaseCost)}
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
        <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
          <span>Showing {recentItems.length} of {recentItems.length} items</span>
          <span>Powered by mock data</span>
        </div>
      </div>
    </div>
  );
}
