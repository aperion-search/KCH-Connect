import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import axios from 'axios';

export default function Profile() {
  const { currentUser, students, teachers, updateStudent, showToast } = useApp();
  if (!currentUser) return null;

  const userData = currentUser.role === 'parent'
    ? students.find(s => s.rollId === currentUser.studentId || String(s.id) === String(currentUser.studentId))
    : teachers.find(t => t.id === currentUser.id);

  const [newPassword, setNewPassword] = useState('');
  const [hifzStatus, setHifzStatus] = useState(userData?.hifzStatus || '');

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!newPassword.trim()) {
      showToast('Please enter a new password', 'error');
      return;
    }
    if (currentUser.role === 'parent' && userData) {
      await updateStudent(userData.id || userData.rollId, {
        ...userData,
        password: newPassword
      });
      showToast('Password updated successfully!');
      setNewPassword('');
    } else {
      showToast('Password update is available for student accounts', 'info');
    }
  };

  const handleUpdateHifz = async (newStatus) => {
    setHifzStatus(newStatus);
    if (currentUser.role === 'parent' && userData) {
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

      if (currentUser.role === 'parent' && userData) {
        await updateStudent(userData.id || userData.rollId, {
          ...userData,
          photo: photoUrl
        });
        showToast('Profile photo updated successfully!');
      } else {
        showToast('Photo update is available for student accounts', 'info');
      }
    } catch (err) {
      console.error('Photo upload error:', err);
      showToast('Failed to upload profile photo.', 'error');
    }
  };

  return (
    <div className="animate-fade-in max-w-3xl mx-auto pb-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Profile Settings</h1>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
        <div className="flex items-center gap-4 pb-6 border-b border-gray-100">
          <div className="relative group cursor-pointer" title="Click to change photo">
            <label className="cursor-pointer block">
              {userData?.photo ? (
                <img src={userData.photo} alt={currentUser.name} className="w-20 h-20 rounded-full object-cover border-2 border-madrasa-gold shadow-md" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-madrasa-gold/20 flex items-center justify-center text-madrasa-gold font-bold text-3xl flex-shrink-0 border-2 border-madrasa-gold shadow-md">
                  {currentUser.name.charAt(0)}
                </div>
              )}
              {currentUser.role === 'parent' && (
                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-bold">
                  Change
                </div>
              )}
              <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
            </label>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{currentUser.name}</h2>
            <p className="text-sm text-gray-500 capitalize">Role: <span className="font-semibold text-gray-800">{currentUser.role}</span></p>
            {currentUser.role === 'parent' && (
              <p className="text-xs text-madrasa-gold font-semibold mt-1">Click your photo to update profile picture</p>
            )}
          </div>
        </div>

        {userData && currentUser.role === 'parent' ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div><label className="text-gray-400 block mb-1">ITS ID / Roll ID</label><p className="font-medium text-gray-900">{userData.rollId || userData.id || '-'}</p></div>
              <div><label className="text-gray-400 block mb-1">Grade / Class</label><p className="font-medium text-gray-900">{userData.grade || '-'}</p></div>
              <div><label className="text-gray-400 block mb-1">Division</label><p className="font-medium text-gray-900">{userData.division || '-'}</p></div>
              <div><label className="text-gray-400 block mb-1">Gender</label><p className="font-medium text-gray-900">{userData.gender || '-'}</p></div>
              <div><label className="text-gray-400 block mb-1">Phone / Mobile No.</label><p className="font-medium text-gray-900">{userData.phone || '-'}</p></div>
              <div><label className="text-gray-400 block mb-1">Email</label><p className="font-medium text-gray-900">{userData.email || '-'}</p></div>
              <div><label className="text-gray-400 block mb-1">Date of Birth</label><p className="font-medium text-gray-900">{userData.hdob || '-'}</p></div>
              <div>
                <label className="text-gray-400 block mb-1">Hifz Status (Marhala)</label>
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
              <div className="col-span-full"><label className="text-gray-400 block mb-1">Arabic Name</label><p className="text-xl font-bold text-gray-900" style={{fontFamily:'"Kanz-al-Marjaan", serif'}}>{userData.arabicName || '-'}</p></div>
            </div>

            <div className="pt-6 border-t border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Change Password</h3>
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
        ) : userData ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div><label className="text-gray-400 block mb-1">Email</label><p className="font-medium text-gray-900">{userData.email || '-'}</p></div>
            <div><label className="text-gray-400 block mb-1">Class/Grade</label><p className="font-medium text-gray-900">{userData.grade || userData.assignedClass || '-'}</p></div>
            <div><label className="text-gray-400 block mb-1">Phone</label><p className="font-medium text-gray-900">{userData.phone || '-'}</p></div>
            <div><label className="text-gray-400 block mb-1">Arabic Name</label><p className="font-medium text-gray-900" style={{fontFamily:'"Kanz-al-Marjaan"'}}>{userData.arabicName || '-'}</p></div>
            <div><label className="text-gray-400 block mb-1">DOB</label><p className="font-medium text-gray-900">{userData.hdob || '-'}</p></div>
            <div><label className="text-gray-400 block mb-1">Gender</label><p className="font-medium text-gray-900">{userData.gender || '-'}</p></div>
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No additional profile details found.</p>
        )}
      </div>
    </div>
  );
}
