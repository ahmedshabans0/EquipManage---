
export enum CustomerStatus {
  Active = 'نشط',
  Inactive = 'غير نشط',
  Blacklisted = 'محظور',
}

export enum EquipmentType {
  Owned = 'مملوكة',
  External = 'خارجية',
}

export enum EquipmentStatus {
  Available = 'متاحة',
  Rented = 'محجوزة',
  Maintenance = 'صيانة',
  Retired = 'خارج الخدمة',
}

export enum BookingStatus {
  Pending = 'قيد الانتظار',
  Active = 'نشط',
  Completed = 'مكتمل',
  Cancelled = 'ملغي',
}

export enum PaymentMethod {
  Cash = 'نقدي',
  Transfer = 'تحويل بنكي',
  Credit = 'آجل',
}

export interface SystemSettings {
  appName: string;
  itemName: string;       // e.g., "معدة", "سيارة"
  itemsName: string;      // e.g., "المعدات", "السيارات"
  categoryLabel: string;  // e.g., "التصنيف", "الفئة"
  identifierLabel: string;// e.g., "الرقم التسلسلي", "رقم اللوحة"
  currency: string;       // e.g., "ر.س", "USD", "ج.م"
}

export interface Customer {
  id: string;
  name: string;
  type: 'client' | 'supplier';
  idNumber: string;
  phone: string;
  email?: string;
  address?: string;
  contactPerson?: string;
  notes?: string;
  balance: number;
  status: CustomerStatus;
  creditLimit?: number;
}

export interface Equipment {
  id: string;
  name: string;
  serialNumber: string;
  category: string;
  brand: string;
  model: string;
  condition: 'جديدة' | 'مستعملة' | 'ممتازة';
  type: EquipmentType;
  status: EquipmentStatus;
  dailyRate: number;
  weeklyRate?: number;
  monthlyRate?: number;
  image?: string;
  supplierName?: string;
  supplierCost?: number;
  supplierAgreement?: string;
}

export interface BookingItem {
  equipmentId: string;
  equipmentName: string;
  dailyRate: number;
  days: number;
  total: number;
}

export interface Booking {
  id: string;
  customerId: string;
  customerName: string;
  items: BookingItem[];
  startDate: string;
  endDate: string;
  totalAmount: number;
  paidAmount: number;
  deposit: number;
  status: BookingStatus;
  notes?: string;
  createdAt: string;
}

export interface Transaction {
  id: string;
  customerId: string;
  bookingId?: string;
  date: string;
  amount: number;
  type: 'Payment' | 'Invoice' | 'Refund';
  description: string;
  method?: PaymentMethod;
}
