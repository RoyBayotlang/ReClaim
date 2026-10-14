import { useState } from 'react';
import {
  User,
  ChevronDown,
  ChevronUp,
  Trash2,
  Search,
  Layers,
  Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import OverallConditionBadge from './OverallConditionBadge';
import ComponentConditionBadge from './ComponentConditionBadge';
import { deleteInspection } from '../../lib/inspectionsApi';
import { formatDateTime } from '../../data/mockData';
import type { Inspection, InspectionResult } from '../../types';

interface InspectionHistoryListProps {
  inspections: Inspection[];
  loading?: boolean;
  onRefresh: () => Promise<void>;
  onStartInspection: () => void;
}

export default function InspectionHistoryList({
  inspections,
  loading = false,
  onRefresh,
  onStartInspection,
}: InspectionHistoryListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(
    inspections.length > 0 ? inspections[0].id : null
  );
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [filterCondition, setFilterCondition] = useState<string>('all');

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleDelete = async (inspectionId: string) => {
    if (!window.confirm('Are you sure you want to delete this inspection record?')) {
      return;
    }

    try {
      setDeletingId(inspectionId);
      await deleteInspection(inspectionId);
      toast.success('Inspection record deleted.');
      await onRefresh();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete inspection.');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-8 text-center space-y-2">
        <Loader2 className="w-6 h-6 text-blue-600 animate-spin mx-auto" />
        <p className="text-xs text-gray-500">Loading inspection history...</p>
      </div>
    );
  }

  if (inspections.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-8 text-center space-y-3">
        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto">
          <Search size={22} />
        </div>
        <div>
          <h3 className="text-sm font-bold text-gray-900">No Inspections Recorded</h3>
          <p className="text-xs text-gray-500 max-w-md mx-auto mt-0.5 leading-relaxed">
            This item has not undergone physical or functional hardware diagnostics yet. Start an
            inspection to record component condition and verify refurbishment viability.
          </p>
        </div>
        <button
          type="button"
          onClick={onStartInspection}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
        >
          <Search size={14} />
          Start First Inspection
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-gray-200 gap-2">
        <div>
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <Layers size={16} className="text-blue-600" />
            Inspection History & Diagnostics Log ({inspections.length})
          </h3>
          <p className="text-xs text-gray-500">
            Chronological inspection records preserved over time (newest first)
          </p>
        </div>

        <button
          type="button"
          onClick={onStartInspection}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors shrink-0"
        >
          <Search size={13} />
          New Inspection
        </button>
      </div>

      {/* List of Inspections */}
      <div className="space-y-3">
        {inspections.map((insp, index) => {
          const isExpanded = expandedId === insp.id;
          const isLatest = index === 0;
          const results = insp.results || [];

          // Summary counts
          const goodCount = results.filter((r) => r.condition === 'GOOD').length;
          const minorCount = results.filter((r) => r.condition === 'MINOR_ISSUE').length;
          const damagedCount = results.filter((r) => r.condition === 'DAMAGED').length;
          const notTestedCount = results.filter((r) => r.condition === 'NOT_TESTED').length;
          const naCount = results.filter((r) => r.condition === 'NOT_APPLICABLE').length;

          return (
            <div
              key={insp.id}
              className={`border rounded-xl bg-white overflow-hidden transition-all shadow-2xs ${
                isLatest ? 'border-blue-200 ring-1 ring-blue-500/10' : 'border-gray-200'
              }`}
            >
              {/* Inspection Header Card */}
              <div
                onClick={() => toggleExpand(insp.id)}
                className="p-4 cursor-pointer hover:bg-gray-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-start sm:items-center gap-3">
                  <OverallConditionBadge condition={insp.overall_condition} size="md" />

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-900">
                        {formatDateTime(insp.inspection_date)}
                      </span>
                      {isLatest && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-100 text-blue-800">
                          Latest Assessment
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                      <span className="flex items-center gap-1">
                        <User size={12} className="text-gray-400" />
                        {insp.inspected_by || 'Inspector not specified'}
                      </span>
                      <span>•</span>
                      <span>{results.length} checks logged</span>
                    </div>
                  </div>
                </div>

                {/* Checklist Summary Stats & Actions */}
                <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                  <div className="flex items-center gap-1.5 text-[11px]">
                    {goodCount > 0 && (
                      <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-medium border border-emerald-100">
                        ✓ {goodCount}
                      </span>
                    )}
                    {minorCount > 0 && (
                      <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 font-medium border border-amber-100">
                        ⚠ {minorCount}
                      </span>
                    )}
                    {damagedCount > 0 && (
                      <span className="px-2 py-0.5 rounded bg-red-50 text-red-700 font-medium border border-red-100">
                        ✗ {damagedCount}
                      </span>
                    )}
                    {notTestedCount > 0 && (
                      <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-600 font-medium">
                        — {notTestedCount}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(insp.id);
                      }}
                      disabled={deletingId === insp.id}
                      className="p-1.5 text-gray-400 hover:text-red-600 rounded transition-colors"
                      title="Delete inspection record"
                    >
                      {deletingId === insp.id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Trash2 size={14} />
                      )}
                    </button>

                    <span className="p-1 text-gray-400 hover:text-gray-600">
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </span>
                  </div>
                </div>
              </div>

              {/* Expanded Inspection Checklist Details */}
              {isExpanded && (
                <div className="border-t border-gray-100 bg-gray-50/50 p-4 sm:p-5 space-y-4 animate-in fade-in duration-150">
                  {/* General Notes if any */}
                  {insp.general_notes && (
                    <div className="bg-white p-3 rounded-lg border border-gray-200 text-xs">
                      <span className="font-semibold text-gray-700 block mb-1">
                        Inspector General Notes:
                      </span>
                      <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                        {insp.general_notes}
                      </p>
                    </div>
                  )}

                  {/* Checklist Table */}
                  <div>
                    <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-2">
                      Full Component Checklist Results ({results.length})
                    </h4>

                    {results.length === 0 ? (
                      <p className="text-xs text-gray-400 py-3 text-center bg-white rounded-lg border border-dashed border-gray-200">
                        No individual component checklist items logged for this inspection.
                      </p>
                    ) : (
                      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden divide-y divide-gray-100 text-xs shadow-2xs">
                        <div className="grid grid-cols-12 px-3 py-2 bg-gray-50 font-semibold text-gray-500 uppercase tracking-wider text-[10px]">
                          <div className="col-span-5 sm:col-span-4">Component Check</div>
                          <div className="col-span-4 sm:col-span-3">Condition</div>
                          <div className="col-span-3 sm:col-span-5">Inspector Notes</div>
                        </div>

                        {results.map((res) => (
                          <div
                            key={res.id || res.component_name}
                            className="grid grid-cols-12 px-3 py-2.5 items-center hover:bg-gray-50/60 transition-colors"
                          >
                            <div className="col-span-5 sm:col-span-4 font-medium text-gray-900 pr-2">
                              {res.component_name}
                              {res.component_type && (
                                <span className="text-[10px] text-gray-400 block capitalize">
                                  {res.component_type}
                                </span>
                              )}
                            </div>

                            <div className="col-span-4 sm:col-span-3">
                              <ComponentConditionBadge condition={res.condition} size="sm" />
                            </div>

                            <div className="col-span-3 sm:col-span-5 text-gray-600">
                              {res.notes ? (
                                <span className="text-gray-700 bg-gray-50 px-2 py-0.5 rounded border border-gray-100 block truncate" title={res.notes}>
                                  {res.notes}
                                </span>
                              ) : (
                                <span className="text-gray-400 italic">No notes</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
