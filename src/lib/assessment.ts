// Configurable thresholds (rule-based, not AI)
export const THRESHOLDS = { refurbishRoi: 25, reviewRoi: 10 }
export type Recommendation = 'refurbish'|'review'|'parts'
export function assess(purchase: number, repair: number, resale: number) {
  const investment = purchase + repair
  const profit = resale - investment
  const roi = investment > 0 ? (profit / investment) * 100 : 0
  const rec: Recommendation = roi >= THRESHOLDS.refurbishRoi ? 'refurbish' : roi >= THRESHOLDS.reviewRoi ? 'review' : 'parts'
  return { investment, profit, roi, rec }
}
export const REC_META = {
  refurbish:{label:'🟢 Refurbish',cls:'bg-green-50 border-green-300 text-green-800'},
  review:{label:'🟡 Review Manually',cls:'bg-amber-50 border-amber-300 text-amber-800'},
  parts:{label:'🔴 Parts Only / Dispose',cls:'bg-red-50 border-red-300 text-red-800'},
}
export const peso = (n: number) => '₱' + n.toLocaleString('en-PH', { maximumFractionDigits: 0 })
