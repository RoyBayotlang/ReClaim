import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Edit3,
  Trash2,
  Calendar,
  DollarSign,
  Package,
  Clock,
  ArrowRight,
  ShieldCheck,
  Wrench,
  Search,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ExternalLink,
  ChevronRight,
  Info,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getItem, getHistory, setStatus, updateItem, deleteItem } from '../lib/itemsApi';
import { assess, peso, REC_META } from '../lib/assessment';
import { formatDate, formatDateTime } from '../data/mockData';
import { Item, HistoryEntry, Status, STATUS_META, NEXT } from '../types';
import StatusBadge from '../components/ui/StatusBadge';

export default function ItemDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [item, setItem] = useState<Item | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [editingRepairEstimate, setEditingRepairEstimate] = useState(false);
  const [newRepairEstimate, setNewRepairEstimate] = useState<number>(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Transition note modal state
  const [transitioningTo, setTransitioningTo] = useState<Status | null>(null);
  const [transitionNote, setTransitionNote] = useState('');

  const loadData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [itemData, historyData] = await Promise.all([
        getItem(id),
        getHistory(id),
      ]);
      setItem(itemData);
      setNewRepairEstimate(itemData.repair_estimate || 0);
      setHistory(historyData);
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

  const assessment = assess(
    item.purchase_cost || 0,
    item.repair_estimate || 0,
    item.resale_value || 0
  );
  const recMeta = REC_META[assessment.rec];
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

  const handleUpdateRepairEstimate = async () => {
    try {
      await updateItem(item.id, {
        repair_estimate: Math.max(0, Number(newRepairEstimate) || 0),
      });
      toast.success('Repair estimate updated');
      setEditingRepairEstimate(false);
      await loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update repair estimate');
    }
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

          {/* Financial Breakdown & Assessment */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <DollarSign size={16} className="text-emerald-600" />
                Financial Estimates & Refurbishment Economics
              </h2>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${recMeta.cls}`}>
                {recMeta.label}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                <span className="text-[11px] text-gray-500 block">Purchase Cost</span>
                <span className="text-sm font-bold text-gray-900 mt-0.5 block">
                  {peso(item.purchase_cost)}
                </span>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 relative group">
                <div className="flex items-center justify-center gap-1">
                  <span className="text-[11px] text-gray-500">Repair Estimate</span>
                  {!editingRepairEstimate && (
                    <button
                      onClick={() => setEditingRepairEstimate(true)}
                      className="text-gray-400 hover:text-emerald-600 text-[10px]"
                      title="Quick edit repair cost"
                    >
                      <Edit3 size={11} />
                    </button>
                  )}
                </div>
                {editingRepairEstimate ? (
                  <div className="flex items-center gap-1 mt-1">
                    <input
                      type="number"
                      min={0}
                      value={newRepairEstimate}
                      onChange={(e) => setNewRepairEstimate(Number(e.target.value) || 0)}
                      className="w-full text-xs p-1 border rounded"
                    />
                    <button
                      onClick={handleUpdateRepairEstimate}
                      className="text-xs px-1.5 py-1 bg-emerald-600 text-white rounded"
                    >
                      ✓
                    </button>
                  </div>
                ) : (
                  <span className="text-sm font-bold text-gray-900 mt-0.5 block">
                    {peso(item.repair_estimate)}
                  </span>
                )}
              </div>

              <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                <span className="text-[11px] text-gray-500 block">Total Investment</span>
                <span className="text-sm font-bold text-gray-900 mt-0.5 block">
                  {peso(assessment.investment)}
                </span>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                <span className="text-[11px] text-gray-500 block">Est. Resale Value</span>
                <span className="text-sm font-bold text-emerald-700 mt-0.5 block">
                  {peso(item.resale_value)}
                </span>
              </div>
            </div>

            <div className="bg-emerald-50/60 border border-emerald-100 rounded-lg p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div>
                <span className="text-emerald-900 font-semibold block">Expected Profit:</span>
                <span
                  className={`text-base font-bold ${
                    assessment.profit >= 0 ? 'text-emerald-700' : 'text-red-600'
                  }`}
                >
                  {peso(assessment.profit)}
                </span>
              </div>

              <div>
                <span className="text-emerald-900 font-semibold block">Projected Return on Investment:</span>
                <span
                  className={`text-base font-bold ${
                    assessment.roi >= 25
                      ? 'text-emerald-700'
                      : assessment.roi >= 10
                      ? 'text-amber-700'
                      : 'text-red-600'
                  }`}
                >
                  {assessment.roi.toFixed(1)}% ROI
                </span>
              </div>

              <div className="sm:text-right">
                <span className="text-gray-500 block text-[11px]">Rule Recommendation</span>
                <span className="font-semibold text-gray-800">{recMeta.label}</span>
              </div>
            </div>
          </div>

          {/* Inspection Readiness & Inspection Module Slot */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Search size={16} className="text-blue-600" />
                <h2 className="text-sm font-semibold text-gray-900">Inspection & Diagnostics Preparation</h2>
              </div>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium">
                {item.status === 'inspection' ? 'Inspection Ready' : 'Pipeline Linked'}
              </span>
            </div>

            <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-4 text-xs text-blue-900 space-y-2">
              <div className="flex items-start gap-2">
                <Info size={16} className="text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-blue-950">
                    Inspection Station Integration
                  </p>
                  <p className="text-blue-800 mt-0.5 leading-relaxed">
                    This item is registered in the ReClaim inventory pipeline. Detailed hardware diagnostic checklists, functional test reports, and repair tickets will link directly to reference <span className="font-mono font-semibold">{item.reference}</span>.
                  </p>
                </div>
              </div>

              <div className="pt-2 flex flex-wrap items-center gap-2">
                <Link
                  to={`/inspections`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  <Search size={13} />
                  Open Inspection Module
                </Link>
                {item.status !== 'inspection' && (
                  <button
                    onClick={() => {
                      setTransitioningTo('inspection');
                      setTransitionNote('Moved to inspection queue');
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors font-medium"
                  >
                    Queue for Inspection
                  </button>
                )}
              </div>
            </div>
          </div>
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
    </div>
  );
}
