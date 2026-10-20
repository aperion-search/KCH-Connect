import React from 'react';
import { useApp } from './context/AppContext';
import Sidebar from './components/Sidebar';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Attendance from './components/Attendance';
import Leaves from './components/Leaves';
import Announcements from './components/Announcements';
import Management from './components/Management';
import Gallery from './components/Gallery';
import Profile from './components/Profile';

export default function App() {
  const { currentUser, activeTab, setActiveTab, loading, toasts, syncStatus, currentDate, handleLogout } = useApp();

  // Toast notifications component
  const ToastContainer = () => (
    <div id="toast-container" className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`flex items-center p-4 border rounded-lg shadow-lg transform transition-all duration-300 animate-fade-in ${
            toast.type === 'error' ? 'bg-red-600 border-red-700' : toast.type === 'info' ? 'bg-blue-600 border-blue-700' : 'bg-gray-900 border-gray-800'
          } text-white max-w-sm w-full mx-4`}
        >
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      ))}
    </div>
  );

  // Mobile Bottom Nav component
  const MobileNav = () => {
    const navItems = [
      { id: 'dashboard', label: 'Dashboard', icon: 'fa-chart-pie' },
      { id: 'attendance', label: 'Attendance', icon: 'fa-clipboard-user' },
      { id: 'leaves', label: 'Leaves', icon: 'fa-envelope-open-text' },
      { id: 'announcements', label: 'Announcements', icon: 'fa-bullhorn' },
    ];

    // Add management and gallery to mobile nav if admin
    const effectiveNav = currentUser?.role === 'admin'
      ? [...navItems, { id: 'management', label: 'Management', icon: 'fa-user-gear' }, { id: 'gallery', label: 'Gallery', icon: 'fa-images' }]
      : [...navItems, { id: 'gallery', label: 'Gallery', icon: 'fa-images' }];

    return (
      <nav className="sm:hidden bg-white border-t border-gray-200 fixed bottom-0 w-full z-30 pb-safe shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        <div className="flex justify-around items-center h-16">
          {effectiveNav.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex-1 h-full flex flex-col items-center justify-center transition-colors ${
                activeTab === item.id ? 'text-primary-600' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <i className={`fa-solid ${item.icon} text-xl mb-1`}></i>
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    );
  };

  if (!currentUser) return <Login />;

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden bg-gray-50 text-gray-800">
      <div className="flex flex-1 h-full relative overflow-hidden">
        <Sidebar />

        <main className="flex-1 flex flex-col h-full relative overflow-hidden">
          {/* Mobile Header */}
          <header className="sm:hidden bg-madrasa-blue h-16 border-b border-madrasa-gold/30 flex items-center justify-between px-4 z-20 shadow-md flex-shrink-0">
            <div className="flex items-center">
              <div className="flex items-center justify-center w-10 h-10 mr-2 bg-madrasa-blue rounded-lg p-1">
                <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
              </div>
              <span className="font-bold text-[10px] text-madrasa-lightgold uppercase leading-tight tracking-wide hidden sm:block">
                Madrasa<br />Wajihiyah
              </span>
            </div>
            <button
              onClick={() => handleLogout()}
              className="text-red-400 bg-red-900/40 px-2 py-1.5 rounded-md text-xs font-bold ml-1"
            >
              <i className="fa-solid fa-power-off"></i>
            </button>
          </header>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-8 w-full max-w-6xl mx-auto pb-24 sm:pb-8 flex flex-col justify-between">
            <div className="flex-1">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <i className="fa-solid fa-spinner fa-spin text-4xl text-primary-600"></i>
                </div>
              ) : (
                <>
                  {activeTab === 'dashboard' && <Dashboard />}
                  {activeTab === 'attendance' && <Attendance />}
                  {activeTab === 'leaves' && <Leaves />}
                  {activeTab === 'announcements' && <Announcements />}
                  {activeTab === 'management' && <Management />}
                  {activeTab === 'gallery' && <Gallery />}
                </>
              )}
            </div>

            {/* Footer */}
            <footer className="mt-12 pt-6 border-t border-gray-200 text-center text-xs text-gray-500 pb-16 sm:pb-2">
              <p className="font-bold text-gray-700">KCH Connect — Madrasa Wajihiyah Khachroad</p>
              <p className="mt-1 text-gray-600">Designed & Powered by - <span className="font-bold text-gray-900">Burhanuddin Badnagarwala</span></p>
            </footer>
          </div>
        </main>
      </div>

      <ToastContainer />
      <MobileNav />
    </div>
  );
}
