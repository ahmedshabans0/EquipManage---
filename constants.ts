
import { Customer, Equipment, Booking, Transaction, CustomerStatus, EquipmentType, EquipmentStatus, BookingStatus } from './types';

export const EQUIPMENT_CATEGORIES = [
  'معدات ثقيلة',
  'معدات حفر',
  'مولدات',
  'رافعات',
  'معدات خرسانة',
  'سقالات',
  'عدد يدوية',
  'أخرى'
];

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'C-001',
    name: 'شركة المقاولات الحديثة',
    type: 'client',
    idNumber: '7001234567',
    phone: '0501234567',
    email: 'info@modern-const.com',
    address: 'الرياض، حي العليا',
    balance: 1500,
    status: CustomerStatus.Active,
    creditLimit: 50000,
  },
  {
    id: 'C-002',
    name: 'مؤسسة خالد للتطوير',
    type: 'client',
    idNumber: '1010123456',
    phone: '0559876543',
    address: 'جدة، شارع التحلية',
    balance: 0,
    status: CustomerStatus.Active,
  },
  {
    id: 'S-001',
    name: 'شركة المعدات المتحدة (مورد)',
    type: 'supplier',
    idNumber: '4030123456',
    phone: '0540000000',
    address: 'الدمام، الصناعية الثانية',
    balance: -3000, // Negative balance implies we owe them money
    status: CustomerStatus.Active,
  },
];

export const INITIAL_EQUIPMENT: Equipment[] = [
  {
    id: 'E-001',
    name: 'رافعة شوكية 3 طن',
    serialNumber: 'FL-2023-001',
    category: 'رافعات',
    brand: 'CAT',
    model: 'DP30',
    condition: 'ممتازة',
    type: EquipmentType.Owned,
    status: EquipmentStatus.Available,
    dailyRate: 500,
    weeklyRate: 3000,
    monthlyRate: 10000,
    image: 'https://picsum.photos/200/200?random=1',
  },
  {
    id: 'E-002',
    name: 'مولد كهرباء 100KV',
    serialNumber: 'GEN-100-X',
    category: 'مولدات',
    brand: 'Perkins',
    model: 'PK100',
    condition: 'جديدة',
    type: EquipmentType.Owned,
    status: EquipmentStatus.Rented,
    dailyRate: 300,
    weeklyRate: 1800,
    monthlyRate: 6000,
    image: 'https://picsum.photos/200/200?random=2',
  },
  {
    id: 'E-003',
    name: 'حفار صغير (بوبكات)',
    serialNumber: 'BC-550',
    category: 'معدات حفر',
    brand: 'Bobcat',
    model: 'S450',
    condition: 'مستعملة',
    type: EquipmentType.External,
    status: EquipmentStatus.Available,
    dailyRate: 450,
    supplierName: 'شركة المعدات المتحدة',
    supplierCost: 300,
    image: 'https://picsum.photos/200/200?random=3',
  },
];

export const INITIAL_BOOKINGS: Booking[] = [
  {
    id: 'B-1001',
    customerId: 'C-001',
    customerName: 'شركة المقاولات الحديثة',
    items: [
      {
        equipmentId: 'E-002',
        equipmentName: 'مولد كهرباء 100KV',
        dailyRate: 300,
        days: 5,
        total: 1500,
      }
    ],
    startDate: '2023-10-25',
    endDate: '2023-10-30',
    totalAmount: 1500,
    paidAmount: 0,
    deposit: 0,
    status: BookingStatus.Active,
    createdAt: '2023-10-24',
  }
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'T-5001',
    customerId: 'C-001',
    bookingId: 'B-1001',
    date: '2023-10-25',
    amount: -1500,
    type: 'Invoice',
    description: 'استحقاق حجز رقم B-1001',
  }
];
