
import React from 'react';
import { LayoutDashboard, Users, Truck, CalendarDays, FileBarChart, Settings, LogOut, ShieldCheck } from 'lucide-react';
import { User, UserRole } from '../types';

interface SidebarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  appName: string;
  itemsLabel: string;
  currentUser: User;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView, appName, itemsLabel, currentUser, onLogout }) => {
  const menuItems = [
    { id: 'dashboard', label: 'لوحة التحكم', icon: LayoutDashboard, allowedRoles: [UserRole.Admin, UserRole.Employee] },
    { id: 'bookings', label: 'إدارة الحجوزات', icon: CalendarDays, allowedRoles: [UserRole.Admin, UserRole.Employee] },
    { id: 'customers', label: 'إدارة العملاء', icon: Users, allowedRoles: [UserRole.Admin, UserRole.Employee] },
    { id: 'equipment', label: `إدارة ${itemsLabel}`, icon: Truck, allowedRoles: [UserRole.Admin, UserRole.Employee] },
    { id: 'reports', label: 'التقارير', icon: FileBarChart, allowedRoles: [UserRole.Admin] },
    { id: 'users', label: 'المستخدمين والصلاحيات', icon: ShieldCheck, allowedRoles: [UserRole.Admin] },
    { id: 'settings', label: 'إعدادات النظام', icon: Settings, allowedRoles: [UserRole.Admin] },
  ];

  return (
    <div className="w-64 bg-black text-zinc-100 min-h-screen flex flex-col shadow-xl border-l border-zinc-800">
      <div className="p-6 border-b border-zinc-800">
        <h1 className="text-xl font-bold flex items-center gap-2">
           <Truck className="text-yellow-500" />
           <span className="truncate">{appName}</span>
        </h1>
        <p className="text-xs text-zinc-500 mt-2">نظام الإدارة المتكامل</p>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.filter(item => item.allowedRoles.includes(currentUser.role)).map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive 
                  ? 'bg-yellow-500 text-black shadow-lg translate-x-1 font-bold' 
                  : 'text-zinc-400 hover:bg-zinc-900 hover:text-yellow-400'
              }`}
            >
              <Icon size={20} />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-zinc-800">
        <div className="flex items-center gap-3 px-4 py-2 mb-3">
            <div className={`w-8 h-8 rounded-full border flex items-center justify-center ${currentUser.role === UserRole.Admin ? 'bg-zinc-800 text-yellow-500 border-yellow-500/30' : 'bg-zinc-800 text-blue-500 border-blue-500/30'}`}>
                <span className="font-bold text-xs">{currentUser.name.substring(0,2)}</span>
            </div>
            <div className="overflow-hidden">
                <p className="text-sm font-medium text-zinc-200 truncate">{currentUser.name}</p>
                <p className={`text-[10px] ${currentUser.role === UserRole.Admin ? 'text-yellow-500' : 'text-blue-500'}`}>{currentUser.role}</p>
            </div>
        </div>
        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-2 justify-center px-4 py-2 text-xs font-bold text-red-400 hover:bg-red-950/30 hover:text-red-300 rounded transition-colors"
        >
          <LogOut size={14} /> تسجيل خروج
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
