import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import { LayoutDashboard, Users, Truck, CalendarDays, Plus, Search, X, DollarSign, Pencil, Trash2, Building2, UserCircle, Settings, Save, Camera, ShoppingCart, Calendar, Minus } from 'lucide-react';
import { 
  Customer, Equipment, Booking, Transaction, 
  CustomerStatus, EquipmentType, EquipmentStatus, BookingStatus, PaymentMethod, BookingItem, SystemSettings 
} from './types';
import { INITIAL_CUSTOMERS, INITIAL_EQUIPMENT, INITIAL_BOOKINGS, INITIAL_TRANSACTIONS, EQUIPMENT_CATEGORIES } from './constants';
import StatCard from './components/StatCard';
import { calculateDays } from './services/dataService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  
  // System Configuration State
  const [settings, setSettings] = useState<SystemSettings>({
    appName: 'إيجار برو',
    itemName: 'معدة',
    itemsName: 'المعدات',
    categoryLabel: 'التصنيف',
    identifierLabel: 'الرقم التسلسلي',
    currency: 'ر.س'
  });

  // Application Data State
  const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS);
  const [equipment, setEquipment] = useState<Equipment[]>(INITIAL_EQUIPMENT);
  const [bookings, setBookings] = useState<Booking[]>(INITIAL_BOOKINGS);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  
  // Categories State
  const [categories, setCategories] = useState<string[]>(EQUIPMENT_CATEGORIES);

  // UI State
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'addCustomer' | 'editCustomer' | 'addEquipment' | 'editEquipment' | 'addBooking' | 'addPayment' | 'returnEquipment' | 'manageCategories'>('addCustomer');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filters
  const [customerFilterType, setCustomerFilterType] = useState<'all' | 'client' | 'supplier'>('all');
  const [equipmentCategoryFilter, setEquipmentCategoryFilter] = useState('all');

  // Booking Modal State
  const [bookingCart, setBookingCart] = useState<Equipment[]>([]); // Changed to store just Equipment, days calc on fly
  const [bookingCustomerId, setBookingCustomerId] = useState('');
  const [bookingDates, setBookingDates] = useState({start: '', end: ''});
  const [bookingCategoryFilter, setBookingCategoryFilter] = useState('all'); // Changed default
  const [bookingSearchTerm, setBookingSearchTerm] = useState(''); // New state for modal search

  // --- Actions ---

  const handleAddCategory = (newCategory: string) => {
    if (newCategory && !categories.includes(newCategory)) {
      setCategories([...categories, newCategory]);
    }
  };

  const handleDeleteCategory = (category: string) => {
    if (window.confirm(`هل أنت متأكد من حذف تصنيف "${category}"؟`)) {
      setCategories(categories.filter(c => c !== category));
      if (equipmentCategoryFilter === category) setEquipmentCategoryFilter('all');
      if (bookingCategoryFilter === category) setBookingCategoryFilter('all');
    }
  };

  const handleApplyPreset = (type: 'equipment' | 'cars' | 'properties' | 'events' | 'photography') => {
    if (type === 'equipment') {
      setSettings({ appName: 'إيجار برو', itemName: 'معدة', itemsName: 'المعدات', categoryLabel: 'التصنيف', identifierLabel: 'الرقم التسلسلي', currency: 'ر.س' });
      setCategories(['معدات ثقيلة', 'مولدات', 'رافعات', 'عدد يدوية']);
    } else if (type === 'cars') {
      setSettings({ appName: 'كار رينتال', itemName: 'سيارة', itemsName: 'السيارات', categoryLabel: 'الفئة', identifierLabel: 'رقم اللوحة', currency: 'ر.س' });
      setCategories(['سيدان', 'دفع رباعي', 'فاخرة', 'نقل']);
    } else if (type === 'properties') {
      setSettings({ appName: 'عقاراتي', itemName: 'وحدة', itemsName: 'الوحدات', categoryLabel: 'نوع العقار', identifierLabel: 'رقم الصك/الوحدة', currency: 'ر.س' });
      setCategories(['شقة', 'فيلا', 'مكتب', 'مستودع']);
    } else if (type === 'events') {
      setSettings({ appName: 'إيفنت ماستر', itemName: 'غرض', itemsName: 'الأغراض', categoryLabel: 'القسم', identifierLabel: 'كود الصنف', currency: 'ر.س' });
      setCategories(['إضاءة', 'صوتيات', 'كراسي وطاولات', 'زينة']);
    } else if (type === 'photography') {
      setSettings({ appName: 'زوم رينتال', itemName: 'قطعة', itemsName: 'المعدات', categoryLabel: 'القسم', identifierLabel: 'السيريال', currency: 'ج.م' });
      setCategories(['كاميرات', 'عدسات', 'إضاءة', 'خلفيات', 'صوتيات', 'درون', 'اكسسوارات']);
    }
    alert('تم تطبيق إعدادات النظام بنجاح!');
  };

  const handleSaveCustomer = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const type = formData.get('type') as 'client' | 'supplier';
    
    if (editingId) {
      setCustomers(prev => prev.map(c => {
        if (c.id === editingId) {
          return {
            ...c,
            name: formData.get('name') as string,
            type: type,
            idNumber: formData.get('idNumber') as string,
            phone: formData.get('phone') as string,
            email: formData.get('email') as string,
            address: formData.get('address') as string,
          };
        }
        return c;
      }));
    } else {
      const newCustomer: Customer = {
        id: type === 'client' ? `C-${Math.floor(Math.random() * 10000)}` : `S-${Math.floor(Math.random() * 10000)}`,
        name: formData.get('name') as string,
        type: type,
        idNumber: formData.get('idNumber') as string,
        phone: formData.get('phone') as string,
        email: formData.get('email') as string,
        address: formData.get('address') as string,
        balance: 0,
        status: CustomerStatus.Active,
      };
      setCustomers(prev => [...prev, newCustomer]);
    }
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleDeleteCustomer = (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا السجل؟ سيتم حذف بياناته من العرض.')) {
      setCustomers(prev => prev.filter(c => c.id !== id));
      if (selectedCustomer?.id === id) setSelectedCustomer(null);
    }
  };

  const handleSaveEquipment = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const type = formData.get('type') as EquipmentType;
    
    if (editingId) {
      setEquipment(prev => prev.map(eq => {
        if (eq.id === editingId) {
          return {
            ...eq,
            name: formData.get('name') as string,
            serialNumber: formData.get('serialNumber') as string,
            category: formData.get('category') as string,
            brand: formData.get('brand') as string,
            model: formData.get('model') as string,
            condition: formData.get('condition') as any,
            type: type,
            dailyRate: Number(formData.get('dailyRate')),
            supplierName: type === EquipmentType.External ? formData.get('supplierName') as string : undefined,
            supplierCost: type === EquipmentType.External ? Number(formData.get('supplierCost')) : undefined,
          };
        }
        return eq;
      }));
    } else {
      const newEquipment: Equipment = {
        id: `E-${Math.floor(Math.random() * 10000)}`,
        name: formData.get('name') as string,
        serialNumber: formData.get('serialNumber') as string,
        category: formData.get('category') as string,
        brand: formData.get('brand') as string,
        model: formData.get('model') as string,
        condition: formData.get('condition') as any,
        type: type,
        status: EquipmentStatus.Available,
        dailyRate: Number(formData.get('dailyRate')),
        supplierName: type === EquipmentType.External ? formData.get('supplierName') as string : undefined,
        supplierCost: type === EquipmentType.External ? Number(formData.get('supplierCost')) : undefined,
        image: `https://picsum.photos/200/200?random=${Math.floor(Math.random() * 100)}`
      };
      setEquipment(prev => [...prev, newEquipment]);
    }
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleDeleteEquipment = (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا السجل؟')) {
      setEquipment(prev => prev.filter(e => e.id !== id));
    }
  };

  const handleAddBooking = () => {
    if (!bookingCustomerId || bookingCart.length === 0 || !bookingDates.start || !bookingDates.end) return;
    
    const cust = customers.find(c => c.id === bookingCustomerId);
    if (!cust) return;

    const days = calculateDays(bookingDates.start, bookingDates.end);
    
    const items: BookingItem[] = bookingCart.map(eq => ({
      equipmentId: eq.id,
      equipmentName: eq.name,
      dailyRate: eq.dailyRate,
      days: days,
      total: eq.dailyRate * days
    }));

    const totalAmount = items.reduce((sum, item) => sum + item.total, 0);

    const newBooking: Booking = {
      id: `B-${Math.floor(Math.random() * 10000)}`,
      customerId: cust.id,
      customerName: cust.name,
      items,
      startDate: bookingDates.start,
      endDate: bookingDates.end,
      totalAmount,
      paidAmount: 0,
      deposit: 0,
      status: BookingStatus.Active,
      createdAt: new Date().toISOString().split('T')[0]
    };

    setBookings(prev => [newBooking, ...prev]);
    const eqIds = items.map(i => i.equipmentId);
    setEquipment(prev => prev.map(e => eqIds.includes(e.id) ? { ...e, status: EquipmentStatus.Rented } : e));

    const newTransaction: Transaction = {
      id: `T-${Math.floor(Math.random() * 10000)}`,
      customerId: cust.id,
      bookingId: newBooking.id,
      date: new Date().toISOString().split('T')[0],
      amount: -totalAmount,
      type: 'Invoice',
      description: `حجز جديد رقم ${newBooking.id}`
    };
    setTransactions(prev => [newTransaction, ...prev]);
    setCustomers(prev => prev.map(c => c.id === cust.id ? { ...c, balance: c.balance + totalAmount } : c));

    setIsModalOpen(false);
    setBookingCart([]);
    setBookingCustomerId('');
    setBookingCategoryFilter('all');
    setBookingSearchTerm('');
  };

  const addToCart = (item: Equipment) => {
    if (!bookingCart.find(i => i.id === item.id)) {
      setBookingCart([...bookingCart, item]);
    }
  };

  const removeFromCart = (itemId: string) => {
    setBookingCart(bookingCart.filter(i => i.id !== itemId));
  };

  const handleAddPayment = (amount: number, method: PaymentMethod) => {
    if (!selectedCustomer) return;
    
    const newTransaction: Transaction = {
      id: `T-${Math.floor(Math.random() * 10000)}`,
      customerId: selectedCustomer.id,
      date: new Date().toISOString().split('T')[0],
      amount: amount,
      type: 'Payment',
      description: 'دفعة لحساب العميل',
      method
    };

    setTransactions(prev => [newTransaction, ...prev]);
    setCustomers(prev => prev.map(c => c.id === selectedCustomer.id ? { ...c, balance: c.balance - amount } : c));
    setIsModalOpen(false);
  };

  const handleReturnEquipment = (bookingId: string) => {
    const booking = bookings.find(b => b.id === bookingId);
    if(!booking) return;
    setBookings(prev => prev.map(b => b.id === bookingId ? {...b, status: BookingStatus.Completed} : b));
    const eqIds = booking.items.map(i => i.equipmentId);
    setEquipment(prev => prev.map(e => eqIds.includes(e.id) ? {...e, status: EquipmentStatus.Available} : e));
  };


  // --- Views ---

  const renderDashboard = () => {
    const totalRevenue = bookings.reduce((sum, b) => sum + b.totalAmount, 0);
    const activeBookings = bookings.filter(b => b.status === BookingStatus.Active).length;
    const availableEquipment = equipment.filter(e => e.status === EquipmentStatus.Available).length;
    const rentedEquipment = equipment.filter(e => e.status === EquipmentStatus.Rented).length;

    const pieData = [
      { name: 'متاح', value: availableEquipment, color: '#10B981' },
      { name: 'مؤجر', value: rentedEquipment, color: '#EAB308' },
      { name: 'صيانة', value: equipment.filter(e => e.status === EquipmentStatus.Maintenance).length, color: '#000000' },
    ];

    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-zinc-800">لوحة التحكم</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="إجمالي الإيرادات" value={`${totalRevenue.toLocaleString()} ${settings.currency}`} icon={DollarSign} color="bg-emerald-500" trend="+12%" />
          <StatCard title="الحجوزات النشطة" value={activeBookings} icon={CalendarDays} color="bg-yellow-500" />
          <StatCard title={`ال${settings.itemsName} المؤجرة`} value={rentedEquipment} icon={Truck} color="bg-black" />
          <StatCard title="عدد العملاء" value={customers.filter(c => c.type === 'client').length} icon={Users} color="bg-lime-600" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-zinc-200">
            <h3 className="text-lg font-bold mb-4 text-zinc-800">حالة {settings.itemsName}</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          
           <div className="bg-white p-6 rounded-xl shadow-sm border border-zinc-200">
            <h3 className="text-lg font-bold mb-4 text-zinc-800">أحدث الحجوزات</h3>
            <div className="space-y-4">
              {bookings.slice(0, 4).map(booking => (
                <div key={booking.id} className="flex items-center justify-between p-3 bg-zinc-50 rounded-lg">
                  <div>
                    <p className="font-bold text-sm text-zinc-800">{booking.customerName}</p>
                    <p className="text-xs text-zinc-500">{booking.items.length} {settings.itemsName} • {booking.startDate}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${booking.status === BookingStatus.Active ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-100 text-zinc-700'}`}>
                    {booking.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderCustomers = () => {
    if (selectedCustomer) return renderCustomerDetails();

    let filteredCustomers = customers.filter(c => c.name.includes(searchTerm) || c.phone.includes(searchTerm));
    
    if (customerFilterType !== 'all') {
      filteredCustomers = filteredCustomers.filter(c => c.type === customerFilterType);
    }

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-zinc-800">إدارة الشركاء</h2>
          <button 
            onClick={() => { setModalType('addCustomer'); setEditingId(null); setIsModalOpen(true); }}
            className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus size={18} /> إضافة جديد
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
          <div className="p-4 border-b border-zinc-200 space-y-4">
            <div className="flex gap-2">
               <button 
                  onClick={() => setCustomerFilterType('all')}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${customerFilterType === 'all' ? 'bg-black text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'}`}
               >
                 الكل
               </button>
               <button 
                  onClick={() => setCustomerFilterType('client')}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${customerFilterType === 'client' ? 'bg-emerald-600 text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'}`}
               >
                 العملاء
               </button>
               <button 
                  onClick={() => setCustomerFilterType('supplier')}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${customerFilterType === 'supplier' ? 'bg-purple-600 text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'}`}
               >
                 الموردين (المكاتب)
               </button>
            </div>
            <div className="relative max-w-sm">
              <Search className="absolute right-3 top-3 text-zinc-400" size={18} />
              <input 
                type="text" 
                placeholder="بحث بالاسم أو رقم الهاتف..." 
                className="w-full pl-4 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none text-zinc-900 bg-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <table className="w-full text-right">
            <thead className="bg-zinc-50 text-zinc-600 text-sm">
              <tr>
                <th className="p-4">النوع</th>
                <th className="p-4">الاسم</th>
                <th className="p-4">رقم الجوال</th>
                <th className="p-4">الرصيد</th>
                <th className="p-4">الحالة</th>
                <th className="p-4">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map(customer => (
                <tr key={customer.id} className="border-b border-zinc-100 hover:bg-zinc-50">
                  <td className="p-4">
                     {customer.type === 'client' ? (
                       <span className="flex items-center gap-1 text-emerald-700 bg-emerald-100 w-fit px-2 py-1 rounded text-xs font-bold">
                         <UserCircle size={14} /> عميل
                       </span>
                     ) : (
                       <span className="flex items-center gap-1 text-purple-700 bg-purple-100 w-fit px-2 py-1 rounded text-xs font-bold">
                         <Building2 size={14} /> مورد
                       </span>
                     )}
                  </td>
                  <td className="p-4 font-medium text-zinc-800">{customer.name}</td>
                  <td className="p-4 text-zinc-500">{customer.phone}</td>
                  <td className={`p-4 font-bold ${customer.balance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {customer.balance.toLocaleString()} {settings.currency}
                  </td>
                  <td className="p-4">
                    <span className="px-2 py-1 bg-zinc-100 text-zinc-700 text-xs rounded-full">{customer.status}</span>
                  </td>
                  <td className="p-4 flex gap-2">
                    <button 
                      onClick={() => setSelectedCustomer(customer)}
                      className="text-yellow-600 hover:text-yellow-800 text-sm font-bold bg-yellow-50 px-3 py-1 rounded-md"
                    >
                      عرض الملف
                    </button>
                    <button 
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setEditingId(customer.id); setModalType('editCustomer'); setIsModalOpen(true); }}
                      className="text-zinc-600 hover:text-zinc-900 bg-zinc-100 p-1.5 rounded-md"
                      title="تعديل"
                    >
                      <Pencil size={16} />
                    </button>
                    <button 
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleDeleteCustomer(customer.id); }}
                      className="text-red-500 hover:text-red-700 bg-red-50 p-1.5 rounded-md"
                      title="حذف"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderCustomerDetails = () => {
    if (!selectedCustomer) return null;
    const customerTransactions = transactions.filter(t => t.customerId === selectedCustomer.id);
    const customerBookings = bookings.filter(b => b.customerId === selectedCustomer.id);

    return (
      <div className="space-y-6">
        <button onClick={() => setSelectedCustomer(null)} className="text-zinc-500 hover:text-zinc-800 flex items-center gap-2 mb-4">
          ← العودة للقائمة
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-zinc-200 h-fit">
            <div className="flex items-center justify-between mb-6">
               <h2 className="text-xl font-bold text-zinc-800">{selectedCustomer.name}</h2>
               <div className="flex items-center gap-2">
                 <span className={`px-2 py-1 text-xs rounded-full font-bold ${selectedCustomer.type === 'client' ? 'bg-emerald-100 text-emerald-700' : 'bg-purple-100 text-purple-700'}`}>
                    {selectedCustomer.type === 'client' ? 'عميل' : 'مورد'}
                 </span>
                 <span className="px-2 py-1 bg-zinc-100 text-zinc-700 text-xs rounded-full">{selectedCustomer.id}</span>
               </div>
            </div>
            
            <div className="space-y-4 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-500">الجوال:</span>
                <span className="font-medium">{selectedCustomer.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">البريد:</span>
                <span className="font-medium">{selectedCustomer.email || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">العنوان:</span>
                <span className="font-medium">{selectedCustomer.address || '-'}</span>
              </div>
              
              <div className="pt-4 border-t border-zinc-100 mt-4">
                <p className="text-zinc-500 mb-1">الرصيد الحالي</p>
                <h3 className={`text-3xl font-bold ${selectedCustomer.balance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {selectedCustomer.balance.toLocaleString()} <span className="text-sm text-zinc-400">{settings.currency}</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                   {selectedCustomer.balance > 0 ? 'مبلغ مستحق لنا' : selectedCustomer.balance < 0 ? 'مبلغ مستحق له (علينا)' : 'حساب متزن'}
                </p>
              </div>

              <button 
                onClick={() => { setModalType('addPayment'); setIsModalOpen(true); }}
                className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg font-bold"
              >
                تسجيل دفعة / حركة مالية
              </button>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
               <div className="p-4 bg-zinc-50 border-b border-zinc-200">
                 <h3 className="font-bold text-zinc-700">سجل المعاملات المالية</h3>
               </div>
               <div className="max-h-64 overflow-y-auto">
                 <table className="w-full text-right text-sm">
                   <thead className="bg-zinc-50 text-zinc-500 sticky top-0">
                     <tr>
                       <th className="p-3">التاريخ</th>
                       <th className="p-3">الوصف</th>
                       <th className="p-3">النوع</th>
                       <th className="p-3 text-left">المبلغ</th>
                     </tr>
                   </thead>
                   <tbody>
                     {customerTransactions.map(t => (
                       <tr key={t.id} className="border-b border-zinc-100">
                         <td className="p-3 text-zinc-600">{t.date}</td>
                         <td className="p-3 text-zinc-600">{t.description}</td>
                         <td className="p-3">
                           <span className={`text-xs px-2 py-1 rounded ${t.type === 'Invoice' ? 'bg-black text-white' : 'bg-emerald-100 text-emerald-700'}`}>
                             {t.type === 'Invoice' ? 'فاتورة' : 'دفعة'}
                           </span>
                         </td>
                         <td className={`p-3 text-left font-bold ${t.amount < 0 ? 'text-black' : 'text-emerald-600'}`}>
                           {Math.abs(t.amount).toLocaleString()} {settings.currency}
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-zinc-200">
               <div className="p-4 bg-zinc-50 border-b border-zinc-200">
                 <h3 className="font-bold text-zinc-700">الحجوزات</h3>
               </div>
                <div className="p-4 space-y-3">
                  {customerBookings.map(b => (
                    <div key={b.id} className="border border-zinc-200 rounded-lg p-4 flex justify-between items-center bg-zinc-50/50">
                       <div>
                          <div className="flex items-center gap-2 mb-1">
                             <span className="font-bold text-zinc-800">{b.id}</span>
                             <span className={`text-xs px-2 py-0.5 rounded ${b.status === BookingStatus.Active ? 'bg-emerald-100 text-emerald-800' : 'bg-zinc-200 text-zinc-600'}`}>
                                {b.status}
                             </span>
                          </div>
                          <p className="text-sm text-zinc-500">{b.startDate} إلى {b.endDate}</p>
                          <p className="text-sm mt-1 text-zinc-700">{b.items.map(i => i.equipmentName).join(', ')}</p>
                       </div>
                       <div className="text-left">
                          <p className="font-bold text-lg text-zinc-900">{b.totalAmount.toLocaleString()} {settings.currency}</p>
                          {b.status === BookingStatus.Active && (
                             <button onClick={() => handleReturnEquipment(b.id)} className="mt-2 text-xs bg-yellow-100 text-yellow-800 px-3 py-1 rounded hover:bg-yellow-200 font-bold">
                                تسجيل إرجاع
                             </button>
                          )}
                       </div>
                    </div>
                  ))}
                </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderEquipment = () => {
    const filteredEq = equipment.filter(e => 
      (equipmentCategoryFilter === 'all' || e.category === equipmentCategoryFilter) &&
      (e.name.includes(searchTerm) || e.category.includes(searchTerm))
    );

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-zinc-800">إدارة {settings.itemsName}</h2>
          <div className="flex gap-2">
            <button 
              onClick={() => { setModalType('manageCategories'); setIsModalOpen(true); }}
              className="bg-zinc-200 hover:bg-zinc-300 text-black font-bold px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Settings size={18} /> إدارة {settings.categoryLabel}
            </button>
            <button 
              onClick={() => { setModalType('addEquipment'); setEditingId(null); setIsModalOpen(true); }}
              className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Plus size={18} /> إضافة {settings.itemName}
            </button>
          </div>
        </div>

        <div className="mb-4 flex gap-2">
           <select 
             className="p-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none w-48 bg-white text-zinc-900"
             value={equipmentCategoryFilter}
             onChange={(e) => setEquipmentCategoryFilter(e.target.value)}
           >
             <option value="all">كل التصنيفات</option>
             {categories.map(cat => (
               <option key={cat} value={cat}>{cat}</option>
             ))}
           </select>

           <input 
              type="text" 
              placeholder={`بحث باسم ال${settings.itemName}...`}
              className="flex-1 p-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none bg-white text-zinc-900"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEq.map(item => (
            <div key={item.id} className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden hover:shadow-md transition-all group relative">
              <div className="h-40 bg-zinc-100 relative">
                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                <span className={`absolute top-2 right-2 px-2 py-1 text-xs rounded-lg font-medium bg-white/90 shadow-sm
                  ${item.status === EquipmentStatus.Available ? 'text-emerald-600' : 
                    item.status === EquipmentStatus.Rented ? 'text-yellow-600' : 'text-black'}`}>
                  {item.status}
                </span>
                {item.type === EquipmentType.External && (
                  <span className="absolute bottom-2 left-2 px-2 py-1 text-xs rounded-lg font-medium bg-black text-white shadow-sm">
                    خارجية
                  </span>
                )}
                
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setEditingId(item.id); setModalType('editEquipment'); setIsModalOpen(true); }}
                    className="bg-white p-2 rounded-full hover:bg-yellow-400 text-black transition-colors"
                  >
                    <Pencil size={18} />
                  </button>
                  <button 
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleDeleteEquipment(item.id); }}
                    className="bg-white p-2 rounded-full hover:bg-red-500 hover:text-white text-red-500 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-bold text-zinc-800">{item.name}</h3>
                    <p className="text-xs text-zinc-500">{item.category} • {item.brand}</p>
                  </div>
                  <p className="font-bold text-yellow-600">{item.dailyRate} <span className="text-xs font-normal text-zinc-400">{settings.currency}/يوم</span></p>
                </div>
                
                <div className="mt-4 pt-4 border-t border-zinc-100 grid grid-cols-2 gap-2 text-xs text-zinc-600">
                  <div>
                    <span className="block text-zinc-400">{settings.identifierLabel}</span>
                    {item.serialNumber}
                  </div>
                  <div>
                    <span className="block text-zinc-400">الموديل</span>
                    {item.model}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderBookings = () => {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-zinc-800">سجل الحجوزات</h2>
          <button 
            onClick={() => { setModalType('addBooking'); setIsModalOpen(true); }}
            className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus size={18} /> حجز جديد
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
          <table className="w-full text-right">
            <thead className="bg-zinc-50 text-zinc-600 text-sm">
              <tr>
                <th className="p-4">رقم الحجز</th>
                <th className="p-4">العميل</th>
                <th className="p-4">{settings.itemsName}</th>
                <th className="p-4">التاريخ</th>
                <th className="p-4">القيمة</th>
                <th className="p-4">الحالة</th>
                <th className="p-4">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map(booking => (
                <tr key={booking.id} className="border-b border-zinc-100 hover:bg-zinc-50 text-sm">
                  <td className="p-4 font-bold text-zinc-800">{booking.id}</td>
                  <td className="p-4 text-zinc-700">{booking.customerName}</td>
                  <td className="p-4">
                     <div className="flex flex-col">
                       {booking.items.map((item, idx) => (
                         <span key={idx} className="text-zinc-600 text-xs">- {item.equipmentName}</span>
                       ))}
                     </div>
                  </td>
                  <td className="p-4 text-zinc-500">
                    {booking.startDate} <br/> <span className="text-xs">إلى</span> {booking.endDate}
                  </td>
                  <td className="p-4 font-bold text-zinc-900">{booking.totalAmount.toLocaleString()} {settings.currency}</td>
                  <td className="p-4">
                     <span className={`px-2 py-1 text-xs rounded-full ${booking.status === BookingStatus.Active ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-100 text-zinc-600'}`}>
                        {booking.status}
                     </span>
                  </td>
                  <td className="p-4">
                    {booking.status === BookingStatus.Active && (
                        <button onClick={() => handleReturnEquipment(booking.id)} className="text-yellow-600 hover:text-yellow-800 font-bold hover:underline">
                           إرجاع وإقفال
                        </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };
  
  const renderReports = () => {
    const data = bookings.slice(0, 10).map(b => ({
      name: b.id,
      amount: b.totalAmount
    }));

    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-zinc-800">التقارير والإحصائيات</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-zinc-200">
            <h3 className="font-bold mb-4 text-zinc-700">الإيرادات حسب الحجز</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="amount" fill="#EAB308" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
           <div className="bg-white p-6 rounded-xl shadow-sm border border-zinc-200">
            <h3 className="font-bold mb-4 text-zinc-700">ملخص سريع</h3>
             <ul className="space-y-3 text-sm">
                <li className="flex justify-between p-2 bg-zinc-50 rounded">
                   <span>إجمالي {settings.itemsName} المملوكة</span>
                   <span className="font-bold">{equipment.filter(e => e.type === EquipmentType.Owned).length}</span>
                </li>
                 <li className="flex justify-between p-2 bg-zinc-50 rounded">
                   <span>إجمالي {settings.itemsName} الخارجية</span>
                   <span className="font-bold">{equipment.filter(e => e.type === EquipmentType.External).length}</span>
                </li>
                 <li className="flex justify-between p-2 bg-zinc-50 rounded">
                   <span>إجمالي الديون (على العملاء)</span>
                   <span className="font-bold text-black">{customers.filter(c => c.type === 'client').reduce((acc, c) => acc + (c.balance > 0 ? c.balance : 0), 0).toLocaleString()} {settings.currency}</span>
                </li>
                 <li className="flex justify-between p-2 bg-zinc-50 rounded">
                   <span>مستحقات الموردين (علينا)</span>
                   <span className="font-bold text-red-600">{Math.abs(customers.filter(c => c.type === 'supplier').reduce((acc, c) => acc + (c.balance < 0 ? c.balance : 0), 0)).toLocaleString()} {settings.currency}</span>
                </li>
             </ul>
          </div>
        </div>
      </div>
    );
  };

  const renderSettings = () => {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-zinc-800">إعدادات النظام</h2>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-zinc-200">
          <h3 className="font-bold mb-4 text-zinc-700">تخصيص النظام</h3>
          <p className="text-sm text-zinc-500 mb-6">يمكنك تغيير مسميات النظام لتناسب نشاطك التجاري (سيارات، عقارات، معدات، إلخ).</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <button onClick={() => handleApplyPreset('equipment')} className="p-4 border border-zinc-200 rounded-lg hover:bg-yellow-50 hover:border-yellow-500 transition-all flex flex-col items-center gap-2">
               <Truck className="text-yellow-600" />
               <span className="font-bold text-zinc-800">نظام المعدات</span>
            </button>
            <button onClick={() => handleApplyPreset('cars')} className="p-4 border border-zinc-200 rounded-lg hover:bg-blue-50 hover:border-blue-500 transition-all flex flex-col items-center gap-2">
               <div className="text-blue-600 font-bold">CAR</div>
               <span className="font-bold text-zinc-800">تأجير السيارات</span>
            </button>
            <button onClick={() => handleApplyPreset('properties')} className="p-4 border border-zinc-200 rounded-lg hover:bg-emerald-50 hover:border-emerald-500 transition-all flex flex-col items-center gap-2">
               <Building2 className="text-emerald-600" />
               <span className="font-bold text-zinc-800">إدارة العقارات</span>
            </button>
            <button onClick={() => handleApplyPreset('events')} className="p-4 border border-zinc-200 rounded-lg hover:bg-purple-50 hover:border-purple-500 transition-all flex flex-col items-center gap-2">
               <div className="text-purple-600 font-bold">EVT</div>
               <span className="font-bold text-zinc-800">تجهيز المناسبات</span>
            </button>
            <button onClick={() => handleApplyPreset('photography')} className="p-4 border border-zinc-200 rounded-lg hover:bg-red-50 hover:border-red-500 transition-all flex flex-col items-center gap-2">
               <Camera className="text-red-600" />
               <span className="font-bold text-zinc-800">معدات التصوير</span>
            </button>
          </div>

          <div className="space-y-4 pt-6 border-t border-zinc-100">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                 <label className="block text-sm font-medium text-zinc-700 mb-1">اسم التطبيق</label>
                 <input 
                   value={settings.appName} 
                   onChange={(e) => setSettings({...settings, appName: e.target.value})}
                   className="w-full p-2 border rounded bg-zinc-50 text-zinc-900" 
                 />
               </div>
               <div>
                 <label className="block text-sm font-medium text-zinc-700 mb-1">رمز العملة</label>
                 <input 
                   value={settings.currency} 
                   onChange={(e) => setSettings({...settings, currency: e.target.value})}
                   placeholder="مثال: ر.س، ج.م، $"
                   className="w-full p-2 border rounded bg-zinc-50 text-zinc-900" 
                 />
               </div>
               <div>
                 <label className="block text-sm font-medium text-zinc-700 mb-1">اسم العنصر (مفرد)</label>
                 <input 
                   value={settings.itemName} 
                   onChange={(e) => setSettings({...settings, itemName: e.target.value})}
                   placeholder="مثال: سيارة، معدة"
                   className="w-full p-2 border rounded bg-zinc-50 text-zinc-900" 
                 />
               </div>
               <div>
                 <label className="block text-sm font-medium text-zinc-700 mb-1">اسم العناصر (جمع)</label>
                 <input 
                   value={settings.itemsName} 
                   onChange={(e) => setSettings({...settings, itemsName: e.target.value})}
                   placeholder="مثال: السيارات، المعدات"
                   className="w-full p-2 border rounded bg-zinc-50 text-zinc-900" 
                 />
               </div>
               <div>
                 <label className="block text-sm font-medium text-zinc-700 mb-1">مسمى التصنيف</label>
                 <input 
                   value={settings.categoryLabel} 
                   onChange={(e) => setSettings({...settings, categoryLabel: e.target.value})}
                   placeholder="مثال: الفئة، النوع"
                   className="w-full p-2 border rounded bg-zinc-50 text-zinc-900" 
                 />
               </div>
               <div>
                 <label className="block text-sm font-medium text-zinc-700 mb-1">مسمى المعرف الفريد</label>
                 <input 
                   value={settings.identifierLabel} 
                   onChange={(e) => setSettings({...settings, identifierLabel: e.target.value})}
                   placeholder="مثال: رقم اللوحة، الرقم التسلسلي"
                   className="w-full p-2 border rounded bg-zinc-50 text-zinc-900" 
                 />
               </div>
            </div>
            <div className="flex justify-end pt-4">
               <button className="bg-black text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2">
                 <Save size={18} /> حفظ الإعدادات
               </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderModal = () => {
    if (!isModalOpen) return null;

    const editingCustomer = modalType === 'editCustomer' && editingId ? customers.find(c => c.id === editingId) : null;
    const editingEquipment = modalType === 'editEquipment' && editingId ? equipment.find(e => e.id === editingId) : null;
    
    // Booking specific variables
    const bookingDays = (bookingDates.start && bookingDates.end) ? calculateDays(bookingDates.start, bookingDates.end) : 0;
    const bookingTotal = bookingCart.reduce((acc, eq) => acc + (eq.dailyRate * bookingDays), 0);
    const filteredBookingEquipment = equipment
      .filter(e => e.status === EquipmentStatus.Available)
      .filter(e => bookingCategoryFilter === 'all' || e.category === bookingCategoryFilter)
      .filter(e => e.name.toLowerCase().includes(bookingSearchTerm.toLowerCase()));

    return (
      <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
        <div className={`bg-white rounded-2xl shadow-xl w-full ${modalType === 'addBooking' ? 'max-w-6xl h-[85vh]' : 'max-w-2xl max-h-[90vh]'} overflow-hidden flex flex-col`}>
          <div className="p-6 border-b border-zinc-100 flex justify-between items-center bg-white shrink-0">
            <h3 className="text-xl font-bold text-zinc-800">
              {modalType === 'addCustomer' && 'إضافة شريك جديد'}
              {modalType === 'editCustomer' && 'تعديل بيانات الشريك'}
              {modalType === 'addEquipment' && `إضافة ${settings.itemName} جديدة`}
              {modalType === 'editEquipment' && `تعديل بيانات ال${settings.itemName}`}
              {modalType === 'addBooking' && 'حجز جديد (نقطة بيع)'}
              {modalType === 'addPayment' && 'تسجيل دفعة'}
              {modalType === 'manageCategories' && `إدارة ${settings.categoryLabel}`}
            </h3>
            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-zinc-100 rounded-full text-zinc-500">
              <X size={24} />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 bg-zinc-50">
            {modalType === 'manageCategories' && (
              <div className="space-y-6">
                 <div className="flex gap-2">
                    <input 
                      id="newCategoryInput"
                      type="text" 
                      placeholder={`اسم ${settings.categoryLabel} الجديد...`}
                      className="flex-1 p-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none text-zinc-900 bg-white"
                    />
                    <button 
                      onClick={() => {
                         const input = document.getElementById('newCategoryInput') as HTMLInputElement;
                         if(input.value) {
                           handleAddCategory(input.value);
                           input.value = '';
                         }
                      }}
                      className="bg-black text-white px-4 rounded-lg hover:bg-zinc-800 font-bold"
                    >
                      إضافة
                    </button>
                 </div>
                 
                 <div className="bg-zinc-50 rounded-lg p-2 max-h-60 overflow-y-auto space-y-2">
                    {categories.length === 0 && <p className="text-center text-zinc-400 p-4">لا توجد تصنيفات حالياً</p>}
                    {categories.map((cat, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-white p-3 rounded shadow-sm border border-zinc-100">
                         <span className="font-medium text-zinc-800">{cat}</span>
                         <button 
                           onClick={() => handleDeleteCategory(cat)}
                           className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-full transition-colors"
                           title="حذف"
                         >
                           <Trash2 size={16} />
                         </button>
                      </div>
                    ))}
                 </div>
              </div>
            )}

            {(modalType === 'addCustomer' || modalType === 'editCustomer') && (
              <form onSubmit={handleSaveCustomer} className="space-y-4">
                <div className="mb-4">
                   <label className="block text-sm font-bold text-zinc-800 mb-2">نوع الشريك</label>
                   <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer bg-emerald-50 p-3 rounded-lg border border-emerald-100 w-full hover:bg-emerald-100 transition-colors">
                        <input type="radio" name="type" value="client" defaultChecked={!editingCustomer || editingCustomer.type === 'client'} className="w-5 h-5 text-emerald-600 focus:ring-emerald-500 accent-emerald-600" />
                        <span className="font-bold text-emerald-900">عميل (نؤجر له)</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer bg-purple-50 p-3 rounded-lg border border-purple-100 w-full hover:bg-purple-100 transition-colors">
                        <input type="radio" name="type" value="supplier" defaultChecked={editingCustomer?.type === 'supplier'} className="w-5 h-5 text-purple-600 focus:ring-purple-500 accent-purple-600" />
                        <span className="font-bold text-purple-900">مورد / مكتب (نستأجر منه)</span>
                      </label>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <input name="name" defaultValue={editingCustomer?.name} placeholder="اسم العميل / المكتب" required className="border p-2 rounded w-full focus:ring-2 focus:ring-yellow-500 outline-none text-zinc-900 bg-white" />
                  <input name="idNumber" defaultValue={editingCustomer?.idNumber} placeholder="رقم الهوية / السجل التجاري" required className="border p-2 rounded w-full focus:ring-2 focus:ring-yellow-500 outline-none text-zinc-900 bg-white" />
                  <input name="phone" defaultValue={editingCustomer?.phone} placeholder="رقم الجوال" required className="border p-2 rounded w-full focus:ring-2 focus:ring-yellow-500 outline-none text-zinc-900 bg-white" />
                  <input name="email" defaultValue={editingCustomer?.email} type="email" placeholder="البريد الإلكتروني" className="border p-2 rounded w-full focus:ring-2 focus:ring-yellow-500 outline-none text-zinc-900 bg-white" />
                </div>
                <input name="address" defaultValue={editingCustomer?.address} placeholder="العنوان التفصيلي" className="border p-2 rounded w-full focus:ring-2 focus:ring-yellow-500 outline-none text-zinc-900 bg-white" />
                <button type="submit" className="w-full bg-yellow-500 text-black py-2 rounded-lg hover:bg-yellow-600 font-bold transition-colors">
                  {modalType === 'editCustomer' ? 'حفظ التعديلات' : 'حفظ البيانات'}
                </button>
              </form>
            )}

            {(modalType === 'addEquipment' || modalType === 'editEquipment') && (
              <form onSubmit={handleSaveEquipment} className="space-y-4">
                 <div className="grid grid-cols-2 gap-4">
                   <select name="type" defaultValue={editingEquipment?.type} className="border p-2 rounded w-full bg-white text-zinc-900 focus:ring-2 focus:ring-yellow-500 outline-none" required>
                     <option value={EquipmentType.Owned}>مملوكة</option>
                     <option value={EquipmentType.External}>خارجية</option>
                   </select>
                   <select name="condition" defaultValue={editingEquipment?.condition} className="border p-2 rounded w-full bg-white text-zinc-900 focus:ring-2 focus:ring-yellow-500 outline-none">
                     <option value="جديدة">جديدة</option>
                     <option value="ممتازة">ممتازة</option>
                     <option value="مستعملة">مستعملة</option>
                   </select>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                   <input name="name" defaultValue={editingEquipment?.name} placeholder={`اسم ال${settings.itemName}`} required className="border p-2 rounded w-full focus:ring-2 focus:ring-yellow-500 outline-none text-zinc-900 bg-white" />
                   <input name="serialNumber" defaultValue={editingEquipment?.serialNumber} placeholder={settings.identifierLabel} required className="border p-2 rounded w-full focus:ring-2 focus:ring-yellow-500 outline-none text-zinc-900 bg-white" />
                   
                   <select name="category" defaultValue={editingEquipment?.category} className="border p-2 rounded w-full bg-white text-zinc-900 focus:ring-2 focus:ring-yellow-500 outline-none" required>
                     <option value="">اختر {settings.categoryLabel}...</option>
                     {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                     ))}
                   </select>

                   <input name="brand" defaultValue={editingEquipment?.brand} placeholder="الماركة" required className="border p-2 rounded w-full focus:ring-2 focus:ring-yellow-500 outline-none text-zinc-900 bg-white" />
                   <input name="model" defaultValue={editingEquipment?.model} placeholder="الموديل" required className="border p-2 rounded w-full focus:ring-2 focus:ring-yellow-500 outline-none text-zinc-900 bg-white" />
                   <input name="dailyRate" defaultValue={editingEquipment?.dailyRate} type="number" placeholder="سعر التأجير اليومي" required className="border p-2 rounded w-full focus:ring-2 focus:ring-yellow-500 outline-none text-zinc-900 bg-white" />
                 </div>
                 
                 <div className="border-t border-zinc-100 pt-4">
                    <p className="text-sm text-zinc-500 mb-2">لل{settings.itemsName} الخارجية فقط</p>
                    <div className="grid grid-cols-2 gap-4">
                       <input name="supplierName" defaultValue={editingEquipment?.supplierName} placeholder="اسم المورد" className="border p-2 rounded w-full focus:ring-2 focus:ring-yellow-500 outline-none text-zinc-900 bg-white" />
                       <input name="supplierCost" defaultValue={editingEquipment?.supplierCost} type="number" placeholder="تكلفة الاستئجار من المورد" className="border p-2 rounded w-full focus:ring-2 focus:ring-yellow-500 outline-none text-zinc-900 bg-white" />
                    </div>
                 </div>

                 <button type="submit" className="w-full bg-yellow-500 text-black py-2 rounded-lg hover:bg-yellow-600 font-bold transition-colors">
                  {modalType === 'editEquipment' ? 'حفظ التعديلات' : `حفظ ال${settings.itemName}`}
                 </button>
              </form>
            )}

            {modalType === 'addPayment' && selectedCustomer && (
              <div className="space-y-4">
                 <p>تسجيل دفعة للعميل: <strong>{selectedCustomer.name}</strong></p>
                 <div className="flex gap-2 mb-4">
                    <p className="text-sm">الرصيد الحالي:</p>
                    <p className={`font-bold text-sm ${selectedCustomer.balance > 0 ? 'text-black' : 'text-emerald-600'}`}>
                      {selectedCustomer.balance.toLocaleString()} {settings.currency}
                    </p>
                 </div>
                 <input id="payAmount" type="number" placeholder="المبلغ" className="border p-2 rounded w-full focus:ring-2 focus:ring-emerald-500 outline-none text-zinc-900 bg-white" />
                 <select id="payMethod" className="border p-2 rounded w-full focus:ring-2 focus:ring-emerald-500 outline-none text-zinc-900 bg-white">
                    <option value={PaymentMethod.Cash}>نقدي</option>
                    <option value={PaymentMethod.Transfer}>تحويل بنكي</option>
                 </select>
                 <button 
                   onClick={() => {
                     const amt = (document.getElementById('payAmount') as HTMLInputElement).value;
                     const mth = (document.getElementById('payMethod') as HTMLSelectElement).value as PaymentMethod;
                     if(amt) handleAddPayment(Number(amt), mth);
                   }}
                   className="w-full bg-emerald-600 text-white py-2 rounded-lg hover:bg-emerald-700 font-bold transition-colors"
                 >
                   تأكيد الدفعة
                 </button>
              </div>
            )}

            {modalType === 'addBooking' && (
              <div className="flex flex-col lg:flex-row h-full gap-6">
                 {/* Right Side: Item Selector */}
                 <div className="flex-1 flex flex-col gap-4 overflow-hidden">
                    {/* Search & Filters */}
                    <div className="flex gap-2 bg-white p-3 rounded-xl border border-zinc-200 shrink-0">
                       <div className="relative flex-1">
                          <Search className="absolute right-3 top-3 text-zinc-400" size={18} />
                          <input 
                             placeholder="بحث عن المنتجات..." 
                             className="w-full pl-4 pr-10 py-2 bg-zinc-50 border rounded-lg outline-none focus:ring-2 focus:ring-yellow-500"
                             value={bookingSearchTerm}
                             onChange={(e) => setBookingSearchTerm(e.target.value)}
                          />
                       </div>
                    </div>
                    
                    {/* Categories Pills */}
                    <div className="flex gap-2 overflow-x-auto pb-2 shrink-0 no-scrollbar">
                       <button 
                          onClick={() => setBookingCategoryFilter('all')}
                          className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-bold transition-all ${bookingCategoryFilter === 'all' ? 'bg-black text-white shadow-md' : 'bg-white border text-zinc-600 hover:bg-zinc-100'}`}
                       >
                          الكل
                       </button>
                       {categories.map(cat => (
                         <button 
                            key={cat}
                            onClick={() => setBookingCategoryFilter(cat)}
                            className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-bold transition-all ${bookingCategoryFilter === cat ? 'bg-black text-white shadow-md' : 'bg-white border text-zinc-600 hover:bg-zinc-100'}`}
                         >
                            {cat}
                         </button>
                       ))}
                    </div>

                    {/* Grid */}
                    <div className="flex-1 overflow-y-auto pr-1">
                       <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                          {filteredBookingEquipment.map(item => {
                            const isAdded = bookingCart.find(i => i.id === item.id);
                            return (
                              <div key={item.id} className={`bg-white rounded-xl border transition-all overflow-hidden flex flex-col ${isAdded ? 'border-yellow-500 ring-1 ring-yellow-500' : 'border-zinc-200 hover:shadow-md'}`}>
                                 <div className="h-28 bg-zinc-100 relative">
                                    <img src={item.image} className="w-full h-full object-cover" alt={item.name} />
                                    {isAdded && (
                                       <div className="absolute inset-0 bg-yellow-500/20 flex items-center justify-center">
                                          <div className="bg-yellow-500 text-white rounded-full p-1"><Plus /></div>
                                       </div>
                                    )}
                                 </div>
                                 <div className="p-3 flex-1 flex flex-col">
                                    <h4 className="font-bold text-sm text-zinc-800 line-clamp-1">{item.name}</h4>
                                    <p className="text-xs text-zinc-500 mb-2">{item.category}</p>
                                    <div className="mt-auto flex items-center justify-between">
                                       <span className="font-bold text-emerald-600 text-sm">{item.dailyRate} <span className="text-[10px] text-zinc-400">{settings.currency}</span></span>
                                       <button 
                                          onClick={() => isAdded ? removeFromCart(item.id) : addToCart(item)}
                                          className={`p-1.5 rounded-lg transition-colors ${isAdded ? 'bg-red-50 text-red-500 hover:bg-red-100' : 'bg-black text-white hover:bg-zinc-800'}`}
                                       >
                                          {isAdded ? <Minus size={16}/> : <Plus size={16} />}
                                       </button>
                                    </div>
                                 </div>
                              </div>
                            );
                          })}
                       </div>
                    </div>
                 </div>

                 {/* Left Side: Cart & Details */}
                 <div className="w-full lg:w-96 bg-white border border-zinc-200 rounded-xl flex flex-col shrink-0">
                    <div className="p-4 border-b border-zinc-100 bg-zinc-50 rounded-t-xl">
                       <h4 className="font-bold text-lg flex items-center gap-2">
                          <ShoppingCart size={20} /> تفاصيل الحجز
                       </h4>
                    </div>
                    
                    <div className="p-4 space-y-4 border-b border-zinc-100">
                       <div>
                          <label className="text-xs font-bold text-zinc-500 mb-1 block">العميل</label>
                          <select 
                            className="w-full border p-2 rounded-lg bg-zinc-50 focus:ring-2 focus:ring-yellow-500 outline-none text-sm"
                            value={bookingCustomerId}
                            onChange={(e) => setBookingCustomerId(e.target.value)}
                          >
                            <option value="">اختر العميل...</option>
                            {customers.filter(c => c.type === 'client').map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                          </select>
                       </div>
                       
                       <div className="grid grid-cols-2 gap-2">
                          <div>
                             <label className="text-xs font-bold text-zinc-500 mb-1 block">من</label>
                             <input type="date" className="w-full border p-2 rounded-lg bg-zinc-50 focus:ring-2 focus:ring-yellow-500 outline-none text-sm"
                               onChange={(e) => setBookingDates({...bookingDates, start: e.target.value})}
                             />
                          </div>
                          <div>
                             <label className="text-xs font-bold text-zinc-500 mb-1 block">إلى</label>
                             <input type="date" className="w-full border p-2 rounded-lg bg-zinc-50 focus:ring-2 focus:ring-yellow-500 outline-none text-sm"
                               onChange={(e) => setBookingDates({...bookingDates, end: e.target.value})}
                             />
                          </div>
                       </div>
                       
                       {bookingDays > 0 && (
                          <div className="bg-blue-50 text-blue-700 px-3 py-2 rounded-lg text-xs font-bold text-center border border-blue-100">
                             مدة الحجز: {bookingDays} يوم
                          </div>
                       )}
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                       {bookingCart.length === 0 ? (
                          <div className="h-full flex flex-col items-center justify-center text-zinc-400 opacity-50">
                             <ShoppingCart size={48} className="mb-2" />
                             <p>السلة فارغة</p>
                          </div>
                       ) : (
                          bookingCart.map(item => (
                             <div key={item.id} className="flex gap-3 items-center bg-zinc-50 p-2 rounded-lg border border-zinc-100">
                                <img src={item.image} className="w-12 h-12 rounded-md object-cover" />
                                <div className="flex-1">
                                   <p className="text-sm font-bold text-zinc-800 line-clamp-1">{item.name}</p>
                                   <p className="text-xs text-zinc-500">{item.dailyRate} × {bookingDays} يوم</p>
                                </div>
                                <div className="text-left">
                                   <p className="font-bold text-sm text-emerald-600">{(item.dailyRate * bookingDays).toLocaleString()}</p>
                                   <button onClick={() => removeFromCart(item.id)} className="text-red-400 hover:text-red-600 text-xs underline">حذف</button>
                                </div>
                             </div>
                          ))
                       )}
                    </div>

                    <div className="p-4 bg-zinc-50 border-t border-zinc-200 rounded-b-xl space-y-3">
                       <div className="flex justify-between items-center text-sm">
                          <span className="text-zinc-500">عدد المواد</span>
                          <span className="font-bold">{bookingCart.length}</span>
                       </div>
                       <div className="flex justify-between items-center text-xl font-bold">
                          <span>الإجمالي</span>
                          <span className="text-zinc-900">{bookingTotal.toLocaleString()} <span className="text-sm font-normal text-zinc-500">{settings.currency}</span></span>
                       </div>
                       <button 
                          disabled={!bookingCustomerId || bookingCart.length === 0 || bookingDays <= 0}
                          onClick={handleAddBooking}
                          className="w-full bg-yellow-500 hover:bg-yellow-600 disabled:bg-zinc-300 disabled:text-zinc-500 text-black py-3 rounded-xl font-bold shadow-lg shadow-yellow-500/20 transition-all flex justify-center items-center gap-2"
                       >
                          <Save size={18} /> تأكيد الحجز
                       </button>
                    </div>
                 </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-50 font-tajawal">
      <Sidebar 
        currentView={currentView} 
        setCurrentView={(view) => {
          setCurrentView(view);
          setSelectedCustomer(null);
        }} 
        appName={settings.appName}
        itemsLabel={settings.itemsName}
      />
      
      <main className="flex-1 overflow-y-auto p-8">
        {currentView === 'dashboard' && renderDashboard()}
        {currentView === 'customers' && renderCustomers()}
        {currentView === 'equipment' && renderEquipment()}
        {currentView === 'bookings' && renderBookings()}
        {currentView === 'reports' && renderReports()}
        {currentView === 'settings' && renderSettings()}
      </main>

      {renderModal()}
    </div>
  );
}

export default App;