import { supabase } from './supabase'
import type { Item, Status, HistoryEntry } from '../types'
export type NewItem = Omit<Item,'id'|'created_at'>
export async function listItems(): Promise<Item[]> {
  const { data, error } = await supabase.from('items').select('*').order('created_at',{ascending:false})
  if (error) throw error; return data as Item[]
}
export async function getItem(id: string): Promise<Item> {
  const { data, error } = await supabase.from('items').select('*').eq('id',id).single()
  if (error) throw error; return data as Item
}
export async function createItem(i: Partial<NewItem>) {
  const { error } = await supabase.from('items').insert(i); if (error) throw error
}
export async function setStatus(id: string, status: Status) {
  const { error } = await supabase.from('items').update({ status }).eq('id',id); if (error) throw error
}
export async function updateItem(id: string, patch: Partial<Item>) {
  const { error } = await supabase.from('items').update(patch).eq('id',id); if (error) throw error
}
export async function deleteItem(id: string) {
  const { error } = await supabase.from('items').delete().eq('id',id); if (error) throw error
}
export async function getHistory(id: string): Promise<HistoryEntry[]> {
  const { data, error } = await supabase.from('status_history').select('*').eq('item_id',id).order('created_at')
  if (error) throw error; return data as HistoryEntry[]
}
export async function seedDemo() { const { error } = await supabase.rpc('seed_demo'); if (error) throw error }
