import { supabase } from './supabase';
import type { Item, Status, HistoryEntry } from '../types';

export type NewItemInput = {
  reference?: string;
  name: string;
  category?: string | null;
  brand?: string | null;
  model?: string | null;
  serial_number?: string | null;
  description?: string | null;
  purchase_cost: number;
  resale_value: number;
  repair_estimate?: number;
  status?: Status;
  image_url?: string | null;
  notes?: string | null;
  received_at?: string;
};

export type UpdateItemInput = Partial<NewItemInput>;

/**
 * Fetch all items for current authenticated user, newest first.
 */
export async function listItems(): Promise<Item[]> {
  const { data, error } = await supabase
    .from('items')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data as Item[]) || [];
}

/**
 * Fetch a single item by ID.
 */
export async function getItem(id: string): Promise<Item> {
  const { data, error } = await supabase
    .from('items')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as Item;
}

/**
 * Generate next reference code (e.g., REF-1001, REF-1002...).
 */
export async function getNextReference(): Promise<string> {
  const { data } = await supabase
    .from('items')
    .select('reference')
    .order('created_at', { ascending: false })
    .limit(50);

  if (!data || data.length === 0) {
    return 'REF-1001';
  }

  // Find max numeric reference
  let maxNum = 1000;
  for (const row of data) {
    const match = row.reference?.match(/REF-(\d+)/i);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
  }

  return `REF-${maxNum + 1}`;
}

/**
 * Create a new item.
 */
export async function createItem(input: NewItemInput): Promise<Item> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) throw new Error('You must be logged in to create an item.');

  const reference = input.reference?.trim() || (await getNextReference());
  const today = new Date().toISOString().split('T')[0];

  const payload = {
    owner_id: userData.user.id,
    reference,
    name: input.name.trim(),
    category: input.category?.trim() || null,
    brand: input.brand?.trim() || null,
    model: input.model?.trim() || null,
    serial_number: input.serial_number?.trim() || null,
    description: input.description?.trim() || null,
    purchase_cost: Math.max(0, Number(input.purchase_cost) || 0),
    resale_value: Math.max(0, Number(input.resale_value) || 0),
    repair_estimate: Math.max(0, Number(input.repair_estimate) || 0),
    status: input.status || 'unknown',
    image_url: input.image_url?.trim() || null,
    notes: input.notes?.trim() || null,
    received_at: input.received_at || today,
  };

  const { data, error } = await supabase
    .from('items')
    .insert(payload)
    .select()
    .single();

  if (error) throw error;
  return data as Item;
}

/**
 * Update an existing item.
 */
export async function updateItem(id: string, patch: UpdateItemInput): Promise<Item> {
  const payload: Record<string, unknown> = {};

  if (patch.name !== undefined) payload.name = patch.name.trim();
  if (patch.reference !== undefined) payload.reference = patch.reference.trim();
  if (patch.category !== undefined) payload.category = patch.category ? patch.category.trim() : null;
  if (patch.brand !== undefined) payload.brand = patch.brand ? patch.brand.trim() : null;
  if (patch.model !== undefined) payload.model = patch.model ? patch.model.trim() : null;
  if (patch.serial_number !== undefined) payload.serial_number = patch.serial_number ? patch.serial_number.trim() : null;
  if (patch.description !== undefined) payload.description = patch.description ? patch.description.trim() : null;
  if (patch.purchase_cost !== undefined) payload.purchase_cost = Math.max(0, Number(patch.purchase_cost) || 0);
  if (patch.resale_value !== undefined) payload.resale_value = Math.max(0, Number(patch.resale_value) || 0);
  if (patch.repair_estimate !== undefined) payload.repair_estimate = Math.max(0, Number(patch.repair_estimate) || 0);
  if (patch.status !== undefined) payload.status = patch.status;
  if (patch.image_url !== undefined) payload.image_url = patch.image_url ? patch.image_url.trim() : null;
  if (patch.notes !== undefined) payload.notes = patch.notes ? patch.notes.trim() : null;
  if (patch.received_at !== undefined) payload.received_at = patch.received_at;

  const { data, error } = await supabase
    .from('items')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Item;
}

/**
 * Change status and record note in history.
 */
export async function setStatus(id: string, status: Status, note?: string): Promise<void> {
  const { error } = await supabase
    .from('items')
    .update({ status, ...(note ? { notes: note } : {}) })
    .eq('id', id);

  if (error) throw error;
}

