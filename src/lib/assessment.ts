import type { OverallCondition, InspectionResult } from '../types';

/**
 * Recommendation outcome for refurbishment financial assessment
 */
export type RecommendationCode = 'REFURBISH' | 'REVIEW_MANUALLY' | 'PARTS_ONLY';

// Backward-compatible alias
export type Recommendation = 'refurbish' | 'review' | 'parts';

export interface AssessmentThresholds {
  minRefurbishRoi: number; // minimum ROI % for automatic REFURBISH (default 25%)
  minReviewRoi: number;    // minimum ROI % below which item should be PARTS_ONLY (default 10%)
  minProfit: number;       // minimum expected profit in PHP (default ₱1,000)
}

export const DEFAULT_THRESHOLDS: AssessmentThresholds = {
  minRefurbishRoi: 25,
  minReviewRoi: 10,
  minProfit: 1000,
};

// Legacy alias
export const THRESHOLDS = {
  refurbishRoi: DEFAULT_THRESHOLDS.minRefurbishRoi,
  reviewRoi: DEFAULT_THRESHOLDS.minReviewRoi,
};

export interface FinancialAssessmentInput {
  purchaseCost: number | null | undefined;
  repairCost: number | null | undefined;
  resaleValue: number | null | undefined;
  inspection?: {
    overall_condition?: OverallCondition;
    results?: InspectionResult[];
  } | null;
  thresholds?: Partial<AssessmentThresholds>;
}

export interface FinancialAssessmentResult {
  purchaseCost: number;
  repairCost: number;
  resaleValue: number;
  totalInvestment: number;
  expectedProfit: number;
  estimatedRoi: number;
  recommendation: RecommendationCode;
  reason: string;
  isEstimate: boolean;
  thresholds: AssessmentThresholds;
  // Legacy fields
  investment: number;
  profit: number;
  roi: number;
  rec: Recommendation;
}

export const RECOMMENDATION_META: Record<
  RecommendationCode,
  { label: string; cls: string; icon: string; description: string }
> = {
  REFURBISH: {
    label: 'Refurbish',
    cls: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    icon: '🟢',
    description: 'Projected returns and hardware condition justify full refurbishment and resale.',
  },
  REVIEW_MANUALLY: {
    label: 'Review Manually',
    cls: 'bg-amber-100 text-amber-800 border-amber-300',
    icon: '🟡',
    description: 'Inspection is incomplete, costs are unconfirmed, or profit margins are borderline.',
  },
  PARTS_ONLY: {
    label: 'Parts Only / Harvest',
    cls: 'bg-red-100 text-red-800 border-red-300',
    icon: '🔴',
    description: 'Refurbishment costs exceed market recovery value. Best utilized for component harvesting.',
  },
};

// Legacy metadata
export const REC_META: Record<Recommendation, { label: string; cls: string }> = {
  refurbish: { label: '🟢 Refurbish', cls: 'bg-green-50 border-green-300 text-green-800' },
  review: { label: '🟡 Review Manually', cls: 'bg-amber-50 border-amber-300 text-amber-800' },
  parts: { label: '🔴 Parts Only / Dispose', cls: 'bg-red-50 border-red-300 text-red-800' },
};

/**
 * Format a number as Philippine Pesos (₱) safely
 */
export function formatPeso(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount) || !isFinite(amount)) {
    return '₱0';
  }
  return '₱' + Math.round(amount).toLocaleString('en-PH');
}

export const peso = formatPeso;

/**
 * Calculate financial refurbishment assessment and explainable recommendation
 */
