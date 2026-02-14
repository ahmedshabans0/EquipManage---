import { supabase } from './supabaseClient';
import { Booking, BookingItem, BookingStatus } from '../types';
import { updateEquipmentStatus, bulkUpdateEquipmentStatus } from './equipmentService';
import { EquipmentStatus } from '../types';

/**
 * Booking Service
 * CRUD operations for bookings and booking items
 */

/**
 * Get all bookings
 */
export const getBookings = async (): Promise<Booking[]> => {
  try {
    const { data: bookingsData, error: bookingsError } = await supabase
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false });

    if (bookingsError) {
      console.error('Error fetching bookings:', bookingsError);
      return [];
    }

    if (!bookingsData) return [];

    // Fetch booking items for each booking
    const bookingsWithItems = await Promise.all(
      bookingsData.map(async (booking) => {
        const { data: itemsData } = await supabase
          .from('booking_items')
          .select('*')
          .eq('booking_id', booking.id);

        return convertDBBookingToAppBooking(booking, itemsData || []);
      })
    );

    return bookingsWithItems;
  } catch (err) {
    console.error('Exception fetching bookings:', err);
    return [];
  }
};

/**
 * Get booking by ID
 */
export const getBookingById = async (id: string): Promise<Booking | null> => {
  try {
    const { data: bookingData, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', id)
      .single();

    if (bookingError || !bookingData) {
      console.error('Error fetching booking:', bookingError);
      return null;
    }

    const { data: itemsData } = await supabase
      .from('booking_items')
      .select('*')
      .eq('booking_id', id);

    return convertDBBookingToAppBooking(bookingData, itemsData || []);
  } catch (err) {
    console.error('Exception fetching booking:', err);
    return null;
  }
};

/**
 * Create new booking with items
 */
export const createBooking = async (
  booking: Omit<Booking, 'id' | 'createdAt'>,
  createdBy?: string
): Promise<Booking | null> => {
  try {
    // 1. Insert booking
    const { data: bookingData, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        customer_id: booking.customerId,
        customer_name: booking.customerName,
        start_date: booking.startDate,
        end_date: booking.endDate,
        total_amount: booking.totalAmount,
        paid_amount: booking.paidAmount,
        deposit: booking.deposit,
        status: booking.status,
        notes: booking.notes || null,
        created_by: createdBy || null,
      })
      .select()
      .single();

    if (bookingError || !bookingData) {
      console.error('Error creating booking:', bookingError);
      return null;
    }

    // 2. Insert booking items
    if (booking.items.length > 0) {
      const itemsToInsert = booking.items.map((item) => ({
        booking_id: bookingData.id,
        equipment_id: item.equipmentId,
        equipment_name: item.equipmentName,
        daily_rate: item.dailyRate,
        days: item.days,
        total: item.total,
      }));

      const { error: itemsError } = await supabase
        .from('booking_items')
        .insert(itemsToInsert);

      if (itemsError) {
        console.error('Error creating booking items:', itemsError);
        // Rollback booking
        await supabase.from('bookings').delete().eq('id', bookingData.id);
        return null;
      }
    }

    // 3. Update equipment status to 'محجوزة'
    const equipmentIds = booking.items.map((item) => item.equipmentId);
    await bulkUpdateEquipmentStatus(equipmentIds, EquipmentStatus.Rented);

    // 4. Fetch and return complete booking
    return await getBookingById(bookingData.id);
  } catch (err) {
    console.error('Exception creating booking:', err);
    return null;
  }
};

/**
 * Update booking
 */
export const updateBooking = async (
  id: string,
  updates: Partial<Booking>
): Promise<Booking | null> => {
  try {
    const updateData: any = {};

    if (updates.customerId !== undefined) updateData.customer_id = updates.customerId;
    if (updates.customerName !== undefined) updateData.customer_name = updates.customerName;
    if (updates.startDate !== undefined) updateData.start_date = updates.startDate;
    if (updates.endDate !== undefined) updateData.end_date = updates.endDate;
    if (updates.totalAmount !== undefined) updateData.total_amount = updates.totalAmount;
    if (updates.paidAmount !== undefined) updateData.paid_amount = updates.paidAmount;
    if (updates.deposit !== undefined) updateData.deposit = updates.deposit;
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.notes !== undefined) updateData.notes = updates.notes;

    const { data, error } = await supabase
      .from('bookings')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      console.error('Error updating booking:', error);
      return null;
    }

    return await getBookingById(id);
  } catch (err) {
    console.error('Exception updating booking:', err);
    return null;
  }
};

/**
 * Update booking status
 */
