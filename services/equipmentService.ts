import { supabase } from './supabaseClient';
import { Equipment, EquipmentStatus, EquipmentType } from '../types';

/**
 * Equipment Service
 * CRUD operations for equipment (owned and external)
 */

/**
 * Get all equipment
 * @param categoryFilter - Optional category filter
 * @param statusFilter - Optional status filter
 */
export const getEquipment = async (
  categoryFilter?: string,
  statusFilter?: EquipmentStatus
): Promise<Equipment[]> => {
  try {
    let query = supabase.from('equipment').select('*').order('created_at', { ascending: false });

    if (categoryFilter && categoryFilter !== 'all') {
      query = query.eq('category', categoryFilter);
    }

    if (statusFilter) {
      query = query.eq('status', statusFilter);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching equipment:', error);
      return [];
    }

    return (data || []).map(convertDBEquipmentToAppEquipment);
  } catch (err) {
    console.error('Exception fetching equipment:', err);
    return [];
  }
};

/**
 * Get equipment by ID
 */
export const getEquipmentById = async (id: string): Promise<Equipment | null> => {
  try {
    const { data, error } = await supabase
      .from('equipment')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      console.error('Error fetching equipment:', error);
      return null;
    }

    return convertDBEquipmentToAppEquipment(data);
  } catch (err) {
    console.error('Exception fetching equipment:', err);
    return null;
  }
};

/**
 * Get available equipment (status = 'متاحة')
 */
export const getAvailableEquipment = async (): Promise<Equipment[]> => {
  return getEquipment(undefined, EquipmentStatus.Available);
};

/**
 * Create new equipment
 */
export const createEquipment = async (equipment: Omit<Equipment, 'id'>): Promise<Equipment | null> => {
  try {
    const { data, error } = await supabase
      .from('equipment')
      .insert({
        name: equipment.name,
        serial_number: equipment.serialNumber,
        category: equipment.category,
        brand: equipment.brand,
        model: equipment.model,
        condition: equipment.condition,
        type: equipment.type,
        status: equipment.status,
        daily_rate: equipment.dailyRate,
        weekly_rate: equipment.weeklyRate || null,
        monthly_rate: equipment.monthlyRate || null,
        image: equipment.image || null,
        supplier_name: equipment.supplierName || null,
        supplier_cost: equipment.supplierCost || null,
        supplier_agreement: equipment.supplierAgreement || null,
      })
      .select()
      .single();

    if (error || !data) {
      console.error('Error creating equipment:', error);
      return null;
    }

    return convertDBEquipmentToAppEquipment(data);
  } catch (err) {
    console.error('Exception creating equipment:', err);
    return null;
  }
};

/**
 * Update equipment
 */
export const updateEquipment = async (
  id: string,
  updates: Partial<Equipment>
): Promise<Equipment | null> => {
  try {
    const updateData: any = {};

    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.serialNumber !== undefined) updateData.serial_number = updates.serialNumber;
    if (updates.category !== undefined) updateData.category = updates.category;
    if (updates.brand !== undefined) updateData.brand = updates.brand;
    if (updates.model !== undefined) updateData.model = updates.model;
    if (updates.condition !== undefined) updateData.condition = updates.condition;
    if (updates.type !== undefined) updateData.type = updates.type;
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.dailyRate !== undefined) updateData.daily_rate = updates.dailyRate;
    if (updates.weeklyRate !== undefined) updateData.weekly_rate = updates.weeklyRate;
    if (updates.monthlyRate !== undefined) updateData.monthly_rate = updates.monthlyRate;
    if (updates.image !== undefined) updateData.image = updates.image;
    if (updates.supplierName !== undefined) updateData.supplier_name = updates.supplierName;
    if (updates.supplierCost !== undefined) updateData.supplier_cost = updates.supplierCost;
    if (updates.supplierAgreement !== undefined) updateData.supplier_agreement = updates.supplierAgreement;

    const { data, error } = await supabase
      .from('equipment')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      console.error('Error updating equipment:', error);
      return null;
    }

    return convertDBEquipmentToAppEquipment(data);
  } catch (err) {
    console.error('Exception updating equipment:', err);
    return null;
  }
};

/**
 * Update equipment status
 */
export const updateEquipmentStatus = async (
  id: string,
  status: EquipmentStatus
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('equipment')
      .update({ status })
      .eq('id', id);

    if (error) {
      console.error('Error updating equipment status:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Exception updating equipment status:', err);
    return false;
  }
};

/**
 * Bulk update equipment status (for multiple items)
 */
export const bulkUpdateEquipmentStatus = async (
  ids: string[],
  status: EquipmentStatus
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('equipment')
      .update({ status })
      .in('id', ids);

    if (error) {
      console.error('Error bulk updating equipment status:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Exception bulk updating equipment status:', err);
    return false;
  }
};

/**
 * Delete equipment
 */
export const deleteEquipment = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase.from('equipment').delete().eq('id', id);

    if (error) {
      console.error('Error deleting equipment:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Exception deleting equipment:', err);
    return false;
  }
};

/**
 * Subscribe to equipment changes (real-time)
 */
export const subscribeToEquipment = (callback: (equipment: Equipment[]) => void) => {
  const subscription = supabase
    .channel('equipment_channel')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'equipment',
      },
      async () => {
        const equipment = await getEquipment();
        callback(equipment);
      }
    )
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
};

// Helper function to convert DB format to App format
const convertDBEquipmentToAppEquipment = (dbEquipment: any): Equipment => {
  return {
    id: dbEquipment.id,
    name: dbEquipment.name,
    serialNumber: dbEquipment.serial_number,
    category: dbEquipment.category,
    brand: dbEquipment.brand,
    model: dbEquipment.model,
    condition: dbEquipment.condition as 'جديدة' | 'مستعملة' | 'ممتازة',
    type: dbEquipment.type as EquipmentType,
    status: dbEquipment.status as EquipmentStatus,
    dailyRate: Number(dbEquipment.daily_rate),
    weeklyRate: dbEquipment.weekly_rate ? Number(dbEquipment.weekly_rate) : undefined,
    monthlyRate: dbEquipment.monthly_rate ? Number(dbEquipment.monthly_rate) : undefined,
    image: dbEquipment.image || undefined,
    supplierName: dbEquipment.supplier_name || undefined,
    supplierCost: dbEquipment.supplier_cost ? Number(dbEquipment.supplier_cost) : undefined,
    supplierAgreement: dbEquipment.supplier_agreement || undefined,
  };
};
