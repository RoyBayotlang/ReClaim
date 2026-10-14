import { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ClipboardCheck,
  Search,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  User,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { listRecentInspections } from '../lib/inspectionsApi';
import { listItems } from '../lib/itemsApi';
import OverallConditionBadge from '../components/inspections/OverallConditionBadge';
import ComponentConditionBadge from '../components/inspections/ComponentConditionBadge';
import InspectionModal from '../components/inspections/InspectionModal';
import StatusBadge from '../components/ui/StatusBadge';
import EmptyState from '../components/ui/EmptyState';
import { formatDateTime, formatDate } from '../data/mockData';
import {
  Item,
  Inspection,
  OverallCondition,
  OVERALL_CONDITION_META,
} from '../types';

export default function InspectionsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'queue' | 'history'>('queue');
  const [items, setItems] = useState<Item[]>([]);
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [conditionFilter, setConditionFilter] = useState<'all' | OverallCondition>('all');
  const [expandedInspectionId, setExpandedInspectionId] = useState<string | null>(null);

  // Modal inspection target item
  const [selectedItemForInspection, setSelectedItemForInspection] = useState<Item | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [itemsData, inspectionsData] = await Promise.all([
        listItems().catch((err) => {
          console.warn('Error fetching items:', err);
          return [] as Item[];
        }),
        listRecentInspections(50).catch((err) => {
          console.warn('Error fetching inspections:', err);
          return [] as Inspection[];
        }),
      ]);
      setItems(itemsData);
      setInspections(inspectionsData);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load inspection data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Set of item IDs that have at least one completed inspection
  const inspectedItemIds = useMemo(() => {
    return new Set(inspections.map((i) => i.item_id));
  }, [inspections]);

  // Queue of items that need inspection (status is inspection or unknown, or never inspected)
  const inspectionQueue = useMemo(() => {
    return items.filter((item) => {
      // Prioritize items in 'inspection' or 'unknown' status, or without prior inspections
      const needsInspection =
        item.status === 'inspection' ||
        item.status === 'unknown' ||
        !inspectedItemIds.has(item.id);

      if (!needsInspection) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const target = [item.reference, item.name, item.brand, item.model, item.category]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!target.includes(q)) return false;
      }

      return true;
    });
  }, [items, inspectedItemIds, searchQuery]);

  // Filtered completed inspections history
  const filteredInspections = useMemo(() => {
    return inspections.filter((insp) => {
      if (conditionFilter !== 'all' && insp.overall_condition !== conditionFilter) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const target = [
          insp.inspected_by,
          insp.general_notes,
          insp.item?.reference,
          insp.item?.name,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!target.includes(q)) return false;
      }

      return true;
    });
  }, [inspections, conditionFilter, searchQuery]);

  // Condition distribution metrics
  const conditionStats = useMemo(() => {
    const counts = {
      GOOD: 0,
      FAIR: 0,
      POOR: 0,
      NON_FUNCTIONAL: 0,
      UNASSESSED: 0,
    };
    inspections.forEach((i) => {
      if (counts[i.overall_condition] !== undefined) {
        counts[i.overall_condition]++;
      }
    });
    return counts;
  }, [inspections]);

  const handleInspectionSuccess = async () => {
    await fetchData();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Inspection & Diagnostics Station</h1>
          <p className="text-sm text-gray-500">
            Assess incoming devices, conduct component checklists, and log hardware conditions.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2 text-gray-500 hover:text-gray-900 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-2xs"
            title="Refresh"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-2xs">
          <span className="text-xs font-medium text-gray-500 block">Pending Inspection</span>
          <span className="text-xl sm:text-2xl font-bold text-blue-700 mt-1 block">
            {inspectionQueue.length}
          </span>
          <span className="text-[11px] text-gray-400 mt-0.5 block">Inbound or unverified</span>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-2xs">
          <span className="text-xs font-medium text-gray-500 block">Total Inspected</span>
          <span className="text-xl sm:text-2xl font-bold text-gray-900 mt-1 block">
            {inspections.length}
          </span>
          <span className="text-[11px] text-emerald-600 mt-0.5 block">Diagnostics logged</span>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-2xs">
          <span className="text-xs font-medium text-gray-500 block">Good / Fair Condition</span>
          <span className="text-xl sm:text-2xl font-bold text-emerald-700 mt-1 block">
            {conditionStats.GOOD + conditionStats.FAIR}
          </span>
          <span className="text-[11px] text-gray-400 mt-0.5 block">Viable refurbishment</span>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-2xs">
          <span className="text-xs font-medium text-gray-500 block">Poor / Non-Functional</span>
          <span className="text-xl sm:text-2xl font-bold text-red-700 mt-1 block">
            {conditionStats.POOR + conditionStats.NON_FUNCTIONAL}
          </span>
          <span className="text-[11px] text-gray-400 mt-0.5 block">Parts salvage candidates</span>
        </div>
      </div>

      {/* Tabs & Search Filter Header */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Tab buttons */}
          <div className="flex items-center gap-1.5 p-1 bg-gray-100 rounded-lg shrink-0">
            <button
              onClick={() => setActiveTab('queue')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                activeTab === 'queue'
                  ? 'bg-white text-gray-900 shadow-2xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Inspection Queue ({inspectionQueue.length})
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                activeTab === 'history'
                  ? 'bg-white text-gray-900 shadow-2xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Completed Inspections ({inspections.length})
            </button>
          </div>

          {/* Search box & filter */}
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  activeTab === 'queue'
                    ? 'Search queue by reference, name, brand...'
                    : 'Search logs by inspector, notes, item...'
                }
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            {activeTab === 'history' && (
              <select
                value={conditionFilter}
                onChange={(e) => setConditionFilter(e.target.value as any)}
                className="px-2.5 py-1.5 text-xs bg-white border border-gray-200 rounded-lg text-gray-700"
              >
                <option value="all">All Conditions</option>
                {Object.entries(OVERALL_CONDITION_META).map(([key, meta]) => (
                  <option key={key} value={key}>
                    {meta.label}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="bg-white border border-gray-200 rounded-xl p-16 text-center shadow-2xs">
          <RefreshCw size={24} className="animate-spin text-blue-600 mx-auto mb-2" />
          <p className="text-xs text-gray-500 font-medium">Loading inspection station records...</p>
        </div>
      ) : activeTab === 'queue' ? (
        /* Tab 1: Inspection Queue */
        inspectionQueue.length === 0 ? (
          <EmptyState
            icon={ClipboardCheck}
            title="Inspection Queue is Clear"
            description="All inventory items have been inspected or no items are currently flagged for diagnostics."
            action={{
              label: 'View Inventory Items',
              onClick: () => navigate('/items'),
            }}
          />
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-2xs">
            <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between text-xs text-gray-500">
              <span className="font-semibold text-gray-900">
                Items Awaiting Hardware Inspection ({inspectionQueue.length})
              </span>
              <span>Select an item to run component diagnostic checklist</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left font-medium text-gray-500 uppercase tracking-wider border-b border-gray-100 bg-gray-50/50">
                    <th className="px-5 py-3">Reference</th>
                    <th className="px-5 py-3">Product Name</th>
                    <th className="px-5 py-3 hidden sm:table-cell">Category</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 hidden md:table-cell">Received</th>
                    <th className="px-5 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {inspectionQueue.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="px-5 py-3.5 font-mono font-bold text-blue-700">
                        <Link to={`/items/${item.id}`} className="hover:underline">
                          {item.reference}
                        </Link>
                      </td>
                      <td className="px-5 py-3.5">
                        <Link
                          to={`/items/${item.id}`}
                          className="font-semibold text-gray-900 hover:text-blue-700"
                        >
                          {item.name}
                        </Link>
                        <div className="text-[11px] text-gray-400">
                          {[item.brand, item.model].filter(Boolean).join(' · ')}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-gray-600 hidden sm:table-cell">
                        {item.category || '—'}
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusBadge status={item.status} size="sm" />
                      </td>
                      <td className="px-5 py-3.5 text-gray-500 hidden md:table-cell">
                        {formatDate(item.received_at || item.created_at)}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedItemForInspection(item)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-2xs transition-colors"
                        >
                          <ClipboardCheck size={13} />
                          <span>Inspect Now</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        /* Tab 2: Completed Inspections History */
        filteredInspections.length === 0 ? (
          <EmptyState
            icon={ClipboardCheck}
            title="No Completed Inspections Found"
            description="No inspection records match the selected filter. Try selecting 'All Conditions' or clearing search."
          />
        ) : (
          <div className="space-y-3">
            {filteredInspections.map((insp) => {
              const isExpanded = expandedInspectionId === insp.id;
              const results = insp.results || [];
              const damagedCount = results.filter((r) => r.condition === 'DAMAGED').length;
              const goodCount = results.filter((r) => r.condition === 'GOOD').length;
              const minorCount = results.filter((r) => r.condition === 'MINOR_ISSUE').length;

              return (
                <div
                  key={insp.id}
                  className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-2xs transition-all"
                >
                  <div
                    onClick={() =>
                      setExpandedInspectionId((prev) => (prev === insp.id ? null : insp.id))
                    }
                    className="p-4 cursor-pointer hover:bg-gray-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-start sm:items-center gap-3">
                      <OverallConditionBadge condition={insp.overall_condition} size="md" />

                      <div>
                        <div className="flex items-center gap-2">
                          {insp.item ? (
                            <Link
                              to={`/items/${insp.item.id}`}
                              onClick={(e) => e.stopPropagation()}
                              className="font-mono font-bold text-blue-700 hover:underline"
                            >
                              {insp.item.reference}
                            </Link>
                          ) : (
                            <span className="font-mono text-gray-500">ITEM</span>
                          )}
                          <span className="font-semibold text-gray-900">
                            {insp.item?.name || 'Inventory Item'}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-gray-500 mt-0.5 text-[11px]">
                          <span>{formatDateTime(insp.inspection_date)}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <User size={11} className="text-gray-400" />
                            {insp.inspected_by || 'Inspector'}
                          </span>
                          <span>•</span>
                          <span>{results.length} checks</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                      <div className="flex items-center gap-1.5 text-[11px]">
                        {goodCount > 0 && (
                          <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-medium">
                            ✓ {goodCount}
                          </span>
                        )}
                        {minorCount > 0 && (
                          <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 font-medium">
                            ⚠ {minorCount}
                          </span>
                        )}
                        {damagedCount > 0 && (
                          <span className="px-2 py-0.5 rounded bg-red-50 text-red-700 font-medium">
                            ✗ {damagedCount}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {insp.item && (
                          <Link
                            to={`/items/${insp.item.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="p-1.5 text-gray-400 hover:text-blue-600 rounded transition-colors"
                            title="View Item Details"
                          >
                            <ExternalLink size={14} />
                          </Link>
                        )}
                        <span className="p-1 text-gray-400">
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Checklist */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 bg-gray-50/50 p-4 space-y-3 animate-in fade-in duration-150">
                      {insp.general_notes && (
                        <div className="bg-white p-3 rounded-lg border border-gray-200 text-xs text-gray-700">
                          <span className="font-semibold block mb-0.5">Notes:</span>
                          <p>{insp.general_notes}</p>
                        </div>
                      )}

                      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden divide-y divide-gray-100 text-xs">
                        <div className="grid grid-cols-12 px-3 py-2 bg-gray-50 font-semibold text-gray-500 uppercase tracking-wider text-[10px]">
                          <div className="col-span-5 sm:col-span-4">Component</div>
                          <div className="col-span-4 sm:col-span-3">Condition</div>
                          <div className="col-span-3 sm:col-span-5">Notes</div>
                        </div>

                        {results.map((res) => (
                          <div
                            key={res.id || res.component_name}
                            className="grid grid-cols-12 px-3 py-2 items-center hover:bg-gray-50/60"
                          >
                            <div className="col-span-5 sm:col-span-4 font-medium text-gray-900">
                              {res.component_name}
                            </div>
                            <div className="col-span-4 sm:col-span-3">
                              <ComponentConditionBadge condition={res.condition} size="sm" />
                            </div>
                            <div className="col-span-3 sm:col-span-5 text-gray-500">
                              {res.notes || '—'}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Modal for triggering inspection directly from queue */}
      {selectedItemForInspection && (
        <InspectionModal
          item={selectedItemForInspection}
          isOpen={!!selectedItemForInspection}
          onClose={() => setSelectedItemForInspection(null)}
          onSuccess={handleInspectionSuccess}
        />
      )}
    </div>
  );
}