export function calculateFinancialAssessment(
  input: FinancialAssessmentInput
): FinancialAssessmentResult {
  const purchaseCost = Math.max(0, Number(input.purchaseCost) || 0);
  const repairCost = Math.max(0, Number(input.repairCost) || 0);
  const resaleValue = Math.max(0, Number(input.resaleValue) || 0);

  const thresholds: AssessmentThresholds = {
    ...DEFAULT_THRESHOLDS,
    ...(input.thresholds || {}),
  };

  const totalInvestment = purchaseCost + repairCost;
  const expectedProfit = resaleValue - totalInvestment;

  // Safe ROI calculation: handle 0 investment without division by zero, NaN, or Infinity
  let estimatedRoi = 0;
  if (totalInvestment > 0) {
    const rawRoi = (expectedProfit / totalInvestment) * 100;
    estimatedRoi = isFinite(rawRoi) ? Number(rawRoi.toFixed(1)) : 0;
  }

  // Evaluate inspection context if provided
  const inspection = input.inspection;
  const overallCondition = inspection?.overall_condition;
  const results = inspection?.results || [];

  const damagedCount = results.filter((r) => r.condition === 'DAMAGED').length;
  const notTestedCount = results.filter((r) => r.condition === 'NOT_TESTED').length;

  let recommendation: RecommendationCode = 'REVIEW_MANUALLY';
  let reason = '';

  // 1. Missing or zero critical figures
  if (resaleValue <= 0) {
    recommendation = 'REVIEW_MANUALLY';
    reason =
      'Estimated resale value is not set. Resale estimate is required to project refurbishment viability.';
  } else if (purchaseCost <= 0 && repairCost <= 0) {
    recommendation = 'REVIEW_MANUALLY';
    reason =
      'Both purchase cost and repair estimate are ₱0. Verify actual acquisition and refurbishment expenses.';
  } else if (!overallCondition || overallCondition === 'UNASSESSED') {
    // Inspection incomplete
    recommendation = 'REVIEW_MANUALLY';
    reason =
      'Item has not completed diagnostic inspection. Hardware condition must be verified before proceeding.';
  }
  // 2. Clear PARTS_ONLY conditions (economics unviable or non-functional beyond recovery)
  else if (expectedProfit < 0) {
    recommendation = 'PARTS_ONLY';
    reason = `Negative expected return: total investment (${formatPeso(totalInvestment)}) exceeds resale value (${formatPeso(resaleValue)}) by ${formatPeso(Math.abs(expectedProfit))}.`;
  } else if (overallCondition === 'NON_FUNCTIONAL' && estimatedRoi < thresholds.minRefurbishRoi) {
    recommendation = 'PARTS_ONLY';
    reason = `Unit is non-functional and projected ROI (${estimatedRoi.toFixed(1)}%) does not justify high refurbishment risk. Recommend salvaging parts.`;
  } else if (damagedCount >= 4 && expectedProfit < thresholds.minProfit * 1.5) {
    recommendation = 'PARTS_ONLY';
    reason = `${damagedCount} damaged components detected. Economic repair scope exceeded; harvest working parts.`;
  }
  // 3. Borderline / Review Manually conditions
  else if (damagedCount >= 2 && overallCondition !== 'GOOD') {
    recommendation = 'REVIEW_MANUALLY';
    reason = `${damagedCount} critical components damaged. Manual technician review advised before committing parts order.`;
  } else if (notTestedCount >= 4 && results.length > 0) {
    recommendation = 'REVIEW_MANUALLY';
    reason = `${notTestedCount} components remain untested. Complete testing to ensure no hidden defects.`;
  } else if (estimatedRoi < thresholds.minReviewRoi) {
    recommendation = 'PARTS_ONLY';
    reason = `Projected ROI (${estimatedRoi.toFixed(1)}%) is below the minimum viability threshold (${thresholds.minReviewRoi}%).`;
  } else if (estimatedRoi < thresholds.minRefurbishRoi) {
    recommendation = 'REVIEW_MANUALLY';
    reason = `Projected ROI (${estimatedRoi.toFixed(1)}%) is below standard target (${thresholds.minRefurbishRoi}%). Review labor and parts budget.`;
  } else if (expectedProfit < thresholds.minProfit) {
    recommendation = 'REVIEW_MANUALLY';
    reason = `Expected profit (${formatPeso(expectedProfit)}) is below minimum margin threshold (${formatPeso(thresholds.minProfit)}).`;
  }
  // 4. Clean Refurbishment
  else {
    recommendation = 'REFURBISH';
    reason = `Favorable economics (${estimatedRoi.toFixed(1)}% ROI, ${formatPeso(expectedProfit)} profit) with ${overallCondition.toLowerCase()} physical condition. Proceed with refurbishment.`;
  }

  // Legacy recommendation code mapping
  const legacyRecMap: Record<RecommendationCode, Recommendation> = {
    REFURBISH: 'refurbish',
    REVIEW_MANUALLY: 'review',
    PARTS_ONLY: 'parts',
  };

  return {
    purchaseCost,
    repairCost,
    resaleValue,
    totalInvestment,
    expectedProfit,
    estimatedRoi,
    recommendation,
    reason,
    isEstimate: true,
    thresholds,
    // Legacy fields
    investment: totalInvestment,
    profit: expectedProfit,
    roi: estimatedRoi,
    rec: legacyRecMap[recommendation],
  };
}

/**
 * Backward compatible function matching existing assess(purchase, repair, resale)
 */
export function assess(
  purchase: number,
  repair: number,
  resale: number,
  inspection?: { overall_condition?: OverallCondition; results?: InspectionResult[] } | null
) {
  return calculateFinancialAssessment({
    purchaseCost: purchase,
    repairCost: repair,
    resaleValue: resale,
    inspection,
  });
}