/**
 * Delete an item by ID.
 */
export async function deleteItem(id: string): Promise<void> {
  const { error } = await supabase
    .from('items')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

/**
 * Fetch status history timeline for an item.
 */
export async function getHistory(id: string): Promise<HistoryEntry[]> {
  const { data, error } = await supabase
    .from('status_history')
    .select('*')
    .eq('item_id', id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data as HistoryEntry[]) || [];
}

/**
 * Upload an image file (returns a public URL or data URL).
 */
export async function uploadItemImage(file: File): Promise<string> {
  // If smaller than 3MB, convert to data URL as universal fallback if storage bucket isn't set up
  return new Promise((resolve, reject) => {
    // Try supabase storage first
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `items/${fileName}`;

    supabase.storage
      .from('item-images')
      .upload(filePath, file)
      .then(({ error }) => {
        if (!error) {
          const { data } = supabase.storage.from('item-images').getPublicUrl(filePath);
          if (data?.publicUrl) {
            resolve(data.publicUrl);
            return;
          }
        }
        // Fallback to Base64 Data URL so the user is never blocked
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(file);
      })
      .catch(() => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(file);
      });
  });
}

/**
 * Seed initial sample items for the current user to help evaluate and demo the app.
 */
export async function seedSampleItems(): Promise<void> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) throw new Error('Not logged in');

  const today = new Date().toISOString().split('T')[0];

  const samples: NewItemInput[] = [
    {
      reference: 'REF-1001',
      name: 'Lenovo ThinkPad T480',
      category: 'Laptop',
      brand: 'Lenovo',
      model: 'T480',
      serial_number: 'PF1A2B3C',
      purchase_cost: 8500,
      resale_value: 18000,
      repair_estimate: 1500,
      status: 'ready_to_sell',
      notes: 'Battery replaced, thermal paste renewed. Ready for resale.',
      received_at: today,
    },
    {
      reference: 'REF-1002',
      name: 'Dell Latitude 5490',
      category: 'Laptop',
      brand: 'Dell',
      model: '5490',
      serial_number: '7XK2M91',
      purchase_cost: 6200,
      resale_value: 14500,
      repair_estimate: 2200,
      status: 'in_repair',
      notes: 'Keyboard replacement in progress.',
      received_at: today,
    },
    {
      reference: 'REF-1003',
      name: 'iPhone 11',
      category: 'Smartphone',
      brand: 'Apple',
      model: 'A2111',
      serial_number: 'F2LDX9Q1',
      purchase_cost: 5800,
      resale_value: 12000,
      repair_estimate: 1800,
      status: 'quality_control',
      notes: 'New screen installed, running camera and battery tests.',
      received_at: today,
    },
    {
      reference: 'REF-1004',
      name: 'Samsung Galaxy A52',
      category: 'Smartphone',
      brand: 'Samsung',
      model: 'SM-A525F',
      serial_number: 'R58N90XZ',
      purchase_cost: 3200,
      resale_value: 7500,
      repair_estimate: 900,
      status: 'inspection',
      notes: 'Received in batch from trade-in. Awaiting full diagnostics.',
      received_at: today,
    },
    {
      reference: 'REF-1005',
      name: 'Acer Aspire 5',
      category: 'Laptop',
      brand: 'Acer',
      model: 'A515-54',
      serial_number: 'NXHFDSP00',
      purchase_cost: 4500,
      resale_value: 11000,
      repair_estimate: 3500,
      status: 'needs_refurbishment',
      notes: 'Left hinge loose, fan cleaning required.',
      received_at: today,
    },
    {
      reference: 'REF-1006',
      name: 'iPad Air (4th Gen)',
      category: 'Tablet',
      brand: 'Apple',
      model: 'MYFN2LL/A',
      serial_number: 'DMPD801N',
      purchase_cost: 9200,
      resale_value: 19500,
      repair_estimate: 1200,
      status: 'ready_to_sell',
      notes: 'Pristine condition, battery health 94%.',
      received_at: today,
    },
  ];

  for (const s of samples) {
    try {
      await createItem(s);
    } catch (e) {
      console.warn('Sample item insert skip:', e);
    }
  }
}

/**
 * Backward compatibility alias for legacy demo pages
 */
export const seedDemo = seedSampleItems;

