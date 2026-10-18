import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';

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
    hdob: ''
  });

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
      hdob: ''
    });
    setIsEditing(false);
    setEditingItem(null);
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
      rollId: studentForm.rollId
    };

    if (isEditing) {
      await updateStudent(targetId, studentData);
    } else {
      await addStudent(studentData);
    }

    resetStudentForm();
  };

  const handleStudentEdit = (student) => {
    setStudentForm({ ...student });
    setEditingItem(student);
    setIsEditing(true);
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500 bg-white">
                <th className="px-4 sm:px-6 py-3 font-medium">Name & Contact</th>
                <th className="px-4 sm:px-6 py-3 font-medium">Roll ID</th>
                <th className="px-4 sm:px-6 py-3 font-medium">Class</th>
                <th className="px-4 sm:px-6 py-3 font-medium">Division</th>
                <th className="px-4 sm:px-6 py-3 font-medium text-center w-32">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sortedStudents.map((student) => (
                <tr key={student.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 sm:px-6 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-madrasa-gold/10 flex items-center justify-center text-madrasa-gold font-bold text-sm flex-shrink-0">
                        {student.name.charAt(0)}
                      </div>
                      <p className="font-medium text-gray-900 text-sm sm:text-base">{student.name}</p>
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-3">
                    <p className="text-sm text-gray-600">{student.rollId}</p>
                  </td>
                  <td className="px-4 sm:px-6 py-3">
                    <span className="px-2.5 py-1 bg-madrasa-gold/10 text-gray-800 text-xs rounded-full font-medium">
                      {student.grade}
                    </span>
                  </td>
                  <td className="px-4 sm:px-6 py-3">
                    <span className="text-sm text-gray-600">{student.division || '-'}</span>
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
              {teachers.map((teacher) => (
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
                        <span className="text-sm text-gray-400">None</span>
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
    <div className="animate-fade-in pb-12 sm:pb-0">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Management</h1>
          <p className="text-gray-500 mt-1 text-sm">Admin panel for managing students and teachers</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
        <div className="border-b border-gray-200">
          <div className="flex overflow-x-auto">
            <button
              onClick={() => {setActiveTab('students'); resetStudentForm();}}
              className={`px-6 py-3.5 sm:py-4 font-medium text-sm transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'students'
                  ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Students ({students.length})
            </button>
            <button
              onClick={() => {setActiveTab('teachers'); resetTeacherForm();}}
              className={`px-6 py-3.5 sm:py-4 font-medium text-sm transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'teachers'
                  ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Teachers ({teachers.length})
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          {renderTable()}
          {students.length === 0 && activeTab === 'students' && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-sm">No students found. Add your first student using the form.</p>
            </div>
          )}
          {teachers.length === 0 && activeTab === 'teachers' && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-sm">No teachers found. Add your first teacher using the form.</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-16 sm:mb-6">
        <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50">
          <h2 className="font-semibold text-gray-800 text-sm">
            {activeTab === 'students' ? 'Add/Edit Student' : 'Add/Edit Teacher'}
          </h2>
        </div>
        <div className="p-4 sm:p-6">
          {renderForm()}
        </div>
      </div>
    </div>
  );
}
