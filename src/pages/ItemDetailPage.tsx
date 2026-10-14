import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Edit3,
  Trash2,
  Package,
  Clock,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getItem, getHistory, setStatus, updateItem, deleteItem } from '../lib/itemsApi';
import { listInspectionsForItem } from '../lib/inspectionsApi';
import { formatDate, formatDateTime } from '../data/mockData';
import { Item, HistoryEntry, Status, STATUS_META, NEXT, Inspection } from '../types';
import StatusBadge from '../components/ui/StatusBadge';
import FinancialAssessmentPanel from '../components/inspections/FinancialAssessmentPanel';
import InspectionModal from '../components/inspections/InspectionModal';
import InspectionHistoryList from '../components/inspections/InspectionHistoryList';

export default function ItemDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [item, setItem] = useState<Item | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingInspections, setLoadingInspections] = useState(false);
  const [showInspectionModal, setShowInspectionModal] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Transition note modal state
  const [transitioningTo, setTransitioningTo] = useState<Status | null>(null);
  const [transitionNote, setTransitionNote] = useState('');

  const loadInspections = async () => {
    if (!id) return;
    try {
      setLoadingInspections(true);
      const data = await listInspectionsForItem(id);
      setInspections(data);
    } catch (err: any) {
      console.error('Failed to load inspections:', err);
    } finally {
      setLoadingInspections(false);
    }
  };

  const loadData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [itemData, historyData, inspectionsData] = await Promise.all([
        getItem(id),
        getHistory(id),
        listInspectionsForItem(id).catch((e) => {
          console.warn('Inspection fetch error:', e);
          return [] as Inspection[];
        }),
      ]);
      setItem(itemData);
      setHistory(historyData);
      setInspections(inspectionsData);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load item details');
      navigate('/items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mb-3" />
        <p className="text-sm text-gray-500">Loading item information...</p>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-12 text-center max-w-lg mx-auto">
        <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <h2 className="text-base font-semibold text-gray-900 mb-1">Item Not Found</h2>
        <p className="text-sm text-gray-500 mb-4">
          This item could not be retrieved from the database. It may have been deleted.
        </p>
        <Link
          to="/items"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Items
        </Link>
      </div>
    );
  }

  const nextStatuses = NEXT[item.status] || [];

  const handleStatusChange = async (targetStatus: Status) => {
    try {
      setUpdatingStatus(true);
      const note = transitionNote.trim() || `Moved to ${STATUS_META[targetStatus].label}`;
      await setStatus(item.id, targetStatus, note);
      toast.success(`Item status updated to ${STATUS_META[targetStatus].label}`);
      setTransitioningTo(null);
      setTransitionNote('');
      await loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleUpdateRepairCostDirect = async (newCost: number) => {
    try {
      await updateItem(item.id, { repair_estimate: newCost });
      toast.success('Repair cost estimate updated');
      await loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update repair estimate');
    }
  };

  const handleInspectionSuccess = async (_newInspection: Inspection) => {
    await loadData();
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await deleteItem(item.id);
      toast.success(`Item ${item.reference} removed from inventory`);
      navigate('/items');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete item');
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Top Navigation & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/items"
            className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            title="Back to items list"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-semibold px-2 py-0.5 bg-gray-100 text-gray-700 rounded">
                {item.reference}
              </span>
              <StatusBadge status={item.status} size="md" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 mt-1">{item.name}</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to={`/items/${item.id}/edit`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 shadow-sm transition-colors"
          >
            <Edit3 size={15} />
            Edit Item
          </Link>

          <button
            onClick={() => setShowDeleteModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 shadow-sm transition-colors"
          >
            <Trash2 size={15} />
            Delete
          </button>
        </div>
      </div>

      {/* Main Grid: Details (Left 2 cols) + Pipeline & Timeline (Right 1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Workflow Action Bar */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <ShieldCheck size={16} className="text-emerald-600" />
                Pipeline Workflow Actions
              </h2>
              <span className="text-xs text-gray-500">Current: {STATUS_META[item.status].label}</span>
            </div>

            {nextStatuses.length > 0 ? (
              <div className="flex flex-wrap gap-2 pt-1">
                {nextStatuses.map((nextSt) => (
                  <button
                    key={nextSt}
                    onClick={() => {
                      setTransitioningTo(nextSt);
                      setTransitionNote('');
                    }}
                    disabled={updatingStatus}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 disabled:opacity-50 transition-colors"
                  >
                    <span>{STATUS_META[nextSt].icon}</span>
                    <span>Advance to {STATUS_META[nextSt].label}</span>
                    <ArrowRight size={13} />
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500 bg-gray-50 p-2.5 rounded-lg">
                This item has reached its terminal pipeline status ({STATUS_META[item.status].label}).
              </p>
            )}
          </div>

          {/* Product Information Card */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-semibold text-gray-900 pb-3 border-b border-gray-100 flex items-center gap-2">
              <Package size={16} className="text-emerald-600" />
              Product Information
            </h2>

            <div className="flex flex-col sm:flex-row gap-5">
              {item.image_url ? (
                <div className="w-full sm:w-44 h-40 bg-gray-50 rounded-lg border border-gray-200 overflow-hidden shrink-0 flex items-center justify-center">
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-full sm:w-44 h-40 bg-gray-50 rounded-lg border border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 shrink-0">
                  <Package size={36} className="mb-1" />
                  <span className="text-xs">No image</span>
                </div>
              )}

              <div className="flex-1 grid grid-cols-2 gap-y-3 gap-x-4 text-xs">
                <div>
                  <span className="text-gray-500 block mb-0.5">Category</span>
                  <span className="font-medium text-gray-900">{item.category || '—'}</span>
                </div>
                <div>
                  <span className="text-gray-500 block mb-0.5">Brand</span>
                  <span className="font-medium text-gray-900">{item.brand || '—'}</span>
                </div>
                <div>
                  <span className="text-gray-500 block mb-0.5">Model</span>
                  <span className="font-medium text-gray-900">{item.model || '—'}</span>
                </div>
                <div>
                  <span className="text-gray-500 block mb-0.5">Serial Number</span>
                  <span className="font-mono font-medium text-gray-900">{item.serial_number || '—'}</span>
                </div>
                <div>
                  <span className="text-gray-500 block mb-0.5">Date Received</span>
                  <span className="font-medium text-gray-900">{formatDate(item.received_at)}</span>
                </div>
                <div>
                  <span className="text-gray-500 block mb-0.5">Logged In System</span>
                  <span className="font-medium text-gray-900">{formatDate(item.created_at)}</span>
                </div>
              </div>
            </div>

            {item.notes && (
              <div className="mt-4 pt-3 border-t border-gray-100">
                <span className="text-xs font-semibold text-gray-700 block mb-1">Intake Notes</span>
                <p className="text-xs text-gray-600 bg-gray-50 p-3 rounded-lg leading-relaxed whitespace-pre-wrap">
                  {item.notes}
                </p>
              </div>
            )}
          </div>

          {/* Phase 5: Refurbishment Financial Assessment Panel */}
          <FinancialAssessmentPanel
            item={item}
            latestInspection={inspections[0] || null}
            onUpdateRepairCost={handleUpdateRepairCostDirect}
          />

          {/* Phase 5: Hardware Inspection History & Diagnostics Module */}
          <InspectionHistoryList
            inspections={inspections}
            loading={loadingInspections}
            onRefresh={loadInspections}
            onStartInspection={() => setShowInspectionModal(true)}
          />
        </div>

        {/* Sidebar: Status History Timeline (1 col) */}
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-semibold text-gray-900 pb-3 border-b border-gray-100 flex items-center gap-2">
              <Clock size={16} className="text-emerald-600" />
              Status History Timeline
            </h2>

            {history.length === 0 ? (
              <p className="text-xs text-gray-400 py-6 text-center">
                No status history events recorded yet.
              </p>
            ) : (
              <div className="relative pl-4 space-y-5 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200">
                {history.map((entry, idx) => {
                  const meta = STATUS_META[entry.to_status] || STATUS_META.unknown;
                  return (
                    <div key={entry.id || idx} className="relative group">
                      <div className="absolute -left-[19px] top-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
                      <div className="text-xs">
                        <div className="flex items-center gap-1.5 font-semibold text-gray-800">
                          <span>{meta.icon}</span>
                          <span>{meta.label}</span>
                        </div>
                        {entry.note && (
                          <p className="text-gray-600 mt-1 bg-gray-50 p-2 rounded text-[11px] leading-relaxed">
                            {entry.note}
                          </p>
                        )}
                        <span className="text-[10px] text-gray-400 mt-1 block">
                          {formatDateTime(entry.created_at)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Advance Status Modal */}
      {transitioningTo && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <span>{STATUS_META[transitioningTo].icon}</span>
              Advance to {STATUS_META[transitioningTo].label}
            </h3>

            <p className="text-xs text-gray-500">
              Update the pipeline status for <span className="font-semibold">{item.name}</span> ({item.reference}). You can optionally attach an audit note for this status change.
            </p>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Audit Log Note (Optional)
              </label>
              <textarea
                rows={2}
                value={transitionNote}
                onChange={(e) => setTransitionNote(e.target.value)}
                placeholder="e.g. Visual diagnostics passed, assigned to technician..."
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setTransitioningTo(null)}
                className="px-3.5 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={updatingStatus}
                onClick={() => handleStatusChange(transitioningTo)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm disabled:opacity-50 transition-colors"
              >
                {updatingStatus ? <Loader2 size={13} className="animate-spin" /> : null}
                Confirm Transition
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
              <AlertTriangle size={20} />
            </div>

            <h3 className="text-base font-bold text-gray-900">
              Delete Item {item.reference}?
            </h3>

            <p className="text-xs text-gray-500 leading-relaxed">
              Are you sure you want to delete <span className="font-semibold">{item.name}</span>? This will permanently remove the item and its status history from the Supabase database. This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="px-3.5 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDelete}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg shadow-sm disabled:opacity-50 transition-colors"
              >
                {deleting ? <Loader2 size={13} className="animate-spin" /> : null}
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Phase 5: New Inspection Modal */}
      {showInspectionModal && (
        <InspectionModal
          item={item}
          isOpen={showInspectionModal}
          onClose={() => setShowInspectionModal(false)}
          onSuccess={handleInspectionSuccess}
        />
      )}
    </div>
  );
}
