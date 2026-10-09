import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { deleteItem, getHistory, getItem, setStatus, updateItem } from '../lib/itemsApi'
import { assess, peso, REC_META } from '../lib/assessment'
import { HistoryEntry, Item, NEXT, Status, STATUS_META } from '../types'
import StatusBadge from '../components/StatusBadge'
export default function ItemDetail() {
  const { id } = useParams(); const nav = useNavigate()
  const [item, setItem] = useState<Item|null>(null); const [hist, setHist] = useState<HistoryEntry[]>([])
  const load = () => { getItem(id!).then(setItem).catch(() => toast.error('Item not found')); getHistory(id!).then(setHist) }
  useEffect(load, [id])
  if (!item) return <p className="text-gray-500">Loading…</p>
  const a = assess(item.purchase_cost, item.repair_estimate, item.resale_value); const rec = REC_META[a.rec]
  async function move(s: Status) { try { await setStatus(item!.id, s); toast.success(`Moved to ${STATUS_META[s].label}`); load() } catch (e: any) { toast.error(e.message) } }
  async function remove() { if (confirm(`Delete ${item!.reference}? This cannot be undone.`)) { await deleteItem(item!.id); toast.success('Deleted'); nav('/items') } }
  return (
    <div className="grid md:grid-cols-3 gap-4">
      <div className="md:col-span-2 space-y-4">
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-start justify-between"><div><p className="text-xs text-gray-500">{item.reference}</p><h1 className="text-xl font-semibold">{item.name}</h1>
            <p className="text-sm text-gray-500">{[item.category, item.brand, item.model, item.serial_number].filter(Boolean).join(' · ')}</p></div><StatusBadge status={item.status} /></div>
          <div className="flex flex-wrap gap-2 mt-4">{NEXT[item.status].map(s => <button key={s} onClick={() => move(s)} className="border rounded px-3 py-1.5 text-sm hover:bg-slate-50">→ {STATUS_META[s].label}</button>)}
            {!NEXT[item.status].length && <p className="text-sm text-gray-500">Workflow complete.</p>}</div></div>
        <div className="bg-white border rounded-lg p-4"><h2 className="font-medium mb-3">Refurbishment assessment</h2>
          <label className="text-sm text-gray-600">Estimated repair cost (₱)
            <input type="number" min={0} className="border rounded px-2 py-1 ml-2 w-32" defaultValue={item.repair_estimate}
              onBlur={async e => { await updateItem(item.id, { repair_estimate: Math.max(0, +e.target.value) }); load() }} /></label>
          <dl className="grid grid-cols-2 gap-2 text-sm mt-3">
            <dt>Purchase cost</dt><dd>{peso(item.purchase_cost)}</dd><dt>Repair estimate</dt><dd>{peso(item.repair_estimate)}</dd>
            <dt>Total investment</dt><dd>{peso(a.investment)}</dd><dt>Est. resale value</dt><dd>{peso(item.resale_value)}</dd>
            <dt className="font-medium">Expected profit</dt><dd className="font-medium">{peso(a.profit)}</dd><dt className="font-medium">Estimated ROI</dt><dd className="font-medium">{a.roi.toFixed(1)}%</dd></dl>
          <p className={`mt-3 border rounded p-2 text-center font-semibold ${rec.cls}`}>{rec.label}</p>
          <p className="text-xs text-gray-500 mt-2">Estimate only. Does not guarantee actual resale profit.</p></div>
        <button onClick={remove} className="text-sm text-red-600">Delete item</button>
      </div>
      <div className="bg-white border rounded-lg p-4 h-fit"><h2 className="font-medium mb-3">Timeline</h2>
        <ol className="border-l-2 border-slate-200 ml-2 space-y-4">{hist.map(h => <li key={h.id} className="ml-4 text-sm">
          <p>{STATUS_META[h.to_status].icon} {h.note ?? STATUS_META[h.to_status].label}</p><p className="text-xs text-gray-500">{new Date(h.created_at).toLocaleString('en-PH')}</p></li>)}</ol></div>
    </div>)
}
