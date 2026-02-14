import { supabase } from './supabaseClient';
import { Transaction, PaymentMethod } from '../types';
import { updateCustomerBalance } from './customerService';

/**
 * Transaction Service
 * CRUD operations for financial transactions
 */

/**
 * Get all transactions
 */
export const getTransactions = async (): Promise<Transaction[]> => {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching transactions:', error);
      return [];
    }

    return (data || []).map(convertDBTransactionToAppTransaction);
  } catch (err) {
    console.error('Exception fetching transactions:', err);
    return [];
  }
};

/**
 * Get transactions by customer ID
 */
export const getTransactionsByCustomer = async (customerId: string): Promise<Transaction[]> => {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching customer transactions:', error);
      return [];
    }

    return (data || []).map(convertDBTransactionToAppTransaction);
  } catch (err) {
    console.error('Exception fetching customer transactions:', err);
    return [];
  }
};

/**
 * Get transactions by booking ID
 */
export const getTransactionsByBooking = async (bookingId: string): Promise<Transaction[]> => {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('booking_id', bookingId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching booking transactions:', error);
      return [];
    }

    return (data || []).map(convertDBTransactionToAppTransaction);
  } catch (err) {
    console.error('Exception fetching booking transactions:', err);
    return [];
  }
};

/**
 * Create new transaction
 */
export const createTransaction = async (
  transaction: Omit<Transaction, 'id'>
): Promise<Transaction | null> => {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .insert({
        customer_id: transaction.customerId,
        booking_id: transaction.bookingId || null,
        date: transaction.date,
        amount: transaction.amount,
        type: transaction.type,
        description: transaction.description,
        method: transaction.method || null,
      })
      .select()
      .single();

    if (error || !data) {
      console.error('Error creating transaction:', error);
      return null;
    }

    // Update customer balance
    // For Invoice (negative amount) -> increase balance (debt)
    // For Payment (positive amount) -> decrease balance (payment)
    await updateCustomerBalance(transaction.customerId, transaction.amount);

    return convertDBTransactionToAppTransaction(data);
  } catch (err) {
    console.error('Exception creating transaction:', err);
    return null;
  }
};

/**
 * Create payment transaction
 */
export const createPayment = async (
  customerId: string,
  amount: number,
  method: PaymentMethod,
  description: string,
  bookingId?: string
): Promise<Transaction | null> => {
  return await createTransaction({
    customerId,
    bookingId,
    date: new Date().toISOString().split('T')[0],
    amount,
    type: 'Payment',
    description,
    method,
  });
};

/**
 * Create invoice transaction (for bookings)
 */
export const createInvoice = async (
  customerId: string,
  bookingId: string,
  amount: number,
  description: string
): Promise<Transaction | null> => {
  return await createTransaction({
    customerId,
    bookingId,
    date: new Date().toISOString().split('T')[0],
    amount: -Math.abs(amount), // Negative amount for invoices
    type: 'Invoice',
    description,
  });
};

/**
 * Create refund transaction
 */
export const createRefund = async (
  customerId: string,
  amount: number,
  description: string,
  bookingId?: string
): Promise<Transaction | null> => {
  return await createTransaction({
    customerId,
    bookingId,
    date: new Date().toISOString().split('T')[0],
    amount: Math.abs(amount), // Positive amount for refunds
    type: 'Refund',
    description,
  });
};

/**
 * Delete transaction
 * Note: This will also need to revert customer balance
 */
export const deleteTransaction = async (id: string): Promise<boolean> => {
  try {
    // First, get the transaction to know the amount
    const { data: transaction } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', id)
      .single();

    if (!transaction) return false;

    // Delete the transaction
    const { error } = await supabase.from('transactions').delete().eq('id', id);

    if (error) {
      console.error('Error deleting transaction:', error);
      return false;
    }

    // Revert customer balance (opposite of the transaction amount)
    await updateCustomerBalance(transaction.customer_id, -transaction.amount);

    return true;
  } catch (err) {
    console.error('Exception deleting transaction:', err);
    return false;
  }
};

/**
 * Get customer statement (all transactions)
 */
export const getCustomerStatement = async (
  customerId: string,
  startDate?: string,
  endDate?: string
): Promise<Transaction[]> => {
  try {
    let query = supabase
      .from('transactions')
      .select('*')
      .eq('customer_id', customerId);

    if (startDate) {
      query = query.gte('date', startDate);
    }

    if (endDate) {
      query = query.lte('date', endDate);
    }

    const { data, error } = await query.order('date', { ascending: true });

    if (error) {
      console.error('Error fetching customer statement:', error);
      return [];
    }

    return (data || []).map(convertDBTransactionToAppTransaction);
  } catch (err) {
    console.error('Exception fetching customer statement:', err);
    return [];
  }
};

/**
 * Subscribe to transaction changes (real-time)
 */
export const subscribeToTransactions = (callback: (transactions: Transaction[]) => void) => {
  const subscription = supabase
    .channel('transactions_channel')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'transactions',
      },
      async () => {
        const transactions = await getTransactions();
        callback(transactions);
      }
    )
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
};

// Helper function to convert DB format to App format
const convertDBTransactionToAppTransaction = (dbTransaction: any): Transaction => {
  return {
    id: dbTransaction.id,
    customerId: dbTransaction.customer_id,
    bookingId: dbTransaction.booking_id || undefined,
    date: dbTransaction.date,
    amount: Number(dbTransaction.amount),
    type: dbTransaction.type as 'Payment' | 'Invoice' | 'Refund',
    description: dbTransaction.description,
    method: dbTransaction.method as PaymentMethod | undefined,
  };
};
