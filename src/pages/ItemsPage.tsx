import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  Plus,
  Search,
  Filter,
  RefreshCw,
  AlertCircle,
  ExternalLink,
  Edit3,
  DollarSign,
  TrendingUp,
  Wrench,
  CheckCircle,
  Layers,
  Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';
import StatusBadge from '../components/ui/StatusBadge';
import EmptyState from '../components/ui/EmptyState';
import { listItems, seedSampleItems } from '../lib/itemsApi';
import { formatDate, formatPeso } from '../data/mockData';
import { Item, Status, STATUS_META, CATEGORIES } from '../types';

export default function ItemsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | Status>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'value_high' | 'cost_high' | 'name'>('newest');

  const fetchItems = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await listItems();
      setItems(data);
    } catch (err: any) {
      console.error('Error fetching items:', err);
      setError(err.message || 'Failed to load items from Supabase');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleSeedDemo = async () => {
    try {
      setSeeding(true);
      await seedSampleItems();
      toast.success('Sample items loaded successfully!');
      await fetchItems();
    } catch (err: any) {
      toast.error(err.message || 'Failed to seed sample items');
    } finally {
      setSeeding(false);
    }
  };

  // Unique categories from actual items
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    items.forEach((item) => {
      if (item.category) set.add(item.category);
    });
    return Array.from(set).sort();
  }, [items]);

  // Filtered & Sorted items
  const filteredItems = useMemo(() => {
    return items
      .filter((item) => {
        // Status filter
        if (statusFilter !== 'all' && item.status !== statusFilter) {
          return false;
        }

        // Category filter
        if (categoryFilter !== 'all' && item.category !== categoryFilter) {
          return false;
        }

        // Search query across reference, name, brand, model, serial_number
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const target = [
            item.reference,
            item.name,
            item.brand,
            item.model,
            item.serial_number,
            item.category,
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();

          if (!target.includes(q)) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
        if (sortBy === 'oldest') {
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        }
        if (sortBy === 'value_high') {
          return (b.resale_value || 0) - (a.resale_value || 0);
        }
        if (sortBy === 'cost_high') {
          return (b.purchase_cost || 0) - (a.purchase_cost || 0);
        }
        if (sortBy === 'name') {
          return a.name.localeCompare(b.name);
        }
        return 0;
      });
  }, [items, searchQuery, statusFilter, categoryFilter, sortBy]);

  // Inventory stats calculated from real Supabase items
  const stats = useMemo(() => {
    const total = items.length;
    const totalResale = items.reduce((sum, i) => sum + (Number(i.resale_value) || 0), 0);
    const inRepairCount = items.filter((i) => i.status === 'in_repair' || i.status === 'needs_refurbishment').length;
    const readyToSellCount = items.filter((i) => i.status === 'ready_to_sell').length;

    return { total, totalResale, inRepairCount, readyToSellCount };
  }, [items]);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Inventory Items</h1>
          <p className="text-sm text-gray-500">
            Track, assess, and move recovered items through the refurbishment lifecycle.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={fetchItems}
            disabled={loading}
            className="p-2 text-gray-500 hover:text-gray-900 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            title="Refresh items"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>

          <Link
            to="/items/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors"
          >
            <Plus size={16} />
            Receive Item
          </Link>
        </div>
      </div>

      {/* Metric Mini-Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-gray-500 block">Total Items</span>
            <span className="text-lg sm:text-xl font-bold text-gray-900 mt-0.5 block">{stats.total}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600">
            <Package size={20} />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-gray-500 block">Est. Inventory Value</span>
            <span className="text-lg sm:text-xl font-bold text-emerald-700 mt-0.5 block">
              {formatPeso(stats.totalResale)}
            </span>
          </div>
          <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600">
            <TrendingUp size={20} />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-gray-500 block">In Refurbishment</span>
            <span className="text-lg sm:text-xl font-bold text-orange-700 mt-0.5 block">{stats.inRepairCount}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-orange-50 text-orange-600">
            <Wrench size={20} />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-gray-500 block">Ready to Sell</span>
            <span className="text-lg sm:text-xl font-bold text-green-700 mt-0.5 block">{stats.readyToSellCount}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-green-50 text-green-600">
            <CheckCircle size={20} />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search box */}
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by reference, product name, brand, model, or serial number..."
              className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600"
              >
                Clear
              </button>
            )}
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            >
              <option value="all">All Statuses</option>
              {Object.entries(STATUS_META).map(([key, meta]) => (
                <option key={key} value={key}>
                  {meta.label}
                </option>
              ))}
            </select>

            {/* Category filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            >
              <option value="all">All Categories</option>
              {availableCategories.length > 0 ? (
                availableCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))
              ) : (
                CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))
              )}
            </select>

            {/* Sort filter */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 hidden md:block"
            >
              <option value="newest">Sort: Newest First</option>
              <option value="oldest">Sort: Oldest First</option>
              <option value="value_high">Sort: Highest Resale Value</option>
              <option value="cost_high">Sort: Highest Cost</option>
              <option value="name">Sort: Product Name A–Z</option>
            </select>
          </div>
        </div>

        {/* Active Filter Tags */}
        {(statusFilter !== 'all' || categoryFilter !== 'all' || searchQuery) && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100 text-xs">
            <span className="text-gray-400">Active filters:</span>
            {searchQuery && (
              <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 font-medium">
                Query: "{searchQuery}"
              </span>
            )}
            {statusFilter !== 'all' && (
              <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-medium">
                Status: {STATUS_META[statusFilter]?.label}
              </span>
            )}
            {categoryFilter !== 'all' && (
              <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-medium">
                Category: {categoryFilter}
              </span>
            )}
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
                setCategoryFilter('all');
              }}
              className="text-emerald-600 hover:underline font-medium ml-1"
            >
              Reset all
            </button>
          </div>
        )}
      </div>

      {/* Main Content Area: Loading / Error / Empty / Table */}
      {loading ? (
        <div className="bg-white border border-gray-200 rounded-xl p-16 text-center shadow-sm">
          <RefreshCw size={28} className="animate-spin text-emerald-600 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-700">Loading items from Supabase...</p>
          <p className="text-xs text-gray-400 mt-1">Querying database for inventory items</p>
        </div>
      ) : error ? (
        <div className="bg-white border border-red-200 rounded-xl p-8 text-center shadow-sm max-w-lg mx-auto">
          <AlertCircle size={36} className="text-red-500 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-gray-900 mb-1">Failed to Load Items</h3>
          <p className="text-xs text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchItems}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            <RefreshCw size={14} />
            Try Again
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center shadow-sm max-w-xl mx-auto space-y-4">
          <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-600">
            <Package size={28} />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">Your Inventory is Empty</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto leading-relaxed">
              No items have been registered in Supabase yet. Start by receiving your first item or load demo items to test the refurbishment workflow.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              to="/items/new"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
            >
              <Plus size={15} />
              Receive First Item
            </Link>

            <button
              onClick={handleSeedDemo}
              disabled={seeding}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-emerald-300 text-emerald-700 hover:bg-emerald-50 text-xs font-semibold rounded-lg shadow-sm disabled:opacity-50 transition-colors"
            >
              {seeding ? (
                <RefreshCw size={15} className="animate-spin" />
              ) : (
                <Sparkles size={15} />
              )}
              Load Sample Demo Data
            </button>
          </div>
        </div>
      ) : filteredItems.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No matching items"
          description="No items match your active search and filter criteria. Try adjusting your query or resetting filters."
          action={{
            label: 'Clear Filters',
            onClick: () => {
              setSearchQuery('');
              setStatusFilter('all');
              setCategoryFilter('all');
            },
          }}
        />
      ) : (
        /* Items Table */
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package size={16} className="text-emerald-600" />
              <h2 className="text-sm font-semibold text-gray-900">Items Catalog</h2>
            </div>
            <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
              Showing {filteredItems.length} of {items.length} items
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-100 bg-gray-50/50">
                  <th className="px-5 py-3">Reference</th>
                  <th className="px-5 py-3">Product Name</th>
                  <th className="px-5 py-3 hidden sm:table-cell">Category</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 hidden md:table-cell">Cost</th>
                  <th className="px-5 py-3 hidden lg:table-cell">Est. Resale</th>
                  <th className="px-5 py-3 hidden md:table-cell">Received</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredItems.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-gray-50/70 transition-colors group cursor-pointer"
                  >
                    <td className="px-5 py-3.5">
                      <Link
                        to={`/items/${item.id}`}
                        className="text-emerald-700 hover:text-emerald-900 font-mono font-semibold text-xs flex items-center gap-1"
                      >
                        {item.reference}
                      </Link>
                    </td>

                    <td className="px-5 py-3.5">
                      <Link
                        to={`/items/${item.id}`}
                        className="block group-hover:text-emerald-700 transition-colors"
                      >
                        <div className="font-medium text-gray-900 text-sm">{item.name}</div>
                        <div className="text-xs text-gray-400">
                          {[item.brand, item.model].filter(Boolean).join(' · ')}
                        </div>
                      </Link>
                    </td>

                    <td className="px-5 py-3.5 text-gray-600 text-xs hidden sm:table-cell">
                      {item.category || '—'}
                    </td>

                    <td className="px-5 py-3.5">
                      <StatusBadge status={item.status} size="sm" />
                    </td>

                    <td className="px-5 py-3.5 text-gray-600 text-xs hidden md:table-cell font-medium">
                      {formatPeso(item.purchase_cost)}
                    </td>

                    <td className="px-5 py-3.5 text-gray-900 font-semibold text-xs hidden lg:table-cell">
                      {formatPeso(item.resale_value)}
                    </td>

                    <td className="px-5 py-3.5 text-gray-500 text-xs hidden md:table-cell">
                      {formatDate(item.received_at || item.created_at)}
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      <div className="inline-flex items-center gap-1">
                        <Link
                          to={`/items/${item.id}`}
                          className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-gray-100 rounded transition-colors"
                          title="View details"
                        >
                          <ExternalLink size={15} />
                        </Link>
                        <Link
                          to={`/items/${item.id}/edit`}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-gray-100 rounded transition-colors"
                          title="Edit item"
                        >
                          <Edit3 size={15} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-5 py-3 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>
              Showing {filteredItems.length} of {items.length} items from Supabase
            </span>
            <span className="font-mono text-[11px] text-gray-400">ReClaim Item Manager</span>
          </div>
        </div>
      )}
    </div>
  );
}
