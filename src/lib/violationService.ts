import { supabase } from '@/lib/supabase';
import type { Violation, ViolationInput, ViolationStatus } from '@/lib/types';
import { ITEMS_PER_PAGE } from '@/lib/constants';

export interface ViolationFilters {
  search?: string;
  status?: ViolationStatus | 'all';
  violationType?: string;
  vehicleType?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  reporterId?: string;
}

export async function fetchViolations(filters: ViolationFilters = {}): Promise<{ data: Violation[]; total: number }> {
  const {
    search = '',
    status = 'all',
    violationType = 'all',
    vehicleType = 'all',
    sortBy = 'created_at',
    sortOrder = 'desc',
    page = 1,
    reporterId,
  } = filters;

  let query = supabase
    .from('violations')
    .select('*, reporter:profiles!reporter_id(id, full_name, phone, role, created_at), reviewer:profiles!reviewed_by(id, full_name, phone, role, created_at)', { count: 'exact' });

  if (reporterId) {
    query = query.eq('reporter_id', reporterId);
  }

  if (status !== 'all') {
    query = query.eq('status', status);
  }

  if (violationType !== 'all') {
    query = query.eq('violation_type', violationType);
  }

  if (vehicleType !== 'all') {
    query = query.eq('vehicle_type', vehicleType);
  }

  if (search) {
    query = query.or(`vehicle_number.ilike.%${search}%,location.ilike.%${search}%,description.ilike.%${search}%`);
  }

  const validSortColumns = ['created_at', 'violation_date', 'vehicle_number', 'status', 'violation_type'];
  const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'created_at';
  query = query.order(sortColumn, { ascending: sortOrder === 'asc' });

  const from = (page - 1) * ITEMS_PER_PAGE;
  const to = from + ITEMS_PER_PAGE - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return {
    data: (data || []) as Violation[],
    total: count || 0,
  };
}

export async function fetchViolationById(id: string): Promise<Violation | null> {
  const { data, error } = await supabase
    .from('violations')
    .select('*, reporter:profiles!reporter_id(id, full_name, phone, role, created_at), reviewer:profiles!reviewed_by(id, full_name, phone, role, created_at)')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as Violation | null;
}

export async function createViolation(input: ViolationInput): Promise<Violation> {
  const { data, error } = await supabase
    .from('violations')
    .insert(input)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as Violation;
}

export async function updateViolation(id: string, input: Partial<ViolationInput>): Promise<Violation> {
  const { data, error } = await supabase
    .from('violations')
    .update(input)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as Violation;
}

export async function deleteViolation(id: string): Promise<void> {
  const { error } = await supabase.from('violations').delete().eq('id', id);
  if (error) {
    throw new Error(error.message);
  }
}

export async function reviewViolation(
  id: string,
  status: ViolationStatus,
  reviewNotes: string,
  reviewerId: string
): Promise<Violation> {
  const { data, error } = await supabase
    .from('violations')
    .update({
      status,
      review_notes: reviewNotes,
      reviewed_by: reviewerId,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as Violation;
}

export async function fetchStats(reporterId?: string): Promise<{ total: number; pending: number; approved: number; rejected: number }> {
  let query = supabase.from('violations').select('status');
  if (reporterId) {
    query = query.eq('reporter_id', reporterId);
  }
  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  const rows = data || [];
  return {
    total: rows.length,
    pending: rows.filter((r) => r.status === 'pending').length,
    approved: rows.filter((r) => r.status === 'approved').length,
    rejected: rows.filter((r) => r.status === 'rejected').length,
  };
}

export async function uploadViolationImage(file: File, reporterId: string): Promise<string> {
  const ext = file.name.split('.').pop();
  const fileName = `${reporterId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage
    .from('violation-images')
    .upload(fileName, file, { cacheControl: '3600', upsert: false });

  if (error) {
    throw new Error(error.message);
  }

  const { data: urlData } = supabase.storage
    .from('violation-images')
    .getPublicUrl(fileName);

  return urlData.publicUrl;
}
