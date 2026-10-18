import React from 'react';
import { useApp } from '../context/AppContext';

export default function Profile() {
  const { currentUser, students, teachers } = useApp();
  if (!currentUser) return null;

  const userData = currentUser.role === 'parent'
    ? students.find(s => s.rollId === currentUser.studentId)
    : teachers.find(t => t.id === currentUser.id);

  return (
    <div className="animate-fade-in max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Profile</h1>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
        <h2 className="text-xl font-bold">{currentUser.name}</h2>
        <p className="text-sm text-gray-500">Role: <span className="font-medium text-gray-800">{currentUser.role}</span></p>
        {userData && currentUser.role === 'parent' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div><label className="text-gray-400 block mb-1">ITS ID / Roll ID</label><p className="font-medium text-gray-900">{userData.rollId || userData.id || '-'}</p></div>
            <div><label className="text-gray-400 block mb-1">Grade / Class</label><p className="font-medium text-gray-900">{userData.grade || '-'}</p></div>
            <div><label className="text-gray-400 block mb-1">Division</label><p className="font-medium text-gray-900">{userData.division || '-'}</p></div>
            <div><label className="text-gray-400 block mb-1">Gender</label><p className="font-medium text-gray-900">{userData.gender || '-'}</p></div>
            <div><label className="text-gray-400 block mb-1">Phone / Mobile No.</label><p className="font-medium text-gray-900">{userData.phone || '-'}</p></div>
            <div><label className="text-gray-400 block mb-1">Email</label><p className="font-medium text-gray-900">{userData.email || '-'}</p></div>
            <div><label className="text-gray-400 block mb-1">Date of Birth</label><p className="font-medium text-gray-900">{userData.hdob || '-'}</p></div>
            <div className="col-span-full"><label className="text-gray-400 block mb-1">Arabic Name</label><p className="font-lg font-bold text-gray-900" style={{fontFamily:'"Kanz-al-Marjaan", serif'}}>{userData.arabicName || '-'}</p></div>
          </div>
        ) : userData ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div><label className="text-gray-400">Email</label><p className="font-medium">{userData.email || '-'}</p></div>
            <div><label className="text-gray-400">Class/Grade</label><p className="font-medium">{userData.grade || userData.assignedClass || '-'}</p></div>
            <div><label className="text-gray-400">Phone</label><p className="font-medium">{userData.phone || '-'}</p></div>
            <div><label className="text-gray-400">Arabic Name</label><p className="font-medium" style={{fontFamily:'"Kanz-al-Marjaan"'}}>{userData.arabicName || '-'}</p></div>
            <div><label className="text-gray-400">DOB</label><p className="font-medium">{userData.hdob || '-'}</p></div>
            <div><label className="text-gray-400">Gender</label><p className="font-medium">{userData.gender || '-'}</p></div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
