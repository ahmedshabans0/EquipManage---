import { supabase } from './supabaseClient';
import { Customer, CustomerStatus } from '../types';

/**
 * Customer Service
 * CRUD operations for customers and suppliers
 */

/**
 * Get all customers (excludes soft deleted)
 * @param type - Filter by type ('client', 'supplier', or 'all')
 */
export const getCustomers = async (type: 'all' | 'client' | 'supplier' = 'all'): Promise<Customer[]> => {
  try {
    let query = supabase
      .from('customers')
      .select('*')
      .is('deleted_at', null)  // Exclude soft deleted records
      .order('created_at', { ascending: false });

    if (type !== 'all') {
      query = query.eq('type', type);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching customers:', error);
      return [];
    }

    return (data || []).map(convertDBCustomerToAppCustomer);
  } catch (err) {
    console.error('Exception fetching customers:', err);
    return [];
  }
};

/**
 * Get customer by ID
 */
export const getCustomerById = async (id: string): Promise<Customer | null> => {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      console.error('Error fetching customer:', error);
      return null;
    }

    return convertDBCustomerToAppCustomer(data);
  } catch (err) {
    console.error('Exception fetching customer:', err);
    return null;
  }
};

/**
 * Create new customer
 */
export const createCustomer = async (customer: Omit<Customer, 'id' | 'balance'>): Promise<Customer | null> => {
  try {
    const { data, error } = await supabase
      .from('customers')
      .insert({
        name: customer.name,
        type: customer.type,
        id_number: customer.idNumber,
        phone: customer.phone,
        email: customer.email || null,
        address: customer.address || null,
        contact_person: customer.contactPerson || null,
        notes: customer.notes || null,
        balance: 0,
        status: customer.status,
        credit_limit: customer.creditLimit || null,
      })
      .select()
      .single();

    if (error || !data) {
      console.error('Error creating customer:', error);
      return null;
    }

    return convertDBCustomerToAppCustomer(data);
  } catch (err) {
    console.error('Exception creating customer:', err);
    return null;
  }
};

/**
 * Update customer
 */
export const updateCustomer = async (id: string, updates: Partial<Customer>): Promise<Customer | null> => {
  try {
    const updateData: any = {};

    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.type !== undefined) updateData.type = updates.type;
    if (updates.idNumber !== undefined) updateData.id_number = updates.idNumber;
    if (updates.phone !== undefined) updateData.phone = updates.phone;
    if (updates.email !== undefined) updateData.email = updates.email;
    if (updates.address !== undefined) updateData.address = updates.address;
    if (updates.contactPerson !== undefined) updateData.contact_person = updates.contactPerson;
    if (updates.notes !== undefined) updateData.notes = updates.notes;
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.creditLimit !== undefined) updateData.credit_limit = updates.creditLimit;
    if (updates.balance !== undefined) updateData.balance = updates.balance;

    const { data, error } = await supabase
      .from('customers')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      console.error('Error updating customer:', error);
      return null;
    }

    return convertDBCustomerToAppCustomer(data);
  } catch (err) {
    console.error('Exception updating customer:', err);
    return null;
  }
};

/**
 * Delete customer (Soft Delete)
 */
export const deleteCustomer = async (id: string): Promise<boolean> => {
  try {
    // Soft delete - set deleted_at timestamp instead of actual deletion
    const { error } = await supabase
      .from('customers')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('Error soft deleting customer:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Exception soft deleting customer:', err);
    return false;
  }
};

/**
 * Update customer balance
 */
export const updateCustomerBalance = async (id: string, amount: number): Promise<boolean> => {
  try {
    // Get current balance
    const customer = await getCustomerById(id);
    if (!customer) return false;

    const newBalance = customer.balance + amount;

    const { error } = await supabase
      .from('customers')
      .update({ balance: newBalance })
      .eq('id', id);

    if (error) {
      console.error('Error updating customer balance:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Exception updating customer balance:', err);
    return false;
  }
};

/**
 * Subscribe to customer changes (real-time)
 */
export const subscribeToCustomers = (callback: (customers: Customer[]) => void) => {
  const subscription = supabase
    .channel('customers_channel')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'customers',
      },
      async () => {
        const customers = await getCustomers();
        callback(customers);
      }
    )
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
};

// Helper function to convert DB format to App format
const convertDBCustomerToAppCustomer = (dbCustomer: any): Customer => {
  return {
    id: dbCustomer.id,
    name: dbCustomer.name,
    type: dbCustomer.type,
    idNumber: dbCustomer.id_number,
    phone: dbCustomer.phone,
    email: dbCustomer.email || undefined,
    address: dbCustomer.address || undefined,
    contactPerson: dbCustomer.contact_person || undefined,
    notes: dbCustomer.notes || undefined,
    balance: Number(dbCustomer.balance),
    status: dbCustomer.status as CustomerStatus,
    creditLimit: dbCustomer.credit_limit ? Number(dbCustomer.credit_limit) : undefined,
  };
};