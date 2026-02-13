import { Booking, Customer, Transaction, Equipment, EquipmentStatus, BookingStatus } from '../types';

export const calculateRevenue = (bookings: Booking[]) => {
  return bookings.reduce((acc, curr) => acc + curr.totalAmount, 0);
};

export const getEquipmentStats = (equipment: Equipment[]) => {
  const total = equipment.length;
  const available = equipment.filter(e => e.status === EquipmentStatus.Available).length;
  const rented = equipment.filter(e => e.status === EquipmentStatus.Rented).length;
  const maintenance = equipment.filter(e => e.status === EquipmentStatus.Maintenance).length;
  
  return { total, available, rented, maintenance };
};

export const calculateDays = (start: string, end: string): number => {
  const d1 = new Date(start);
  const d2 = new Date(end);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
  return diffDays === 0 ? 1 : diffDays; // Minimum 1 day
};
