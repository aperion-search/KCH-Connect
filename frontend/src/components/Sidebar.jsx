import React from 'react';
import { useApp } from '../context/AppContext';

export default function Sidebar() {
  const { activeTab, setActiveTab, currentUser, handleLogout } = useApp();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'fa-chart-pie' },
    { id: 'attendance', label: 'Attendance', icon: 'fa-clipboard-user' },
    { id: 'leaves', label: 'Leaves', icon: 'fa-envelope-open-text' },
    { id: 'announcements', label: 'Announcements', icon: 'fa-bullhorn' },
    { id: 'gallery', label: 'Gallery', icon: 'fa-images' },
  ];

  if (currentUser?.role === 'admin') {
    navItems.push({ id: 'management', label: 'Management', icon: 'fa-user-gear' });
  }

  return (
    <nav className="bg-white border-r border-gray-200 w-20 md:w-64 flex flex-col justify-between hidden sm:flex z-20 shadow-sm flex-shrink-0">
      <div>
        <div className="h-16 flex items-center justify-center md:justify-start md:px-4 border-b border-gray-100 bg-madrasa-blue">
          <div className="flex items-center justify-center w-9 h-9 mr-2">
            <img
              src="/logo.png"
              alt="Logo"
              className="w-full h-full object-contain drop-shadow-[0_0_8px_rgba(212,175,55,0.4)]"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          </div>
          <span className="font-bold text-[11px] text-madrasa-lightgold hidden md:block uppercase leading-tight tracking-wider">
            Madrasa Wajihiyah
          </span>
        </div>

        <div className="mt-6 flex flex-col space-y-2 px-3">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center justify-center md:justify-start px-3 py-3 rounded-xl font-medium transition-colors ${
                  isActive
                    ? 'text-primary-600 bg-primary-50'
                    : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                <i className={`fa-solid ${item.icon} md:w-6 md:text-center text-lg`}></i>
                <span className="ml-3 hidden md:block">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-4 border-t border-gray-100 bg-gray-50/50">
        <div className="flex items-center justify-between text-sm text-gray-500 w-full">
          <div className="flex items-center overflow-hidden">
            <i className="fa-solid fa-circle-user md:w-6 md:text-center text-gray-400"></i>
            <span className="ml-2 hidden md:block font-medium truncate">
              {currentUser?.name || 'User'}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="hidden md:block text-red-500 hover:text-red-700 bg-red-50 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
            title="Sign Out"
          >
            <i className="fa-solid fa-power-off"></i>
          </button>
        </div>
      </div>
    </nav>
  );
}
