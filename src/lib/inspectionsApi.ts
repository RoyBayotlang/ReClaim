import { supabase } from './supabase';
import type {
  Inspection,
  InspectionResult,
  OverallCondition,
  ComponentCondition,
  ComponentType,
} from '../types';

export interface CreateInspectionInput {
  item_id: string;
  inspected_by?: string | null;
  inspection_date?: string;
  overall_condition: OverallCondition;
  general_notes?: string | null;
  results: {
    component_name: string;
    component_type: ComponentType;
    condition: ComponentCondition;
    notes?: string | null;
  }[];
}

export interface UpdateInspectionInput {
  inspected_by?: string | null;
  inspection_date?: string;
  overall_condition?: OverallCondition;
  general_notes?: string | null;
  results?: {
    id?: string;
    component_name: string;
    component_type: ComponentType;
    condition: ComponentCondition;
    notes?: string | null;
  }[];
}

/**
 * Fetch all inspections for a specific item, newest first.
 * Preserves individual checklist results for each inspection.
 */
export async function listInspectionsForItem(itemId: string): Promise<Inspection[]> {
  const { data: inspections, error: inspError } = await supabase
    .from('inspections')
    .select('*')
    .eq('item_id', itemId)
    .order('inspection_date', { ascending: false });

  if (inspError) {
    console.error('Error fetching inspections:', inspError);
    throw inspError;
  }

  if (!inspections || inspections.length === 0) {
    return [];
  }

  const inspectionIds = inspections.map((i) => i.id);

  // Fetch all associated checklist results in a single query
  const { data: results, error: resultsError } = await supabase
    .from('inspection_results')
    .select('*')
    .in('inspection_id', inspectionIds)
    .order('created_at', { ascending: true });

  if (resultsError) {
    console.warn('Error fetching inspection results:', resultsError);
  }

  const resultsByInspection = (results || []).reduce<Record<string, InspectionResult[]>>(
    (acc, res) => {
      if (!acc[res.inspection_id]) acc[res.inspection_id] = [];
      acc[res.inspection_id].push({
        id: res.id,
        inspection_id: res.inspection_id,
        component_name: res.component_name || res.component || 'Component',
        component_type: res.component_type || 'physical',
        condition: (res.condition || res.result || 'NOT_TESTED') as ComponentCondition,
        notes: res.notes || null,
        created_at: res.created_at,
      });
      return acc;
    },
    {}
  );

  return inspections.map((insp) => ({
    id: insp.id,
    item_id: insp.item_id,
    user_id: insp.user_id || insp.owner_id,
    inspected_by: insp.inspected_by || null,
    inspection_date: insp.inspection_date || insp.created_at,
    overall_condition: (insp.overall_condition || 'UNASSESSED') as OverallCondition,
    general_notes: insp.general_notes || insp.notes || null,
    created_at: insp.created_at,
    updated_at: insp.updated_at,
    results: resultsByInspection[insp.id] || [],
  }));
}

/**
 * Fetch a single inspection by ID along with its checklist results.
 */
export async function getInspection(inspectionId: string): Promise<Inspection> {
  const { data: insp, error: inspError } = await supabase
    .from('inspections')
    .select('*')
    .eq('id', inspectionId)
    .single();

  if (inspError) throw inspError;

  const { data: results, error: resultsError } = await supabase
    .from('inspection_results')
    .select('*')
    .eq('inspection_id', inspectionId)
    .order('created_at', { ascending: true });

  if (resultsError) {
    console.warn('Error fetching inspection results for id:', inspectionId, resultsError);
  }

  const mappedResults: InspectionResult[] = (results || []).map((res) => ({
    id: res.id,
    inspection_id: res.inspection_id,
    component_name: res.component_name || res.component || 'Component',
    component_type: res.component_type || 'physical',
    condition: (res.condition || res.result || 'NOT_TESTED') as ComponentCondition,
    notes: res.notes || null,
    created_at: res.created_at,
  }));

  return {
    id: insp.id,
    item_id: insp.item_id,
    user_id: insp.user_id || insp.owner_id,
    inspected_by: insp.inspected_by || null,
    inspection_date: insp.inspection_date || insp.created_at,
    overall_condition: (insp.overall_condition || 'UNASSESSED') as OverallCondition,
    general_notes: insp.general_notes || insp.notes || null,
    created_at: insp.created_at,
    updated_at: insp.updated_at,
    results: mappedResults,
  };
}

/**
 * Record a new hardware inspection for an item.
 * Automatically ties the record to the currently authenticated user session.
 */
