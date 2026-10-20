import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import axios from 'axios';

export default function Management() {
  const {
    students,
    teachers,
    showToast,
    addStudent,
    updateStudent,
    deleteStudent,
    addTeacher,
    updateTeacher,
    deleteTeacher
  } = useApp();

  const [activeTab, setActiveTab] = useState('students');
  const [isEditing, setIsEditing] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const gradeOrder = { '9': 1, '8': 2, '7': 3, '6': 4, '5': 5, '4': 6, '3': 7, '2': 8, '1': 9, 'ATFAAL': 10 };
  const sortedStudents = useMemo(() => {
    return [...students].sort((a, b) => {
      const gA = gradeOrder[String(a.grade || '').trim().toUpperCase()] || 99;
      const gB = gradeOrder[String(b.grade || '').trim().toUpperCase()] || 99;
      if (gA !== gB) return gA - gB;

      const isMale = (g) => {
        const s = String(g || '').trim().toUpperCase();
        return s === 'M' || s === 'MALE';
      };
      const maleA = isMale(a.gender) ? 0 : 1;
      const maleB = isMale(b.gender) ? 0 : 1;
      if (maleA !== maleB) return maleA - maleB;

      return (a.name || '').localeCompare(b.name || '');
    });
  }, [students]);

  const filteredStudents = useMemo(() => {
    let list = sortedStudents;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      list = list.filter(s =>
        (s.name && s.name.toLowerCase().includes(term)) ||
        (s.rollId && s.rollId.toLowerCase().includes(term)) ||
        (s.grade && s.grade.toLowerCase().includes(term)) ||
        (s.phone && s.phone.includes(term)) ||
        (s.hifzStatus && s.hifzStatus.toLowerCase().includes(term))
      );
    }
    return list;
  }, [sortedStudents, searchTerm]);

  const filteredTeachers = useMemo(() => {
    let list = teachers;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      list = list.filter(t =>
        (t.name && t.name.toLowerCase().includes(term)) ||
        (t.id && t.id.toLowerCase().includes(term)) ||
        (t.assignedClasses && t.assignedClasses.some(c => String(c).toLowerCase().includes(term))) ||
        (t.assignedClass && String(t.assignedClass).toLowerCase().includes(term))
      );
    }
    return list;
  }, [teachers, searchTerm]);

  // Student Management State
  const [studentForm, setStudentForm] = useState({
    name: '',
    rollId: '',
    grade: '',
    division: '',
    phone: '',
    gender: '',
    email: '',
    contactNos: '',
    arabicName: '',
    hdob: '',
    hifzStatus: '',
    password: '515253',
    photo: ''
  });

  const [selectedStudentForDetails, setSelectedStudentForDetails] = useState(null);
  const [isModalEditOpen, setIsModalEditOpen] = useState(false);

  // Teacher Management State
  const [teacherForm, setTeacherForm] = useState({
    id: '',
    name: '',
    assignedClasses: []
  });

  // Helper functions
  const resetStudentForm = () => {
    setStudentForm({
      name: '',
      rollId: '',
      grade: '',
      division: '',
      phone: '',
      gender: '',
      email: '',
      contactNos: '',
      arabicName: '',
      hdob: '',
      hifzStatus: '',
      password: '515253',
      photo: ''
    });
    setIsEditing(false);
    setEditingItem(null);
    setIsModalEditOpen(false);
  };

  const resetTeacherForm = () => {
    setTeacherForm({ id: '', name: '', assignedClasses: [] });
    setIsEditing(false);
    setEditingItem(null);
  };

  // Student CRUD operations
  const handleStudentSubmit = async (e) => {
    e.preventDefault();

    if (!studentForm.name || !studentForm.rollId) {
      showToast('Name and Roll/ITS ID are required.', 'error');
      return;
    }

    const targetId = editingItem?.id || editingItem?.rollId || studentForm.rollId;

    const studentData = {
      ...studentForm,
      id: targetId,
      rollId: studentForm.rollId,
      password: studentForm.password || '515253'
    };

    if (isEditing) {
      await updateStudent(targetId, studentData);
    } else {
      await addStudent(studentData);
    }

    resetStudentForm();
    setIsModalEditOpen(false);
  };

  const handleStudentPhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const reader = new FileReader();
      const base64Data = await new Promise((resolve, reject) => {
        reader.onload = (event) => resolve(event.target.result);
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
      });

      const res = await axios.post('/api/upload', {
        image: base64Data,
        filename: file.name
      });
      setStudentForm(prev => ({ ...prev, photo: res.data.url }));
      showToast('Photo uploaded successfully!');
    } catch (err) {
      showToast('Failed to upload photo.', 'error');
    }
  };

  const handleStudentEdit = (student) => {
    setStudentForm({
      name: student.name || '',
      rollId: student.rollId || '',
      grade: student.grade || '',
      division: student.division || '',
      phone: student.phone || '',
      gender: student.gender || '',
      email: student.email || '',
      contactNos: student.contactNos || '',
      arabicName: student.arabicName || '',
      hdob: student.hdob || '',
      hifzStatus: student.hifzStatus || '',
      password: student.password || '515253',
      photo: student.photo || ''
    });
    setEditingItem(student);
    setIsEditing(true);
    setIsModalEditOpen(true);
  };

  const handleResetPassword = async (student) => {
    const updated = { ...student, password: '515253' };
    await updateStudent(student.id || student.rollId, updated);
    showToast(`Password reset to default (515253) for ${student.name}`);
  };

  const handleStudentDelete = async (id) => {
    if (deleteConfirm === id) {
      await deleteStudent(id);
      showToast('Student deleted successfully!', 'success');
      setDeleteConfirm(null);
    } else {
      setDeleteConfirm(id);
      setTimeout(() => setDeleteConfirm(null), 3000);
    }
  };

  // Teacher CRUD operations
  const handleTeacherSubmit = async (e) => {
    e.preventDefault();

    if (!teacherForm.name || !teacherForm.id) {
      showToast('Teacher Name and ID are required.', 'error');
      return;
    }

    const teacherData = {
      ...teacherForm,
      assignedClasses: teacherForm.assignedClasses || []
    };

    if (isEditing && activeTab === 'teachers') {
      await updateTeacher(editingItem.id || teacherForm.id, teacherData);
      showToast('Teacher updated successfully!', 'success');
    } else {
      await addTeacher(teacherData);
      showToast('Teacher added successfully!', 'success');
    }

    resetTeacherForm();
  };

  const handleTeacherEdit = (teacher) => {
    setTeacherForm({
      ...teacher,
      assignedClasses: teacher.assignedClasses || (teacher.assignedClass ? [teacher.assignedClass] : [])
    });
    setEditingItem(teacher);
    setIsEditing(true);
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  };

  const handleTeacherDelete = async (id) => {
    if (deleteConfirm === id) {
      await deleteTeacher(id);
      showToast('Teacher deleted successfully!', 'success');
      setDeleteConfirm(null);
    } else {
      setDeleteConfirm(id);
      setTimeout(() => setDeleteConfirm(null), 3000);
    }
  };

  // Render forms based on active tab
  const renderForm = () => {
    if (activeTab === 'students') {
      return (
        <form onSubmit={handleStudentSubmit} className="space-y-4">
          <div className="flex items-center gap-4 mb-4">
            {studentForm.photo ? (
              <div className="relative group">
                <img src={studentForm.photo} alt="Student" className="w-16 h-16 rounded-full object-cover border border-madrasa-gold shadow" />
                <button
                  type="button"
                  onClick={() => setStudentForm(prev => ({ ...prev, photo: '' }))}
                  className="absolute -top-1 -right-1 bg-red-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs hover:bg-red-700 shadow"
                  title="Remove photo"
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>
            ) : (
              <div className="w-16 h-16 rounded-full bg-madrasa-gold/20 flex items-center justify-center text-madrasa-gold font-bold text-xl border border-madrasa-gold shadow">
                {studentForm.name ? studentForm.name.charAt(0) : 'S'}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Student Photo</label>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleStudentPhotoUpload}
                  className="text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 cursor-pointer"
                />
                {studentForm.photo && (
                  <button
                    type="button"
                    onClick={() => setStudentForm(prev => ({ ...prev, photo: '' }))}
                    className="px-2.5 py-1 bg-red-50 text-red-600 text-xs font-bold rounded-lg hover:bg-red-100 transition"
                  >
                    Delete Photo
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Student Name *</label>
              <input
                type="text"
                required
                value={studentForm.name}
                onChange={(e) => setStudentForm({...studentForm, name: e.target.value})}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Roll/ITS ID *</label>
              <input
                type="text"
                required
                value={studentForm.rollId}
                onChange={(e) => setStudentForm({...studentForm, rollId: e.target.value})}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Class/Grade</label>
              <input
                type="text"
                value={studentForm.grade}
                onChange={(e) => setStudentForm({...studentForm, grade: e.target.value})}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Division</label>
              <input
                type="text"
                value={studentForm.division}
                onChange={(e) => setStudentForm({...studentForm, division: e.target.value})}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="tel"
                value={studentForm.phone}
                onChange={(e) => setStudentForm({...studentForm, phone: e.target.value})}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={studentForm.email}
                onChange={(e) => setStudentForm({...studentForm, email: e.target.value})}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
              <select
                value={studentForm.gender}
                onChange={(e) => setStudentForm({...studentForm, gender: e.target.value})}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white text-sm"
              >
                <option value="">Select...</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hifz Status</label>
              <select
                value={studentForm.hifzStatus}
                onChange={(e) => setStudentForm({...studentForm, hifzStatus: e.target.value})}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white text-sm font-medium text-primary-700"
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
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="text"
                value={studentForm.password}
                onChange={(e) => setStudentForm({...studentForm, password: e.target.value})}
                placeholder="Default: 515253"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm font-mono"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Nos</label>
              <input
                type="text"
                value={studentForm.contactNos}
                onChange={(e) => setStudentForm({...studentForm, contactNos: e.target.value})}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Arabic Name</label>
              <input
                type="text"
                value={studentForm.arabicName}
                onChange={(e) => setStudentForm({...studentForm, arabicName: e.target.value})}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
              <input
                type="date"
                value={studentForm.hdob}
                onChange={(e) => setStudentForm({...studentForm, hdob: e.target.value})}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="submit"
              className="px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium cursor-pointer text-sm flex-1 sm:flex-none"
            >
              {isEditing ? 'Update Student' : 'Add Student'}
            </button>
            {isEditing && (
              <button
                type="button"
                onClick={resetStudentForm}
                className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium cursor-pointer text-sm flex-1 sm:flex-none"
              >Cancel</button>
            )}
          </div>
        </form>
      );
    } else {
      return (
        <form onSubmit={handleTeacherSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teacher ID *</label>
              <input
                type="text"
                required
                value={teacherForm.id}
                onChange={(e) => setTeacherForm({...teacherForm, id: e.target.value})}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teacher Name *</label>
              <input
                type="text"
                required
                value={teacherForm.name}
                onChange={(e) => setTeacherForm({...teacherForm, name: e.target.value})}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Classes (Select multiple)</label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 pt-1">
              {['9', '8', '7', '6', '5', '4', '3', '2', '1', 'ATFAAL'].map(cls => {
                const isSelected = (teacherForm.assignedClasses || []).includes(cls);
                return (
                  <button
                    key={cls}
                    type="button"
                    onClick={() => {
                      const current = teacherForm.assignedClasses || [];
                      const updated = isSelected
                        ? current.filter(c => c !== cls)
                        : [...current, cls];
                      setTeacherForm({ ...teacherForm, assignedClasses: updated });
                    }}
                    className={`py-1.5 px-2 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-primary-600 text-white border-primary-600'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    Class {cls}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="submit"
              className="px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium cursor-pointer text-sm flex-1 sm:flex-none"
            >
              {isEditing ? 'Update Teacher' : 'Add Teacher'}
            </button>
            {isEditing && (
              <button
                type="button"
                onClick={resetTeacherForm}
                className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium cursor-pointer text-sm flex-1 sm:flex-none"
              >Cancel</button>
            )}
          </div>
        </form>
      );
    }
  };

  const renderTable = () => {
    if (activeTab === 'students') {
      return (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500 bg-white">
                <th className="px-4 sm:px-6 py-3 font-medium">Student Name & Contact</th>
                <th className="px-4 sm:px-6 py-3 font-medium">Roll ID</th>
                <th className="px-4 sm:px-6 py-3 font-medium">Class</th>
                <th className="px-4 sm:px-6 py-3 font-medium">Hifz Status</th>
                <th className="px-4 sm:px-6 py-3 font-medium text-center">Contact / Call / WhatsApp</th>
                <th className="px-4 sm:px-6 py-3 font-medium text-center w-36">Password</th>
                <th className="px-4 sm:px-6 py-3 font-medium text-center w-32">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredStudents.map((student) => (
                <tr key={student.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 sm:px-6 py-3">
                    <div className="flex items-center gap-3">
                      {student.photo ? (
                        <img src={student.photo} alt={student.name} className="w-10 h-10 rounded-full object-cover flex-shrink-0 border border-madrasa-gold/30 shadow-sm" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-madrasa-gold/10 flex items-center justify-center text-madrasa-gold font-bold text-sm flex-shrink-0 border border-madrasa-gold/20">
                          {student.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <p
                          className="font-medium text-gray-900 text-sm sm:text-base cursor-pointer hover:text-primary-600 transition"
                          onClick={() => setSelectedStudentForDetails(student)}
                          title="Click to view full student details"
                        >
                          {student.name}
                        </p>
                        <p className="text-xs text-gray-400">{student.phone || student.contactNos || 'No Phone'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-3">
                    <p className="text-sm text-gray-600 font-medium">{student.rollId}</p>
                  </td>
                  <td className="px-4 sm:px-6 py-3">
                    <span className="px-2.5 py-1 bg-madrasa-gold/10 text-gray-800 text-xs rounded-full font-medium">
                      {student.grade}
                    </span>
                  </td>
                  <td className="px-4 sm:px-6 py-3">
                    <span className="px-2.5 py-1 bg-purple-50 text-purple-700 text-xs rounded-full font-semibold">
                      {student.hifzStatus || 'Not Set'}
                    </span>
                  </td>
                  <td className="px-4 sm:px-6 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      {student.phone ? (
                        <>
                          <a
                            href={`tel:${student.phone}`}
                            className="p-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors shadow-sm"
                            title={`Call ${student.phone}`}
                          >
                            <i className="fa-solid fa-phone text-sm"></i>
                          </a>
                          <a
                            href={`https://wa.me/${student.phone.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors shadow-sm"
                            title={`WhatsApp ${student.phone}`}
                          >
                            <i className="fa-brands fa-whatsapp text-sm"></i>
                          </a>
                        </>
                      ) : (
                        <span className="text-xs text-gray-400">No phone</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded text-gray-700">
                        {student.password || '515253'}
                      </span>
                      <button
                        onClick={() => handleResetPassword(student)}
                        className="text-xs text-primary-600 hover:text-primary-800 font-bold underline cursor-pointer"
                        title="Reset password to 515253"
                      >
                        Reset
                      </button>
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-3">
                    <div className="flex justify-center gap-1 sm:gap-2">
                      <button
                        onClick={() => handleStudentEdit(student)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                        title="Edit"
                      >
                        <i className="fa-solid fa-pencil text-sm"></i>
                      </button>
                      <button
                        onClick={() => handleStudentDelete(student.id)}
                        className={`p-2 rounded-lg transition-colors cursor-pointer ${
                          deleteConfirm === student.id
                            ? 'text-red-600 bg-red-50'
                            : 'text-red-600 hover:bg-red-50'
                        }`}
                        title={deleteConfirm === student.id ? "Click again to confirm" : "Delete"}
                      >
                        {deleteConfirm === student.id ? (
                          <i className="fa-solid fa-check text-sm"></i>
                        ) : (
                          <i className="fa-solid fa-trash-can text-sm"></i>
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    } else {
      return (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[500px]">
            <thead>
              <tr className="border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500 bg-white">
                <th className="px-4 sm:px-6 py-3 font-medium">Teacher ID</th>
                <th className="px-4 sm:px-6 py-3 font-medium">Name</th>
                <th className="px-4 sm:px-6 py-3 font-medium">Assigned Classes</th>
                <th className="px-4 sm:px-6 py-3 font-medium text-center w-32">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredTeachers.map((teacher) => (
                <tr key={teacher.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 sm:px-6 py-3">
                    <p className="font-medium text-gray-900 text-sm sm:text-base">{teacher.id}</p>
                  </td>
                  <td className="px-4 sm:px-6 py-3">
                    <p className="text-sm text-gray-600">{teacher.name}</p>
                  </td>
                  <td className="px-4 sm:px-6 py-3">
                    <div className="flex flex-wrap gap-1">
                      {(teacher.assignedClasses || (teacher.assignedClass ? [teacher.assignedClass] : [])).length > 0 ? (
                        (teacher.assignedClasses || [teacher.assignedClass]).map(c => (
                          <span key={c} className="px-2 py-0.5 bg-primary-50 text-primary-700 rounded text-xs font-medium">
                            Class {c}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-gray-400">None</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-3">
                    <div className="flex justify-center gap-1 sm:gap-2">
                      <button
                        onClick={() => handleTeacherEdit(teacher)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                        title="Edit"
                      >
                        <i className="fa-solid fa-pencil text-sm"></i>
                      </button>
                      <button
                        onClick={() => handleTeacherDelete(teacher.id)}
                        className={`p-2 rounded-lg transition-colors cursor-pointer ${
                          deleteConfirm === teacher.id
                            ? 'text-red-600 bg-red-50'
                            : 'text-red-600 hover:bg-red-50'
                        }`}
                        title={deleteConfirm === teacher.id ? "Click again to confirm" : "Delete"}
                      >
                        {deleteConfirm === teacher.id ? (
                          <i className="fa-solid fa-check text-sm"></i>
                        ) : (
                          <i className="fa-solid fa-trash-can text-sm"></i>
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
  };

  return (
    <div className="animate-fade-in max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">System Management</h1>
          <p className="text-gray-500 mt-1 text-sm">Manage students, teachers, Hifz status, and passwords</p>
        </div>
        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl">
          <button
            onClick={() => { setActiveTab('students'); resetStudentForm(); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              activeTab === 'students' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Students ({students.length})
          </button>
          <button
            onClick={() => { setActiveTab('teachers'); resetTeacherForm(); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              activeTab === 'teachers' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Teachers ({teachers.length})
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-8 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-gray-50/50 gap-3">
          <h2 className="font-semibold text-gray-800 text-base capitalize">
            {activeTab === 'students' ? `Students Directory (${filteredStudents.length})` : `Teachers Directory (${filteredTeachers.length})`}
          </h2>
          <div className="relative w-full sm:w-64">
            <i className="fa-solid fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm"></i>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={`Search ${activeTab}...`}
              className="pl-9 pr-4 py-1.5 border border-gray-200 rounded-lg text-sm w-full bg-white outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
        {renderTable()}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="font-semibold text-gray-800 mb-4 text-base">
          {isEditing ? `Edit ${activeTab === 'students' ? 'Student' : 'Teacher'}` : `Add New ${activeTab === 'students' ? 'Student' : 'Teacher'}`}
        </h2>
        {renderForm()}
      </div>

      {/* Student Details Popup Modal */}
      {selectedStudentForDetails && (
        <div className="fixed inset-x-0 top-16 z-50 bg-black/60 backdrop-blur-xs flex items-start justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-2xl animate-fade-in p-6 border border-gray-200">
            <div className="flex justify-between items-center pb-4 border-b border-gray-100 mb-4">
              <h3 className="text-xl font-bold text-gray-900">Student Full Details</h3>
              <button onClick={() => setSelectedStudentForDetails(null)} className="text-gray-400 hover:text-gray-700 p-2 text-lg"><i className="fa-solid fa-xmark"></i></button>
            </div>
            <div className="flex flex-col items-center mb-6">
              {selectedStudentForDetails.photo ? (
                <img src={selectedStudentForDetails.photo} alt={selectedStudentForDetails.name} className="w-24 h-24 rounded-full object-cover border-2 border-madrasa-gold shadow-md mb-3" />
              ) : (
                <div className="w-24 h-24 rounded-full bg-madrasa-gold/20 flex items-center justify-center text-madrasa-gold font-bold text-4xl border-2 border-madrasa-gold shadow-md mb-3">
                  {selectedStudentForDetails.name.charAt(0)}
                </div>
              )}
              <h4 className="text-2xl font-bold text-gray-900">{selectedStudentForDetails.name}</h4>
              <p className="text-sm font-semibold text-primary-600">Roll / ITS ID: {selectedStudentForDetails.rollId}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm bg-gray-50 p-4 rounded-xl border border-gray-100 mb-6">
              <div><label className="text-gray-400 block mb-1">Class / Grade</label><p className="font-medium text-gray-900">{selectedStudentForDetails.grade || '-'}</p></div>
              <div><label className="text-gray-400 block mb-1">Division</label><p className="font-medium text-gray-900">{selectedStudentForDetails.division || '-'}</p></div>
              <div><label className="text-gray-400 block mb-1">Gender</label><p className="font-medium text-gray-900">{selectedStudentForDetails.gender || '-'}</p></div>
              <div><label className="text-gray-400 block mb-1">Phone</label><p className="font-medium text-gray-900">{selectedStudentForDetails.phone || '-'}</p></div>
              <div><label className="text-gray-400 block mb-1">Email</label><p className="font-medium text-gray-900">{selectedStudentForDetails.email || '-'}</p></div>
              <div><label className="text-gray-400 block mb-1">Hifz Status</label><span className="px-2.5 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full font-bold">{selectedStudentForDetails.hifzStatus || 'Not Set'}</span></div>
              <div><label className="text-gray-400 block mb-1">Date of Birth</label><p className="font-medium text-gray-900">{selectedStudentForDetails.hdob || '-'}</p></div>
              <div><label className="text-gray-400 block mb-1">Password</label><p className="font-mono text-xs bg-white px-2 py-1 rounded border border-gray-200 inline-block">{selectedStudentForDetails.password || '515253'}</p></div>
              <div className="col-span-full"><label className="text-gray-400 block mb-1">Arabic Name</label><p className="text-xl font-bold text-gray-900" style={{fontFamily:'"Kanz-al-Marjaan", serif'}}>{selectedStudentForDetails.arabicName || '-'}</p></div>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => { const s = selectedStudentForDetails; setSelectedStudentForDetails(null); handleStudentEdit(s); }} className="px-5 py-2.5 bg-primary-600 text-white font-bold rounded-xl text-sm hover:bg-primary-700 transition">Edit Student</button>
              <button onClick={() => setSelectedStudentForDetails(null)} className="px-5 py-2.5 bg-gray-200 text-gray-700 font-bold rounded-xl text-sm hover:bg-gray-300 transition">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Student/Teacher Edit Modal Popup */}
      {isModalEditOpen && (
        <div className="fixed inset-x-0 top-16 z-50 bg-black/60 backdrop-blur-xs flex items-start justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl animate-fade-in p-6 border border-gray-200">
            <div className="flex justify-between items-center pb-4 border-b border-gray-100 mb-4">
              <h3 className="text-xl font-bold text-gray-900">Edit {activeTab === 'students' ? 'Student' : 'Teacher'}</h3>
              <button onClick={() => resetStudentForm()} className="text-gray-400 hover:text-gray-700 p-2 text-lg"><i className="fa-solid fa-xmark"></i></button>
            </div>
            {renderForm()}
          </div>
        </div>
      )}
    </div>
  );
}