export const updateBookingStatus = async (
  id: string,
  status: BookingStatus
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('bookings')
      .update({ status })
      .eq('id', id);

    if (error) {
      console.error('Error updating booking status:', error);
      return false;
    }

    // If status is 'مكتمل', update equipment status back to 'متاحة'
    if (status === BookingStatus.Completed) {
      const booking = await getBookingById(id);
      if (booking) {
        const equipmentIds = booking.items.map((item) => item.equipmentId);
        await bulkUpdateEquipmentStatus(equipmentIds, EquipmentStatus.Available);
      }
    }

    return true;
  } catch (err) {
    console.error('Exception updating booking status:', err);
    return false;
  }
};

/**
 * Complete booking (return equipment)
 */
export const completeBooking = async (id: string): Promise<boolean> => {
  return await updateBookingStatus(id, BookingStatus.Completed);
};

/**
 * Cancel booking
 */
export const cancelBooking = async (id: string): Promise<boolean> => {
  try {
    // Get booking to retrieve equipment IDs
    const booking = await getBookingById(id);
    if (!booking) return false;

    // Update booking status
    const success = await updateBookingStatus(id, BookingStatus.Cancelled);
    
    if (success) {
      // Update equipment status back to available
      const equipmentIds = booking.items.map((item) => item.equipmentId);
      await bulkUpdateEquipmentStatus(equipmentIds, EquipmentStatus.Available);
    }

    return success;
  } catch (err) {
    console.error('Exception cancelling booking:', err);
    return false;
  }
};

/**
 * Delete booking
 */
export const deleteBooking = async (id: string): Promise<boolean> => {
  try {
    // Get booking to retrieve equipment IDs
    const booking = await getBookingById(id);
    if (!booking) return false;

    // Delete booking (cascade will delete booking_items)
    const { error } = await supabase.from('bookings').delete().eq('id', id);

    if (error) {
      console.error('Error deleting booking:', error);
      return false;
    }

    // Update equipment status back to available
    const equipmentIds = booking.items.map((item) => item.equipmentId);
    await bulkUpdateEquipmentStatus(equipmentIds, EquipmentStatus.Available);

    return true;
  } catch (err) {
    console.error('Exception deleting booking:', err);
    return false;
  }
};

/**
 * Update booking items (for edit booking)
 */
export const updateBookingItems = async (
  bookingId: string,
  newItems: BookingItem[]
): Promise<boolean> => {
  try {
    // 1. Get current items
    const { data: currentItems } = await supabase
      .from('booking_items')
      .select('*')
      .eq('booking_id', bookingId);

    // 2. Delete old items
    await supabase.from('booking_items').delete().eq('booking_id', bookingId);

    // 3. Insert new items
    const itemsToInsert = newItems.map((item) => ({
      booking_id: bookingId,
      equipment_id: item.equipmentId,
      equipment_name: item.equipmentName,
      daily_rate: item.dailyRate,
      days: item.days,
      total: item.total,
    }));

    const { error } = await supabase.from('booking_items').insert(itemsToInsert);

    if (error) {
      console.error('Error updating booking items:', error);
      return false;
    }

    // 4. Update equipment statuses
    // - Old items -> Available
    // - New items -> Rented
    const oldIds = (currentItems || []).map((item: any) => item.equipment_id);
    const newIds = newItems.map((item) => item.equipmentId);

    const toAvailable = oldIds.filter((id: string) => !newIds.includes(id));
    const toRented = newIds.filter((id) => !oldIds.includes(id));

    if (toAvailable.length > 0) {
      await bulkUpdateEquipmentStatus(toAvailable, EquipmentStatus.Available);
    }

    if (toRented.length > 0) {
      await bulkUpdateEquipmentStatus(toRented, EquipmentStatus.Rented);
    }

    return true;
  } catch (err) {
    console.error('Exception updating booking items:', err);
    return false;
  }
};

/**
 * Subscribe to booking changes (real-time)
 */
export const subscribeToBookings = (callback: (bookings: Booking[]) => void) => {
  const subscription = supabase
    .channel('bookings_channel')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'bookings',
      },
      async () => {
        const bookings = await getBookings();
        callback(bookings);
      }
    )
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
};

// Helper function to convert DB format to App format
const convertDBBookingToAppBooking = (dbBooking: any, dbItems: any[]): Booking => {
  return {
    id: dbBooking.id,
    customerId: dbBooking.customer_id,
    customerName: dbBooking.customer_name,
    items: dbItems.map((item) => ({
      equipmentId: item.equipment_id,
      equipmentName: item.equipment_name,
      dailyRate: Number(item.daily_rate),
      days: item.days,
      total: Number(item.total),
    })),
    startDate: dbBooking.start_date,
    endDate: dbBooking.end_date,
    totalAmount: Number(dbBooking.total_amount),
    paidAmount: Number(dbBooking.paid_amount),
    deposit: Number(dbBooking.deposit),
    status: dbBooking.status as BookingStatus,
    notes: dbBooking.notes || undefined,
    createdAt: dbBooking.created_at.split('T')[0], // Convert to date only
  };
};
