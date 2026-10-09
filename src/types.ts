export type Status = 'unknown'|'inspection'|'needs_refurbishment'|'in_repair'|'quality_control'|'ready_to_sell'|'parts_only'|'disposed'|'sold'
export interface Item {
  id: string; reference: string; name: string; category: string|null; brand: string|null; model: string|null
  serial_number: string|null; description: string|null; purchase_cost: number; resale_value: number
  repair_estimate: number; status: Status; notes: string|null; received_at: string; created_at: string
}
export interface HistoryEntry { id: string; from_status: Status|null; to_status: Status; note: string|null; created_at: string }
export const STATUS_META: Record<Status,{label:string;cls:string;icon:string}> = {
  unknown:{label:'Unknown Condition',cls:'bg-gray-100 text-gray-700',icon:'📦'},
  inspection:{label:'Inspection',cls:'bg-blue-100 text-blue-700',icon:'🔍'},
  needs_refurbishment:{label:'Needs Refurbishment',cls:'bg-amber-100 text-amber-800',icon:'⚠️'},
  in_repair:{label:'In Repair',cls:'bg-orange-100 text-orange-700',icon:'🔧'},
  quality_control:{label:'Quality Control',cls:'bg-purple-100 text-purple-700',icon:'🧪'},
  ready_to_sell:{label:'Ready to Sell',cls:'bg-green-100 text-green-700',icon:'🏷️'},
  parts_only:{label:'Parts Only',cls:'bg-red-100 text-red-800',icon:'🧩'},
  disposed:{label:'Disposed',cls:'bg-gray-200 text-gray-600',icon:'🗑️'},
  sold:{label:'Sold',cls:'bg-green-200 text-green-800',icon:'💰'},
}
// Allowed next steps in the main workflow
export const NEXT: Record<Status,Status[]> = {
  unknown:['inspection'], inspection:['needs_refurbishment','ready_to_sell','parts_only','disposed'],
  needs_refurbishment:['in_repair','parts_only','disposed'], in_repair:['quality_control'],
  quality_control:['ready_to_sell','in_repair'], ready_to_sell:['sold'], parts_only:['disposed'], disposed:[], sold:[],
}
