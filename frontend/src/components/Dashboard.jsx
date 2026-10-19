import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import axios from 'axios';

export default function Dashboard() {
  const { currentUser, students, attendance, leaves, currentDate, getVisibleStudents, setActiveTab, syncStatus, updateStudent, showToast } = useApp();
  const visibleStudents = useMemo(() => getVisibleStudents(), [currentUser, students, getVisibleStudents]);

  const userData = currentUser?.role === 'parent'
    ? students.find(s => s.rollId === currentUser.studentId || String(s.id) === String(currentUser.studentId))
    : null;

  const [newPassword, setNewPassword] = useState('');
  const [hifzStatus, setHifzStatus] = useState(userData?.hifzStatus || '');

  React.useEffect(() => {
    if (userData?.hifzStatus) {
      setHifzStatus(userData.hifzStatus);
    }
  }, [userData]);

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!newPassword.trim()) {
      showToast('Please enter a new password', 'error');
      return;
    }
    if (userData) {
      await updateStudent(userData.id || userData.rollId, {
        ...userData,
        password: newPassword
      });
      showToast('Password updated successfully!');
      setNewPassword('');
    }
  };

  const handleUpdateHifz = async (newStatus) => {
    setHifzStatus(newStatus);
    if (userData) {
      await updateStudent(userData.id || userData.rollId, {
        ...userData,
        hifzStatus: newStatus
      });
      showToast('Hifz status updated successfully!');
    }
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const reader = new FileReader();
      const base64Data = await new Promise((resolve, reject) => {
        reader.onload = (event) => resolve(event.target.result);
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
      });

      const uploadRes = await axios.post('/api/upload', {
        image: base64Data,
        filename: file.name
      });
      const photoUrl = uploadRes.data.url;

      if (userData) {
        await updateStudent(userData.id || userData.rollId, {
          ...userData,
          photo: photoUrl
        });
        showToast('Profile photo updated successfully!');
      }
    } catch (err) {
      showToast('Failed to upload profile photo.', 'error');
    }
  };

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
                {student.phone && student.phone !== '-' && currentUser?.role !== 'parent' && (
                  <div className="flex items-center gap-1.5">
                    <a
                      href={`tel:${student.phone}`}
                      className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-sm transition-colors flex items-center justify-center"
                      title="Call Parent"
                    >
                      <i className="fa-solid fa-phone text-sm"></i>
                    </a>
                    <a
                      href={`https://wa.me/91${student.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`📋 ABSENTEE NOTICE\n\nDear Parents,\n\nYour ward, ${student.name} (${student.grade || 'Class'}), was marked absent on ${currentDate} without prior intimation.\n\nKindly submit a leave request here: https://kch-connect.onrender.com/\n\nKindly ensure your child attends school tomorrow with all pending work completed.\n\nRegards,\nMadrasa Wajihiyah Khachroad (Sender: +91 7737252833)`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 shadow-sm transition-colors flex items-center justify-center"
                      title="Send WhatsApp Message"
                    >
                      <i className="fa-brands fa-whatsapp text-sm"></i>
                    </a>
                  </div>
                )}
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
      {/* Parent / Student Dashboard Profile & Settings */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
        <div className="p-6 border-b border-gray-50 bg-gradient-to-r from-madrasa-blue to-blue-900 text-white flex items-center gap-4">
          <div className="relative group cursor-pointer" title="Click to change profile photo">
            <label className="cursor-pointer block">
              {userData?.photo ? (
                <img src={userData.photo} alt={currentUser.name} className="w-16 h-16 rounded-full object-cover border-2 border-madrasa-gold shadow-md" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-madrasa-gold text-madrasa-blue flex items-center justify-center text-2xl font-bold flex-shrink-0 border-2 border-madrasa-gold shadow-md">
                  {currentUser?.details?.name?.charAt(0) || currentUser?.name?.charAt(0) || 'S'}
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-[10px] font-bold">
                Change
              </div>
              <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
            </label>
          </div>
          <div>
            <h2 className="text-2xl font-bold">{userData?.name || currentUser?.details?.name || currentUser?.name || '-'}</h2>
            <p className="text-gray-300 font-medium">Class: {userData?.grade || currentUser?.details?.grade || '-'}</p>
            <p className="text-xs text-madrasa-gold mt-0.5">Click photo to update profile picture</p>
          </div>
        </div>
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <p className="text-xs text-gray-500 uppercase font-semibold mb-1">ITS ID / Roll ID</p>
            <p className="text-gray-900 font-medium">{userData?.rollId || userData?.id || currentUser?.details?.rollId || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Grade / Class</p>
            <p className="text-gray-900 font-medium">{userData?.grade || currentUser?.details?.grade || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Division</p>
            <p className="text-gray-900 font-medium">{userData?.division || currentUser?.details?.division || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Gender</p>
            <p className="text-gray-900 font-medium">{userData?.gender || currentUser?.details?.gender || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Phone / Mobile No.</p>
            <p className="text-gray-900 font-medium">{userData?.phone || currentUser?.details?.phone || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Email</p>
            <p className="text-gray-900 font-medium">{userData?.email || currentUser?.details?.email || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Date of Birth</p>
            <p className="text-gray-900 font-medium">{userData?.hdob || currentUser?.details?.hdob || '-'}</p>
          </div>
          <div>
            <label className="text-xs text-gray-500 uppercase font-semibold mb-1 block">Hifz Status (Marhala)</label>
            <select
              value={hifzStatus}
              onChange={(e) => handleUpdateHifz(e.target.value)}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-white font-semibold text-primary-700 w-full cursor-pointer"
            >
              <option value="">Select Marhala...</option>
              <option value="Marhala 1">Marhala 1</option>
              <option value="Marhala 2">Marhala 2</option>
              <option value="Marhala 3">Marhala 3</option>
              <option value="Marhala 4">Marhala 4</option>
              <option value="Marhala 5">Marhala 5</option>
              <option value="Marhala 6">Marhala 6</option>
              <option value="Marhala 7">Marhala 7</option>
            </select>
          </div>
          <div className="col-span-full">
            <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Arabic Name</p>
            <p className="text-xl font-bold text-gray-900" style={{fontFamily:'"Kanz-al-Marjaan", serif'}}>
              {userData?.arabicName || currentUser?.details?.arabicName || '-'}
            </p>
          </div>

          <div className="col-span-full pt-4 border-t border-gray-100">
            <h3 className="text-base font-semibold text-gray-800 mb-3">Change Password</h3>
            <form onSubmit={handleUpdatePassword} className="flex flex-col sm:flex-row gap-3">
              <input
                type="password"
                placeholder="Enter new password (e.g. 515253)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm flex-1"
              />
              <button
                type="submit"
                className="px-5 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium text-sm transition-colors cursor-pointer whitespace-nowrap"
              >
                Update Password
              </button>
            </form>
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
