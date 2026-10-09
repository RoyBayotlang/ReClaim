import { useEffect, useState, FormEvent } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { createItem, listItems } from '../lib/itemsApi'
import { assess, peso } from '../lib/assessment'
import { Item, Status, STATUS_META } from '../types'
import StatusBadge from '../components/StatusBadge'
const blank = { reference: '', name: '', category: '', brand: '', model: '', serial_number: '', purchase_cost: 0, resale_value: 0, notes: '' }
export default function Items() {
  const [items, setItems] = useState<Item[]>([]); const [q, setQ] = useState(''); const [st, setSt] = useState<'all'|Status>('all')
  const [sort, setSort] = useState<'new'|'profit'>('new'); const [open, setOpen] = useState(false); const [f, setF] = useState(blank)
  const load = () => listItems().then(setItems).catch(e => toast.error(e.message)); useEffect(() => { load() }, [])
  const profit = (i: Item) => assess(i.purchase_cost, i.repair_estimate, i.resale_value).profit
  const shown = items.filter(i => (st === 'all' || i.status === st) &&
    [i.reference, i.name, i.brand, i.model, i.serial_number].join(' ').toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => sort === 'profit' ? profit(b) - profit(a) : 0)
  async function add(e: FormEvent) {
    e.preventDefault()
    if (f.resale_value < 0 || f.purchase_cost < 0) return toast.error('Amounts cannot be negative')
    try { await createItem({ ...f, status: 'unknown' }); toast.success('Item received'); setF(blank); setOpen(false); load() } catch (er: any) { toast.error(er.message) }
  }
  const inp = 'border rounded px-3 py-2 text-sm w-full'
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <input className={inp + ' flex-1 min-w-[200px]'} placeholder="Search reference, name, brand, model, serial…" value={q} onChange={e => setQ(e.target.value)} />
        <select className="border rounded px-2 text-sm" value={st} onChange={e => setSt(e.target.value as any)}><option value="all">All statuses</option>
          {Object.entries(STATUS_META).map(([k, m]) => <option key={k} value={k}>{m.label}</option>)}</select>
        <select className="border rounded px-2 text-sm" value={sort} onChange={e => setSort(e.target.value as any)}><option value="new">Newest</option><option value="profit">Highest profit</option></select>
        <button className="bg-slate-900 text-white rounded px-4 text-sm" onClick={() => setOpen(!open)}>+ Receive item</button></div>
      {open && <form onSubmit={add} className="bg-white border rounded-lg p-4 grid sm:grid-cols-3 gap-2">
        <input required className={inp} placeholder="Reference (REF-1030)" value={f.reference} onChange={e => setF({ ...f, reference: e.target.value })} />
        <input required className={inp} placeholder="Product name" value={f.name} onChange={e => setF({ ...f, name: e.target.value })} />
        <input className={inp} placeholder="Category" value={f.category} onChange={e => setF({ ...f, category: e.target.value })} />
        <input className={inp} placeholder="Brand" value={f.brand} onChange={e => setF({ ...f, brand: e.target.value })} />
        <input className={inp} placeholder="Model" value={f.model} onChange={e => setF({ ...f, model: e.target.value })} />
        <input className={inp} placeholder="Serial number" value={f.serial_number} onChange={e => setF({ ...f, serial_number: e.target.value })} />
        <input type="number" className={inp} placeholder="Purchase cost ₱" value={f.purchase_cost || ''} onChange={e => setF({ ...f, purchase_cost: +e.target.value })} />
        <input type="number" className={inp} placeholder="Est. resale value ₱" value={f.resale_value || ''} onChange={e => setF({ ...f, resale_value: +e.target.value })} />
        <button className="bg-orange-500 text-white rounded text-sm py-2">Save</button></form>}
      {!shown.length ? <p className="text-center text-gray-500 bg-white border rounded-lg p-8">No items match.</p> :
        <div className="bg-white border rounded-lg overflow-x-auto"><table className="w-full text-sm">
          <thead className="text-left text-gray-500 border-b"><tr><th className="p-3">Ref</th><th>Product</th><th>Status</th><th>Cost</th><th>Resale</th><th>Est. profit</th></tr></thead>
          <tbody>{shown.map(i => <tr key={i.id} className="border-b last:border-0 hover:bg-slate-50">
            <td className="p-3"><Link className="text-blue-600" to={`/items/${i.id}`}>{i.reference}</Link></td><td>{i.name}</td>
            <td><StatusBadge status={i.status} /></td><td>{peso(i.purchase_cost)}</td><td>{peso(i.resale_value)}</td><td>{peso(profit(i))}</td></tr>)}</tbody></table></div>}
    </div>)
}
