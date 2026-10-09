import { STATUS_META, Status } from '../types'
export default function StatusBadge({ status }: { status: Status }) {
  const m = STATUS_META[status]
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${m.cls}`}>{m.label}</span>
}
