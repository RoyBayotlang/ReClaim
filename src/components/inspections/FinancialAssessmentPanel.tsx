import { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Edit3,
  Loader2,
  Info,
  Sliders,
} from 'lucide-react';
import {
  calculateFinancialAssessment,
  formatPeso,
  RECOMMENDATION_META,
  DEFAULT_THRESHOLDS,
  AssessmentThresholds,
} from '../../lib/assessment';
import type { Item, Inspection } from '../../types';

interface FinancialAssessmentPanelProps {
  item: Item;
  latestInspection?: Inspection | null;
  onUpdateRepairCost?: (newRepairCost: number) => Promise<void>;
}

export default function FinancialAssessmentPanel({
  item,
  latestInspection,
  onUpdateRepairCost,
}: FinancialAssessmentPanelProps) {
  const [isEditingRepairCost, setIsEditingRepairCost] = useState(false);
  const [repairCostInput, setRepairCostInput] = useState<number>(item.repair_estimate || 0);
  const [savingRepairCost, setSavingRepairCost] = useState(false);
  const [showThresholds, setShowThresholds] = useState(false);
  const [thresholds, setThresholds] = useState<AssessmentThresholds>(DEFAULT_THRESHOLDS);

  const assessment = calculateFinancialAssessment({
    purchaseCost: item.purchase_cost,
    repairCost: isEditingRepairCost ? repairCostInput : item.repair_estimate,
    resaleValue: item.resale_value,
    inspection: latestInspection,
    thresholds,
  });

  const recMeta = RECOMMENDATION_META[assessment.recommendation];

  const handleSaveRepairCost = async () => {
    if (!onUpdateRepairCost) return;
    try {
      setSavingRepairCost(true);
      await onUpdateRepairCost(Math.max(0, Number(repairCostInput) || 0));
      setIsEditingRepairCost(false);
    } catch (err) {
      console.error('Error saving repair cost:', err);
    } finally {
      setSavingRepairCost(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-gray-100 gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
            ₱
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900">
              Refurbishment Financial Assessment
            </h2>
            <p className="text-xs text-gray-500">
              Estimated economics, return on investment (ROI), and advisory recovery recommendations
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowThresholds(!showThresholds)}
            className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 bg-gray-50 hover:bg-gray-100 border border-gray-200 px-2.5 py-1 rounded-md transition-colors"
            title="Adjust rule thresholds"
          >
            <Sliders size={13} />
            <span>Rules</span>
          </button>

          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${recMeta.cls}`}
          >
            <span>{recMeta.icon}</span>
            <span>{recMeta.label}</span>
          </span>
        </div>
      </div>

      {/* Thresholds Configurator (Accordion) */}
      {showThresholds && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs space-y-2 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-gray-700 flex items-center gap-1">
              <Sliders size={13} />
              Configurable Decision Rules (Non-AI)
            </span>
            <button
              onClick={() => setThresholds(DEFAULT_THRESHOLDS)}
              className="text-[11px] text-emerald-600 hover:underline"
            >
              Reset to Defaults
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div>
              <label className="block text-[11px] text-gray-600 mb-1">
                Min. Refurbish ROI (%)
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={thresholds.minRefurbishRoi}
                onChange={(e) =>
                  setThresholds({
                    ...thresholds,
                    minRefurbishRoi: Number(e.target.value) || 0,
                  })
                }
                className="w-full p-1.5 bg-white border border-gray-300 rounded text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] text-gray-600 mb-1">
                Min. Review ROI (%)
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={thresholds.minReviewRoi}
                onChange={(e) =>
                  setThresholds({
                    ...thresholds,
                    minReviewRoi: Number(e.target.value) || 0,
                  })
                }
                className="w-full p-1.5 bg-white border border-gray-300 rounded text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] text-gray-600 mb-1">
                Min. Profit Threshold (₱)
              </label>
              <input
                type="number"
                min={0}
                step={100}
                value={thresholds.minProfit}
                onChange={(e) =>
                  setThresholds({
                    ...thresholds,
                    minProfit: Number(e.target.value) || 0,
                  })
                }
                className="w-full p-1.5 bg-white border border-gray-300 rounded text-xs"
              />
            </div>
          </div>
        </div>
      )}

      {/* 4 Financial Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
        {/* Purchase Cost */}
        <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
          <span className="text-[11px] text-gray-500 font-medium block">Purchase Cost</span>
          <span className="text-sm sm:text-base font-bold text-gray-900 mt-0.5 block">
            {formatPeso(assessment.purchaseCost)}
          </span>
          <span className="text-[10px] text-gray-400">Acquisition</span>
        </div>

        {/* Estimated Repair Cost */}
        <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 relative group">
          <div className="flex items-center justify-center gap-1">
            <span className="text-[11px] text-gray-500 font-medium">Est. Repair Cost</span>
            {!isEditingRepairCost && onUpdateRepairCost && (
              <button
                type="button"
                onClick={() => {
                  setRepairCostInput(item.repair_estimate || 0);
                  setIsEditingRepairCost(true);
                }}
                className="text-gray-400 hover:text-emerald-600 transition-colors"
                title="Edit repair estimate"
              >
                <Edit3 size={11} />
              </button>
            )}
          </div>

          {isEditingRepairCost ? (
            <div className="flex items-center gap-1 mt-1">
              <input
                type="number"
                min={0}
                step={50}
                value={repairCostInput}
                onChange={(e) => setRepairCostInput(Number(e.target.value) || 0)}
                className="w-full text-xs p-1 border border-emerald-400 rounded focus:outline-none"
                autoFocus
              />
              <button
                type="button"
                disabled={savingRepairCost}
                onClick={handleSaveRepairCost}
                className="px-2 py-1 bg-emerald-600 text-white rounded text-xs font-bold hover:bg-emerald-700 disabled:opacity-50"
              >
                {savingRepairCost ? <Loader2 size={11} className="animate-spin" /> : '✓'}
              </button>
              <button
                type="button"
                onClick={() => setIsEditingRepairCost(false)}
                className="px-1.5 py-1 text-gray-400 hover:text-gray-600 text-xs"
              >
                ✕
              </button>
            </div>
          ) : (
            <span className="text-sm sm:text-base font-bold text-gray-900 mt-0.5 block">
              {formatPeso(assessment.repairCost)}
            </span>
          )}
          <span className="text-[10px] text-gray-400">Parts & labor</span>
        </div>

        {/* Total Investment */}
        <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
          <span className="text-[11px] text-gray-500 font-medium block">Total Investment</span>
          <span className="text-sm sm:text-base font-bold text-gray-900 mt-0.5 block">
            {formatPeso(assessment.totalInvestment)}
          </span>
          <span className="text-[10px] text-gray-400">Purchase + Repair</span>
        </div>

        {/* Estimated Resale Value */}
        <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
          <span className="text-[11px] text-gray-500 font-medium block">Est. Resale Value</span>
          <span className="text-sm sm:text-base font-bold text-emerald-700 mt-0.5 block">
            {formatPeso(assessment.resaleValue)}
          </span>
          <span className="text-[10px] text-gray-400">Market Target</span>
        </div>
      </div>

      {/* Primary Calculation Highlight Box */}
      <div className="bg-linear-to-r from-emerald-50/70 to-blue-50/70 border border-emerald-100 rounded-xl p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <span className="text-xs font-semibold text-gray-700 block">Expected Profit:</span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span
                className={`text-xl font-extrabold ${
                  assessment.expectedProfit >= 0 ? 'text-emerald-700' : 'text-red-600'
                }`}
              >
                {formatPeso(assessment.expectedProfit)}
              </span>
              <span className="text-xs text-gray-500">
                (Resale − Total Investment)
              </span>
            </div>
          </div>

          <div>
            <span className="text-xs font-semibold text-gray-700 block">
              Estimated Return on Investment (ROI):
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span
                className={`text-xl font-extrabold ${
                  assessment.estimatedRoi >= thresholds.minRefurbishRoi
                    ? 'text-emerald-700'
                    : assessment.estimatedRoi >= thresholds.minReviewRoi
                    ? 'text-amber-700'
                    : 'text-red-600'
                }`}
              >
                {assessment.estimatedRoi.toFixed(1)}%
              </span>
              <span className="text-xs text-gray-500">
                (Profit ÷ Investment × 100)
              </span>
            </div>
          </div>
        </div>

        {/* Advisory Disclaimer */}
        <div className="mt-3 pt-3 border-t border-emerald-100/80 flex items-start gap-1.5 text-[11px] text-gray-500">
          <Info size={13} className="shrink-0 text-emerald-600 mt-0.5" />
          <p>
            <span className="font-semibold text-gray-700">Financial Estimates Only:</span> All
            figures are projections based on entered cost inputs and anticipated market pricing, not
            guaranteed revenues.
          </p>
        </div>
      </div>

      {/* Explainable Recommendation Banner */}
      <div
        className={`border rounded-lg p-4 space-y-1.5 text-xs ${
          assessment.recommendation === 'REFURBISH'
            ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
            : assessment.recommendation === 'REVIEW_MANUALLY'
            ? 'bg-amber-50/60 border-amber-200 text-amber-950'
            : 'bg-red-50/60 border-red-200 text-red-950'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {assessment.recommendation === 'REFURBISH' ? (
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            ) : assessment.recommendation === 'REVIEW_MANUALLY' ? (
              <AlertTriangle size={16} className="text-amber-600 shrink-0" />
            ) : (
              <XCircle size={16} className="text-red-600 shrink-0" />
            )}
            <span className="font-bold text-xs uppercase tracking-wide">
              Advisory Recommendation: {recMeta.label}
            </span>
          </div>

          <span className="text-[11px] opacity-75">
            Rule-Based Threshold Logic
          </span>
        </div>

        <p className="leading-relaxed pl-6 text-gray-800">
          {assessment.reason}
        </p>

        <p className="text-[11px] opacity-70 pl-6 pt-0.5 italic">
          * Advisory only. Inventory status is never automatically updated without technician confirmation.
        </p>
      </div>
    </div>
  );
}
