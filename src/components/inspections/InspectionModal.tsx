import { useState } from 'react';
import {
  X,
  ClipboardCheck,
  Check,
  Plus,
  Trash2,
  AlertCircle,
  Loader2,
  Calendar,
  User,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { DEFAULT_CHECKLIST } from '../../data/inspectionChecklist';
import { createInspection } from '../../lib/inspectionsApi';
import { updateItem, setStatus } from '../../lib/itemsApi';
import { useAuth } from '../../context/AuthContext';
import {
  OverallCondition,
  ComponentCondition,
  ComponentType,
  OVERALL_CONDITION_META,
  COMPONENT_CONDITION_META,
  Item,
  Inspection,
} from '../../types';

interface InspectionModalProps {
  item: Item;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newInspection: Inspection) => void;
}

interface ChecklistFormItem {
  id: string;
  name: string;
  category: 'physical' | 'functional' | 'custom';
  type: ComponentType;
  condition: ComponentCondition;
  notes: string;
}

const CONDITION_KEYS: ComponentCondition[] = [
  'GOOD',
  'MINOR_ISSUE',
  'DAMAGED',
  'NOT_TESTED',
  'NOT_APPLICABLE',
];

const OVERALL_CONDITIONS: OverallCondition[] = [
  'GOOD',
  'FAIR',
  'POOR',
  'NON_FUNCTIONAL',
  'UNASSESSED',
];

