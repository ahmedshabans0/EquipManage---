import React from 'react';
import { LayoutDashboard, Users, Truck, CalendarDays, FileBarChart, Settings } from 'lucide-react';

interface SidebarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  appName: string;
  itemsLabel: string;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView, appName, itemsLabel }) => {
  const menuItems = [
    { id: 'dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
    { id: 'bookings', label: 'إدارة الحجوزات', icon: CalendarDays },
    { id: 'customers', label: 'إدارة العملاء', icon: Users },
    { id: 'equipment', label: `إدارة ${itemsLabel}`, icon: Truck },
    { id: 'reports', label: 'التقارير', icon: FileBarChart },
    { id: 'settings', label: 'إعدادات النظام', icon: Settings },
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
        {menuItems.map((item) => {
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
        <div className="flex items-center gap-3 px-4 py-2">
            <div className="w-8 h-8 rounded-full bg-zinc-800 text-yellow-500 border border-yellow-500/30 flex items-center justify-center">
                <span className="font-bold text-xs">AD</span>
            </div>
            <div>
                <p className="text-sm font-medium text-zinc-200">مدير النظام</p>
                <p className="text-xs text-emerald-500">نشط الآن</p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;