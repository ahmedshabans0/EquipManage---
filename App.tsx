import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import { LayoutDashboard, Users, Truck, CalendarDays, Plus, Search, X, DollarSign, Pencil, Trash2, Building2, UserCircle, Settings, Save, Camera, ShoppingCart, Calendar, Minus, Lock, ShieldCheck, User as UserIcon, Upload, Image as ImageIcon } from 'lucide-react';
import {
  Customer, Equipment, Booking, Transaction, User,
  CustomerStatus, EquipmentType, EquipmentStatus, BookingStatus, PaymentMethod, BookingItem, SystemSettings, UserRole
} from './types';
import { EQUIPMENT_CATEGORIES } from './constants';
import StatCard from './components/StatCard';
import { calculateDays } from './services/dataService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// Import Supabase Services
import * as AuthService from './services/authService';
import * as CustomerService from './services/customerService';
import * as EquipmentService from './services/equipmentService';
import * as BookingService from './services/bookingService';
import * as TransactionService from './services/transactionService';
import * as UserService from './services/userService';
import * as SettingsService from './services/settingsService';

function App() {
  // Auth State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');

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

  // Application Data State - NOW LOADED FROM SUPABASE
  const [users, setUsers] = useState<User[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Loading State
  const [loading, setLoading] = useState(true);

  // Categories State
  const [categories, setCategories] = useState<string[]>(EQUIPMENT_CATEGORIES);

  // UI State
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedCustomerDetail, setSelectedCustomerDetail] = useState<Customer | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'addCustomer' | 'editCustomer' | 'addEquipment' | 'editEquipment' | 'addBooking' | 'addPayment' | 'returnEquipment' | 'manageCategories' | 'addUser' | 'editUser'>('addCustomer');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Image Upload State
  const [imagePreview, setImagePreview] = useState<string>('');

  // Filters
  const [customerFilterType, setCustomerFilterType] = useState<'all' | 'client' | 'supplier'>('all');
  const [equipmentCategoryFilter, setEquipmentCategoryFilter] = useState('all');

  // Booking Modal State
  const [bookingCart, setBookingCart] = useState<Equipment[]>([]);
  const [bookingCustomerId, setBookingCustomerId] = useState('');
  const [bookingDates, setBookingDates] = useState({ start: '', end: '' });
  const [bookingCategoryFilter, setBookingCategoryFilter] = useState('all');
  const [bookingSearchTerm, setBookingSearchTerm] = useState('');

  // --- LOAD DATA FROM SUPABASE ON MOUNT ---
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [customersData, equipmentData, bookingsData, transactionsData, usersData, settingsData] =
        await Promise.all([
          CustomerService.getCustomers(),
          EquipmentService.getEquipment(),
          BookingService.getBookings(),
          TransactionService.getTransactions(),
          UserService.getUsers(),
          SettingsService.getSettings(),
        ]);

      setCustomers(customersData);
      setEquipment(equipmentData);
      setBookings(bookingsData);
      setTransactions(transactionsData);
      setUsers(usersData);

      // Load settings and categories
      if (settingsData) {
        setSettings({
          appName: settingsData.appName,
          itemName: settingsData.itemName,
          itemsName: settingsData.itemsName,
          categoryLabel: settingsData.categoryLabel,
          identifierLabel: settingsData.identifierLabel,
          currency: settingsData.currency,
        });
        setCategories(settingsData.categories);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      alert('حدث خطأ أثناء تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  // --- Auth Actions ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const user = await AuthService.login(loginForm.username, loginForm.password);

    if (user) {
      if (!user.active) {
        setLoginError('تم تعطيل هذا الحساب. يرجى مراجعة الإدارة.');
        setLoading(false);
        return;
      }
      setCurrentUser(user);
      setLoginError('');
      setCurrentView('dashboard');
      await loadInitialData();
    } else {
      setLoginError('اسم المستخدم أو كلمة المرور غير صحيحة');
    }

    setLoading(false);
  };

  const handleLogout = () => {
    AuthService.logout();
    setCurrentUser(null);
    setLoginForm({ username: '', password: '' });
    setCustomers([]);
    setEquipment([]);
    setBookings([]);
    setTransactions([]);
    setUsers([]);
  };

  // --- Actions ---

  const handleAddCategory = async (newCategory: string) => {
    if (newCategory && !categories.includes(newCategory)) {
      const updatedCategories = [...categories, newCategory];
      setCategories(updatedCategories);
      await SettingsService.updateCategories(updatedCategories);
    }
  };

  const handleDeleteCategory = async (category: string) => {
    if (window.confirm(`هل أنت متأكد من حذف تصنيف "${category}"؟`)) {
      const updatedCategories = categories.filter(c => c !== category);
      setCategories(updatedCategories);
      await SettingsService.updateCategories(updatedCategories);
      if (equipmentCategoryFilter === category) setEquipmentCategoryFilter('all');
      if (bookingCategoryFilter === category) setBookingCategoryFilter('all');
    }
  };

  const handleApplyPreset = async (type: 'equipment' | 'cars' | 'properties' | 'events' | 'photography') => {
    const newSettings = await SettingsService.applyPreset(type);
    if (newSettings) {
      setSettings({
        appName: newSettings.appName,
        itemName: newSettings.itemName,
        itemsName: newSettings.itemsName,
        categoryLabel: newSettings.categoryLabel,
        identifierLabel: newSettings.identifierLabel,
        currency: newSettings.currency,
      });
      setCategories(newSettings.categories);
      alert('تم تطبيق إعدادات النظام بنجاح!');
    }
  };

  const handleSaveSettings = async () => {
    const success = await SettingsService.updateSettings({
      ...settings,
      categories,
    });
    if (success) {
      alert('تم حفظ الإعدادات بنجاح! ✅');
    } else {
      alert('حدث خطأ أثناء حفظ الإعدادات');
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const role = formData.get('role') as UserRole;

    const userData = {
      name: formData.get('name') as string,
      username: formData.get('username') as string,
      password: formData.get('password') as string,
      role: role,
      phone: formData.get('phone') as string,
      active: formData.get('active') === 'on'
    };

    if (editingId) {
      // Don't update password if empty
      if (!userData.password) {
        delete (userData as any).password;
      }

      const updated = await UserService.updateUser(editingId, userData);
      if (updated) {
        setUsers(prev => prev.map(u => u.id === editingId ? updated : u));
      }
    } else {
      const created = await UserService.createUser(userData);
      if (created) {
        setUsers(prev => [created, ...prev]);
      }
    }

    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleDeleteUser = async (id: string) => {
    if (users.length <= 1) {
      alert("لا يمكن حذف المستخدم الأخير.");
      return;
    }
    if (window.confirm('هل أنت متأكد من حذف هذا المستخدم؟')) {
      const success = await UserService.deleteUser(id);
      if (success) {
        setUsers(prev => prev.filter(u => u.id !== id));
      }
    }
  };

  const handleSaveCustomer = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const type = formData.get('type') as 'client' | 'supplier';

    if (editingId) {
      const updated = await CustomerService.updateCustomer(editingId, {
        name: formData.get('name') as string,
        type: type,
        idNumber: formData.get('idNumber') as string,
        phone: formData.get('phone') as string,
        email: formData.get('email') as string,
        address: formData.get('address') as string,
      });

      if (updated) {
        setCustomers(prev => prev.map(c => c.id === editingId ? updated : c));

        // Update selectedCustomerDetail if it's the same customer
        if (selectedCustomerDetail?.id === editingId) {
          setSelectedCustomerDetail(updated);
        }
      }
    } else {
      const created = await CustomerService.createCustomer({
        name: formData.get('name') as string,
        type: type,
        idNumber: formData.get('idNumber') as string,
        phone: formData.get('phone') as string,
        email: formData.get('email') as string,
        address: formData.get('address') as string,
        status: CustomerStatus.Active,
      });

      if (created) {
        setCustomers(prev => [created, ...prev]);
      }
    }

    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleDeleteCustomer = async (id: string) => {
    if (currentUser?.role !== UserRole.Admin) {
      alert('عذراً، هذه الصلاحية للمدراء فقط');
      return;
    }

    if (window.confirm('هل أنت متأكد من حذف هذا السجل؟')) {
      const success = await CustomerService.deleteCustomer(id);
      if (success) {
        setCustomers(prev => prev.filter(c => c.id !== id));
        if (selectedCustomer?.id === id) setSelectedCustomer(null);
      } else {
        alert('حدث خطأ أثناء الحذف');
      }
    }
  };

  const handleSaveEquipment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const type = formData.get('type') as EquipmentType;

    const equipmentData = {
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
      image: imagePreview || `https://picsum.photos/200/200?random=${Math.floor(Math.random() * 100)}`
    };

    if (editingId) {
      const updated = await EquipmentService.updateEquipment(editingId, equipmentData);
      if (updated) {
        setEquipment(prev => prev.map(eq => eq.id === editingId ? updated : eq));
      }
    } else {
      const created = await EquipmentService.createEquipment(equipmentData);
      if (created) {
        setEquipment(prev => [created, ...prev]);
      }
    }

    setIsModalOpen(false);
    setEditingId(null);
    setImagePreview('');
  };

  const handleDeleteEquipment = async (id: string) => {
    if (currentUser?.role !== UserRole.Admin) {
      alert('عذراً، هذه الصلاحية للمدراء فقط');
      return;
    }

    if (window.confirm('هل أنت متأكد من حذف هذا السجل؟')) {
      const success = await EquipmentService.deleteEquipment(id);
      if (success) {
        setEquipment(prev => prev.filter(e => e.id !== id));
      } else {
        alert('حدث خطأ أثناء الحذف');
      }
    }
  };

  const handleSaveBooking = async () => {
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

    if (editingId) {
      // UPDATE BOOKING
      const updated = await BookingService.updateBooking(editingId, {
        customerId: cust.id,
        customerName: cust.name,
        startDate: bookingDates.start,
        endDate: bookingDates.end,
        totalAmount,
      });

      if (updated) {
        await BookingService.updateBookingItems(editingId, items);

        // Refresh data
        const bookingsData = await BookingService.getBookings();
        const equipmentData = await EquipmentService.getEquipment();
        const transactionsData = await TransactionService.getTransactions();
        const customersData = await CustomerService.getCustomers();

        setBookings(bookingsData);
        setEquipment(equipmentData);
        setTransactions(transactionsData);
        setCustomers(customersData);
      }
    } else {
      // CREATE BOOKING
      const newBooking = await BookingService.createBooking({
        customerId: cust.id,
        customerName: cust.name,
        items,
        startDate: bookingDates.start,
        endDate: bookingDates.end,
        totalAmount,
        paidAmount: 0,
        deposit: 0,
        status: BookingStatus.Active,
      }, currentUser?.id);

      if (newBooking) {
        // Create invoice transaction
        await TransactionService.createInvoice(
          cust.id,
          newBooking.id,
          totalAmount,
          `حجز جديد رقم ${newBooking.id} (بواسطة ${currentUser?.name})`
        );

        // Refresh data
        const bookingsData = await BookingService.getBookings();
        const transactionsData = await TransactionService.getTransactions();
        const customersData = await CustomerService.getCustomers();
        const equipmentData = await EquipmentService.getEquipment();

        setBookings(bookingsData);
        setTransactions(transactionsData);
        setCustomers(customersData);
        setEquipment(equipmentData);
      }
    }

    setIsModalOpen(false);
    setBookingCart([]);
    setBookingCustomerId('');
    setBookingCategoryFilter('all');
    setBookingSearchTerm('');
    setEditingId(null);
  };

  const handleEditBooking = (booking: Booking) => {
    if (booking.status === BookingStatus.Completed) {
      alert('لا يمكن تعديل حجز مكتمل.');
      return;
    }

    setEditingId(booking.id);
    setModalType('addBooking');
    setBookingCustomerId(booking.customerId);
    setBookingDates({ start: booking.startDate, end: booking.endDate });

    const bookedEquipmentIds = booking.items.map(i => i.equipmentId);
    const cartItems = equipment.filter(e => bookedEquipmentIds.includes(e.id));
    setBookingCart(cartItems);

    setIsModalOpen(true);
  };

  const handleDeleteBooking = async (id: string) => {
    if (currentUser?.role !== UserRole.Admin) {
      alert('عذراً، حذف الحجوزات للمدراء فقط.');
      return;
    }

    if (window.confirm('هل أنت متأكد من حذف هذا الحجز؟')) {
      const success = await BookingService.deleteBooking(id);

      if (success) {
        const bookingsData = await BookingService.getBookings();
        const equipmentData = await EquipmentService.getEquipment();
        const transactionsData = await TransactionService.getTransactions();
        const customersData = await CustomerService.getCustomers();

        setBookings(bookingsData);
        setEquipment(equipmentData);
        setTransactions(transactionsData);
        setCustomers(customersData);
      }
    }
  };

  const addToCart = (item: Equipment) => {
    if (!bookingCart.find(i => i.id === item.id)) {
      setBookingCart([...bookingCart, item]);
    }
  };

  const removeFromCart = (itemId: string) => {
    setBookingCart(bookingCart.filter(i => i.id !== itemId));
  };

  const handleAddPayment = async (amount: number, method: PaymentMethod) => {
    if (!selectedCustomer) return;

    const payment = await TransactionService.createPayment(
      selectedCustomer.id,
      amount,
      method,
      `دفعة لحساب العميل (بواسطة ${currentUser?.name})`
    );

    if (payment) {
      const transactionsData = await TransactionService.getTransactions();
      const customersData = await CustomerService.getCustomers();

      setTransactions(transactionsData);
      setCustomers(customersData);

      // Update selectedCustomerDetail if it's the same customer
      if (selectedCustomerDetail?.id === selectedCustomer.id) {
        const updatedCustomer = customersData.find(c => c.id === selectedCustomer.id);
        if (updatedCustomer) {
          setSelectedCustomerDetail(updatedCustomer);
        }
      }
    }

    setIsModalOpen(false);
  };

  const handleReturnEquipment = async (bookingId: string) => {
    const success = await BookingService.completeBooking(bookingId);

    if (success) {
      const bookingsData = await BookingService.getBookings();
      const equipmentData = await EquipmentService.getEquipment();
      setBookings(bookingsData);
      setEquipment(equipmentData);
    }
  };

  // --- Views ---

  // LOADING VIEW
  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-100 flex items-center justify-center font-tajawal" dir="rtl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-yellow-500 mx-auto mb-4"></div>
          <p className="text-zinc-600 font-tajawal">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  // LOGIN VIEW
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-zinc-100 flex items-center justify-center p-4 font-tajawal" dir="rtl">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-zinc-200">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-black text-yellow-500 rounded-2xl mx-auto flex items-center justify-center mb-4">
              <Truck size={32} />
            </div>
            <h1 className="text-2xl font-bold text-zinc-800">{settings.appName}</h1>
            <p className="text-zinc-500">تسجيل الدخول للنظام</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">اسم المستخدم</label>
              <div className="relative">
                <UserIcon className="absolute right-3 top-3 text-zinc-400" size={18} />
                <input
                  type="text"
                  value={loginForm.username}
                  onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                  className="w-full pr-10 pl-3 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none text-zinc-900 bg-zinc-50"
                  placeholder="admin / user"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">كلمة المرور</label>
              <div className="relative">
                <Lock className="absolute right-3 top-3 text-zinc-400" size={18} />
                <input
                  type="password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  className="w-full pr-10 pl-3 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none text-zinc-900 bg-zinc-50"
                  placeholder="123"
                />
              </div>
            </div>

            {loginError && <p className="text-red-500 text-sm text-center">{loginError}</p>}

            <button type="submit" className="w-full bg-black text-white py-3 rounded-lg font-bold hover:bg-zinc-800 transition-colors">
              دخول
            </button>

            <div className="mt-6 p-4 bg-yellow-50 rounded-lg text-xs text-zinc-600 border border-yellow-100">
              <p className="font-bold mb-1">بيانات تجريبية:</p>
              <div className="flex justify-between">
                <span>مدير: admin / 123</span>
                <span>موظف: user / 123</span>
              </div>
            </div>
          </form>
        </div>
      </div>
    );
  }

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

  const renderUsers = () => {
    if (currentUser?.role !== UserRole.Admin) {
      return <div className="text-center p-10 text-red-500">ليس لديك صلاحية للوصول لهذه الصفحة</div>;
    }

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-zinc-800">إدارة المستخدمين والصلاحيات</h2>
          <button
            onClick={() => { setModalType('addUser'); setEditingId(null); setIsModalOpen(true); }}
            className="bg-black text-white hover:bg-zinc-800 font-bold px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus size={18} /> مستخدم جديد
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
          <table className="w-full text-right">
            <thead className="bg-zinc-50 text-zinc-600 text-sm">
              <tr>
                <th className="p-4">الاسم</th>
                <th className="p-4">اسم المستخدم</th>
                <th className="p-4">الدور الوظيفي</th>
                <th className="p-4">رقم الجوال</th>
                <th className="p-4">الحالة</th>
                <th className="p-4">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} className="border-b border-zinc-100 hover:bg-zinc-50 text-sm">
                  <td className="p-4 font-bold text-zinc-800">{user.name}</td>
                  <td className="p-4 font-mono text-zinc-600">{user.username}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 text-xs rounded-full font-bold ${user.role === UserRole.Admin ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="p-4 text-zinc-600">{user.phone}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${user.active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                      {user.active ? 'نشط' : 'معطل'}
                    </span>
                  </td>
                  <td className="p-4 flex gap-2">
                    <button
                      onClick={() => { setEditingId(user.id); setModalType('editUser'); setIsModalOpen(true); }}
                      className="text-zinc-600 hover:text-zinc-900 bg-zinc-100 p-1.5 rounded-md"
                    >
                      <Pencil size={16} />
                    </button>
                    {user.id !== currentUser.id && (
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-red-500 hover:text-red-700 bg-red-50 p-1.5 rounded-md"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100 text-sm text-zinc-700">
          <h4 className="font-bold flex items-center gap-2 mb-2"><ShieldCheck size={16} /> دليل الصلاحيات</h4>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>مدير النظام:</strong> صلاحية كاملة على جميع أقسام النظام (الإعدادات، المستخدمين، التقارير، الحذف).</li>
            <li><strong>الموظف:</strong> صلاحية محدودة (الحجز، إضافة عملاء، إدارة المعدات) ولا يمكنه الحذف أو دخول الإعدادات.</li>
          </ul>
        </div>
      </div>
    );
  };

  const renderCustomerDetail = () => {
    if (!selectedCustomerDetail) return null;

    const customer = selectedCustomerDetail;
    const customerBookings = bookings.filter(b => b.customerId === customer.id);
    const activeBookings = customerBookings.filter(b => b.status === BookingStatus.Active);
    const completedBookings = customerBookings.filter(b => b.status === BookingStatus.Completed);
    const customerTransactions = transactions.filter(t => t.customerId === customer.id);

    // Get rented equipment IDs from active bookings
    const rentedEquipmentIds = activeBookings.flatMap(b => b.items.map(i => i.equipmentId));
    const rentedEquipment = equipment.filter(e => rentedEquipmentIds.includes(e.id));

    // Calculate totals
    const totalInvoices = customerTransactions
      .filter(t => t.type === 'Invoice')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const totalPayments = customerTransactions
      .filter(t => t.type === 'Payment')
      .reduce((sum, t) => sum + t.amount, 0);

    return (
      <div className="space-y-6">
        {/* Header with back button */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSelectedCustomerDetail(null)}
            className="p-2 hover:bg-zinc-100 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h2 className="text-2xl font-bold text-zinc-800">{customer.name}</h2>
            <p className="text-zinc-500 text-sm">
              {customer.type === 'client' ? 'عميل' : 'مورد'} • {customer.phone}
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-zinc-200">
            <p className="text-zinc-500 text-sm mb-1">الرصيد الحالي</p>
            <p className={`text-2xl font-bold ${customer.balance > 0 ? 'text-red-600' : customer.balance < 0 ? 'text-emerald-600' : 'text-zinc-800'}`}>
              {Math.abs(customer.balance).toLocaleString()} {settings.currency}
            </p>
            <p className="text-xs text-zinc-400 mt-1">
              {customer.balance > 0 ? 'مدين (له)' : customer.balance < 0 ? 'دائن (عليه)' : 'متزن'}
            </p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-zinc-200">
            <p className="text-zinc-500 text-sm mb-1">إجمالي الفواتير</p>
            <p className="text-2xl font-bold text-zinc-800">{totalInvoices.toLocaleString()} {settings.currency}</p>
            <p className="text-xs text-zinc-400 mt-1">{customerTransactions.filter(t => t.type === 'Invoice').length} فاتورة</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-zinc-200">
            <p className="text-zinc-500 text-sm mb-1">إجمالي المدفوعات</p>
            <p className="text-2xl font-bold text-emerald-600">{totalPayments.toLocaleString()} {settings.currency}</p>
            <p className="text-xs text-zinc-400 mt-1">{customerTransactions.filter(t => t.type === 'Payment').length} دفعة</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-zinc-200">
            <p className="text-zinc-500 text-sm mb-1">الحجوزات</p>
            <p className="text-2xl font-bold text-zinc-800">{customerBookings.length}</p>
            <p className="text-xs text-zinc-400 mt-1">
              {activeBookings.length} نشط • {completedBookings.length} مكتمل
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - Left Side */}
          <div className="lg:col-span-2 space-y-6">
            {/* Active Bookings */}
            {activeBookings.length > 0 && (
              <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
                <div className="p-4 border-b border-zinc-100 bg-yellow-50">
                  <h3 className="font-bold text-zinc-800 flex items-center gap-2">
                    <CalendarDays size={18} className="text-yellow-600" />
                    الحجوزات النشطة ({activeBookings.length})
                  </h3>
                </div>
                <div className="p-4 space-y-3">
                  {activeBookings.map(booking => (
                    <div key={booking.id} className="border border-zinc-200 rounded-lg p-4 hover:bg-zinc-50 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-mono font-bold text-zinc-700">{booking.id}</p>
                          <p className="text-sm text-zinc-500">
                            {booking.startDate} → {booking.endDate}
                          </p>
                        </div>
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full font-bold">
                          {booking.status}
                        </span>
                      </div>
                      <div className="space-y-1 mt-3">
                        {booking.items.map((item, idx) => (
                          <p key={idx} className="text-sm text-zinc-600 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full"></span>
                            {item.equipmentName} ({item.days} يوم × {item.dailyRate} {settings.currency})
                          </p>
                        ))}
                      </div>
                      <div className="mt-3 pt-3 border-t border-zinc-100 flex justify-between items-center">
                        <span className="text-sm text-zinc-500">الإجمالي:</span>
                        <span className="font-bold text-zinc-800">{booking.totalAmount.toLocaleString()} {settings.currency}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Rented Equipment */}
            {rentedEquipment.length > 0 && (
              <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
                <div className="p-4 border-b border-zinc-100 bg-blue-50">
                  <h3 className="font-bold text-zinc-800 flex items-center gap-2">
                    <Truck size={18} className="text-blue-600" />
                    {settings.itemsName} المؤجرة حالياً ({rentedEquipment.length})
                  </h3>
                </div>
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                  {rentedEquipment.map(item => (
                    <div key={item.id} className="flex gap-3 border border-zinc-200 rounded-lg p-3 hover:bg-zinc-50 transition-colors">
                      <img src={item.image} className="w-16 h-16 rounded-lg object-cover" alt={item.name} />
                      <div className="flex-1">
                        <p className="font-bold text-sm text-zinc-800 line-clamp-1">{item.name}</p>
                        <p className="text-xs text-zinc-500">{item.category}</p>
                        <p className="text-xs font-mono text-zinc-400 mt-1">{item.serialNumber}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Transaction History */}
            <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
              <div className="p-4 border-b border-zinc-100 bg-zinc-50">
                <h3 className="font-bold text-zinc-800 flex items-center gap-2">
                  <DollarSign size={18} />
                  كشف الحساب ({customerTransactions.length})
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-right text-sm">
                  <thead className="bg-zinc-50 text-zinc-600">
                    <tr>
                      <th className="p-3">التاريخ</th>
                      <th className="p-3">البيان</th>
                      <th className="p-3">النوع</th>
                      <th className="p-3">المبلغ</th>
                      <th className="p-3">الرصيد</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customerTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-zinc-400">
                          لا توجد معاملات
                        </td>
                      </tr>
                    ) : (
                      (() => {
                        let runningBalance = 0;
                        return customerTransactions
                          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                          .map(t => {
                            runningBalance += t.amount;
                            return (
                              <tr key={t.id} className="border-b border-zinc-100 hover:bg-zinc-50">
                                <td className="p-3 text-zinc-600 font-mono text-xs">{t.date}</td>
                                <td className="p-3 text-zinc-700">{t.description}</td>
                                <td className="p-3">
                                  <span className={`px-2 py-0.5 text-xs rounded-full ${t.type === 'Invoice' ? 'bg-red-100 text-red-700' :
                                      t.type === 'Payment' ? 'bg-emerald-100 text-emerald-700' :
                                        'bg-blue-100 text-blue-700'
                                    }`}>
                                    {t.type === 'Invoice' ? 'فاتورة' : t.type === 'Payment' ? 'دفعة' : 'مرتجع'}
                                  </span>
                                </td>
                                <td className={`p-3 font-bold ${t.amount < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                  {t.amount < 0 ? '-' : '+'} {Math.abs(t.amount).toLocaleString()} {settings.currency}
                                </td>
                                <td className={`p-3 font-bold ${runningBalance > 0 ? 'text-red-600' : runningBalance < 0 ? 'text-emerald-600' : 'text-zinc-800'}`}>
                                  {Math.abs(runningBalance).toLocaleString()} {settings.currency}
                                </td>
                              </tr>
                            );
                          });
                      })()
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Customer Info Card */}
            <div className="bg-white rounded-xl border border-zinc-200 p-5">
              <h3 className="font-bold text-zinc-800 mb-4 flex items-center gap-2">
                <UserCircle size={18} />
                معلومات {customer.type === 'client' ? 'العميل' : 'المورد'}
              </h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-zinc-500 mb-1">الاسم الكامل</p>
                  <p className="font-bold text-zinc-800">{customer.name}</p>
                </div>
                <div>
                  <p className="text-zinc-500 mb-1">رقم الهوية/السجل</p>
                  <p className="font-mono font-bold text-zinc-800">{customer.idNumber}</p>
                </div>
                <div>
                  <p className="text-zinc-500 mb-1">رقم الجوال</p>
                  <p className="font-mono font-bold text-zinc-800" dir="ltr">{customer.phone}</p>
                </div>
                {customer.email && (
                  <div>
                    <p className="text-zinc-500 mb-1">البريد الإلكتروني</p>
                    <p className="text-zinc-800" dir="ltr">{customer.email}</p>
                  </div>
                )}
                {customer.address && (
                  <div>
                    <p className="text-zinc-500 mb-1">العنوان</p>
                    <p className="text-zinc-800">{customer.address}</p>
                  </div>
                )}
                <div>
                  <p className="text-zinc-500 mb-1">الحالة</p>
                  <span className={`px-2 py-1 text-xs rounded-full ${customer.status === CustomerStatus.Active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                    }`}>
                    {customer.status}
                  </span>
                </div>
                {customer.creditLimit && (
                  <div>
                    <p className="text-zinc-500 mb-1">حد الائتمان</p>
                    <p className="font-bold text-zinc-800">{customer.creditLimit.toLocaleString()} {settings.currency}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl border border-zinc-200 p-5">
              <h3 className="font-bold text-zinc-800 mb-4">إجراءات سريعة</h3>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    setSelectedCustomer(customer);
                    setModalType('addPayment');
                    setIsModalOpen(true);
                  }}
                  className="w-full bg-emerald-50 text-emerald-700 hover:bg-emerald-100 py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors"
                >
                  <DollarSign size={18} />
                  تسجيل دفعة
                </button>
                <button
                  onClick={() => {
                    setEditingId(customer.id);
                    setModalType('editCustomer');
                    setIsModalOpen(true);
                  }}
                  className="w-full bg-blue-50 text-blue-700 hover:bg-blue-100 py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors"
                >
                  <Pencil size={18} />
                  تعديل البيانات
                </button>
                <button
                  onClick={() => window.print()}
                  className="w-full bg-zinc-50 text-zinc-700 hover:bg-zinc-100 py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  طباعة كشف الحساب
                </button>
              </div>
            </div>

            {/* Balance Alert */}
            {customer.balance > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <h4 className="font-bold text-red-800 mb-2 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  تنبيه مديونية
                </h4>
                <p className="text-sm text-red-700">
                  العميل مدين بمبلغ <strong>{customer.balance.toLocaleString()} {settings.currency}</strong>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderCustomers = () => {
    // Show detail view if customer is selected
    if (selectedCustomerDetail) {
      return renderCustomerDetail();
    }

    const filtered = customers.filter(c => {
      if (customerFilterType === 'all') return true;
      return c.type === customerFilterType;
    });

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-2xl font-bold text-zinc-800">إدارة العملاء والموردين</h2>
          <div className="flex gap-2">
            <div className="flex bg-white rounded-lg border p-1">
              <button onClick={() => setCustomerFilterType('all')} className={`px-3 py-1 text-sm rounded-md ${customerFilterType === 'all' ? 'bg-black text-white shadow' : 'text-zinc-600'}`}>الكل</button>
              <button onClick={() => setCustomerFilterType('client')} className={`px-3 py-1 text-sm rounded-md ${customerFilterType === 'client' ? 'bg-emerald-500 text-white shadow' : 'text-zinc-600'}`}>العملاء</button>
              <button onClick={() => setCustomerFilterType('supplier')} className={`px-3 py-1 text-sm rounded-md ${customerFilterType === 'supplier' ? 'bg-purple-500 text-white shadow' : 'text-zinc-600'}`}>الموردين</button>
            </div>
            <button
              onClick={() => { setModalType('addCustomer'); setEditingId(null); setIsModalOpen(true); }}
              className="bg-black text-white hover:bg-zinc-800 font-bold px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Plus size={18} /> شريك جديد
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(customer => (
            <div key={customer.id} className="bg-white p-5 rounded-xl border border-zinc-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className={`absolute top-0 right-0 w-2 h-full ${customer.type === 'client' ? 'bg-emerald-500' : 'bg-purple-500'}`} />
              <div className="mr-3">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-lg text-zinc-800">{customer.name}</h3>
                  <span className={`px-2 py-0.5 text-[10px] rounded-full ${customer.status === CustomerStatus.Active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{customer.status}</span>
                </div>
                <p className="text-sm text-zinc-500 mb-4 flex items-center gap-1"><UserCircle size={14} /> {customer.type === 'client' ? 'عميل' : 'مورد'}</p>

                <div className="space-y-2 text-sm text-zinc-600 mb-4">
                  <p className="flex justify-between"><span>رقم الجوال:</span> <span className="font-mono font-bold" dir="ltr">{customer.phone}</span></p>
                  <p className="flex justify-between"><span>الرصيد:</span> <span className={`font-bold ${customer.balance > 0 ? 'text-red-600' : 'text-emerald-600'}`}>{Math.abs(customer.balance).toLocaleString()} {settings.currency} {customer.balance > 0 ? 'له' : 'عليه'}</span></p>
                </div>

                <div className="flex gap-2 mt-4 pt-4 border-t border-zinc-100">
                  <button
                    onClick={() => setSelectedCustomerDetail(customer)}
                    className="flex-1 bg-blue-50 text-blue-600 hover:bg-blue-100 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    عرض التفاصيل
                  </button>
                  <button
                    onClick={() => { setSelectedCustomer(customer); setModalType('addPayment'); setIsModalOpen(true); }}
                    className="flex-1 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1"
                  >
                    <DollarSign size={14} /> تسجيل دفعة
                  </button>
                  <button
                    onClick={() => { setEditingId(customer.id); setModalType('editCustomer'); setIsModalOpen(true); }}
                    className="bg-zinc-100 text-zinc-600 hover:bg-zinc-200 p-2 rounded-lg"
                  >
                    <Pencil size={16} />
                  </button>
                  {currentUser?.role === UserRole.Admin && (
                    <button
                      onClick={() => handleDeleteCustomer(customer.id)}
                      className="bg-red-50 text-red-500 hover:bg-red-100 p-2 rounded-lg"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderEquipment = () => {
    const filtered = equipment.filter(e => {
      const matchesSearch = e.name.toLowerCase().includes(searchTerm.toLowerCase()) || e.serialNumber.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = equipmentCategoryFilter === 'all' || e.category === equipmentCategoryFilter;
      return matchesSearch && matchesCategory;
    });

    return (
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-zinc-800">إدارة {settings.itemsName}</h2>
            <p className="text-zinc-500 text-sm">إجمالي: {equipment.length} | متاح: {equipment.filter(e => e.status === EquipmentStatus.Available).length}</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute right-3 top-3 text-zinc-400" size={18} />
              <input
                type="text"
                placeholder="بحث..."
                className="w-full pl-4 pr-10 py-2 bg-white border rounded-lg outline-none focus:ring-2 focus:ring-yellow-500 text-zinc-900"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button
              onClick={() => { setModalType('addEquipment'); setEditingId(null); setIsModalOpen(true); setImagePreview(''); }}
              className="bg-black text-white hover:bg-zinc-800 font-bold px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors shrink-0"
            >
              <Plus size={18} /> إضافة {settings.itemName}
            </button>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          <button
            onClick={() => setEquipmentCategoryFilter('all')}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-bold transition-all ${equipmentCategoryFilter === 'all' ? 'bg-black text-white shadow-md' : 'bg-white border text-zinc-600 hover:bg-zinc-100'}`}
          >
            الكل
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setEquipmentCategoryFilter(cat)}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-bold transition-all ${equipmentCategoryFilter === cat ? 'bg-black text-white shadow-md' : 'bg-white border text-zinc-600 hover:bg-zinc-100'}`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map(item => (
            <div key={item.id} className="bg-white rounded-xl border border-zinc-200 overflow-hidden hover:shadow-lg transition-all group">
              <div className="h-48 bg-zinc-100 relative overflow-hidden">
                <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute top-2 right-2 flex gap-1">
                  <span className={`px-2 py-1 text-xs font-bold rounded-md shadow-sm backdrop-blur-md ${item.status === EquipmentStatus.Available ? 'bg-emerald-500/90 text-white' :
                      item.status === EquipmentStatus.Rented ? 'bg-yellow-500/90 text-black' :
                        'bg-red-500/90 text-white'
                    }`}>
                    {item.status}
                  </span>
                </div>
              </div>
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-bold text-zinc-800 line-clamp-1">{item.name}</h3>
                    <p className="text-xs text-zinc-500">{item.category} • {item.brand}</p>
                  </div>
                  <p className="font-bold text-emerald-600 text-lg">{item.dailyRate} <span className="text-xs font-normal text-zinc-400">{settings.currency}/يوم</span></p>
                </div>

                <div className="border-t border-zinc-100 pt-3 mt-3 flex justify-between items-center">
                  <span className="text-xs font-mono text-zinc-400 bg-zinc-50 px-2 py-1 rounded">{item.serialNumber}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setEditingId(item.id); setModalType('editEquipment'); setIsModalOpen(true); setImagePreview(item.image || ''); }}
                      className="text-zinc-400 hover:text-zinc-600 p-1"
                    >
                      <Pencil size={16} />
                    </button>
                    {currentUser?.role === UserRole.Admin && (
                      <button
                        onClick={() => handleDeleteEquipment(item.id)}
                        className="text-red-300 hover:text-red-500 p-1"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
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
          <h2 className="text-2xl font-bold text-zinc-800">إدارة الحجوزات</h2>
          <button
            onClick={() => {
              setBookingCart([]);
              setBookingCustomerId('');
              setBookingDates({ start: '', end: '' });
              setModalType('addBooking');
              setEditingId(null);
              setIsModalOpen(true);
            }}
            className="bg-black text-white hover:bg-zinc-800 font-bold px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
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
                <th className="p-4">المواد المحجوزة</th>
                <th className="p-4">التاريخ</th>
                <th className="p-4">الإجمالي</th>
                <th className="p-4">الحالة</th>
                <th className="p-4">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map(booking => (
                <tr key={booking.id} className="border-b border-zinc-100 hover:bg-zinc-50 text-sm">
                  <td className="p-4 font-mono font-bold text-zinc-700">{booking.id}</td>
                  <td className="p-4 font-medium text-zinc-800">{booking.customerName}</td>
                  <td className="p-4 text-zinc-600">
                    {booking.items.map(i => i.equipmentName).join('، ').substring(0, 30)}
                    {booking.items.length > 1 && '...'}
                  </td>
                  <td className="p-4 text-zinc-600 font-mono text-xs">
                    <div className="flex flex-col">
                      <span>{booking.startDate}</span>
                      <span className="text-zinc-400">إلى</span>
                      <span>{booking.endDate}</span>
                    </div>
                  </td>
                  <td className="p-4 font-bold text-zinc-800">{booking.totalAmount.toLocaleString()} {settings.currency}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 text-xs rounded-full font-bold ${booking.status === BookingStatus.Active ? 'bg-yellow-100 text-yellow-800' :
                        booking.status === BookingStatus.Completed ? 'bg-emerald-100 text-emerald-800' :
                          'bg-red-100 text-red-800'
                      }`}>
                      {booking.status}
                    </span>
                  </td>
                  <td className="p-4 flex items-center gap-2">
                    {booking.status === BookingStatus.Active && (
                      <button
                        onClick={() => handleReturnEquipment(booking.id)}
                        className="text-xs bg-black text-white px-3 py-1 rounded hover:bg-zinc-800 transition-colors"
                      >
                        إرجاع
                      </button>
                    )}
                    <button
                      onClick={() => handleEditBooking(booking)}
                      className="text-zinc-600 hover:text-zinc-900 bg-zinc-100 p-1.5 rounded-md"
                    >
                      <Pencil size={16} />
                    </button>
                    {currentUser?.role === UserRole.Admin && (
                      <button
                        onClick={() => handleDeleteBooking(booking.id)}
                        className="text-red-500 hover:text-red-700 bg-red-50 p-1.5 rounded-md"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {bookings.length === 0 && <div className="p-8 text-center text-zinc-400">لا توجد حجوزات حالياً</div>}
        </div>
      </div>
    );
  };

  const renderReports = () => {
    const topCustomers = [...customers].sort((a, b) => b.balance - a.balance).slice(0, 5);

    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-zinc-800">التقارير والإحصائيات</h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm">
            <h3 className="font-bold text-zinc-700 mb-4">أداء المبيعات</h3>
            <div className="h-64 flex items-center justify-center text-zinc-400 bg-zinc-50 rounded-lg">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bookings.slice(0, 7)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="startDate" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="totalAmount" fill="#10B981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm">
            <h3 className="font-bold text-zinc-700 mb-4">أعلى العملاء مديونية</h3>
            <div className="space-y-3">
              {topCustomers.filter(c => c.balance < 0).map(c => (
                <div key={c.id} className="flex justify-between items-center p-3 bg-zinc-50 rounded-lg">
                  <span className="font-medium text-zinc-800">{c.name}</span>
                  <span className="font-bold text-red-500" dir="ltr">{c.balance.toLocaleString()} {settings.currency}</span>
                </div>
              ))}
              {topCustomers.filter(c => c.balance < 0).length === 0 && <p className="text-zinc-400 text-center">لا توجد مديونيات</p>}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderSettings = () => {
    if (currentUser?.role !== UserRole.Admin) return <div className="text-red-500 p-8">غير مصرح لك</div>;

    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-zinc-800">إعدادات النظام</h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm">
              <h3 className="font-bold text-lg text-zinc-800 mb-4 flex items-center gap-2">
                <Settings size={20} className="text-yellow-500" /> تكوين النظام
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-600 mb-1">اسم التطبيق</label>
                  <input
                    value={settings.appName}
                    onChange={(e) => setSettings({ ...settings, appName: e.target.value })}
                    className="w-full p-2 border rounded-lg bg-zinc-50 focus:ring-2 focus:ring-yellow-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-600 mb-1">العملة</label>
                  <input
                    value={settings.currency}
                    onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                    className="w-full p-2 border rounded-lg bg-zinc-50 focus:ring-2 focus:ring-yellow-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-600 mb-1">مسمى (المفرد)</label>
                  <input
                    value={settings.itemName}
                    onChange={(e) => setSettings({ ...settings, itemName: e.target.value })}
                    placeholder="مثال: معدة، سيارة"
                    className="w-full p-2 border rounded-lg bg-zinc-50 focus:ring-2 focus:ring-yellow-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-600 mb-1">مسمى (الجمع)</label>
                  <input
                    value={settings.itemsName}
                    onChange={(e) => setSettings({ ...settings, itemsName: e.target.value })}
                    placeholder="مثال: المعدات، السيارات"
                    className="w-full p-2 border rounded-lg bg-zinc-50 focus:ring-2 focus:ring-yellow-500 outline-none"
                  />
                </div>
              </div>

              {/* زر الحفظ */}
              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleSaveSettings}
                  className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 font-bold flex items-center gap-2 transition-colors"
                >
                  <Save size={18} /> حفظ التغييرات
                </button>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm">
              <h3 className="font-bold text-lg text-zinc-800 mb-4 flex items-center gap-2">
                <Truck size={20} className="text-blue-500" /> إعدادات النشاط (قوالب جاهزة)
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <button onClick={() => handleApplyPreset('equipment')} className="p-3 rounded-xl border border-zinc-200 hover:border-yellow-500 hover:bg-yellow-50 transition-all text-center">
                  <span className="block text-2xl mb-2">🚜</span>
                  <span className="font-bold text-sm text-zinc-700">تأجير معدات</span>
                </button>
                <button onClick={() => handleApplyPreset('cars')} className="p-3 rounded-xl border border-zinc-200 hover:border-blue-500 hover:bg-blue-50 transition-all text-center">
                  <span className="block text-2xl mb-2">🚗</span>
                  <span className="font-bold text-sm text-zinc-700">تأجير سيارات</span>
                </button>
                <button onClick={() => handleApplyPreset('properties')} className="p-3 rounded-xl border border-zinc-200 hover:border-emerald-500 hover:bg-emerald-50 transition-all text-center">
                  <span className="block text-2xl mb-2">🏢</span>
                  <span className="font-bold text-sm text-zinc-700">إدارة عقارات</span>
                </button>
                <button onClick={() => handleApplyPreset('events')} className="p-3 rounded-xl border border-zinc-200 hover:border-purple-500 hover:bg-purple-50 transition-all text-center">
                  <span className="block text-2xl mb-2">🎉</span>
                  <span className="font-bold text-sm text-zinc-700">تنظيم حفلات</span>
                </button>
                <button onClick={() => handleApplyPreset('photography')} className="p-3 rounded-xl border border-zinc-200 hover:border-pink-500 hover:bg-pink-50 transition-all text-center">
                  <span className="block text-2xl mb-2">📸</span>
                  <span className="font-bold text-sm text-zinc-700">معدات تصوير</span>
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm">
              <h3 className="font-bold text-lg text-zinc-800 mb-4">التصنيفات</h3>
              <p className="text-sm text-zinc-500 mb-4">إدارة تصنيفات {settings.itemsName} المتاحة في النظام.</p>
              <button
                onClick={() => { setModalType('manageCategories'); setIsModalOpen(true); }}
                className="w-full py-2 bg-black text-white rounded-lg hover:bg-zinc-800 font-bold"
              >
                إدارة {settings.categoryLabel}
              </button>
            </div>

            <div className="bg-red-50 p-6 rounded-xl border border-red-100">
              <h3 className="font-bold text-lg text-red-800 mb-2">منطقة الخطر</h3>
              <p className="text-xs text-red-600 mb-4">الإجراءات هنا لا يمكن التراجع عنها.</p>
              <button
                onClick={() => {
                  if (confirm('هل أنت متأكد من تصفير جميع البيانات؟')) {
                    setCustomers([]);
                    setEquipment([]);
                    setBookings([]);
                    setTransactions([]);
                  }
                }}
                className="w-full py-2 bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-100 font-bold text-sm"
              >
                حذف جميع البيانات
              </button>
            </div>
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
          setSelectedCustomerDetail(null);
        }}
        appName={settings.appName}
        itemsLabel={settings.itemsName}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      <main className="flex-1 overflow-y-auto p-8">
        {currentView === 'dashboard' && renderDashboard()}
        {currentView === 'customers' && renderCustomers()}
        {currentView === 'equipment' && renderEquipment()}
        {currentView === 'bookings' && renderBookings()}
        {currentView === 'reports' && renderReports()}
        {currentView === 'users' && renderUsers()}
        {currentView === 'settings' && renderSettings()}
      </main>

      {renderModal()}
    </div>
  );

  function renderModal() {
    if (!isModalOpen) return null;

    const editingUser = (modalType === 'editUser' && editingId) ? users.find(u => u.id === editingId) : null;
    const editingCustomer = modalType === 'editCustomer' && editingId ? customers.find(c => c.id === editingId) : null;
    const editingEquipment = modalType === 'editEquipment' && editingId ? equipment.find(e => e.id === editingId) : null;

    const bookingDays = (bookingDates.start && bookingDates.end) ? calculateDays(bookingDates.start, bookingDates.end) : 0;
    const bookingTotal = bookingCart.reduce((acc, eq) => acc + (eq.dailyRate * bookingDays), 0);
    const filteredBookingEquipment = equipment
      .filter(e => e.status === EquipmentStatus.Available || (editingId && bookingCart.find(bc => bc.id === e.id)))
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
              {modalType === 'addBooking' && (editingId ? 'تعديل الحجز' : 'حجز جديد (نقطة بيع)')}
              {modalType === 'addPayment' && 'تسجيل دفعة'}
              {modalType === 'manageCategories' && `إدارة ${settings.categoryLabel}`}
              {modalType === 'addUser' && 'إضافة مستخدم جديد'}
              {modalType === 'editUser' && 'تعديل بيانات المستخدم'}
            </h3>
            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-zinc-100 rounded-full text-zinc-500">
              <X size={24} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 bg-zinc-50">

            {(modalType === 'addUser' || modalType === 'editUser') && (
              <form onSubmit={handleSaveUser} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1">الاسم الكامل</label>
                    <input name="name" defaultValue={editingUser?.name} required className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none text-zinc-900 bg-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1">رقم الجوال</label>
                    <input name="phone" defaultValue={editingUser?.phone} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none text-zinc-900 bg-white" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1">اسم الدخول</label>
                    <input name="username" defaultValue={editingUser?.username} required className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none text-zinc-900 bg-white" dir="ltr" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1">كلمة المرور {modalType === 'editUser' && '(اتركها فارغة لعدم التغيير)'}</label>
                    <input name="password" type="password" required={modalType === 'addUser'} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none text-zinc-900 bg-white" dir="ltr" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-2">الدور الوظيفي</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer bg-white p-3 rounded-lg border border-zinc-200 w-full hover:border-yellow-500 transition-colors">
                      <input type="radio" name="role" value={UserRole.Employee} defaultChecked={!editingUser || editingUser.role === UserRole.Employee} className="w-4 h-4 text-yellow-600 focus:ring-yellow-500" />
                      <span className="text-zinc-800">موظف (صلاحيات محدودة)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer bg-white p-3 rounded-lg border border-zinc-200 w-full hover:border-yellow-500 transition-colors">
                      <input type="radio" name="role" value={UserRole.Admin} defaultChecked={editingUser?.role === UserRole.Admin} className="w-4 h-4 text-yellow-600 focus:ring-yellow-500" />
                      <span className="text-zinc-800">مدير نظام (صلاحيات كاملة)</span>
                    </label>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-4">
                  <input type="checkbox" name="active" id="activeUser" defaultChecked={editingUser ? editingUser.active : true} className="w-5 h-5 text-emerald-600 rounded" />
                  <label htmlFor="activeUser" className="text-zinc-700 font-medium select-none">حساب نشط (يمكنه تسجيل الدخول)</label>
                </div>

                <button type="submit" className="w-full bg-black text-white py-2 rounded-lg hover:bg-zinc-800 font-bold transition-colors mt-4">
                  {modalType === 'editUser' ? 'حفظ التعديلات' : 'إضافة المستخدم'}
                </button>
              </form>
            )}

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
                      if (input.value) {
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

                <div className="mb-6">
                  <label className="block text-sm font-medium text-zinc-700 mb-2">صورة ال{settings.itemName}</label>
                  <div className="flex items-center gap-4">
                    <div
                      onClick={() => document.getElementById('equipImageInput')?.click()}
                      className="w-24 h-24 rounded-lg border-2 border-dashed border-zinc-300 flex flex-col items-center justify-center cursor-pointer hover:border-yellow-500 hover:bg-yellow-50 transition-colors relative overflow-hidden bg-white"
                    >
                      {imagePreview ? (
                        <>
                          <img src={imagePreview} className="w-full h-full object-cover" alt="Preview" />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                            <Camera className="text-white" size={20} />
                          </div>
                        </>
                      ) : (
                        <>
                          <ImageIcon className="text-zinc-400 mb-1" size={24} />
                          <span className="text-xs text-zinc-500">رفع صورة</span>
                        </>
                      )}
                    </div>
                    <input
                      id="equipImageInput"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                    <div className="text-xs text-zinc-500">
                      <p>اضغط لرفع صورة جديدة.</p>
                      <p>الصيغ المدعومة: JPG, PNG</p>
                    </div>
                  </div>
                </div>

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
                    if (amt) handleAddPayment(Number(amt), mth);
                  }}
                  className="w-full bg-emerald-600 text-white py-2 rounded-lg hover:bg-emerald-700 font-bold transition-colors"
                >
                  تأكيد الدفعة
                </button>
              </div>
            )}

            {modalType === 'addBooking' && (
              <div className="flex flex-col lg:flex-row h-full gap-6">
                <div className="flex-1 flex flex-col gap-4 overflow-hidden">
                  <div className="flex gap-2 bg-white p-3 rounded-xl border border-zinc-200 shrink-0">
                    <div className="relative flex-1">
                      <Search className="absolute right-3 top-3 text-zinc-400" size={18} />
                      <input
                        placeholder="بحث عن المنتجات..."
                        className="w-full pl-4 pr-10 py-2 bg-zinc-50 border rounded-lg outline-none focus:ring-2 focus:ring-yellow-500 text-zinc-900"
                        value={bookingSearchTerm}
                        onChange={(e) => setBookingSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>

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
                                  {isAdded ? <Minus size={16} /> : <Plus size={16} />}
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

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
                        className="w-full border p-2 rounded-lg bg-zinc-50 focus:ring-2 focus:ring-yellow-500 outline-none text-sm text-zinc-900"
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
                        <input type="date" className="w-full border p-2 rounded-lg bg-zinc-50 focus:ring-2 focus:ring-yellow-500 outline-none text-sm text-zinc-900"
                          onChange={(e) => setBookingDates({ ...bookingDates, start: e.target.value })}
                          value={bookingDates.start}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-zinc-500 mb-1 block">إلى</label>
                        <input type="date" className="w-full border p-2 rounded-lg bg-zinc-50 focus:ring-2 focus:ring-yellow-500 outline-none text-sm text-zinc-900"
                          onChange={(e) => setBookingDates({ ...bookingDates, end: e.target.value })}
                          value={bookingDates.end}
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
                      onClick={handleSaveBooking}
                      className="w-full bg-yellow-500 hover:bg-yellow-600 disabled:bg-zinc-300 disabled:text-zinc-500 text-black py-3 rounded-xl font-bold shadow-lg shadow-yellow-500/20 transition-all flex justify-center items-center gap-2"
                    >
                      <Save size={18} /> {editingId ? 'حفظ التعديلات' : 'تأكيد الحجز'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
}

export default App;