export async function createInspection(input: CreateInspectionInput): Promise<Inspection> {
  const { data: authData } = await supabase.auth.getUser();
  if (!authData?.user) {
    throw new Error('You must be authenticated to record an inspection.');
  }

  const userId = authData.user.id;
  const nowIso = new Date().toISOString();

  // 1. Insert inspection record
  const inspectionPayload = {
    item_id: input.item_id,
    user_id: userId,
    inspected_by: input.inspected_by?.trim() || null,
    inspection_date: input.inspection_date || nowIso,
    overall_condition: input.overall_condition || 'UNASSESSED',
    general_notes: input.general_notes?.trim() || null,
  };

  const { data: newInspection, error: insertError } = await supabase
    .from('inspections')
    .insert(inspectionPayload)
    .select()
    .single();

  if (insertError) {
    console.error('Failed to insert inspection:', insertError);
    throw new Error(insertError.message || 'Failed to save inspection record.');
  }

  // 2. Insert checklist results if provided
  let createdResults: InspectionResult[] = [];
  if (input.results && input.results.length > 0) {
    const resultsPayload = input.results.map((r) => ({
      inspection_id: newInspection.id,
      component_name: r.component_name.trim(),
      component_type: r.component_type || 'physical',
      condition: r.condition,
      notes: r.notes?.trim() || null,
    }));

    const { data: insertedResults, error: resultsInsertError } = await supabase
      .from('inspection_results')
      .insert(resultsPayload)
      .select();

    if (resultsInsertError) {
      console.error('Failed to insert checklist results:', resultsInsertError);
      // We don't abort since inspection was created, but report warning
    } else if (insertedResults) {
      createdResults = insertedResults.map((r) => ({
        id: r.id,
        inspection_id: r.inspection_id,
        component_name: r.component_name,
        component_type: r.component_type,
        condition: r.condition as ComponentCondition,
        notes: r.notes,
        created_at: r.created_at,
      }));
    }
  }

  return {
    id: newInspection.id,
    item_id: newInspection.item_id,
    user_id: newInspection.user_id,
    inspected_by: newInspection.inspected_by,
    inspection_date: newInspection.inspection_date,
    overall_condition: newInspection.overall_condition,
    general_notes: newInspection.general_notes,
    created_at: newInspection.created_at,
    updated_at: newInspection.updated_at,
    results: createdResults,
  };
}

/**
 * Delete an inspection and its associated checklist results.
 */
export async function deleteInspection(inspectionId: string): Promise<void> {
  const { error } = await supabase
    .from('inspections')
    .delete()
    .eq('id', inspectionId);

  if (error) {
    console.error('Failed to delete inspection:', error);
    throw new Error(error.message || 'Failed to delete inspection record.');
  }
}

/**
 * List recent inspections across all items owned by current user.
 * Joins associated item info for the Inspections Hub page.
 */
export async function listRecentInspections(limit = 30): Promise<Inspection[]> {
  const { data: authData } = await supabase.auth.getUser();
  if (!authData?.user) return [];

  const { data: inspections, error } = await supabase
    .from('inspections')
    .select(`
      *,
      item:items (
        id,
        reference,
        name,
        category,
        brand,
        model,
        serial_number,
        status,
        purchase_cost,
        repair_estimate,
        resale_value
      )
    `)
    .order('inspection_date', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Failed to fetch recent inspections:', error);
    throw error;
  }

  if (!inspections || inspections.length === 0) return [];

  const inspectionIds = inspections.map((i) => i.id);

  // Fetch all checklist results for summary counters
  const { data: results } = await supabase
    .from('inspection_results')
    .select('*')
    .in('inspection_id', inspectionIds);

  const resultsByInspection = (results || []).reduce<Record<string, InspectionResult[]>>(
    (acc, res) => {
      if (!acc[res.inspection_id]) acc[res.inspection_id] = [];
      acc[res.inspection_id].push({
        id: res.id,
        inspection_id: res.inspection_id,
        component_name: res.component_name || res.component || 'Component',
        component_type: res.component_type || 'physical',
        condition: (res.condition || res.result || 'NOT_TESTED') as ComponentCondition,
        notes: res.notes || null,
        created_at: res.created_at,
      });
      return acc;
    },
    {}
  );

  return inspections.map((insp) => ({
    id: insp.id,
    item_id: insp.item_id,
    user_id: insp.user_id || insp.owner_id,
    inspected_by: insp.inspected_by || null,
    inspection_date: insp.inspection_date || insp.created_at,
    overall_condition: (insp.overall_condition || 'UNASSESSED') as OverallCondition,
    general_notes: insp.general_notes || insp.notes || null,
    created_at: insp.created_at,
    updated_at: insp.updated_at,
    results: resultsByInspection[insp.id] || [],
    item: insp.item || undefined,
  }));
}
