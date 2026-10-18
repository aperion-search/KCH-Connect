import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';

export default function Dashboard() {
  const { currentUser, students, attendance, leaves, currentDate, getVisibleStudents, setActiveTab, syncStatus } = useApp();
  const visibleStudents = useMemo(() => getVisibleStudents(), [currentUser, students, getVisibleStudents]);

  // Today's attendance for current date
  const todayRecord = attendance[currentDate] || {};
  const presentToday = Object.values(todayRecord).filter(s => s === 'Present').length;
  const absentToday = Object.values(todayRecord).filter(s => s === 'Absent').length;
  const leaveToday = Object.values(todayRecord).filter(s => s === 'Leave').length;
  const todayAbsentStudents = visibleStudents.filter(s => todayRecord[s.id] === 'Absent');
  const todayLeaveStudents = visibleStudents.filter(s => todayRecord[s.id] === 'Leave');

  const onLeaveCount = leaves.filter(l =>
    l.status === 'Approved' || l.status === 'Pending'
  ).length;

  // Pending leaves (admin/teacher view only)
  const pendingLeaves = currentUser?.role !== 'parent'
    ? leaves.filter(l => l.status === 'Pending')
    : [];

  const dashboardContent = currentUser?.role !== 'parent' ? (
    <>
      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6 mb-8">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left transition-all hover:shadow-md">
          <div className="w-12 h-12 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center text-xl mb-2 sm:mb-0 sm:mr-3 flex-shrink-0">
            <i className="fa-solid fa-users"></i>
          </div>
          <div>
            <h3 className="text-gray-500 text-xs font-medium">Students</h3>
            <p className="text-xl font-bold text-gray-900">{visibleStudents.length}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left transition-all hover:shadow-md">
          <div className="w-12 h-12 rounded-full bg-green-50 text-green-600 flex items-center justify-center text-xl mb-2 sm:mb-0 sm:mr-3 flex-shrink-0">
            <i className="fa-solid fa-user-check"></i>
          </div>
          <div>
            <h3 className="text-gray-500 text-xs font-medium">Present Today</h3>
            <p className="text-xl font-bold text-gray-900">{presentToday}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left transition-all hover:shadow-md">
          <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center text-xl mb-2 sm:mb-0 sm:mr-3 flex-shrink-0">
            <i className="fa-solid fa-user-xmark"></i>
          </div>
          <div>
            <h3 className="text-gray-500 text-xs font-medium">Absent Today</h3>
            <p className="text-xl font-bold text-gray-900">{absentToday}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left transition-all hover:shadow-md">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-xl mb-2 sm:mb-0 sm:mr-3 flex-shrink-0">
            <i className="fa-solid fa-plane-departure"></i>
          </div>
          <div>
            <h3 className="text-gray-500 text-xs font-medium">On Leave Today</h3>
            <p className="text-xl font-bold text-gray-900">{leaveToday}</p>
          </div>
        </div>

        {currentUser?.role !== 'parent' && (
          <div
            onClick={() => setActiveTab('leaves')}
            className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left transition-all hover:shadow-md hover:shadow-lg cursor-pointer"
          >
            <div className="w-12 h-12 rounded-full bg-yellow-50 text-yellow-600 flex items-center justify-center text-xl mb-2 sm:mb-0 sm:mr-3 flex-shrink-0">
              <i className="fa-solid fa-envelope-open-text"></i>
            </div>
            <div>
              <h3 className="text-gray-500 text-xs font-medium">Pending Req.</h3>
              <p className="text-xl font-bold text-gray-900">{pendingLeaves.length}</p>
            </div>
          </div>
        )}
      </div>

      {/* Recent Absences */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
          <h2 className="font-semibold text-gray-800 text-sm sm:text-base">
            <i className="fa-regular fa-calendar mr-2 text-primary-500"></i>
            Absent Today
          </h2>
        </div>
        <ul className="divide-y divide-gray-50">
          {todayAbsentStudents.length > 0 ? (
            todayAbsentStudents.map(student => (
              <li key={student.id} className="px-6 py-4 flex justify-between items-center hover:bg-gray-50/50">
                <div>
                  <p className="font-medium text-gray-900">{student.name}</p>
                  <p className="text-base text-gray-600 font-bold" style={{fontFamily:'"Kanz-al-Marjaan", serif'}}>{student.arabicName || '-'}</p>
                  <p className="text-sm text-gray-500">Class {student.grade} • Absent</p>
                </div>
                <a
                  href={`https://wa.me/91${student.phone.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-600 hover:text-green-700 text-sm font-medium flex items-center gap-1"
                >
                  <i className="fa-brands fa-whatsapp text-base"></i>
                  <span className="hidden sm:inline">Notify</span>
                </a>
              </li>
            ))
          ) : (
            <li className="px-6 py-8 text-center text-gray-500 text-sm">
              All students are present today!
            </li>
          )}
        </ul>
      </div>

      {/* Today On Leave */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
          <h2 className="font-semibold text-gray-800 text-sm sm:text-base">
            <i className="fa-solid fa-plane-departure mr-2 text-blue-500"></i>
            On Leave Today
          </h2>
        </div>
        <ul className="divide-y divide-gray-50">
          {todayLeaveStudents.length > 0 ? (
            todayLeaveStudents.map(student => (
              <li key={student.id} className="px-6 py-4 flex justify-between items-center hover:bg-gray-50/50">
                <div>
                  <p className="font-medium text-gray-900">{student.name}</p>
                  <p className="text-base text-gray-600 font-bold" style={{fontFamily:'"Kanz-al-Marjaan", serif'}}>{student.arabicName || '-'}</p>
                  <p className="text-sm text-gray-500">Class {student.grade} • On Leave</p>
                </div>
                <a
                  href={`https://wa.me/91${student.phone.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-600 hover:text-green-700 text-sm font-medium flex items-center gap-1"
                >
                  <i className="fa-brands fa-whatsapp text-base"></i>
                  <span className="hidden sm:inline">WhatsApp</span>
                </a>
              </li>
            ))
          ) : (
            <li className="px-6 py-8 text-center text-gray-500 text-sm">
              No students on leave today.
            </li>
          )}
        </ul>
      </div>
    </>
  ) : (
    <>
      {/* Parent / Student Dashboard Profile */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
        <div className="p-6 border-b border-gray-50 bg-gradient-to-r from-madrasa-blue to-blue-900 text-white">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-madrasa-gold text-madrasa-blue flex items-center justify-center text-2xl font-bold flex-shrink-0">
              {currentUser?.details?.name?.charAt(0) || currentUser?.name?.charAt(0) || 'S'}
            </div>
            <div>
              <h2 className="text-2xl font-bold">{currentUser?.details?.name || currentUser?.name || '-'}</h2>
              <p className="text-gray-300 font-medium">Class: {currentUser?.details?.grade || '-'}</p>
            </div>
          </div>
        </div>
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <p className="text-xs text-gray-500 uppercase font-semibold mb-1">ITS ID / Roll ID</p>
            <p className="text-gray-900 font-medium">{currentUser?.details?.rollId || currentUser?.details?.id || currentUser?.id || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Grade / Class</p>
            <p className="text-gray-900 font-medium">{currentUser?.details?.grade || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Division</p>
            <p className="text-gray-900 font-medium">{currentUser?.details?.division || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Gender</p>
            <p className="text-gray-900 font-medium">{currentUser?.details?.gender || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Phone / Mobile No.</p>
            <p className="text-gray-900 font-medium">{currentUser?.details?.phone || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Email</p>
            <p className="text-gray-900 font-medium">{currentUser?.details?.email || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Date of Birth</p>
            <p className="text-gray-900 font-medium">{currentUser?.details?.hdob || '-'}</p>
          </div>
          <div className="col-span-full">
            <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Arabic Name</p>
            <p className="text-xl font-bold text-gray-900" style={{fontFamily:'"Kanz-al-Marjaan", serif'}}>
              {currentUser?.details?.arabicName || '-'}
            </p>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Overview</h1>
          <p className="text-gray-500 mt-1 text-sm sm:text-base font-medium">
            <i className="fa-regular fa-calendar mr-1"></i> {currentDate} |{' '}
            <span className="text-primary-600 font-bold">
              <i className="fa-solid fa-circle-check mr-1"></i>
              {syncStatus}
            </span>
          </p>
        </div>
      </div>

      {dashboardContent}

      {/* Teacher View: Quick Stats */}
      {currentUser?.role === 'teacher' && (
        <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden p-6">
          <h3 className="font-semibold text-gray-800 text-sm mb-4">Today's Summary</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{presentToday}</p>
              <p className="text-xs text-gray-500 uppercase font-semibold mt-1">Present</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{absentToday}</p>
              <p className="text-xs text-gray-500 uppercase font-semibold mt-1">Absent</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{onLeaveCount}</p>
              <p className="text-xs text-gray-500 uppercase font-semibold mt-1">On Leave</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