export default function InspectionModal({
  item,
  isOpen,
  onClose,
  onSuccess,
}: InspectionModalProps) {
  const { user, profile } = useAuth();

  const inspectorInitial = profile?.full_name || user?.email?.split('@')[0] || '';
  const [inspectedBy, setInspectedBy] = useState(inspectorInitial);
  const [inspectionDate, setInspectionDate] = useState(
    new Date().toISOString().substring(0, 16)
  );
  const [overallCondition, setOverallCondition] = useState<OverallCondition>('UNASSESSED');
  const [generalNotes, setGeneralNotes] = useState('');

  // Optional item updates
  const [updateItemStatusToInspection, setUpdateItemStatusToInspection] = useState(
    item.status === 'unknown'
  );
  const [newRepairEstimate, setNewRepairEstimate] = useState<number>(
    item.repair_estimate || 0
  );
  const [applyRepairEstimate, setApplyRepairEstimate] = useState(false);

  // Initialize checklist items from templates
  const [checklist, setChecklist] = useState<ChecklistFormItem[]>(() =>
    DEFAULT_CHECKLIST.map((template, idx) => ({
      id: `std-${idx}`,
      name: template.name,
      category: template.category,
      type: template.type,
      condition: template.defaultCondition || 'NOT_TESTED',
      notes: '',
    }))
  );

  // Custom component input state
  const [customName, setCustomName] = useState('');
  const [customCategory, setCustomCategory] = useState<'physical' | 'functional' | 'custom'>(
    'functional'
  );
  const [showAddCustom, setShowAddCustom] = useState(false);

  // Submission state
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleConditionChange = (id: string, condition: ComponentCondition) => {
    setChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, condition } : item))
    );
  };

  const handleNotesChange = (id: string, notes: string) => {
    setChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, notes } : item))
    );
  };

  const handleAddCustom = () => {
    if (!customName.trim()) {
      toast.error('Component name is required.');
      return;
    }
    const newItem: ChecklistFormItem = {
      id: `custom-${Date.now()}`,
      name: customName.trim(),
      category: customCategory,
      type: customCategory,
      condition: 'NOT_TESTED',
      notes: '',
    };
    setChecklist((prev) => [...prev, newItem]);
    setCustomName('');
    setShowAddCustom(false);
    toast.success(`Added ${newItem.name} to checklist`);
  };

  const handleRemoveItem = (id: string) => {
    setChecklist((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation: overall condition must be selected
    if (!overallCondition) {
      setError('Please select an overall hardware condition.');
      return;
    }

    try {
      setSaving(true);

      const inspection = await createInspection({
        item_id: item.id,
        inspected_by: inspectedBy.trim() || null,
        inspection_date: new Date(inspectionDate).toISOString(),
        overall_condition: overallCondition,
        general_notes: generalNotes.trim() || null,
        results: checklist.map((c) => ({
          component_name: c.name,
          component_type: c.type,
          condition: c.condition,
          notes: c.notes.trim() || null,
        })),
      });

      // Optionally update item repair estimate if inspector adjusted it
      if (applyRepairEstimate && newRepairEstimate !== item.repair_estimate) {
        await updateItem(item.id, {
          repair_estimate: Math.max(0, Number(newRepairEstimate) || 0),
        });
      }

      // Optionally advance item status to inspection if selected
      if (updateItemStatusToInspection && item.status !== 'inspection') {
        await setStatus(item.id, 'inspection', 'Item moved to inspection station');
      }

      toast.success('Inspection record saved successfully!');
      onSuccess(inspection);
      onClose();
    } catch (err: any) {
      console.error('Inspection submit error:', err);
      setError(err.message || 'Failed to save inspection.');
    } finally {
      setSaving(false);
    }
  };

  // Group checklist items by category
  const physicalItems = checklist.filter((i) => i.category === 'physical');
  const functionalItems = checklist.filter((i) => i.category === 'functional');
  const customItems = checklist.filter((i) => i.category === 'custom');

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full my-auto shadow-2xl flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150 border border-gray-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <ClipboardCheck size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">
                New Inspection & Diagnostics Checklist
              </h2>
              <p className="text-xs text-gray-500">
                Recording inspection for <span className="font-semibold text-gray-800">{item.name}</span> ({item.reference})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={saving}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 text-sm">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Top Inspector & Date Metadata Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
                <User size={13} className="text-gray-500" />
                Inspector Display Name
              </label>
              <input
                type="text"
                value={inspectedBy}
                onChange={(e) => setInspectedBy(e.target.value)}
                placeholder="e.g. Alex Tech, John Doe"
                className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
                <Calendar size={13} className="text-gray-500" />
                Inspection Date & Time
              </label>
              <input
                type="datetime-local"
                value={inspectionDate}
                onChange={(e) => setInspectionDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Section: Overall Condition (Mandatory separate selection) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider">
                Overall Item Condition <span className="text-red-500">*</span>
              </label>
              <span className="text-[11px] text-gray-400">
                Assessed independently from individual components
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {OVERALL_CONDITIONS.map((cond) => {
                const meta = OVERALL_CONDITION_META[cond];
                const isSelected = overallCondition === cond;
                return (
                  <button
                    key={cond}
                    type="button"
                    onClick={() => setOverallCondition(cond)}
                    className={`p-3 rounded-xl border text-left transition-all relative ${
                      isSelected
                        ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/50 shadow-xs'
                        : 'border-gray-200 bg-white hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-base">{meta.icon}</span>
                      {isSelected && (
                        <span className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">
                          ✓
                        </span>
                      )}
                    </div>
                    <div className="font-semibold text-xs text-gray-900">{meta.label}</div>
                    <div className="text-[10px] text-gray-500 leading-tight mt-1 line-clamp-2">
                      {meta.description}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section: General Notes */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              General Diagnostic Notes & Observations
            </label>
            <textarea
              rows={2}
              value={generalNotes}
              onChange={(e) => setGeneralNotes(e.target.value)}
              placeholder="e.g. Unit powers on to desktop, slight cosmetic scratch on top lid, keyboard typing smoothly..."
              className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* Section: Component Checklist */}
          <div className="space-y-4 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-gray-200 gap-2">
              <div>
                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                  Hardware Component Diagnostics Checklist
                </h3>
                <p className="text-[11px] text-gray-500">
                  Evaluate individual modules. Unchecked items default to Not Tested; items not present on this model can be set to Not Applicable.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowAddCustom(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors shrink-0"
              >
                <Plus size={13} />
                Add Custom Component
              </button>
            </div>

            {/* Add Custom Component Sub-form */}
            {showAddCustom && (
              <div className="p-3.5 bg-blue-50/60 border border-blue-200 rounded-xl space-y-3 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-900">
                    Add Custom Hardware Check
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowAddCustom(false)}
                    className="text-gray-400 hover:text-gray-600 text-xs"
                  >
                    Cancel
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="Component name (e.g. SIM Card Tray, Stylus Pen, Touchpad...)"
                    className="flex-1 px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                  <select
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value as any)}
                    className="px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-lg text-gray-700"
                  >
                    <option value="physical">Physical Category</option>
                    <option value="functional">Functional Category</option>
                    <option value="custom">Other Custom Category</option>
                  </select>
                  <button
                    type="button"
                    onClick={handleAddCustom}
                    className="px-4 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Add Check
                  </button>
                </div>
              </div>
            )}

            {/* Checklist Groups */}
            <div className="space-y-6">
              {/* Group 1: Physical Condition */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-800 uppercase tracking-wide">
                    1. Physical Condition Checks ({physicalItems.length})
                  </span>
                </div>
                <div className="divide-y divide-gray-100 border border-gray-200 rounded-xl bg-white overflow-hidden shadow-2xs">
                  {physicalItems.map((item) => (
                    <ChecklistRow
                      key={item.id}
                      item={item}
                      onConditionChange={(c) => handleConditionChange(item.id, c)}
                      onNotesChange={(n) => handleNotesChange(item.id, n)}
                      onRemove={() => handleRemoveItem(item.id)}
                    />
                  ))}
                </div>
              </div>

              {/* Group 2: Functional Tests */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-800 uppercase tracking-wide">
                    2. Functional Tests ({functionalItems.length})
                  </span>
                </div>
                <div className="divide-y divide-gray-100 border border-gray-200 rounded-xl bg-white overflow-hidden shadow-2xs">
                  {functionalItems.map((item) => (
                    <ChecklistRow
                      key={item.id}
                      item={item}
                      onConditionChange={(c) => handleConditionChange(item.id, c)}
                      onNotesChange={(n) => handleNotesChange(item.id, n)}
                      onRemove={() => handleRemoveItem(item.id)}
                    />
                  ))}
                </div>
              </div>

              {/* Group 3: Custom / Extra Checks if any */}
              {customItems.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-800 uppercase tracking-wide">
                      3. Custom Additional Checks ({customItems.length})
                    </span>
                  </div>
                  <div className="divide-y divide-gray-100 border border-gray-200 rounded-xl bg-white overflow-hidden shadow-2xs">
                    {customItems.map((item) => (
                      <ChecklistRow
                        key={item.id}
                        item={item}
                        isCustom
                        onConditionChange={(c) => handleConditionChange(item.id, c)}
                        onNotesChange={(n) => handleNotesChange(item.id, n)}
                        onRemove={() => handleRemoveItem(item.id)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section: Linked Pipeline Options */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
            <span className="text-xs font-bold text-gray-800 block">
              Follow-up Pipeline Options
            </span>

            <div className="space-y-2 text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={updateItemStatusToInspection}
                  onChange={(e) => setUpdateItemStatusToInspection(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <span className="text-gray-700">
                  Update item status to <span className="font-semibold">Inspection</span> in the inventory pipeline
                </span>
              </label>

              <div className="pt-2 flex flex-col sm:flex-row sm:items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={applyRepairEstimate}
                    onChange={(e) => setApplyRepairEstimate(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                  />
                  <span className="text-gray-700">
                    Update item estimated repair cost:
                  </span>
                </label>

                {applyRepairEstimate && (
                  <div className="flex items-center gap-1">
                    <span className="text-gray-500 font-semibold">₱</span>
                    <input
                      type="number"
                      min={0}
                      value={newRepairEstimate}
                      onChange={(e) => setNewRepairEstimate(Number(e.target.value) || 0)}
                      className="w-28 px-2 py-1 text-xs bg-white border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer Submit Actions */}
          <div className="pt-4 border-t border-gray-200 flex items-center justify-end gap-3 sticky bottom-0 bg-white/95 backdrop-blur-xs py-3 -mx-6 px-6">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm disabled:opacity-50 transition-colors"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              <span>Save Inspection Record</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Checklist Row Component
interface ChecklistRowProps {
  item: ChecklistFormItem;
  isCustom?: boolean;
  onConditionChange: (condition: ComponentCondition) => void;
  onNotesChange: (notes: string) => void;
  onRemove: () => void;
}

function ChecklistRow({
  item,
  isCustom = false,
  onConditionChange,
  onNotesChange,
  onRemove,
}: ChecklistRowProps) {
  const [showNotes, setShowNotes] = useState(!!item.notes);

  return (
    <div className="p-3 sm:px-4 hover:bg-gray-50/60 transition-colors space-y-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-44">
          <span className="text-xs font-medium text-gray-900">{item.name}</span>
          {isCustom && (
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-50 text-purple-700 font-medium border border-purple-200">
              Custom
            </span>
          )}
        </div>

        {/* 5-condition selector button pills */}
        <div className="flex flex-wrap items-center gap-1">
          {CONDITION_KEYS.map((cond) => {
            const meta = COMPONENT_CONDITION_META[cond];
            const isSelected = item.condition === cond;
            return (
              <button
                key={cond}
                type="button"
                onClick={() => onConditionChange(cond)}
                className={`px-2 py-1 text-[11px] font-medium rounded-md border transition-all ${
                  isSelected
                    ? meta.activeCls
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100'
                }`}
                title={meta.label}
              >
                <span className="mr-1">{meta.icon}</span>
                <span>{meta.label}</span>
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => setShowNotes(!showNotes)}
            className={`p-1 text-xs rounded transition-colors ${
              showNotes || item.notes
                ? 'text-blue-600 bg-blue-50'
                : 'text-gray-400 hover:text-gray-600'
            }`}
            title="Toggle component notes"
          >
            💬
          </button>

          {isCustom && (
            <button
              type="button"
              onClick={onRemove}
              className="p-1 text-gray-400 hover:text-red-600 transition-colors"
              title="Delete custom check"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Component Notes Input */}
      {showNotes && (
        <div className="pt-1">
          <input
            type="text"
            value={item.notes}
            onChange={(e) => onNotesChange(e.target.value)}
            placeholder={`Notes for ${item.name} (e.g. 2 dead pixels, slight wear, 88% battery health...)`}
            className="w-full px-2.5 py-1 text-[11px] bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      )}
    </div>
  );
}
