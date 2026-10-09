import { useEffect, useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Pie, PieChart, Cell } from 'recharts'
import { listItems, seedDemo } from '../lib/itemsApi'
import { assess, peso } from '../lib/assessment'
import { Item, STATUS_META } from '../types'
import toast from 'react-hot-toast'
const Card = ({ label, value }: { label: string; value: string|number }) =>
  <div className="bg-white rounded-lg border p-4"><p className="text-xs text-gray-500">{label}</p><p className="text-2xl font-semibold mt-1">{value}</p></div>
export default function Dashboard() {
  const [items, setItems] = useState<Item[]|null>(null)
  const load = () => listItems().then(setItems).catch(e => toast.error(e.message))
  useEffect(() => { load() }, [])
  const s = useMemo(() => {
    const it = items ?? []; const n = (st: string[]) => it.filter(i => st.includes(i.status)).length
    const active = it.filter(i => !['sold','disposed','parts_only'].includes(i.status))
    const byStatus = Object.entries(STATUS_META).map(([k, m]) => ({ name: m.label, value: it.filter(i => i.status === k).length })).filter(d => d.value)
    const cats: Record<string, number> = {}; it.forEach(i => { const c = i.category ?? 'Other'; cats[c] = (cats[c] ?? 0) + 1 })
    return { total: it.length, awaiting: n(['unknown','inspection']), repair: n(['in_repair']), qc: n(['quality_control']), ready: n(['ready_to_sell']), sold: n(['sold']), parts: n(['parts_only']),
      value: active.reduce((a, i) => a + i.resale_value, 0), profit: active.reduce((a, i) => a + assess(i.purchase_cost, i.repair_estimate, i.resale_value).profit, 0),
      byStatus, cats: Object.entries(cats).map(([name, value]) => ({ name, value })) }
  }, [items])
  if (!items) return <p className="text-gray-500">Loading…</p>
  if (!items.length) return (
    <div className="text-center bg-white border rounded-lg p-10"><p className="text-lg font-medium">No items yet</p>
      <p className="text-sm text-gray-500 mb-4">Receive your first item, or load sample data to explore.</p>
      <button className="bg-slate-900 text-white rounded px-4 py-2 text-sm" onClick={async () => { await seedDemo(); toast.success('Demo data loaded'); load() }}>Load demo data</button></div>)
  const COLORS = ['#64748b','#3b82f6','#f59e0b','#f97316','#a855f7','#22c55e','#991b1b','#9ca3af','#16a34a']
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card label="Total items" value={s.total} /><Card label="Awaiting inspection" value={s.awaiting} /><Card label="In refurbishment" value={s.repair} /><Card label="Awaiting QC" value={s.qc} />
        <Card label="Ready to sell" value={s.ready} /><Card label="Sold" value={s.sold} /><Card label="Parts only" value={s.parts} />
        <Card label="Inventory value (est.)" value={peso(s.value)} /><Card label="Potential profit (est.)" value={peso(s.profit)} /></div>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white border rounded-lg p-4 h-72"><p className="text-sm font-medium mb-2">Items by status</p>
          <ResponsiveContainer><PieChart><Pie data={s.byStatus} dataKey="value" nameKey="name" outerRadius={80} label>{s.byStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></div>
        <div className="bg-white border rounded-lg p-4 h-72"><p className="text-sm font-medium mb-2">Top categories</p>
          <ResponsiveContainer><BarChart data={s.cats}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="value" fill="#f97316" /></BarChart></ResponsiveContainer></div></div>
      <p className="text-xs text-gray-500">Profit figures are estimates and do not guarantee actual resale results.</p>
    </div>)
}
